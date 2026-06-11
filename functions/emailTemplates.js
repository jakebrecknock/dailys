const { SITE_URL } = require("./managers");

/* =====================================================
   DATE HELPERS
===================================================== */

function formatDateLabel(dateString) {
  const [year, month, day] = dateString.split("-");

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function buildOutstandingListHtml(dates) {
  return dates
    .map(date => `<li style="margin-bottom:8px;">${formatDateLabel(date)}</li>`)
    .join("");
}

/* =====================================================
   REMINDER EMAIL
===================================================== */

function buildReminderEmail(managerName, outstandingDates) {
  const plural = outstandingDates.length === 1 ? "report" : "reports";

  return {
    subject: `ADB Daily Report Reminder - ${outstandingDates.length} Outstanding ${plural}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:28px;color:#172033;">
        <div style="max-width:680px;margin:0 auto;background:white;border:1px solid #d9e0ea;">
          <div style="background:#0f172a;color:white;padding:24px;border-left:8px solid #f97316;">
            <h1 style="margin:0;font-size:26px;">ADB Daily Report Reminder</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;">Outstanding workforce reports require completion.</p>
          </div>

          <div style="padding:28px;">
            <p style="font-size:16px;margin-bottom:18px;">
              ${managerName},
            </p>

            <p style="font-size:16px;line-height:1.5;">
              You currently have the following outstanding daily workforce ${plural}:
            </p>

            <ul style="font-size:16px;line-height:1.6;margin-top:16px;margin-bottom:26px;">
              ${buildOutstandingListHtml(outstandingDates)}
            </ul>

            <a href="${SITE_URL}"
               style="display:inline-block;background:#f97316;color:white;text-decoration:none;
                      padding:14px 22px;font-weight:bold;border-radius:3px;">
              Open Daily Reports
            </a>

            <p style="margin-top:26px;color:#667085;font-size:13px;">
              This is an automated reminder from the ADB Daily Workforce Reports system.
            </p>
          </div>
        </div>
      </div>
    `
  };
}

/* =====================================================
   COMPLETE / UPDATED REPORT EMAIL
===================================================== */

function buildCompleteReportEmail(date, reportHtml, options = {}) {
  const isUpdated = options.isUpdated === true;

  return {
    subject: `${isUpdated ? "*UPDATED* " : ""}COMPLETE DAILY FORMS - ${formatDateLabel(date)}`,
    html: reportHtml
  };
}

/* =====================================================
   INCOMPLETE INTERNAL SUMMARY EMAIL
===================================================== */

function buildIncompleteSummaryEmail(date, missingManagers) {
  return {
    subject: `INCOMPLETE DAILY FORMS - MISSING ${missingManagers.join(", ")}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:28px;color:#172033;">
        <div style="max-width:760px;margin:0 auto;background:white;border:1px solid #d9e0ea;">
          <div style="background:#0f172a;color:white;padding:24px;border-left:8px solid #f97316;">
            <h1 style="margin:0;font-size:26px;">Incomplete Daily Forms</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;">${formatDateLabel(date)}</p>
          </div>

          <div style="padding:28px;">
            <p style="font-size:16px;">
              The following managers have not submitted their daily reports:
            </p>

            <ul style="font-size:16px;line-height:1.7;margin-top:16px;">
              ${missingManagers.map(name => `<li>${name}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `
  };
}

module.exports = {
  formatDateLabel,
  buildReminderEmail,
  buildCompleteReportEmail,
  buildIncompleteSummaryEmail
};