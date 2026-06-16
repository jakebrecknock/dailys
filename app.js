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

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

const formActionBar = document.getElementById("formActionBar");
const actionBarManager = document.getElementById("actionBarManager");
const actionBarDate = document.getElementById("actionBarDate");

/* =========================
   STARTUP
========================= */

window.addEventListener("load", async () => {
  dateInput.value = new Date().toISOString().slice(0, 10);

  wireButtons();

  cachedRosters = { ...defaultRosters };
  cachedReports = loadReportsCache(dateInput.value);

  showDashboard();
  renderDashboard();

  try {
    await firebaseEnsureDefaultRosters(defaultRosters);
    await refreshData();
    saveReportsCache(dateInput.value);
    renderDashboard();
  } catch (error) {
    console.error(error);
    toast("Firebase connection issue. Showing last known data.");
  }
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

  document.getElementById("submitBtn").addEventListener("click", submitReport);
  document.getElementById("bottomSubmitBtn").addEventListener("click", submitReport);

  document.getElementById("tempWorkerBtn").addEventListener("click", openTempWorkerModal);
  document.getElementById("bottomTempWorkerBtn").addEventListener("click", openTempWorkerModal);

  document.getElementById("editRosterBtn").addEventListener("click", openEditRosterModal);
  document.getElementById("bottomEditRosterBtn").addEventListener("click", openEditRosterModal);

  closeModalBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

dateInput.addEventListener("change", async () => {

  cachedReports = loadReportsCache(dateInput.value);

  renderDashboard();

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

  saveReportsCache(dateInput.value);
}

/* =========================
   NAVIGATION
========================= */

function showOnly(view) {
  [dashboardView, formView, reportView].forEach(section => {
    section.classList.add("hidden");
  });

  view.classList.remove("hidden");

  if (view === formView) {
    formActionBar.classList.remove("hidden");
  } else {
    formActionBar.classList.add("hidden");
  }
}

function showDashboard() {
  showOnly(dashboardView);
  renderDashboard();
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {
  const submittedManagers = managers.filter(manager => {
    return cachedReports[manager]?.submitted;
  });

  const submitted = submittedManagers.length;
  const missing = managers.length - submitted;

  completionText.textContent = `${submitted} / ${managers.length}`;
  completeCount.textContent = submitted;
  missingCount.textContent = missing;
  dateTitle.textContent = `Reports for ${formatDate(dateInput.value)}`;

  managerGrid.innerHTML = "";

  managers.forEach(manager => {
    const report = cachedReports[manager] || {};
    const roster =
      cachedRosters[manager] ||
      defaultRosters[manager] ||
      [];

    const teamCount =
      Object.keys(groupByTeam(roster)).length;

    const isSubmitted =
      report.submitted === true;

    const card = document.createElement("article");
    card.className =
      `manager-card ${isSubmitted ? "complete" : ""}`;

    card.innerHTML = `
      <div>
        <div class="manager-card-top">
          <h3>${manager}</h3>

          <span class="pill ${isSubmitted ? "good" : "bad"}">
            ${isSubmitted ? "COMPLETE" : "MISSING"}
          </span>
        </div>

        <p>
          <strong>Status:</strong>
          ${isSubmitted ? "Submitted / Editable" : "Missing"}
        </p>

        <p>
          <strong>Submitted:</strong>
          ${isSubmitted ? formatTimestamp(report.submittedAt) : "—"}
        </p>

        <p>
          <strong>Teams:</strong>
          ${teamCount}
        </p>

        <p>
          <strong>Workers:</strong>
          ${roster.length}
        </p>
      </div>

      <button type="button">
        ${isSubmitted ? "Edit Daily" : "Open Daily"}
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

  actionBarManager.textContent = `${manager} Daily Report`;
  actionBarDate.textContent = formatDate(dateInput.value);

  renderManagerForm(manager);
}

function renderManagerForm(manager) {
  const roster = cachedRosters[manager] || [];
  const rosterTeams = groupByTeam(roster);
  const existing = cachedReports[manager]?.teams || {};

  teamsContainer.innerHTML = "";

  const allTeamNumbers = [
    ...new Set([
      ...Object.keys(rosterTeams),
      ...Object.keys(existing)
    ])
  ].sort((a, b) => Number(a) - Number(b));

  allTeamNumbers.forEach(teamNumber => {
    const saved = existing[teamNumber] || {};
    const jobs = normalizeJobs(saved);

    const rosterWorkers = rosterTeams[teamNumber] || [];
    const rosterWorkerNames = rosterWorkers.map(worker => worker.name);

    const savedWorkers = saved.workers || {};

    const tempWorkers = Object.keys(savedWorkers)
      .filter(name => !rosterWorkerNames.includes(name))
      .map(name => ({
        name,
        team: teamNumber,
        temp: true
      }));

    const allWorkers = [
      ...rosterWorkers,
      ...tempWorkers
    ];

    const teamCard = document.createElement("article");
    teamCard.className = "team-card";
    teamCard.dataset.team = teamNumber;

    teamCard.innerHTML = `
      <div class="team-top">
        <h3>TEAM ${teamNumber}</h3>

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
        <p class="form-block-title">Jobs</p>

        <div class="jobs-container">
          ${jobs.map((job, index) => buildJobHtml(job, index)).join("")}
        </div>

        <button class="add-job-btn" type="button">
          + Add Another Job
        </button>
      </section>

      <section class="form-block">
        <p class="form-block-title">Workers</p>

        <table class="worker-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>NWSA</th>
              <th>Vehicle</th>
              <th>Working For</th>
              <th>Off</th>
            </tr>
          </thead>

          <tbody>
            ${allWorkers.map(worker => {
              const savedWorker = savedWorkers[worker.name] || {};
              const workingFor = savedWorker.workingFor || "Me";

              return `
                <tr data-worker="${worker.name}">
                  <td>
                    <strong>
                      ${worker.name}
                      ${worker.temp ? " (TEMP)" : ""}
                    </strong>
                  </td>

                  <td>
                    <div class="nwsa-toggle">
                      <button
                        type="button"
                        class="toggle-btn yes ${savedWorker.nwsa === "Y" ? "active" : ""}"
                        data-value="Y"
                      >
                        YES
                      </button>

                      <button
                        type="button"
                        class="toggle-btn no ${savedWorker.nwsa === "N" ? "active" : ""}"
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
                    <select class="working-for-select">
                      <option value="Me" ${workingFor === "Me" ? "selected" : ""}>Me</option>
                      <option value="Other" ${workingFor === "Other" ? "selected" : ""}>Other</option>
                    </select>

                    <input
                      class="working-for-other ${workingFor === "Other" ? "" : "hidden-other"}"
                      placeholder="Who?"
                      value="${savedWorker.workingForOther || ""}"
                    >
                  </td>

                  <td>
                    <div class="off-toggle">
                      <button
                        type="button"
                        class="toggle-btn clear ${!savedWorker.off ? "active" : ""}"
                        data-off=""
                      >
                        Working
                      </button>

                      <button
                        type="button"
                        class="toggle-btn off ${savedWorker.off === "PTO" ? "active" : ""}"
                        data-off="PTO"
                      >
                        PTO
                      </button>

                      <button
                        type="button"
                        class="toggle-btn off ${savedWorker.off === "Sick" ? "active" : ""}"
                        data-off="Sick"
                      >
                        Sick
                      </button>

                      <button
                        type="button"
                        class="toggle-btn off ${savedWorker.off === "Other" ? "active" : ""}"
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

    wireTeamCard(teamCard);
  });
}

function buildJobHtml(job, index) {
  return `
    <div class="job-card" data-job-index="${index}">
      <div class="job-card-title">
        <h4>Job ${index + 1}</h4>

        ${index === 0
          ? ""
          : `<button class="remove-job-btn" type="button">Remove Job</button>`
        }
      </div>

      <div class="activity-grid">
        ${activities.map(activity => {
          const checked = job.activities?.includes(activity) ? "checked" : "";

          return `
            <label class="activity">
              <input
                type="checkbox"
                class="activityCheck"
                value="${activity}"
                ${checked}
              >
              <span>${activity}</span>
            </label>
          `;
        }).join("")}
      </div>

      <div class="conditional-inputs">
        <input
          class="otherInput ${job.activities?.includes("Other") ? "" : "hidden"}"
          placeholder="Other activity..."
          value="${job.other || ""}"
        >
      </div>

      <div class="site-grid">
        <input
          class="siteLocationInput"
          placeholder="Site Name"
          value="${job.siteLocation || ""}"
        >

        <input
          class="adbSiteInput"
          placeholder="ADB Site Number"
          value="${job.adbSite || ""}"
        >
      </div>
    </div>
  `;
}

/* =========================
   TEAM CARD WIRING
========================= */

function wireTeamCard(teamCard) {
  wireJobLogic(teamCard);
  wireToggleButtons(teamCard);
  wireWorkingForLogic(teamCard);
  wireWeatherLogic(teamCard);
}

function wireJobLogic(teamCard) {
  wireJobCards(teamCard);

  const addJobBtn = teamCard.querySelector(".add-job-btn");

  addJobBtn.addEventListener("click", () => {
    const jobsContainer = teamCard.querySelector(".jobs-container");
    const currentJobCount = jobsContainer.querySelectorAll(".job-card").length;

    const newJob = {
      activities: [],
      other: "",
      siteLocation: "",
      adbSite: ""
    };

    jobsContainer.insertAdjacentHTML(
      "beforeend",
      buildJobHtml(newJob, currentJobCount)
    );

    wireJobCards(teamCard);
  });
}

function wireJobCards(teamCard) {
  teamCard.querySelectorAll(".job-card").forEach(jobCard => {
    wireSingleJobCard(jobCard);

    const removeBtn = jobCard.querySelector(".remove-job-btn");

    if (removeBtn) {
      removeBtn.onclick = () => {
        jobCard.remove();
        renumberJobs(teamCard);
      };
    }
  });
}

function wireSingleJobCard(jobCard) {
  const activityChecks = jobCard.querySelectorAll(".activityCheck");
  const otherInput = jobCard.querySelector(".otherInput");

  activityChecks.forEach(check => {
    check.onchange = () => {
      const selected = getSelectedActivitiesForJob(jobCard);

      if (selected.includes("Other")) {
        otherInput.classList.remove("hidden");
      } else {
        otherInput.value = "";
        otherInput.classList.add("hidden");
      }
    };
  });
}

function renumberJobs(teamCard) {
  teamCard.querySelectorAll(".job-card").forEach((jobCard, index) => {
    jobCard.dataset.jobIndex = index;

    const title = jobCard.querySelector(".job-card-title h4");

    if (title) {
      title.textContent = `Job ${index + 1}`;
    }

    const titleBar = jobCard.querySelector(".job-card-title");
    const existingRemoveBtn = jobCard.querySelector(".remove-job-btn");

    if (index === 0 && existingRemoveBtn) {
      existingRemoveBtn.remove();
    }

    if (index > 0 && !existingRemoveBtn) {
      titleBar.insertAdjacentHTML(
        "beforeend",
        `<button class="remove-job-btn" type="button">Remove Job</button>`
      );
    }
  });

  wireJobCards(teamCard);
}

/* =========================
   FORM INTERACTION
========================= */

function wireToggleButtons(teamCard) {
  teamCard.querySelectorAll(".nwsa-toggle")
    .forEach(toggle => {
      const buttons = toggle.querySelectorAll(".toggle-btn");

      buttons.forEach(button => {
        button.addEventListener("click", () => {
          buttons.forEach(b => b.classList.remove("active"));
          button.classList.add("active");
        });
      });
    });

  teamCard.querySelectorAll(".off-toggle")
    .forEach(toggle => {
      const buttons = toggle.querySelectorAll(".toggle-btn");

      buttons.forEach(button => {
        button.addEventListener("click", () => {
          buttons.forEach(b => b.classList.remove("active"));
          button.classList.add("active");
        });
      });
    });
}

function wireWorkingForLogic(teamCard) {
  teamCard.querySelectorAll("tbody tr").forEach(row => {
    const select = row.querySelector(".working-for-select");
    const input = row.querySelector(".working-for-other");

    select.addEventListener("change", () => {
      if (select.value === "Other") {
        input.classList.remove("hidden-other");
      } else {
        input.value = "";
        input.classList.add("hidden-other");
      }
    });
  });
}

function wireWeatherLogic(teamCard) {
  const weatherCheck = teamCard.querySelector(".weatherCheck");

  const applyWeatherState = () => {
    const disabled = weatherCheck.checked;

    teamCard
      .querySelectorAll("input, select, button")
      .forEach(element => {
        if (!element.classList.contains("weatherCheck")) {
          element.disabled = disabled;
        }
      });
  };

  weatherCheck.addEventListener("change", applyWeatherState);
  applyWeatherState();
}

/* =========================
   DATA HELPERS
========================= */

function normalizeJobs(savedTeam) {
  if (Array.isArray(savedTeam.jobs) && savedTeam.jobs.length > 0) {
    return savedTeam.jobs;
  }

  return [
    {
      activities: savedTeam.activities || [],
      other: savedTeam.other || "",
      siteLocation: savedTeam.siteLocation || "",
      adbSite: savedTeam.adbSite || ""
    }
  ];
}

function getSelectedActivitiesForJob(jobCard) {
  return [
    ...jobCard.querySelectorAll(".activityCheck:checked")
  ].map(box => box.value);
}

function collectJobsForTeam(teamCard) {
  return [...teamCard.querySelectorAll(".job-card")].map(jobCard => ({
    activities: getSelectedActivitiesForJob(jobCard),
    other: jobCard.querySelector(".otherInput").value.trim(),
    siteLocation: jobCard.querySelector(".siteLocationInput").value.trim(),
    adbSite: jobCard.querySelector(".adbSiteInput").value.trim()
  }));
}

function collectFormData() {
  const teams = {};

  document.querySelectorAll(".team-card").forEach(teamCard => {
    const teamNumber = teamCard.dataset.team;
    const weatheredOut = teamCard.querySelector(".weatherCheck").checked;

    if (weatheredOut) {
      teams[teamNumber] = {
        weather: true,
        jobs: [],
        workers: {}
      };

      return;
    }

    const workers = {};

    teamCard.querySelectorAll("tbody tr").forEach(row => {
      const workerName = row.dataset.worker;

      const nwsaButton = row.querySelector(".nwsa-toggle .active");
      const offButton = row.querySelector(".off-toggle .active");
      const workingForSelect = row.querySelector(".working-for-select");
      const workingForOther = row.querySelector(".working-for-other");

      workers[workerName] = {
        nwsa: nwsaButton ? nwsaButton.dataset.value : "",
        vehicle: row.querySelector(".vehicle").value.trim(),
        workingFor: workingForSelect.value,
        workingForOther: workingForSelect.value === "Other"
          ? workingForOther.value.trim()
          : "",
        off: offButton ? offButton.dataset.off : ""
      };
    });

    teams[teamNumber] = {
      weather: false,
      jobs: collectJobsForTeam(teamCard),
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

  document.querySelectorAll(".team-card").forEach(teamCard => {
    const teamNumber = teamCard.dataset.team;

    clearInvalidFields(teamCard);

    const weatheredOut = teamCard.querySelector(".weatherCheck").checked;

    if (weatheredOut) {
      return;
    }

    let totalWorkers = 0;
    let borrowedWorkers = 0;

    teamCard.querySelectorAll("tbody tr").forEach(row => {
      totalWorkers++;

      const workerName = row.dataset.worker;
      const workingForSelect = row.querySelector(".working-for-select");
      const workingForOther = row.querySelector(".working-for-other");

      if (workingForSelect.value === "Other") {
        borrowedWorkers++;

        if (!workingForOther.value.trim()) {
          errors.push(`Team ${teamNumber}: ${workerName} needs Working For name`);
          markInvalid(workingForOther);
        }
      }
    });

    const entireTeamBorrowed =
      totalWorkers > 0 &&
      borrowedWorkers === totalWorkers;

    if (!entireTeamBorrowed) {
      const jobs = [...teamCard.querySelectorAll(".job-card")];

      jobs.forEach((jobCard, index) => {
        const jobNumber = index + 1;
        const selectedActivities = getSelectedActivitiesForJob(jobCard);

        if (selectedActivities.length === 0) {
          errors.push(`Team ${teamNumber}, Job ${jobNumber}: select at least one activity`);
          markInvalid(jobCard.querySelector(".activity-grid"));
        }

        if (selectedActivities.includes("Other")) {
          const input = jobCard.querySelector(".otherInput");

          if (!input.value.trim()) {
            errors.push(`Team ${teamNumber}, Job ${jobNumber}: enter Other activity`);
            markInvalid(input);
          }
        }

        const siteLocation = jobCard.querySelector(".siteLocationInput");
        const adbSite = jobCard.querySelector(".adbSiteInput");

        if (!siteLocation.value.trim()) {
          errors.push(`Team ${teamNumber}, Job ${jobNumber}: Site Name required`);
          markInvalid(siteLocation);
        }

        if (!adbSite.value.trim()) {
          errors.push(`Team ${teamNumber}, Job ${jobNumber}: Site Number required`);
          markInvalid(adbSite);
        }
      });
    }

    if (entireTeamBorrowed) {
      return;
    }

    teamCard.querySelectorAll("tbody tr").forEach(row => {
      const workerName = row.dataset.worker;
      const vehicle = row.querySelector(".vehicle");
      const nwsaButton = row.querySelector(".nwsa-toggle .active");
      const workingForSelect = row.querySelector(".working-for-select");

      if (workingForSelect.value === "Other") {
        return;
      }

      if (!nwsaButton) {
        errors.push(`Team ${teamNumber}: ${workerName} missing NWSA`);
      }

      if (!vehicle.value.trim()) {
        errors.push(`Team ${teamNumber}: ${workerName} missing vehicle`);
        markInvalid(vehicle);
      }
    });
  });

  return errors;
}

function clearInvalidFields(scope = document) {
  scope.querySelectorAll(".invalid-field").forEach(element => {
    element.classList.remove("invalid-field");
  });
}

function markInvalid(element) {
  if (element) {
    element.classList.add("invalid-field");
  }
}

/* =========================
   FIRESTORE SUBMIT / UPDATE
========================= */

async function submitReport() {
  if (!currentManager) {
    return;
  }

  const errors = validateForm();

  if (errors.length > 0) {
    toast(errors[0]);
    return;
  }

  const previousReport = cachedReports[currentManager];

  const submittedReport = {
    submitted: true,
    submittedAt: previousReport?.submittedAt || new Date().toISOString(),
    updatedAt: previousReport?.submitted ? new Date().toISOString() : null,
    teams: collectFormData()
  };

  cachedReports[currentManager] = submittedReport;
  showDashboard();

  try {
    await firebaseSubmitReport(
      dateInput.value,
      currentManager,
      submittedReport.teams
    );

    await refreshData();
    renderDashboard();

    toast(previousReport?.submitted
      ? `${currentManager} report updated`
      : `${currentManager} submitted`
    );
  } catch (error) {
    console.error(error);
    toast("Error submitting report");
  }
}

/* =========================
   TEMP WORKERS
========================= */

function openTempWorkerModal() {
  if (!currentManager) {
    return;
  }

  const currentTeams = [
    ...new Set([
      ...Object.keys(groupByTeam(cachedRosters[currentManager] || [])),
      ...Object.keys(cachedReports[currentManager]?.teams || {})
    ])
  ].sort((a, b) => Number(a) - Number(b));

  openModal(
    "Add Temporary Worker",
    `
      <div class="temp-worker-card">

        <h4>Temporary Worker for This Report Only</h4>

        <input
          id="tempWorkerName"
          placeholder="Worker Name"
        >

        <select
          id="tempWorkerTeam"
          style="margin-top:14px;width:100%;"
        >

          ${currentTeams.map(team => `
            <option value="${team}">
              Team ${team}
            </option>
          `).join("")}

          <option value="NEW">
            New Team
          </option>

        </select>

        <input
          id="tempWorkerNewTeam"
          class="hidden-other"
          placeholder="New Team Number"
          style="margin-top:14px;width:100%;"
        >

        <button
          id="saveTempWorkerBtn"
          class="save-roster-btn"
          type="button"
        >
          Add Temp Worker
        </button>

      </div>
    `
  );

  const teamSelect =
    document.getElementById(
      "tempWorkerTeam"
    );

  const newTeamInput =
    document.getElementById(
      "tempWorkerNewTeam"
    );

  teamSelect.addEventListener(
    "change",
    () => {

      if (
        teamSelect.value === "NEW"
      ) {

        newTeamInput.classList.remove(
          "hidden-other"
        );

      } else {

        newTeamInput.value = "";

        newTeamInput.classList.add(
          "hidden-other"
        );

      }

    }
  );

  document.getElementById(
    "saveTempWorkerBtn"
  )
    .addEventListener(
      "click",
      saveTempWorker
    );
}

function saveTempWorker() {

  const name =
    document.getElementById(
      "tempWorkerName"
    )
      .value
      .trim();

  const teamChoice =
    document.getElementById(
      "tempWorkerTeam"
    )
      .value;

  const newTeam =
    document.getElementById(
      "tempWorkerNewTeam"
    )
      .value
      .trim();

  if (!name) {

    toast(
      "Enter temporary worker name"
    );

    return;

  }

  const team =
    teamChoice === "NEW"
      ? newTeam
      : teamChoice;

  if (!team) {

    toast(
      "Enter team number"
    );

    return;

  }

  const currentTeams =
    collectFormData();

  if (
    !currentTeams[team]
  ) {

    currentTeams[team] = {

      weather: false,

      jobs: [
        {
          activities: [],
          other: "",
          siteLocation: "",
          adbSite: ""
        }
      ],

      workers: {}

    };

  }

  currentTeams[team]
    .workers[name] = {

    nwsa: "",
    vehicle: "",
    workingFor: "Me",
    workingForOther: "",
    off: ""

  };

  cachedReports[currentManager] = {

    submitted: true,

    teams:
      currentTeams

  };

  closeModal();

  renderManagerForm(
    currentManager
  );

  toast(
    "Temporary worker added"
  );

}

/* =========================
   MODALS
========================= */

function openModal(
  title,
  html
) {

  modalTitle.textContent =
    title;

  modalBody.innerHTML =
    html;

  modalOverlay.classList.remove(
    "hidden"
  );

}

function closeModal() {

  modalOverlay.classList.add(
    "hidden"
  );

  modalBody.innerHTML = "";

}

/* =========================
   ROSTER EDITOR
========================= */

function openEditRosterModal() {

  if (
    !currentManager
  ) {

    return;

  }

  const roster =
    cachedRosters[currentManager]
    || [];

  openModal(

    `Edit ${currentManager} Roster`,

    `
      <div id="rosterEditorRows">

        ${roster.map(worker =>
          rosterRowHtml(
            worker.name,
            worker.team
          )
        ).join("")}

      </div>

      <button
        id="addRosterRowBtn"
        class="add-worker-btn"
        type="button"
      >
        + Add Worker
      </button>

      <button
        id="saveRosterChangesBtn"
        class="save-roster-btn"
        type="button"
      >
        Save Permanent Roster
      </button>
    `

  );

  document.getElementById(
    "addRosterRowBtn"
  )
    .onclick = () => {

      document
        .getElementById(
          "rosterEditorRows"
        )
        .insertAdjacentHTML(
          "beforeend",
          rosterRowHtml(
            "",
            ""
          )
        );

      wireRosterDeleteButtons();

    };

  document
    .getElementById(
      "saveRosterChangesBtn"
    )
    .onclick =
      savePermanentRoster;

  wireRosterDeleteButtons();

}

function rosterRowHtml(
  name,
  team
) {

  return `

    <div class="roster-row">

      <input
        class="roster-name"
        value="${name}"
        placeholder="Worker Name"
      >

      <input
        class="roster-team"
        value="${team}"
        placeholder="Team #"
      >

      <button
        class="remove-worker-btn"
        type="button"
      >
        Remove
      </button>

    </div>

  `;

}

function wireRosterDeleteButtons() {
  document.querySelectorAll(".remove-worker-btn").forEach(button => {
    button.onclick = () => {
      button.closest(".roster-row").remove();
    };
  });
}

async function savePermanentRoster() {
  const rows = document.querySelectorAll(".roster-row");

  const newRoster = [...rows]
    .map(row => ({
      name: row.querySelector(".roster-name").value.trim(),
      team: row.querySelector(".roster-team").value.trim()
    }))
    .filter(worker => worker.name && worker.team);

  if (newRoster.length === 0) {
    toast("Roster cannot be empty");
    return;
  }

  try {
    await firebaseSaveRoster(currentManager, newRoster);

    cachedRosters[currentManager] = newRoster;

    closeModal();
    renderManagerForm(currentManager);
    renderDashboard();

    toast("Roster updated permanently");
  } catch (error) {
    console.error(error);
    toast("Error saving roster");
  }
}

function reportsCacheKey(date) {
  return `adbDailyReports_${date}`;
}

function loadReportsCache(date) {
  try {
    return JSON.parse(localStorage.getItem(reportsCacheKey(date))) || {};
  } catch {
    return {};
  }
}

function saveReportsCache(date) {
  localStorage.setItem(
    reportsCacheKey(date),
    JSON.stringify(cachedReports || {})
  );
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
    const report = cachedReports[manager];

    const section = document.createElement("section");
    section.className = "report-manager";

    if (!report?.submitted) {
      section.innerHTML = `
        <h3>${manager}</h3>
        <p><strong>Status:</strong> DAILY NOT SUBMITTED</p>
      `;

      compiledReport.appendChild(section);
      return;
    }

    section.innerHTML = `
      <h3>${manager}</h3>
      <p>
        <strong>Submitted:</strong>
        ${formatTimestamp(report.submittedAt)}
        ${
          report.updatedAt
            ? ` &nbsp; | &nbsp; <strong>Updated:</strong> ${formatTimestamp(report.updatedAt)}`
            : ""
        }
      </p>
    `;

    Object.entries(report.teams).forEach(([teamNumber, team]) => {
      const teamDiv = document.createElement("div");
      teamDiv.className = "report-team";

      let jobsHtml = "";

      if (team.weather) {
        jobsHtml = `<p><strong>Status:</strong> WEATHERED OUT</p>`;
      } else {
        const jobs = normalizeJobs(team);

        jobs.forEach((job, index) => {
          let activityTags = "";

          (job.activities || []).forEach(activity => {
            if (activity === "Other" && job.other) {
              activityTags += `
                <span class="tag">
                  Other: ${job.other}
                </span>
              `;
            } else {
              activityTags += `
                <span class="tag">
                  ${activity}
                </span>
              `;
            }
          });

          jobsHtml += `
            <div class="report-job">
              <h5>Job ${index + 1}</h5>

              <p>${activityTags}</p>

              <p>
                <strong>Site Name:</strong>
                ${job.siteLocation || "N/A"}
              </p>

              <p>
                <strong>ADB Site #:</strong>
                ${job.adbSite || "N/A"}
              </p>
            </div>
          `;
        });
      }

      teamDiv.innerHTML = `
        <h4>
          Team ${teamNumber}
          ${team.weather ? " — WEATHERED OUT" : ""}
        </h4>

        ${jobsHtml}
      `;

      if (!team.weather) {
        const table = document.createElement("table");
        table.className = "worker-table";

        table.innerHTML = `
          <thead>
            <tr>
              <th>Worker</th>
              <th>NWSA</th>
              <th>Vehicle</th>
              <th>Working For</th>
              <th>Off</th>
            </tr>
          </thead>

          <tbody>
            ${Object.entries(team.workers || {})
              .map(([name, worker]) => {
                return `
                  <tr>
                    <td>${name}</td>
                    <td>${worker.nwsa || "N/A"}</td>
                    <td>${worker.vehicle || "N/A"}</td>
                    <td>
                      ${
                        worker.workingFor === "Other"
                          ? worker.workingForOther || "N/A"
                          : ""
                      }
                    </td>
                    <td>${worker.off || "Working"}</td>
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
  return roster.reduce((groups, worker) => {
    if (!groups[worker.team]) {
      groups[worker.team] = [];
    }

    groups[worker.team].push(worker);

    return groups;
  }, {});
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString.split("-");

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "—";
  }

  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function toast(message) {
  toastBox.textContent = message;
  toastBox.classList.remove("hidden");

  setTimeout(() => {
    toastBox.classList.add("hidden");
  }, 2500);
}
