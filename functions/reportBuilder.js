/* =====================================================
   REPORT BUILDER

   Builds beautiful HTML email
===================================================== */

function buildReportHtml(date, reports) {

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
    padding:24px;
    border-radius:6px;
  }

  .date{
    margin-top:10px;
    color:#cbd5e1;
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
    padding:16px;
    font-size:24px;
    font-weight:bold;
  }

  .team{
    padding:20px;
    border-top:1px solid #d9e0ea;
  }

  .team-title{
    font-size:20px;
    font-weight:bold;
    margin-bottom:14px;
    color:#0f172a;
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

  table{
    width:100%;
    border-collapse:collapse;
    margin-top:20px;
  }

  th{
    background:#0f172a;
    color:white;
    text-align:left;
    padding:12px;
  }

  td{
    padding:12px;
    border:1px solid #d9e0ea;
  }

  .weather{
    color:#dc2626;
    font-weight:bold;
  }

  </style>

  </head>

  <body>

    <div class="title">

      <h1>
        ADB DAILY WORKFORCE REPORT
      </h1>

      <div class="date">

        ${date}

      </div>

    </div>

  `;


  Object.keys(reports)
    .forEach(managerName => {

      const manager =
        reports[managerName];

      html += `

      <div class="manager">

        <div class="manager-header">

          ${managerName}

        </div>

      `;

      Object.entries(manager.teams)
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

          }

          (team.activities || []).forEach(activity => {

            if (
              activity === "Working For"
              &&
              team.workingFor
            ) {

              html += `

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

              html += `

                <span class="tag">

                  Other:
                  ${team.other}

                </span>

              `;

            }

            else {

              html += `

                <span class="tag">

                  ${activity}

                </span>

              `;

            }

          });


          html += `

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

            html += `

            <table>

              <thead>

                <tr>

                  <th>
                  Worker
                  </th>

                  <th>
                  NWSA
                  </th>

                  <th>
                  Vehicle
                  </th>

                  <th>
                  Off
                  </th>

                </tr>

              </thead>

              <tbody>

            `;

            Object.entries(team.workers)
              .forEach(([workerName, worker]) => {

                html += `

                <tr>

                  <td>

                    ${workerName}

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

              });

            html += `

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