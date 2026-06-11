const admin = require("firebase-admin");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const sgMail = require("@sendgrid/mail");

const {
  MANAGERS,
  FULL_REPORT_RECIPIENTS,
  FROM_EMAIL
} = require("./managers");

const {
  buildReminderEmail,
  buildCompleteReportEmail,
  formatDateLabel
} = require("./emailTemplates");

const { buildReportHtml } = require("./reportBuilder");

admin.initializeApp();

const db = admin.firestore();

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");

/* =====================================================
   HELPERS
===================================================== */

function getTodayChicagoDate() {
  const now = new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

async function sendEmail({ to, subject, html }) {
  sgMail.setApiKey(SENDGRID_API_KEY.value());

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject,
    html
  });
}

async function getReportsForDate(date) {
  const snapshot = await db
    .collection("dailyReports")
    .doc(date)
    .collection("managerReports")
    .get();

  const reports = {};

  snapshot.forEach(doc => {
    const data = doc.data();

    if (data.submitted === true) {
      reports[data.managerName || doc.id] = data;
    }
  });

  return reports;
}

function getMissingManagers(reports) {
  return MANAGERS.filter(manager => {
    const report = reports[manager.name];
    return !report || report.submitted !== true;
  });
}

function allManagersSubmitted(reports) {
  return getMissingManagers(reports).length === 0;
}

async function getEmailStatus(date) {
  const statusSnap = await db
    .collection("emailStatus")
    .doc(date)
    .get();

  return statusSnap.exists ? statusSnap.data() : {};
}

async function markReportEmailSent(date, isUpdated) {
  const updateData = {
    completeReportSent: true,
    lastReportSentAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (isUpdated) {
    updateData.updatedReportCount = admin.firestore.FieldValue.increment(1);
    updateData.lastUpdatedReportSentAt = admin.firestore.FieldValue.serverTimestamp();
  } else {
    updateData.completeReportSentAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedReportCount = 0;
  }

  await db
    .collection("emailStatus")
    .doc(date)
    .set(updateData, { merge: true });
}

/* =====================================================
   SEND COMPLETE / UPDATED REPORT
===================================================== */

exports.onDailyReportWritten = onDocumentWritten(
  {
    document: "dailyReports/{date}/managerReports/{managerId}",
    secrets: [SENDGRID_API_KEY],
    region: "us-central1"
  },
  async event => {
    const date = event.params.date;

    const afterData = event.data.after.exists
      ? event.data.after.data()
      : null;

    if (!afterData || afterData.submitted !== true) {
      return;
    }

    const beforeData = event.data.before.exists
      ? event.data.before.data()
      : null;

    const reports = await getReportsForDate(date);

    if (!allManagersSubmitted(reports)) {
      const missing = getMissingManagers(reports).map(manager => manager.name);
      console.log(`Not complete for ${date}. Missing: ${missing.join(", ")}`);
      return;
    }

    const emailStatus = await getEmailStatus(date);
    const firstCompleteEmailAlreadySent = emailStatus.completeReportSent === true;

    const isEdit =
      beforeData &&
      beforeData.submitted === true;

    const shouldSendInitialComplete =
      !firstCompleteEmailAlreadySent;

    const shouldSendUpdated =
      firstCompleteEmailAlreadySent &&
      isEdit;

    if (!shouldSendInitialComplete && !shouldSendUpdated) {
      console.log(`No report email needed for ${date}.`);
      return;
    }

    const reportHtml = buildReportHtml(
      formatDateLabel(date),
      reports,
      {
        isUpdated: shouldSendUpdated
      }
    );

    const email = buildCompleteReportEmail(
      date,
      reportHtml,
      {
        isUpdated: shouldSendUpdated
      }
    );

    await sendEmail({
      to: FULL_REPORT_RECIPIENTS,
      subject: email.subject,
      html: email.html
    });

    await markReportEmailSent(
      date,
      shouldSendUpdated
    );

    console.log(
      shouldSendUpdated
        ? `Updated complete report sent for ${date}.`
        : `Complete report sent for ${date}.`
    );
  }
);

/* =====================================================
   OUTSTANDING DATE CHECKING
===================================================== */

async function getOutstandingDatesForManager(managerId) {
  const outstanding = [];

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = getDateDaysAgo(daysAgo);

    const reportSnap = await db
      .collection("dailyReports")
      .doc(date)
      .collection("managerReports")
      .doc(managerId)
      .get();

    if (!reportSnap.exists || reportSnap.data().submitted !== true) {
      outstanding.push(date);
    }
  }

  return outstanding;
}

async function sendOutstandingReminderEmails(label) {
  const results = [];

  for (const manager of MANAGERS) {
    const outstandingDates = await getOutstandingDatesForManager(manager.id);

    if (outstandingDates.length === 0) {
      results.push(`${manager.name}: no outstanding reports`);
      continue;
    }

    const reminder = buildReminderEmail(
      manager.name,
      outstandingDates
    );

    await sendEmail({
      to: manager.email,
      subject: reminder.subject,
      html: reminder.html
    });

    results.push(
      `${manager.name}: reminder sent for ${outstandingDates.length} outstanding reports`
    );
  }

  console.log(`${label} reminder run complete.`);
  console.log(results.join("\n"));
}

/* =====================================================
   7 AM DAILY REMINDER
===================================================== */

exports.sendMorningDailyReportReminders = onSchedule(
  {
    schedule: "0 7 * * *",
    timeZone: "America/Chicago",
    secrets: [SENDGRID_API_KEY],
    region: "us-central1"
  },
  async () => {
    await sendOutstandingReminderEmails("7 AM");
  }
);

/* =====================================================
   2 PM DAILY REMINDER
===================================================== */

exports.sendAfternoonDailyReportReminders = onSchedule(
  {
    schedule: "0 14 * * *",
    timeZone: "America/Chicago",
    secrets: [SENDGRID_API_KEY],
    region: "us-central1"
  },
  async () => {
    await sendOutstandingReminderEmails("2 PM");
  }
);

/* =====================================================
   OPTIONAL MANUAL TEST FUNCTION
===================================================== */

exports.manualSendTodayReminders = onSchedule(
  {
    schedule: "every day 23:59",
    timeZone: "America/Chicago",
    secrets: [SENDGRID_API_KEY],
    region: "us-central1"
  },
  async () => {
    console.log(`Manual-like scheduled safety function running for ${getTodayChicagoDate()}`);
  }
);