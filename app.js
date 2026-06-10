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
const dashboardBtn = document.getElementById("dashboardBtn");

window.onload = () => {
  dateInput.value = new Date().toISOString().slice(0, 10);
  ensureRosters();
  renderDashboard();
};

dateInput.addEventListener("change", renderDashboard);
dashboardBtn.addEventListener("click", showDashboard);
document.getElementById("previewReportBtn").addEventListener("click", renderCompiledReport);

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

function renderDashboard() {
  showOnly(dashboardView);
  dashboardBtn.classList.add("hidden");

  const reports = getReports();
  const submitted = managers.filter(m => reports[m]?.submitted).length;
  completionText.textContent = `${submitted} / ${managers.length}`;
  document.getElementById("dateTitle").textContent = `Reports for ${dateInput.value}`;

  managerGrid.innerHTML = "";

  managers.forEach(manager => {
    const report = reports[manager];
    const complete = report?.submitted;

    const card = document.createElement("div");
    card.className = `manager-card ${complete ? "complete" : ""}`;

    card.innerHTML = `
      <h3>${manager}</h3>
      <p><strong>Status:</strong> ${complete ? "Submitted" : "Missing"}</p>
      <p><strong>Submitted:</strong> ${complete ? report.submittedAt : "—"}</p>
      <span class="pill ${complete ? "good" : "bad"}">
        ${complete ? "Complete" : "Not Submitted"}
      </span>
      <button>Open Daily</button>
    `;

    card.querySelector("button").onclick = () => openManager(manager);
    managerGrid.appendChild(card);
  });
}

function openManager(manager) {
  currentManager = manager;
  showOnly(formView);
  dashboardBtn.classList.remove("hidden");

  document.getElementById("formTitle").textContent = `${manager} Daily Report`;
  document.getElementById("formSubtitle").textContent = `Report Date: ${dateInput.value}`;

  renderForm(manager);
}

function renderForm(manager) {
  const container = document.getElementById("teamsContainer");
  const rosters = getRosters();
  const reports = getReports();
  const existing = reports[manager]?.teams || {};
  const teams = groupByTeam(rosters[manager]);

  container.innerHTML = "";

  Object.keys(teams).sort().forEach(teamNum => {
    const saved = existing[teamNum] || {};

    const card = document.createElement("div");
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
        ${activities.map(a => `
          <label class="activity">
            <input type="checkbox" class="activityCheck" value="${a}"
              ${saved.activities?.includes(a) ? "checked" : ""}>
            ${a}
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

    const activitiesSelected = [...card.querySelectorAll(".activityCheck:checked")]
      .map(cb => cb.value);

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
      activities: activitiesSelected,
      workingFor: card.querySelector(".workingForInput").value,
      other: card.querySelector(".otherInput").value,
      siteLocation: card.querySelector(".siteLocationInput").value,
      adbSite: card.querySelector(".adbSiteInput").value,
      workers
    };
  });

  return teams;
}

document.getElementById("saveDraftBtn").onclick = () => {
  const reports = getReports();

  reports[currentManager] = {
    submitted: false,
    draftSavedAt: new Date().toLocaleString(),
    teams: collectFormData()
  };

  saveReports(reports);
  toast("Draft saved.");
  renderDashboard();
};

document.getElementById("submitBtn").onclick = () => {
  const reports = getReports();

  reports[currentManager] = {
    submitted: true,
    submittedAt: new Date().toLocaleString(),
    teams: collectFormData()
  };

  saveReports(reports);
  toast(`${currentManager} submitted.`);
  renderDashboard();
};

document.getElementById("editRosterBtn").onclick = () => {
  showOnly(rosterView);
  document.getElementById("rosterTitle").textContent = `Edit ${currentManager} Roster`;
  renderRosterEditor();
};

function renderRosterEditor() {
  const rosters = getRosters();
  const roster = rosters[currentManager];
  const container = document.getElementById("rosterContainer");

  container.innerHTML = `<div class="roster-card"></div>`;
  const card = container.querySelector(".roster-card");

  roster.forEach((worker, index) => {
    const row = document.createElement("div");
    row.className = "roster-row";

    row.innerHTML = `
      <input value="${worker.name}" placeholder="Worker Name">
      <input value="${worker.team}" placeholder="Team #">
      <button class="delete-btn">Delete</button>
    `;

    row.querySelector(".delete-btn").onclick = () => {
      roster.splice(index, 1);
      renderRosterEditor();
    };

    card.appendChild(row);
  });
}

document.getElementById("addWorkerBtn").onclick = () => {
  const rosters = getRosters();
  rosters[currentManager].push({ name: "New Worker", team: "000" });
  saveRosters(rosters);
  renderRosterEditor();
};

document.getElementById("saveRosterBtn").onclick = () => {
  const rosters = getRosters();
  const rows = document.querySelectorAll(".roster-row");

  rosters[currentManager] = [...rows].map(row => ({
    name: row.children[0].value,
    team: row.children[1].value
  }));

  saveRosters(rosters);
  toast("Roster saved.");
  openManager(currentManager);
};

function renderCompiledReport() {
  showOnly(reportView);
  dashboardBtn.classList.remove("hidden");

  const reports = getReports();
  document.getElementById("reportDateLine").textContent = `Report Date: ${dateInput.value}`;

  const container = document.getElementById("compiledReport");
  container.innerHTML = "";

  managers.forEach(manager => {
    const report = reports[manager];

    const section = document.createElement("div");
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
      const div = document.createElement("div");
      div.className = "report-team";

      div.innerHTML = `
        <h4>Team ${team} ${data.weather ? "— WEATHERED OUT" : ""}</h4>
        <p>
          ${(data.activities || []).map(a => `<span class="tag">${a}</span>`).join("")}
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
            ${Object.entries(data.workers).map(([name, w]) => `
              <tr>
                <td>${name}</td>
                <td>${w.nwsa}</td>
                <td>${w.vehicle}</td>
                <td>${w.status}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      section.appendChild(div);
    });

    container.appendChild(section);
  });
}

function groupByTeam(roster) {
  return roster.reduce((groups, worker) => {
    if (!groups[worker.team]) groups[worker.team] = [];
    groups[worker.team].push(worker);
    return groups;
  }, {});
}

function showOnly(view) {
  [dashboardView, formView, rosterView, reportView].forEach(v => v.classList.add("hidden"));
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