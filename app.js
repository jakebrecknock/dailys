/* =====================================================
   ADB DAILY WORKFORCE REPORTS
   Firestore Version
===================================================== */

/* =========================
   BASE DATA
========================= */

const managers = [
  "AJ",
  "Jimmy",
  "Matt A",
  "Matt P",
  "Bob",
  "Zach",
  "Will",
  "Barry"
];

const activities = [
  "Office",
  "Site Prep",
  "Mount Equipment",
  "Run Lines",
  "Drop Lines",
  "Pre-Photos",
  "Post-Photos",
  "Cutovers",
  "Support",
  "Steel",
  "Decom",
  "Travel",
  "Troubleshooting",
  "Working For",
  "Other"
];

const defaultRosters = {
  "AJ": [
    { name: "AJ Worker 1", team: "1" },
    { name: "AJ Worker 2", team: "1" },
    { name: "AJ Worker 3", team: "2" }
  ],
  "Jimmy": [
    { name: "Jimmy Worker 1", team: "1" },
    { name: "Jimmy Worker 2", team: "1" },
    { name: "Jimmy Worker 3", team: "2" }
  ],
  "Matt A": [
    { name: "Matt A Worker 1", team: "1" },
    { name: "Matt A Worker 2", team: "1" },
    { name: "Matt A Worker 3", team: "2" }
  ],
  "Matt P": [
    { name: "Matt P Worker 1", team: "1" },
    { name: "Matt P Worker 2", team: "1" },
    { name: "Matt P Worker 3", team: "2" }
  ],
  "Bob": [
    { name: "Bob Worker 1", team: "1" },
    { name: "Bob Worker 2", team: "1" },
    { name: "Bob Worker 3", team: "2" }
  ],
  "Zach": [
    { name: "Zach Worker 1", team: "1" },
    { name: "Zach Worker 2", team: "1" },
    { name: "Zach Worker 3", team: "2" }
  ],
  "Will": [
    { name: "Will Worker 1", team: "1" },
    { name: "Will Worker 2", team: "1" },
    { name: "Will Worker 3", team: "2" }
  ],
  "Barry": [
    { name: "Barry Worker 1", team: "1" },
    { name: "Barry Worker 2", team: "1" },
    { name: "Barry Worker 3", team: "2" }
  ]
};

/* =========================
   GLOBAL STATE
========================= */

let currentManager = null;
let cachedReports = {};
let cachedRosters = {};

/* =========================
   DOM REFERENCES
========================= */

const dateInput = document.getElementById("dateInput");

const dashboardView = document.getElementById("dashboardView");
const formView = document.getElementById("formView");
const reportView = document.getElementById("reportView");

const managerGrid = document.getElementById("managerGrid");

const completionText = document.getElementById("completionText");
const completeCount = document.getElementById("completeCount");
const missingCount = document.getElementById("missingCount");
const draftCount = document.getElementById("draftCount");
const dateTitle = document.getElementById("dateTitle");

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const teamsContainer = document.getElementById("teamsContainer");

const reportDateLine = document.getElementById("reportDateLine");
const compiledReport = document.getElementById("compiledReport");

const toastBox = document.getElementById("toast");

/* =========================
   STARTUP
========================= */

window.addEventListener("load", async () => {
  dateInput.value = new Date().toISOString().slice(0, 10);

  wireButtons();

  toast("Connecting to Firebase...");

  await firebaseEnsureDefaultRosters(defaultRosters);

  await refreshData();

  showDashboard();
});

/* =========================
   BUTTON WIRING
========================= */

function wireButtons() {
  document.getElementById("logoBtn").addEventListener("click", showDashboard);

  document.getElementById("previewReportBtn").addEventListener("click", renderCompiledReport);
  document.getElementById("backToDashboardBtn").addEventListener("click", showDashboard);
  document.getElementById("reportBackBtn").addEventListener("click", showDashboard);
  document.getElementById("printReportBtn").addEventListener("click", () => window.print());

  document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
  document.getElementById("submitBtn").addEventListener("click", submitReport);

  dateInput.addEventListener("change", async () => {
    await refreshData();

    if (!dashboardView.classList.contains("hidden")) {
      renderDashboard();
    }

    if (!formView.classList.contains("hidden") && currentManager) {
      openManager(currentManager);
    }

    if (!reportView.classList.contains("hidden")) {
      renderCompiledReport();
    }
  });
}

/* =========================
   FIRESTORE DATA LOADING
========================= */

async function refreshData() {
  cachedReports = await firebaseGetReports(dateInput.value);
  cachedRosters = await firebaseGetRosters();

  managers.forEach(manager => {
    if (!cachedRosters[manager]) {
      cachedRosters[manager] = defaultRosters[manager] || [];
    }
  });
}

/* =========================
   NAVIGATION
========================= */

function showOnly(view) {
  [dashboardView, formView, reportView].forEach(section => {
    section.classList.add("hidden");
  });

  view.classList.remove("hidden");
}

function showDashboard() {
  showOnly(dashboardView);
  renderDashboard();
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {
  const submittedManagers = managers.filter(manager => cachedReports[manager]?.submitted);
  const draftManagers = managers.filter(manager => cachedReports[manager] && !cachedReports[manager]?.submitted);

  const submitted = submittedManagers.length;
  const drafts = draftManagers.length;
  const missing = managers.length - submitted;

  completionText.textContent = `${submitted} / ${managers.length}`;
  completeCount.textContent = submitted;
  missingCount.textContent = missing;
  draftCount.textContent = drafts;
  dateTitle.textContent = `Reports for ${formatDate(dateInput.value)}`;

  managerGrid.innerHTML = "";

  managers.forEach(manager => {
    const report = cachedReports[manager];
    const roster = cachedRosters[manager] || [];
    const teamCount = Object.keys(groupByTeam(roster)).length;

    const isSubmitted = !!report?.submitted;
    const isDraft = !!report && !report.submitted;

    const card = document.createElement("article");
    card.className = `manager-card ${isSubmitted ? "complete" : ""}`;

    card.innerHTML = `
      <div>
        <div class="manager-card-top">
          <h3>${manager}</h3>

          <span class="pill ${isSubmitted ? "good" : "bad"}">
            ${isSubmitted ? "COMPLETE" : isDraft ? "DRAFT" : "MISSING"}
          </span>
        </div>

        <p><strong>Status:</strong> ${isSubmitted ? "Submitted" : isDraft ? "Draft Saved" : "Missing"}</p>
        <p><strong>Submitted:</strong> ${isSubmitted ? formatTimestamp(report.submittedAt) : "—"}</p>
        <p><strong>Teams:</strong> ${teamCount}</p>
        <p><strong>Workers:</strong> ${roster.length}</p>
      </div>

      <button type="button">
        Open Daily
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      openManager(manager);
    });

    managerGrid.appendChild(card);
  });
}

/* =========================
   MANAGER FORM
========================= */

function openManager(manager) {
  currentManager = manager;

  showOnly(formView);

  formTitle.textContent = `${manager} Daily Report`;
  formSubtitle.textContent = `Report Date: ${formatDate(dateInput.value)}`;

  renderManagerForm(manager);
}

function renderManagerForm(manager) {

  const roster = cachedRosters[manager] || [];

  const teams = groupByTeam(roster);

  const existing =
    cachedReports[manager]?.teams || {};

  teamsContainer.innerHTML = "";

  Object.keys(teams)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(teamNumber => {

      const saved =
        existing[teamNumber] || {};

      const teamCard =
        document.createElement("article");

      teamCard.className =
        "team-card";

      teamCard.dataset.team =
        teamNumber;

      teamCard.innerHTML = `

        <div class="team-top">

          <h3>

            TEAM ${teamNumber}

          </h3>

          <label class="weather">

            <input
              type="checkbox"
              class="weatherCheck"
              ${saved.weather ? "checked" : ""}
            >

            WEATHERED OUT

          </label>

        </div>


        <section class="form-block">

          <p class="form-block-title">

            Activities

          </p>

          <div class="activity-grid">

            ${activities.map(activity => {

              const checked =
                saved.activities?.includes(activity)
                  ? "checked"
                  : "";

              return `

                <label class="activity">

                  <input
                    type="checkbox"
                    class="activityCheck"
                    value="${activity}"
                    ${checked}
                  >

                  <span>

                    ${activity}

                  </span>

                </label>

              `;

            }).join("")}

          </div>


          <div class="conditional-inputs">

            <input
              class="
                workingForInput
                ${saved.activities?.includes("Working For")
                ? ""
                : "hidden"}
              "

              placeholder="Working for..."

              value="${saved.workingFor || ""}"
            >

            <input
              class="
                otherInput
                ${saved.activities?.includes("Other")
                ? ""
                : "hidden"}
              "

              placeholder="Other activity..."

              value="${saved.other || ""}"
            >

          </div>

        </section>


        <section class="form-block">

          <p class="form-block-title">

            Site Information

          </p>

          <div class="site-grid">

            <input
              class="siteLocationInput"
              placeholder="Site Location"
              value="${saved.siteLocation || ""}"
            >

            <input
              class="adbSiteInput"
              placeholder="ADB Site Number"
              value="${saved.adbSite || ""}"
            >

          </div>

        </section>


        <section class="form-block">

          <p class="form-block-title">

            Workers

          </p>

          <table class="worker-table">

            <thead>

              <tr>

                <th>Name</th>
                <th>NWSA</th>
                <th>Vehicle</th>
                <th>Off</th>

              </tr>

            </thead>

            <tbody>

              ${teams[teamNumber].map(worker => {

                const savedWorker =
                  saved.workers?.[worker.name] || {};

                return `

                  <tr data-worker="${worker.name}">

                    <td>

                      <strong>

                        ${worker.name}

                      </strong>

                    </td>


                    <td>

                      <div class="nwsa-toggle">

                        <button
                          type="button"
                          class="
                            toggle-btn
                            yes
                            ${savedWorker.nwsa === "Y"
                            ? "active"
                            : ""}
                          "
                          data-value="Y"
                        >

                          YES

                        </button>

                        <button
                          type="button"
                          class="
                            toggle-btn
                            no
                            ${savedWorker.nwsa === "N"
                            ? "active"
                            : ""}
                          "
                          data-value="N"
                        >

                          NO

                        </button>

                      </div>

                    </td>


                    <td>

                      <input
                        class="vehicle"
                        placeholder="Vehicle # or N/A"
                        value="${savedWorker.vehicle || ""}"
                      >

                    </td>


                    <td>

                      <div class="off-toggle">

                        <button
                          type="button"
                          class="
                            toggle-btn
                            clear
                            ${!savedWorker.off
                            ? "active"
                            : ""}
                          "
                          data-off=""
                        >

                          Working

                        </button>

                        <button
                          type="button"
                          class="
                            toggle-btn
                            off
                            ${savedWorker.off === "PTO"
                            ? "active"
                            : ""}
                          "
                          data-off="PTO"
                        >

                          PTO

                        </button>

                        <button
                          type="button"
                          class="
                            toggle-btn
                            off
                            ${savedWorker.off === "Sick"
                            ? "active"
                            : ""}
                          "
                          data-off="Sick"
                        >

                          Sick

                        </button>

                        <button
                          type="button"
                          class="
                            toggle-btn
                            off
                            ${savedWorker.off === "Other"
                            ? "active"
                            : ""}
                          "
                          data-off="Other"
                        >

                          Other

                        </button>

                      </div>

                    </td>

                  </tr>

                `;

              }).join("")}

            </tbody>

          </table>

        </section>

      `;

      teamsContainer.appendChild(teamCard);

      wireTeamConditionalInputs(teamCard);
      wireToggleButtons(teamCard);
      wireWeatherLogic(teamCard);

    });

}

/* =========================
   FORM INTERACTION
========================= */

function wireTeamConditionalInputs(teamCard) {

  const activityChecks =
    teamCard.querySelectorAll(".activityCheck");

  const workingForInput =
    teamCard.querySelector(".workingForInput");

  const otherInput =
    teamCard.querySelector(".otherInput");

  activityChecks.forEach(check => {

    check.addEventListener("change", () => {

      const selected =
        getSelectedActivities(teamCard);

      if (selected.includes("Working For")) {

        workingForInput.classList.remove("hidden");

      } else {

        workingForInput.value = "";
        workingForInput.classList.add("hidden");

      }

      if (selected.includes("Other")) {

        otherInput.classList.remove("hidden");

      } else {

        otherInput.value = "";
        otherInput.classList.add("hidden");

      }

    });

  });

}


function wireToggleButtons(teamCard) {

  /* ---------- NWSA ---------- */

  teamCard.querySelectorAll(".nwsa-toggle")
    .forEach(toggle => {

      const buttons =
        toggle.querySelectorAll(".toggle-btn");

      buttons.forEach(button => {

        button.addEventListener("click", () => {

          buttons.forEach(b =>
            b.classList.remove("active")
          );

          button.classList.add("active");

        });

      });

    });


  /* ---------- OFF ---------- */

  teamCard.querySelectorAll(".off-toggle")
    .forEach(toggle => {

      const buttons =
        toggle.querySelectorAll(".toggle-btn");

      buttons.forEach(button => {

        button.addEventListener("click", () => {

          buttons.forEach(b =>
            b.classList.remove("active")
          );

          button.classList.add("active");

        });

      });

    });

}


function wireWeatherLogic(teamCard) {

  const weatherCheck =
    teamCard.querySelector(".weatherCheck");

  weatherCheck.addEventListener("change", () => {

    const disabled =
      weatherCheck.checked;

    teamCard
      .querySelectorAll(
        "input, select, button.activityCheck"
      )
      .forEach(element => {

        if (
          !element.classList.contains("weatherCheck")
        ) {

          element.disabled = disabled;

        }

      });

  });

}


/* =========================
   DATA COLLECTION
========================= */

function getSelectedActivities(teamCard) {

  return [
    ...teamCard.querySelectorAll(
      ".activityCheck:checked"
    )
  ].map(box => box.value);

}


function collectFormData() {

  const teams = {};

  document.querySelectorAll(".team-card")
    .forEach(teamCard => {

      const teamNumber =
        teamCard.dataset.team;

      const weatheredOut =
        teamCard.querySelector(".weatherCheck")
          .checked;


      if (weatheredOut) {

        teams[teamNumber] = {

          weather: true,

          activities: ["WEATHERED OUT"],

          workingFor: "N/A",

          other: "N/A",

          siteLocation: "N/A",

          adbSite: "N/A",

          workers: {}

        };

        return;

      }


      const workers = {};

      teamCard.querySelectorAll("tbody tr")
        .forEach(row => {

          const workerName =
            row.dataset.worker;


          /* ---------- NWSA ---------- */

          let nwsa = "";

          const nwsaButton =
            row.querySelector(
              ".nwsa-toggle .active"
            );

          if (nwsaButton) {

            nwsa =
              nwsaButton.dataset.value;

          }


          /* ---------- OFF ---------- */

          let off = "";

          const offButton =
            row.querySelector(
              ".off-toggle .active"
            );

          if (offButton) {

            off =
              offButton.dataset.off;

          }

          workers[workerName] = {

            nwsa,

            vehicle:
              row.querySelector(".vehicle")
                .value
                .trim(),

            off

          };

        });


      teams[teamNumber] = {

        weather: false,

        activities:
          getSelectedActivities(teamCard),

        workingFor:
          teamCard.querySelector(
            ".workingForInput"
          ).value.trim(),

        other:
          teamCard.querySelector(
            ".otherInput"
          ).value.trim(),

        siteLocation:
          teamCard.querySelector(
            ".siteLocationInput"
          ).value.trim(),

        adbSite:
          teamCard.querySelector(
            ".adbSiteInput"
          ).value.trim(),

        workers

      };

    });

  return teams;

}

/* =========================
   VALIDATION
========================= */

function validateForm() {

  const errors = [];

  document.querySelectorAll(".team-card")
    .forEach(teamCard => {

      const teamNumber =
        teamCard.dataset.team;

      const weatheredOut =
        teamCard.querySelector(".weatherCheck")
          .checked;

      clearInvalidFields(teamCard);

      if (weatheredOut) {
        return;
      }

      const selectedActivities =
        getSelectedActivities(teamCard);

      if (selectedActivities.length === 0) {

        errors.push(
          `Team ${teamNumber}: select at least one activity`
        );

        markInvalid(
          teamCard.querySelector(".activity-grid")
        );

      }

      if (
        selectedActivities.includes("Working For")
      ) {

        const input =
          teamCard.querySelector(
            ".workingForInput"
          );

        if (!input.value.trim()) {

          errors.push(
            `Team ${teamNumber}: enter Working For`
          );

          markInvalid(input);

        }

      }

      if (
        selectedActivities.includes("Other")
      ) {

        const input =
          teamCard.querySelector(
            ".otherInput"
          );

        if (!input.value.trim()) {

          errors.push(
            `Team ${teamNumber}: enter Other activity`
          );

          markInvalid(input);

        }

      }

      const siteLocation =
        teamCard.querySelector(
          ".siteLocationInput"
        );

      const adbSite =
        teamCard.querySelector(
          ".adbSiteInput"
        );

      if (!siteLocation.value.trim()) {

        errors.push(
          `Team ${teamNumber}: Site Location required`
        );

        markInvalid(siteLocation);

      }

      if (!adbSite.value.trim()) {

        errors.push(
          `Team ${teamNumber}: Site Number required`
        );

        markInvalid(adbSite);

      }

      teamCard.querySelectorAll("tbody tr")
        .forEach(row => {

          const workerName =
            row.dataset.worker;

          const vehicle =
            row.querySelector(".vehicle");

          const nwsaButton =
            row.querySelector(
              ".nwsa-toggle .active"
            );

          if (!nwsaButton) {

            errors.push(
              `Team ${teamNumber}: ${workerName} missing NWSA`
            );

          }

          if (
            !vehicle.value.trim()
          ) {

            errors.push(
              `Team ${teamNumber}: ${workerName} missing vehicle`
            );

            markInvalid(vehicle);

          }

        });

    });

  return errors;

}


function clearInvalidFields(scope = document) {

  scope
    .querySelectorAll(".invalid-field")
    .forEach(element => {

      element.classList.remove(
        "invalid-field"
      );

    });

}


function markInvalid(element) {

  if (element) {

    element.classList.add(
      "invalid-field"
    );

  }

}


/* =========================
   FIRESTORE SAVE DRAFT
========================= */

async function saveDraft() {

  if (!currentManager) {
    return;
  }

  try {

    await firebaseSaveDraft(
      dateInput.value,
      currentManager,
      collectFormData()
    );

    await refreshData();

    toast(
      `${currentManager} draft saved`
    );

    renderDashboard();

  }

  catch (error) {

    console.error(error);

    toast(
      "Error saving draft"
    );

  }

}


/* =========================
   FIRESTORE SUBMIT
========================= */

async function submitReport() {

  if (!currentManager) {
    return;
  }

  const errors =
    validateForm();

  if (errors.length > 0) {

    toast(errors[0]);

    return;

  }

  try {

    await firebaseSubmitReport(
      dateInput.value,
      currentManager,
      collectFormData()
    );

    await refreshData();

    toast(
      `${currentManager} submitted`
    );

    showDashboard();

  }

  catch (error) {

    console.error(error);

    toast(
      "Error submitting report"
    );

  }

}

/* =========================
   REPORT PREVIEW
========================= */

function renderCompiledReport() {

  showOnly(reportView);

  reportDateLine.textContent =
    `Report Date: ${formatDate(dateInput.value)}`;

  compiledReport.innerHTML = "";

  managers.forEach(manager => {

    const report =
      cachedReports[manager];

    const section =
      document.createElement("section");

    section.className =
      "report-manager";

    if (!report?.submitted) {

      section.innerHTML = `

        <h3>

          ${manager}

        </h3>

        <p>

          <strong>Status:</strong>

          DAILY NOT SUBMITTED

        </p>

      `;

      compiledReport.appendChild(section);

      return;

    }

    section.innerHTML = `

      <h3>

        ${manager}

      </h3>

      <p>

        <strong>Submitted:</strong>

        ${formatTimestamp(report.submittedAt)}

      </p>

    `;

    Object.entries(report.teams)
      .forEach(([teamNumber, team]) => {

        const teamDiv =
          document.createElement("div");

        teamDiv.className =
          "report-team";

        let activityTags = "";

        team.activities.forEach(activity => {

          if (
            activity === "Working For"
            &&
            team.workingFor
          ) {

            activityTags += `

              <span class="tag">

                Working For:
                ${team.workingFor}

              </span>

            `;

          }

          else if (
            activity === "Other"
            &&
            team.other
          ) {

            activityTags += `

              <span class="tag">

                Other:
                ${team.other}

              </span>

            `;

          }

          else {

            activityTags += `

              <span class="tag">

                ${activity}

              </span>

            `;

          }

        });

        teamDiv.innerHTML = `

          <h4>

            Team ${teamNumber}

            ${team.weather
              ? " — WEATHERED OUT"
              : ""
            }

          </h4>

          <p>

            ${activityTags}

          </p>

          <p>

            <strong>

              Site Location:

            </strong>

            ${team.siteLocation}

          </p>

          <p>

            <strong>

              ADB Site #:

            </strong>

            ${team.adbSite}

          </p>

        `;

        if (!team.weather) {

          const table =
            document.createElement("table");

          table.className =
            "worker-table";

          table.innerHTML = `

            <thead>

              <tr>

                <th>Worker</th>
                <th>NWSA</th>
                <th>Vehicle</th>
                <th>Off</th>

              </tr>

            </thead>

            <tbody>

              ${Object.entries(team.workers)
                .map(([name, worker]) => {

                  return `

                    <tr>

                      <td>

                        ${name}

                      </td>

                      <td>

                        ${worker.nwsa || "N/A"}

                      </td>

                      <td>

                        ${worker.vehicle || "N/A"}

                      </td>

                      <td>

                        ${worker.off || "Working"}

                      </td>

                    </tr>

                  `;

                }).join("")}

            </tbody>

          `;

          teamDiv.appendChild(table);

        }

        section.appendChild(teamDiv);

      });

    compiledReport.appendChild(section);

  });

}


/* =========================
   HELPERS
========================= */

function groupByTeam(roster) {

  return roster.reduce(
    (groups, worker) => {

      if (!groups[worker.team]) {

        groups[worker.team] = [];

      }

      groups[worker.team].push(worker);

      return groups;

    },

    {}

  );

}


function formatDate(dateString) {

  if (!dateString) {

    return "";

  }

  const [
    year,
    month,
    day
  ] = dateString.split("-");

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(

    "en-US",

    {

      weekday: "short",

      month: "short",

      day: "numeric",

      year: "numeric"

    }

  );

}


function formatTimestamp(timestamp) {

  if (!timestamp) {

    return "—";

  }

  try {

    return new Date(timestamp)
      .toLocaleString();

  }

  catch {

    return timestamp;

  }

}


function toast(message) {

  toastBox.textContent =
    message;

  toastBox.classList.remove(
    "hidden"
  );

  setTimeout(() => {

    toastBox.classList.add(
      "hidden"
    );

  }, 2500);

}