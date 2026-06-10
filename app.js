/* =====================================================
   ADB DAILY WORKFORCE REPORTS
   Static GitHub Pages Prototype
   Uses localStorage only — no Firebase/backend yet.
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
    { name: "AJ Worker 1", team: "101" },
    { name: "AJ Worker 2", team: "101" },
    { name: "AJ Worker 3", team: "102" }
  ],
  "Jimmy": [
    { name: "Jimmy Worker 1", team: "201" },
    { name: "Jimmy Worker 2", team: "201" },
    { name: "Jimmy Worker 3", team: "202" }
  ],
  "Matt A": [
    { name: "Matt A Worker 1", team: "301" },
    { name: "Matt A Worker 2", team: "301" },
    { name: "Matt A Worker 3", team: "302" }
  ],
  "Matt P": [
    { name: "Matt P Worker 1", team: "401" },
    { name: "Matt P Worker 2", team: "401" },
    { name: "Matt P Worker 3", team: "402" }
  ],
  "Bob": [
    { name: "Bob Worker 1", team: "501" },
    { name: "Bob Worker 2", team: "501" },
    { name: "Bob Worker 3", team: "502" }
  ],
  "Zach": [
    { name: "Zach Worker 1", team: "601" },
    { name: "Zach Worker 2", team: "601" },
    { name: "Zach Worker 3", team: "602" }
  ],
  "Will": [
    { name: "Will Worker 1", team: "701" },
    { name: "Will Worker 2", team: "701" },
    { name: "Will Worker 3", team: "702" }
  ],
  "Barry": [
    { name: "Barry Worker 1", team: "801" },
    { name: "Barry Worker 2", team: "801" },
    { name: "Barry Worker 3", team: "802" }
  ]
};

/* =========================
   GLOBAL STATE
========================= */

let currentManager = null;
let settingsManager = null;

/* =========================
   DOM REFERENCES
========================= */

const dateInput = document.getElementById("dateInput");

const dashboardView = document.getElementById("dashboardView");
const formView = document.getElementById("formView");
const reportView = document.getElementById("reportView");
const settingsView = document.getElementById("settingsView");

const managerGrid = document.getElementById("managerGrid");
const completionText = document.getElementById("completionText");

const completeCount = document.getElementById("completeCount");
const missingCount = document.getElementById("missingCount");
const draftCount = document.getElementById("draftCount");
const dateTitle = document.getElementById("dateTitle");

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const teamsContainer = document.getElementById("teamsContainer");

const compiledReport = document.getElementById("compiledReport");
const reportDateLine = document.getElementById("reportDateLine");

const toastBox = document.getElementById("toast");

/* =========================
   STARTUP
========================= */

window.addEventListener("load", () => {
  dateInput.value = new Date().toISOString().slice(0, 10);

  ensureRosters();
  wireButtons();
  renderSettingsManagerButtons();
  showDashboard();
});

/* =========================
   BUTTON WIRING
========================= */

function wireButtons() {
  document.getElementById("navDashboardBtn").addEventListener("click", showDashboard);
  document.getElementById("navSettingsBtn").addEventListener("click", showSettings);

  document.getElementById("previewReportBtn").addEventListener("click", renderCompiledReport);
  document.getElementById("backToDashboardBtn").addEventListener("click", showDashboard);
  document.getElementById("reportBackBtn").addEventListener("click", showDashboard);
  document.getElementById("settingsBackBtn").addEventListener("click", showDashboard);

  document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
  document.getElementById("submitBtn").addEventListener("click", submitReport);

  document.getElementById("clearSelectedDateBtn").addEventListener("click", clearSelectedDate);
  document.getElementById("clearAllReportsBtn").addEventListener("click", clearAllReports);
  document.getElementById("resetRostersBtn").addEventListener("click", resetRosters);

  document.getElementById("settingsAddWorkerBtn").addEventListener("click", settingsAddWorker);
  document.getElementById("settingsSaveRosterBtn").addEventListener("click", settingsSaveRoster);

  dateInput.addEventListener("change", () => {
    if (!dashboardView.classList.contains("hidden")) {
      renderDashboard();
    }

    if (!reportView.classList.contains("hidden")) {
      renderCompiledReport();
    }
  });
}

/* =========================
   STORAGE HELPERS
========================= */

function reportKey(date = dateInput.value) {
  return `reports_${date}`;
}

function getReports(date = dateInput.value) {
  return JSON.parse(localStorage.getItem(reportKey(date)) || "{}");
}

function saveReports(reports, date = dateInput.value) {
  localStorage.setItem(reportKey(date), JSON.stringify(reports));
}

function ensureRosters() {
  if (!localStorage.getItem("rosters")) {
    localStorage.setItem("rosters", JSON.stringify(defaultRosters));
  }
}

function getRosters() {
  return JSON.parse(localStorage.getItem("rosters") || "{}");
}

function saveRosters(rosters) {
  localStorage.setItem("rosters", JSON.stringify(rosters));
}

/* =========================
   NAVIGATION
========================= */

function showOnly(view) {
  [dashboardView, formView, reportView, settingsView].forEach(section => {
    section.classList.add("hidden");
  });

  view.classList.remove("hidden");
}

function setActiveNav(target) {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.remove("active");
  });

  if (target === "dashboard") {
    document.getElementById("navDashboardBtn").classList.add("active");
  }

  if (target === "settings") {
    document.getElementById("navSettingsBtn").classList.add("active");
  }
}

function showDashboard() {
  showOnly(dashboardView);
  setActiveNav("dashboard");
  renderDashboard();
}

function showSettings() {
  showOnly(settingsView);
  setActiveNav("settings");
  renderSettingsManagerButtons();

  const editor = document.getElementById("settingsRosterEditor");
  editor.classList.add("hidden");
}

/* =========================
   DASHBOARD
========================= */

function renderDashboard() {
  const reports = getReports();
  const rosters = getRosters();

  const submittedManagers = managers.filter(manager => reports[manager]?.submitted);
  const draftManagers = managers.filter(manager => reports[manager] && !reports[manager]?.submitted);

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
    const report = reports[manager];
    const roster = rosters[manager] || [];
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
        <p><strong>Submitted:</strong> ${isSubmitted ? report.submittedAt : "—"}</p>
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
  setActiveNav(null);

  formTitle.textContent = `${manager} Daily Report`;
  formSubtitle.textContent = `Report Date: ${formatDate(dateInput.value)}`;

  renderManagerForm(manager);
}

function renderManagerForm(manager) {
  const rosters = getRosters();
  const reports = getReports();

  const roster = rosters[manager] || [];
  const teams = groupByTeam(roster);
  const existing = reports[manager]?.teams || {};

  teamsContainer.innerHTML = "";

  Object.keys(teams)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(teamNumber => {
      const saved = existing[teamNumber] || {};

      const teamCard = document.createElement("article");
      teamCard.className = "team-card";
      teamCard.dataset.team = teamNumber;

      teamCard.innerHTML = `
        <div class="team-top">
          <h3>Team ${teamNumber}</h3>

          <label class="weather">
            <input type="checkbox" class="weatherCheck" ${saved.weather ? "checked" : ""}>
            Weathered Out
          </label>
        </div>

        <section class="form-block">
          <p class="form-block-title">Activities</p>

          <div class="activity-grid">
            ${activities.map(activity => {
              const checked = saved.activities?.includes(activity) ? "checked" : "";

              return `
                <label class="activity">
                  <input type="checkbox" class="activityCheck" value="${activity}" ${checked}>
                  ${activity}
                </label>
              `;
            }).join("")}
          </div>

          <div class="conditional-inputs">
            <input
              class="workingForInput conditional-input ${saved.activities?.includes("Working For") ? "" : "hidden"}"
              placeholder="Working for..."
              value="${saved.workingFor || ""}"
            >

            <input
              class="otherInput conditional-input ${saved.activities?.includes("Other") ? "" : "hidden"}"
              placeholder="Other activity note..."
              value="${saved.other || ""}"
            >
          </div>
        </section>

        <section class="form-block">
          <p class="form-block-title">Site Information</p>

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
          <p class="form-block-title">Workers</p>

          <table class="worker-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>NWSA</th>
                <th>Vehicle #</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${teams[teamNumber].map(worker => {
                const savedWorker = saved.workers?.[worker.name] || {};

                return `
                  <tr data-worker="${worker.name}">
                    <td><strong>${worker.name}</strong></td>

                    <td>
                      <select class="nwsa">
                        <option value="">Select</option>
                        <option ${savedWorker.nwsa === "Y" ? "selected" : ""}>Y</option>
                        <option ${savedWorker.nwsa === "N" ? "selected" : ""}>N</option>
                      </select>
                    </td>

                    <td>
                      <input
                        class="vehicle"
                        placeholder="Vehicle # or N/A"
                        value="${savedWorker.vehicle || ""}"
                      >
                    </td>

                    <td>
                      <select class="status">
                        <option value="">Select</option>
                        <option ${savedWorker.status === "Working" ? "selected" : ""}>Working</option>
                        <option ${savedWorker.status === "PTO" ? "selected" : ""}>PTO</option>
                        <option ${savedWorker.status === "Sick" ? "selected" : ""}>Sick</option>
                        <option ${savedWorker.status === "Other Off" ? "selected" : ""}>Other Off</option>
                      </select>
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
    });
}

function wireTeamConditionalInputs(teamCard) {
  const activityChecks = teamCard.querySelectorAll(".activityCheck");
  const workingForInput = teamCard.querySelector(".workingForInput");
  const otherInput = teamCard.querySelector(".otherInput");

  activityChecks.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selectedActivities = getSelectedActivities(teamCard);

      if (selectedActivities.includes("Working For")) {
        workingForInput.classList.remove("hidden");
      } else {
        workingForInput.value = "";
        workingForInput.classList.add("hidden");
      }

      if (selectedActivities.includes("Other")) {
        otherInput.classList.remove("hidden");
      } else {
        otherInput.value = "";
        otherInput.classList.add("hidden");
      }
    });
  });
}

function getSelectedActivities(teamCard) {
  return [...teamCard.querySelectorAll(".activityCheck:checked")]
    .map(checkbox => checkbox.value);
}

function collectFormData() {
  const teams = {};

  document.querySelectorAll(".team-card").forEach(teamCard => {
    const teamNumber = teamCard.dataset.team;
    const selectedActivities = getSelectedActivities(teamCard);

    const workers = {};

    teamCard.querySelectorAll("tbody tr").forEach(row => {
      const workerName = row.dataset.worker;

      workers[workerName] = {
        nwsa: row.querySelector(".nwsa").value,
        vehicle: row.querySelector(".vehicle").value.trim(),
        status: row.querySelector(".status").value
      };
    });

    teams[teamNumber] = {
      weather: teamCard.querySelector(".weatherCheck").checked,
      activities: selectedActivities,
      workingFor: teamCard.querySelector(".workingForInput").value.trim(),
      other: teamCard.querySelector(".otherInput").value.trim(),
      siteLocation: teamCard.querySelector(".siteLocationInput").value.trim(),
      adbSite: teamCard.querySelector(".adbSiteInput").value.trim(),
      workers
    };
  });

  return teams;
}

/* =========================
   VALIDATION
========================= */

function validateRequiredFields() {
  const errors = [];

  document.querySelectorAll(".team-card").forEach(teamCard => {
    const teamNumber = teamCard.dataset.team;
    const selectedActivities = getSelectedActivities(teamCard);
    const isWeatheredOut = teamCard.querySelector(".weatherCheck").checked;

    clearInvalidFields(teamCard);

    if (!isWeatheredOut && selectedActivities.length === 0) {
      errors.push(`Team ${teamNumber}: select at least one activity or mark weathered out.`);
      markInvalid(teamCard.querySelector(".activity-grid"));
    }

    if (selectedActivities.includes("Working For")) {
      const input = teamCard.querySelector(".workingForInput");

      if (!input.value.trim()) {
        errors.push(`Team ${teamNumber}: enter who the team was working for.`);
        markInvalid(input);
      }
    }

    if (selectedActivities.includes("Other")) {
      const input = teamCard.querySelector(".otherInput");

      if (!input.value.trim()) {
        errors.push(`Team ${teamNumber}: enter an Other activity note.`);
        markInvalid(input);
      }
    }

    const siteLocation = teamCard.querySelector(".siteLocationInput");
    const adbSite = teamCard.querySelector(".adbSiteInput");

    if (!siteLocation.value.trim()) {
      errors.push(`Team ${teamNumber}: Site Location is required.`);
      markInvalid(siteLocation);
    }

    if (!adbSite.value.trim()) {
      errors.push(`Team ${teamNumber}: ADB Site Number is required.`);
      markInvalid(adbSite);
    }

    teamCard.querySelectorAll("tbody tr").forEach(row => {
      const workerName = row.dataset.worker;
      const nwsa = row.querySelector(".nwsa");
      const vehicle = row.querySelector(".vehicle");
      const status = row.querySelector(".status");

      if (!nwsa.value) {
        errors.push(`Team ${teamNumber}: ${workerName} needs NWSA Y/N.`);
        markInvalid(nwsa);
      }

      if (!vehicle.value.trim()) {
        errors.push(`Team ${teamNumber}: ${workerName} needs Vehicle # or N/A.`);
        markInvalid(vehicle);
      }

      if (!status.value) {
        errors.push(`Team ${teamNumber}: ${workerName} needs a status.`);
        markInvalid(status);
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
   SAVE / SUBMIT
========================= */

function saveDraft() {
  if (!currentManager) return;

  const reports = getReports();

  reports[currentManager] = {
    submitted: false,
    draftSavedAt: new Date().toLocaleString(),
    teams: collectFormData()
  };

  saveReports(reports);
  toast("Draft saved.");
  renderDashboard();
}

function submitReport() {
  if (!currentManager) return;

  const errors = validateRequiredFields();

  if (errors.length > 0) {
    toast(`Cannot submit: ${errors[0]}`);
    return;
  }

  const reports = getReports();

  reports[currentManager] = {
    submitted: true,
    submittedAt: new Date().toLocaleString(),
    teams: collectFormData()
  };

  saveReports(reports);

  toast(`${currentManager} submitted successfully.`);
  showDashboard();
}

/* =========================
   REPORT PREVIEW
========================= */

function renderCompiledReport() {
  showOnly(reportView);
  setActiveNav(null);

  const reports = getReports();

  reportDateLine.textContent = `Report Date: ${formatDate(dateInput.value)}`;
  compiledReport.innerHTML = "";

  managers.forEach(manager => {
    const report = reports[manager];

    const section = document.createElement("section");
    section.className = "report-manager";

    if (!report?.submitted) {
      section.innerHTML = `
        <h3>${manager}</h3>
        <p><strong>Status:</strong> Missing / Not Submitted</p>
      `;

      compiledReport.appendChild(section);
      return;
    }

    section.innerHTML = `
      <h3>${manager}</h3>
      <p><strong>Submitted:</strong> ${report.submittedAt}</p>
    `;

    Object.entries(report.teams).forEach(([teamNumber, teamData]) => {
      const teamDiv = document.createElement("div");
      teamDiv.className = "report-team";

      teamDiv.innerHTML = `
        <h4>
          Team ${teamNumber}
          ${teamData.weather ? " — WEATHERED OUT" : ""}
        </h4>

        <p>
          ${(teamData.activities || [])
            .map(activity => `<span class="tag">${activity}</span>`)
            .join("")}
        </p>

        ${teamData.workingFor ? `<p><strong>Working For:</strong> ${teamData.workingFor}</p>` : ""}
        ${teamData.other ? `<p><strong>Other:</strong> ${teamData.other}</p>` : ""}

        <p><strong>Site Location:</strong> ${teamData.siteLocation || "—"}</p>
        <p><strong>ADB Site #:</strong> ${teamData.adbSite || "—"}</p>

        <table class="worker-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>NWSA</th>
              <th>Vehicle</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${Object.entries(teamData.workers).map(([workerName, worker]) => `
              <tr>
                <td>${workerName}</td>
                <td>${worker.nwsa || "—"}</td>
                <td>${worker.vehicle || "—"}</td>
                <td>${worker.status || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      section.appendChild(teamDiv);
    });

    compiledReport.appendChild(section);
  });
}

/* =========================
   SETTINGS
========================= */

function clearSelectedDate() {
  const confirmed = confirm(`Clear all reports for ${formatDate(dateInput.value)}?`);

  if (!confirmed) return;

  localStorage.removeItem(reportKey(dateInput.value));

  toast("Selected date reports cleared.");
  renderDashboard();
}

function clearAllReports() {
  const confirmed = confirm("Clear ALL report data stored in this browser?");

  if (!confirmed) return;

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("reports_")) {
      localStorage.removeItem(key);
    }
  });

  toast("All reports cleared.");
  renderDashboard();
}

function resetRosters() {
  const confirmed = confirm("Reset all rosters back to placeholder defaults?");

  if (!confirmed) return;

  localStorage.setItem("rosters", JSON.stringify(defaultRosters));

  toast("Rosters reset.");
  renderSettingsManagerButtons();
}

function renderSettingsManagerButtons() {
  const container = document.getElementById("settingsRosterButtons");

  container.innerHTML = "";

  managers.forEach(manager => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = manager;

    button.addEventListener("click", () => {
      openSettingsRoster(manager);
    });

    container.appendChild(button);
  });
}

function openSettingsRoster(manager) {
  settingsManager = manager;

  document.getElementById("settingsRosterEditor").classList.remove("hidden");
  document.getElementById("settingsRosterTitle").textContent = `${manager} Roster`;

  renderSettingsRosterRows();
}

function renderSettingsRosterRows() {
  const rosters = getRosters();
  const roster = rosters[settingsManager] || [];
  const container = document.getElementById("settingsRosterRows");

  container.innerHTML = "";

  roster.forEach((worker, index) => {
    const row = document.createElement("div");
    row.className = "roster-row";

    row.innerHTML = `
      <input value="${worker.name}" placeholder="Worker Name">
      <input value="${worker.team}" placeholder="Team #">
      <button class="delete-btn" type="button">Delete</button>
    `;

    row.querySelector(".delete-btn").addEventListener("click", () => {
      roster.splice(index, 1);
      saveRosters(rosters);
      renderSettingsRosterRows();
    });

    container.appendChild(row);
  });
}

function settingsAddWorker() {
  if (!settingsManager) {
    toast("Select a manager first.");
    return;
  }

  const rosters = getRosters();

  if (!rosters[settingsManager]) {
    rosters[settingsManager] = [];
  }

  rosters[settingsManager].push({
    name: "New Worker",
    team: "000"
  });

  saveRosters(rosters);
  renderSettingsRosterRows();
}

function settingsSaveRoster() {
  if (!settingsManager) return;

  const rosters = getRosters();
  const rows = document.querySelectorAll("#settingsRosterRows .roster-row");

  rosters[settingsManager] = [...rows].map(row => ({
    name: row.children[0].value.trim() || "Unnamed Worker",
    team: row.children[1].value.trim() || "000"
  }));

  saveRosters(rosters);

  toast(`${settingsManager} roster saved.`);
  renderDashboard();
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
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function toast(message) {
  toastBox.textContent = message;
  toastBox.classList.remove("hidden");

  setTimeout(() => {
    toastBox.classList.add("hidden");
  }, 3000);
}