/* =====================================================
   MANAGERS / EMAIL CONFIG

   IMPORTANT:
   Replace all placeholder emails before deploying email.
===================================================== */

const MANAGERS = [
  {
    id: "aj",
    name: "AJ",
    email: "ajkwasek@adb-us.com"
  },
  {
    id: "jimmy",
    name: "Jimmy",
    email: "jfelgenhauer@adb-us.com"
  },
  {
    id: "matta",
    name: "Matt A",
    email: "madler@adb-us.com"
  },
  {
    id: "mattp",
    name: "Matt P",
    email: "matt.panince@adb-us.com"
  },
  {
    id: "bob",
    name: "Bob",
    email: "bob.johnson@adb-us.com"
  },
  {
    id: "zach",
    name: "Zach",
    email: "zragland@adb-us.com"
  },
  {
    id: "will",
    name: "Will",
    email: "wwright@adb-us.com"
  },
  {
    id: "barry",
    name: "Barry",
    email: "bbergling@adb-us.com"
  }
];

const FULL_REPORT_RECIPIENTS = [
  /*"derek.pleva@adb-us.com",
  "eebay@adb-us.com",
  "cgambrell@adb-us.com",*/
  "jbrecknock@adb-us.com"/*,
  "ajkwasek@adb-us.com",
  "jfelgenhauer@adb-us.com",
  "madler@adb-us.com",
  "matt.panince@adb-us.com",
  "bob.johnson@adb-us.com",
  "zragland@adb-us.com",
  "wwright@adb-us.com",
  "bbergling@adb-us.com",

  "extra1@email.com",
  "extra2@email.com",
  "extra3@email.com"*/
];

const FROM_EMAIL = "jbrecknock@adb-us.com";
const SITE_URL = "https://jakebrecknock.com/dailys/";

function managerIdToName(managerId) {
  const manager = MANAGERS.find(item => item.id === managerId);
  return manager ? manager.name : managerId;
}

function managerNameToId(managerName) {
  return managerName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

module.exports = {
  MANAGERS,
  FULL_REPORT_RECIPIENTS,
  FROM_EMAIL,
  SITE_URL,
  managerIdToName,
  managerNameToId
};
