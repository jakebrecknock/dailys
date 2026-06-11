/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

/* =====================================================
   REPORTS
===================================================== */

async function firebaseSubmitReport(
  date,
  manager,
  teams
) {

  const docRef =
    db
      .collection("dailyReports")
      .doc(date)
      .collection("managerReports")
      .doc(manager);

  const existing =
    await docRef.get();

  const alreadySubmitted =
    existing.exists &&
    existing.data()?.submitted;

  await docRef.set(
    {

      submitted: true,

      submittedAt:
        alreadySubmitted
          ? existing.data().submittedAt
          : new Date().toISOString(),

      updatedAt:
        alreadySubmitted
          ? new Date().toISOString()
          : null,

      teams

    },

    { merge: true }

  );

}

async function firebaseGetReports(
  date
) {

  const snapshot =
    await db
      .collection("dailyReports")
      .doc(date)
      .collection("managerReports")
      .get();

  const reports = {};

  snapshot.forEach(doc => {

    reports[
      doc.id
    ] =
      doc.data();

  });

  return reports;

}

/* =====================================================
   ROSTERS
===================================================== */

async function firebaseSaveRoster(
  manager,
  roster
) {

  await db
    .collection(
      "rosters"
    )
    .doc(
      manager
    )
    .set(
      {
        workers:
          roster
      }
    );

}

async function firebaseGetRosters() {

  const snapshot =
    await db
      .collection(
        "rosters"
      )
      .get();

  const rosters = {};

  snapshot.forEach(doc => {

    rosters[
      doc.id
    ] =
      doc
        .data()
        .workers
      || [];

  });

  return rosters;

}

async function firebaseEnsureDefaultRosters(
  defaultRosters
) {

  const existing =
    await firebaseGetRosters();

  for (
    const manager
    in
    defaultRosters
  ) {

    if (
      existing[
        manager
      ]
    ) {

      continue;

    }

    await firebaseSaveRoster(
      manager,
      defaultRosters[
        manager
      ]
    );

  }

}