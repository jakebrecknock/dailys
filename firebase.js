/* =====================================================
   FIREBASE FRONTEND HELPERS
   Replace firebaseConfig with your real Firebase config.
===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCA-CNpxiEGhwgZThNK9oPkgKac5lcqqq8",
  authDomain: "ada-daily-reports.firebaseapp.com",
  projectId: "ada-daily-reports",
  storageBucket: "ada-daily-reports.firebasestorage.app",
  messagingSenderId: "833103180561",
  appId: "1:833103180561:web:38a4d755bf1be6e12d52b0",
  measurementId: "G-ELSEK5KJHE"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

/* =====================================================
   PATHS

   dailyReports/{date}/managerReports/{managerId}
   rosters/{managerId}
   emailStatus/{date}
===================================================== */

function managerToId(managerName) {
  return managerName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function idToManagerName(managerId) {
  const match = managers.find(manager => managerToId(manager) === managerId);
  return match || managerId;
}

function reportDocRef(date, managerName) {
  return db
    .collection("dailyReports")
    .doc(date)
    .collection("managerReports")
    .doc(managerToId(managerName));
}

function rosterDocRef(managerName) {
  return db
    .collection("rosters")
    .doc(managerToId(managerName));
}

/* =====================================================
   REPORTS
===================================================== */

async function firebaseGetReports(date) {
  const snapshot = await db
    .collection("dailyReports")
    .doc(date)
    .collection("managerReports")
    .get();

  const reports = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const managerName = data.managerName || idToManagerName(doc.id);
    reports[managerName] = data;
  });

  return reports;
}

async function firebaseSaveDraft(date, managerName, teams) {
  await reportDocRef(date, managerName).set({
    managerId: managerToId(managerName),
    managerName,
    date,
    submitted: false,
    draftSavedAt: new Date().toISOString(),
    submittedAt: null,
    teams
  }, { merge: true });
}

async function firebaseSubmitReport(date, managerName, teams) {
  await reportDocRef(date, managerName).set({
    managerId: managerToId(managerName),
    managerName,
    date,
    submitted: true,
    submittedAt: new Date().toISOString(),
    teams
  }, { merge: true });
}

/* =====================================================
   ROSTERS
===================================================== */

async function firebaseGetRosters() {
  const snapshot = await db.collection("rosters").get();

  const rosters = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const managerName = data.managerName || idToManagerName(doc.id);
    rosters[managerName] = data.workers || [];
  });

  return rosters;
}

async function firebaseSaveRoster(managerName, workers) {
  await rosterDocRef(managerName).set({
    managerId: managerToId(managerName),
    managerName,
    workers,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

async function firebaseEnsureDefaultRosters(defaultRosters) {
  const batch = db.batch();

  for (const managerName of Object.keys(defaultRosters)) {
    const ref = rosterDocRef(managerName);
    const snap = await ref.get();

    if (!snap.exists) {
      batch.set(ref, {
        managerId: managerToId(managerName),
        managerName,
        workers: defaultRosters[managerName],
        createdAt: new Date().toISOString()
      });
    }
  }

  await batch.commit();
}