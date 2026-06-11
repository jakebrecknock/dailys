/* =====================================================
   REPORT BUILDER

   Builds polished HTML email reports.
===================================================== */

function normalizeJobs(team) {
  if (Array.isArray(team.jobs) && team.jobs.length > 0) {
    return team.jobs;
  }

  return [
    {
      activities: team.activities || [],
      other: team.other || "",
      siteLocation: team.siteLocation || "",
      adbSite: team.adbSite || ""
    }
  ];
}

function buildActivityTags(job) {
  return (job.activities || [])
    .map(activity => {
      if (activity === "Other" && job.other) {
        return `
          <span class="tag">
            Other: ${job.other}
          </span>
        `;
      }

      return `
        <span class="tag">
          ${activity}
        </span>
      `;
    })
    .join("");
}

function buildWorkerRows(workers = {}) {
  return Object.entries(workers)
    .map(([workerName, worker]) => {
      return `
        <tr>
          <td>${workerName}</td>
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
    })
    .join("");
}

function buildReportHtml(date, reports, options = {}) {
  const isUpdated = options.isUpdated === true;

  let html = `
  <html>
  <head>
  <style>
    body{
      font-family:Arial,sans-serif;
      background:#f3f6fb;
      color:#172033;
      padding:30px;
    }

    .title{
      background:#0f172a;
      color:white;
      padding:26px;
      border-radius:6px;
      border-left:10px solid #f97316;
    }

    .title h1{
      margin:0;
      font-size:30px;
      letter-spacing:-.5px;
    }

    .date{
      margin-top:10px;
      color:#cbd5e1;
      font-size:15px;
    }

    .updated{
      display:inline-block;
      margin-top:14px;
      background:#f97316;
      color:white;
      padding:8px 12px;
      font-weight:bold;
      border-radius:3px;
      letter-spacing:.04em;
    }

    .manager{
      margin-top:35px;
      background:white;
      border:1px solid #d9e0ea;
      border-left:8px solid #f97316;
      border-radius:6px;
      overflow:hidden;
    }

    .manager-header{
      background:#0f172a;
      color:white;
      padding:16px 18px;
      font-size:24px;
      font-weight:bold;
    }

    .manager-meta{
      padding:12px 18px;
      background:#f8fafc;
      border-bottom:1px solid #d9e0ea;
      color:#475467;
      font-size:13px;
    }

    .team{
      padding:20px;
      border-top:1px solid #d9e0ea;
    }

    .team-title{
      font-size:21px;
      font-weight:bold;
      margin-bottom:14px;
      color:#0f172a;
      border-bottom:2px solid #e5e7eb;
      padding-bottom:8px;
    }

    .job{
      margin:16px 0;
      border:1px solid #d9e0ea;
      background:#fbfdff;
      padding:16px;
      border-radius:4px;
    }

    .job-title{
      font-weight:bold;
      color:#0f172a;
      margin-bottom:10px;
      font-size:16px;
    }

    .tag{
      display:inline-block;
      background:#fff7ed;
      color:#c2410c;
      border:1px solid #fed7aa;
      padding:8px 14px;
      margin-right:8px;
      margin-bottom:8px;
      border-radius:4px;
      font-size:13px;
      font-weight:bold;
    }

    .site-line{
      margin:6px 0;
      font-size:14px;
    }

    table{
      width:100%;
      border-collapse:collapse;
      margin-top:20px;
      font-size:14px;
    }

    th{
      background:#0f172a;
      color:white;
      text-align:left;
      padding:12px;
      border:1px solid #0f172a;
    }

    td{
      padding:12px;
      border:1px solid #d9e0ea;
    }

    tr:nth-child(even) td{
      background:#f8fafc;
    }

    .weather{
      color:#dc2626;
      font-weight:bold;
      background:#fee2e2;
      padding:12px;
      border:1px solid #fecaca;
      border-radius:4px;
      display:inline-block;
    }
  </style>
  </head>

  <body>
    <div class="title">
      <h1>
        ${isUpdated ? "*UPDATED* " : ""}ADB DAILY WORKFORCE REPORT
      </h1>

      <div class="date">
        ${date}
      </div>

      ${
        isUpdated
          ? `<div class="updated">UPDATED REPORT</div>`
          : ""
      }
    </div>
  `;

  Object.keys(reports)
    .forEach(managerName => {
      const manager = reports[managerName];

      html += `
        <div class="manager">
          <div class="manager-header">
            ${managerName}
          </div>

          <div class="manager-meta">
            Submitted:
            ${manager.submittedAt || "N/A"}
            ${
              manager.updatedAt
                ? `&nbsp;&nbsp; | &nbsp;&nbsp; Updated: ${manager.updatedAt}`
                : ""
            }
          </div>
      `;

      Object.entries(manager.teams || {})
        .forEach(([teamNumber, team]) => {
          html += `
            <div class="team">
              <div class="team-title">
                Team ${teamNumber}
              </div>
          `;

          if (team.weather) {
            html += `
              <div class="weather">
                WEATHERED OUT
              </div>
            `;
          } else {
            const jobs = normalizeJobs(team);

            jobs.forEach((job, index) => {
              html += `
                <div class="job">
                  <div class="job-title">
                    Job ${index + 1}
                  </div>

                  <div>
                    ${buildActivityTags(job)}
                  </div>

                  <div class="site-line">
                    <strong>Site Location:</strong>
                    ${job.siteLocation || "N/A"}
                  </div>

                  <div class="site-line">
                    <strong>ADB Site #:</strong>
                    ${job.adbSite || "N/A"}
                  </div>
                </div>
              `;
            });

            html += `
              <table>
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
                  ${buildWorkerRows(team.workers)}
                </tbody>
              </table>
            `;
          }

          html += `
            </div>
          `;
        });

      html += `
        </div>
      `;
    });

  html += `
  </body>
  </html>
  `;

  return html;
}

module.exports = {
  buildReportHtml
};