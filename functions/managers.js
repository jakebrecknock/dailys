/* =====================================================
   MANAGERS / EMAIL CONFIG

   IMPORTANT:
   Replace all placeholder emails before deploying email.
===================================================== */

const MANAGERS = [
  {
    id: "aj",
    name: "AJ",
    email: "aj@email.com"
  },
  {
    id: "jimmy",
    name: "Jimmy",
    email: "jimmy@email.com"
  },
  {
    id: "matta",
    name: "Matt A",
    email: "matta@email.com"
  },
  {
    id: "mattp",
    name: "Matt P",
    email: "mattp@email.com"
  },
  {
    id: "bob",
    name: "Bob",
    email: "bob@email.com"
  },
  {
    id: "zach",
    name: "Zach",
    email: "zach@email.com"
  },
  {
    id: "will",
    name: "Will",
    email: "will@email.com"
  },
  {
    id: "barry",
    name: "Barry",
    email: "barry@email.com"
  }
];

const FULL_REPORT_RECIPIENTS = [
  "derek@email.com",
  "evan@email.com",
  "christine@email.com",

  "aj@email.com",
  "jimmy@email.com",
  "matta@email.com",
  "mattp@email.com",
  "bob@email.com",
  "zach@email.com",
  "will@email.com",
  "barry@email.com",

  "extra1@email.com",
  "extra2@email.com",
  "extra3@email.com"
];

const FROM_EMAIL = "jakebrecknock@adb-us.com";
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