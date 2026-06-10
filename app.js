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

let currentManager = null;

const dateInput = document.getElementById("dateInput");
const dashboardView = document.getElementById("dashboardView");
const formView = document.getElementById("formView");
const rosterView = document.getElementById("rosterView");
const reportView = document.getElementById("reportView");
const managerGrid = document.getElementById("managerGrid");
const completionText = document.getElementById("completionText");

window.onload = () => {
  dateInput.value = new Date().toISOString().slice(0, 10);
  ensureRosters();
  wireStaticButtons();
  renderDashboard();
};

function wireStaticButtons() {
  const dashboardBtn = document.getElementById("dashboardBtn");
  const previewReportBtn = document.getElementById("previewReportBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const submitBtn = document.getElementById("submitBtn");
  const editRosterBtn = document.getElementById("editRosterBtn");
  const addWorkerBtn = document.getElementById("addWorkerBtn");
  const saveRosterBtn = document.getElementById("saveRosterBtn");

  if (dashboardBtn) dashboardBtn.addEventListener("click", showDashboard);
  if (previewReportBtn) previewReportBtn.addEventListener("click", renderCompiledReport);
  if (saveDraftBtn) saveDraftBtn.addEventListener("click", saveDraft);
  if (submitBtn) submitBtn.addEventListener("click", submitReport);
  if (editRosterBtn) editRosterBtn.addEventListener("click", openRosterEditor);
  if (addWorkerBtn) addWorkerBtn.addEventListener("click", addWorker);
  if (saveRosterBtn) saveRosterBtn.addEventListener("click", saveRoster);

  dateInput.addEventListener("change", renderDashboard);
}

/* ===================================================
   STORAGE
=================================================== */

function key(type, date = dateInput.value) {
  return `${type}_${date}`;
}

function getReports() {
  return JSON.parse(localStorage.getItem(key("reports")) || "{}");
}

function saveReports(reports) {
  localStorage.setItem(key("reports"), JSON.stringify(reports));
}

function ensureRosters() {
  if (!localStorage.getItem("rosters")) {
    localStorage.setItem("rosters", JSON.stringify(defaultRosters));
  }
}

function getRosters() {
  return JSON.parse(localStorage.getItem("rosters"));
}

function saveRosters(rosters) {
  localStorage.setItem("rosters", JSON.stringify(rosters));
}

/* ===================================================
   DASHBOARD
=================================================== */

function renderDashboard() {
  showOnly(dashboardView);

  const reports = getReports();
  const submitted = managers.filter(manager => reports[manager]?.submitted).length;
  const missing = managers.length - submitted;

  completionText.textContent = `${submitted} / ${managers.length}`;

  const completeCount = document.getElementById("completeCount");
  const missingCount = document.getElementById("missingCount");
  const overdueCount = document.getElementById("overdueCount");
  const dateTitle = document.getElementById("dateTitle");

  if (completeCount) completeCount.textContent = submitted;
  if (missingCount) missingCount.textContent = missing;
  if (overdueCount) overdueCount.textContent = "0";
  if (dateTitle) dateTitle.textContent = `Reports for ${formatDate(dateInput.value)}`;

  managerGrid.innerHTML = "";

  managers.forEach(manager => {
    const report = reports[manager];
    const complete = !!report?.submitted;
    const roster = getRosters()[manager] || [];
    const teams = Object.keys(groupByTeam(roster)).length;

    const card = document.createElement("article");
    card.className = `manager-card ${complete ? "complete" : ""}`;

    card.innerHTML = `
      <div>
        <div class="manager-card-top">
          <h3>${manager}</h3>
          <span class="pill ${complete ? "good" : "bad"}">
            ${complete ? "COMPLETE" : "MISSING"}
          </span>
        </div>

        <p><strong>Submitted:</strong> ${complete ? report.submittedAt : "—"}</p>
        <p><strong>Teams:</strong> ${teams}</p>
        <p><strong>Workers:</strong> ${roster.length}</p>
      </div>

      <button type="button">
        Open Daily
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => openManager(manager));

    managerGrid.appendChild(card);
  });
}

/* ===================================================
   MANAGER FORM
=================================================== */

function openManager(manager) {
  currentManager = manager;

  showOnly(formView);

  document.getElementById("formTitle").textContent = `${manager} Daily Report`;
  document.getElementById("formSubtitle").textContent = `Report Date: ${formatDate(dateInput.value)}`;

  renderForm(manager);
}

function renderForm(manager) {
  const container = document.getElementById("teamsContainer");
  const rosters = getRosters();
  const reports = getReports();

  const roster = rosters[manager] || [];
  const existing = reports[manager]?.teams || {};
  const teams = groupByTeam(roster);

  container.innerHTML = "";

  Object.keys(teams).sort().forEach(teamNum => {
    const saved = existing[teamNum] || {};

    const card = document.createElement("article");
    card.className = "team-card";
    card.dataset.team = teamNum;

    card.innerHTML = `
      <div class="team-top">
        <h3>Team ${teamNum}</h3>

        <label class="weather">
          <input type="checkbox" class="weatherCheck" ${saved.weather ? "checked" : ""}>
          Weathered Out
        </label>
      </div>

      <p class="eyebrow">Activities</p>

      <div class="activity-grid">
        ${activities.map(activity => `
          <label class="activity">
            <input
              type="checkbox"
              class="activityCheck"
              value="${activity}"
              ${saved.activities?.includes(activity) ? "checked" : ""}
            >
            ${activity}
          </label>
        `).join("")}
      </div>

      <div class="extra-inputs">
        <input class="workingForInput" placeholder="Working for..." value="${saved.workingFor || ""}">
        <input class="otherInput" placeholder="Other activity note..." value="${saved.other || ""}">
        <input class="siteLocationInput" placeholder="Site Location" value="${saved.siteLocation || ""}">
        <input class="adbSiteInput" placeholder="ADB Site Number" value="${saved.adbSite || ""}">
      </div>

      <p class="eyebrow">Workers</p>

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
          ${teams[teamNum].map(worker => {
            const savedWorker = saved.workers?.[worker.name] || {};

            return `
              <tr data-worker="${worker.name}">
                <td><strong>${worker.name}</strong></td>

                <td>
                  <select class="nwsa">
                    <option ${savedWorker.nwsa === "Y" ? "selected" : ""}>Y</option>
                    <option ${savedWorker.nwsa === "N" ? "selected" : ""}>N</option>
                  </select>
                </td>

                <td>
                  <input class="vehicle" placeholder="N/A" value="${savedWorker.vehicle || ""}">
                </td>

                <td>
                  <select class="status">
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
    `;

    container.appendChild(card);
  });
}

function collectFormData() {
  const teams = {};

  document.querySelectorAll(".team-card").forEach(card => {
    const team = card.dataset.team;

    const selectedActivities = [...card.querySelectorAll(".activityCheck:checked")]
      .map(checkbox => checkbox.value);

    const workers = {};

    card.querySelectorAll("tbody tr").forEach(row => {
      const name = row.dataset.worker;

      workers[name] = {
        nwsa: row.querySelector(".nwsa").value,
        vehicle: row.querySelector(".vehicle").value || "N/A",
        status: row.querySelector(".status").value
      };
    });

    teams[team] = {
      weather: card.querySelector(".weatherCheck").checked,
      activities: selectedActivities,
      workingFor: card.querySelector(".workingForInput").value.trim(),
      other: card.querySelector(".otherInput").value.trim(),
      siteLocation: card.querySelector(".siteLocationInput").value.trim(),
      adbSite: card.querySelector(".adbSiteInput").value.trim(),
      workers
    };
  });

  return teams;
}

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

  const reports = getReports();

  reports[currentManager] = {
    submitted: true,
    submittedAt: new Date().toLocaleString(),
    teams: collectFormData()
  };

  saveReports(reports);
  toast(`${currentManager} submitted.`);
  renderDashboard();
}

/* ===================================================
   ROSTER EDITOR
=================================================== */

function openRosterEditor() {
  if (!currentManager) return;

  showOnly(rosterView);

  document.getElementById("rosterTitle").textContent =
    `Edit ${currentManager} Roster`;

  renderRosterEditor();
}

function renderRosterEditor() {
  const rosters = getRosters();
  const roster = rosters[currentManager] || [];
  const container = document.getElementById("rosterContainer");

  container.innerHTML = `
    <div class="roster-card"></div>
  `;

  const card = container.querySelector(".roster-card");

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
      renderRosterEditor();
    });

    card.appendChild(row);
  });
}

function addWorker() {
  if (!currentManager) return;

  const rosters = getRosters();

  if (!rosters[currentManager]) {
    rosters[currentManager] = [];
  }

  rosters[currentManager].push({
    name: "New Worker",
    team: "000"
  });

  saveRosters(rosters);
  renderRosterEditor();
}

function saveRoster() {
  if (!currentManager) return;

  const rosters = getRosters();
  const rows = document.querySelectorAll(".roster-row");

  rosters[currentManager] = [...rows].map(row => ({
    name: row.children[0].value.trim() || "Unnamed Worker",
    team: row.children[1].value.trim() || "000"
  }));

  saveRosters(rosters);

  toast("Roster saved.");
  openManager(currentManager);
}

/* ===================================================
   COMPILED REPORT
=================================================== */

function renderCompiledReport() {
  showOnly(reportView);

  const reports = getReports();

  document.getElementById("reportDateLine").textContent =
    `Report Date: ${formatDate(dateInput.value)}`;

  const container = document.getElementById("compiledReport");

  container.innerHTML = "";

  managers.forEach(manager => {
    const report = reports[manager];

    const section = document.createElement("section");
    section.className = "report-manager";

    if (!report?.submitted) {
      section.innerHTML = `
        <h3>${manager}</h3>
        <p><strong>Status:</strong> Missing / Not Submitted</p>
      `;

      container.appendChild(section);
      return;
    }

    section.innerHTML = `
      <h3>${manager}</h3>
      <p><strong>Submitted:</strong> ${report.submittedAt}</p>
    `;

    Object.entries(report.teams).forEach(([team, data]) => {
      const teamDiv = document.createElement("div");
      teamDiv.className = "report-team";

      teamDiv.innerHTML = `
        <h4>
          Team ${team}
          ${data.weather ? " — WEATHERED OUT" : ""}
        </h4>

        <p>
          ${(data.activities || [])
            .map(activity => `<span class="tag">${activity}</span>`)
            .join("")}
        </p>

        ${data.workingFor ? `<p><strong>Working For:</strong> ${data.workingFor}</p>` : ""}
        ${data.other ? `<p><strong>Other:</strong> ${data.other}</p>` : ""}

        <p><strong>Site:</strong> ${data.siteLocation || "—"}</p>
        <p><strong>ADB Site #:</strong> ${data.adbSite || "—"}</p>

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
            ${Object.entries(data.workers).map(([name, worker]) => `
              <tr>
                <td>${name}</td>
                <td>${worker.nwsa}</td>
                <td>${worker.vehicle}</td>
                <td>${worker.status}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      section.appendChild(teamDiv);
    });

    container.appendChild(section);
  });
}

/* ===================================================
   HELPERS
=================================================== */

function groupByTeam(roster) {
  return roster.reduce((groups, worker) => {
    if (!groups[worker.team]) {
      groups[worker.team] = [];
    }

    groups[worker.team].push(worker);

    return groups;
  }, {});
}

function showOnly(view) {
  [dashboardView, formView, rosterView, reportView].forEach(section => {
    section.classList.add("hidden");
  });

  view.classList.remove("hidden");
}

function showDashboard() {
  renderDashboard();
}

function toast(message) {
  const toastBox = document.getElementById("toast");

  toastBox.textContent = message;
  toastBox.classList.remove("hidden");

  setTimeout(() => {
    toastBox.classList.add("hidden");
  }, 2500);
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