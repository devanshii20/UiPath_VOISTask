//Function to add Employee Details to Orchestrator Queue: New Hires.

import https from "https";

// ---------------------
// UiPath Queue Add logic
// ---------------------
async function addQueueItem(
  orchestratorUrl,
  personalAccessToken,
  queueName,
  itemData,
  reference = null,
  priority = "Normal",
  deferDate = null,
  dueDate = null,
  folderId = null
) {
  const apiUrl = `${orchestratorUrl}/odata/Queues/UiPathODataSvc.AddQueueItem`;

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${personalAccessToken}`,
  };

  if (folderId !== null) {
    headers["X-UIPATH-OrganizationUnitId"] = folderId.toString();
  }

  const payload = {
    itemData: {
      Name: queueName,
      Priority: priority,
      SpecificContent: itemData,
    },
  };

  if (reference) payload.itemData.Reference = reference;
  if (deferDate) payload.itemData.DeferDate = deferDate;
  if (dueDate) payload.itemData.DueDate = dueDate;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  return await response.json();
}

// ---------------------
// Main Lambda Handler
// ---------------------
export const handler = async () => {
  const url = "https://dummy.restapiexample.com/api/v1/employees";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.5"
    // no Accept-Encoding → avoid gzip complexity
  };

  try {
    // 1) Call the original API
    const apiBody = await new Promise((resolve, reject) => {
      const req = https.get(url, { headers }, (res) => {
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const bodyText = Buffer.concat(chunks).toString("utf8");
          resolve(bodyText);
        });
      });

      req.on("error", reject);
      req.end();
    });

    // 2) Parse its JSON
    const result = JSON.parse(apiBody);

    // 3) Take only result.data and strip to required keys
    if (!Array.isArray(result.data)) {
      // in case of "Too Many Attempts" or other error
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: result.message ?? "No data array returned" })
      };
    }
      
    const employees = result.data.map(emp => ({
      id: emp.id,
      name: emp.employee_name,
      salary: emp.employee_salary,
      age: emp.employee_age
    }));

    // -----------------------
    // 2) Push each employee to UiPath Queue
    // -----------------------
    const successes = [];
    const failures = [];

        // --- UiPath Config ---
    const ORCHESTRATOR_URL = "https://cloud.uipath.com/automtjavokv/DefaultTenant";
    const PAT = "rt_4CE3D8CADF076E7977F127FAF312D52F582288E24682503466071CF5E300DF0D-1";
    const QUEUE_NAME = "New Hires";
    const FOLDER_ID = 6900516;
    var Priority = 'Normal'

    for (const emp of employees) {
      try {
        if (emp.salary >= 300000) {
          Priority = 'High'
        }else if (emp.salary <= 100000) {
          Priority = 'Low'
        } else {
          Priority = 'Normal'
        };

        const queueResp = await addQueueItem(
          ORCHESTRATOR_URL,
          PAT,
          QUEUE_NAME,
          emp,
          `emp-${emp.id}`, // reference
          Priority,
          null,
          null,
          FOLDER_ID
        );

        successes.push({
          employee: emp,
          queueItemId: queueResp.Id ?? "N/A"
        });

      } catch (err) {
        failures.push({
          employee: emp,
          error: err.message,
          response: err.response?.data
        });
      }
    }

    // -----------------------
    // 3) Return summary
    // -----------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalEmployees: employees.length,
        queueItemsAdded: successes.length,
        failed: failures.length,
        failures
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
