const processCountInput = document.getElementById("processCount");
const resourceCountInput = document.getElementById("resourceCount");
const allocationContainer = document.getElementById("allocationContainer");
const requestContainer = document.getElementById("requestContainer");
const availableContainer = document.getElementById("availableContainer");
const toast = document.getElementById("toast");

let currentSystem = null;
let lastDetection = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function readCount(input, label, max) {
  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`${label} must be a whole number from 1 to ${max}.`);
  }
  return value;
}

function makeMatrixTable(container, rows, cols, prefix, title, values = null) {
  const table = document.createElement("table");
  table.className = "matrix";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const blank = document.createElement("th");
  blank.textContent = title;
  headerRow.appendChild(blank);

  for (let j = 0; j < cols; j++) {
    const th = document.createElement("th");
    th.textContent = `R${j + 1}`;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    const rowHead = document.createElement("td");
    rowHead.className = "row-head";
    rowHead.textContent = prefix ? `P${i + 1}` : "Available";
    tr.appendChild(rowHead);

    for (let j = 0; j < cols; j++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "1";
      input.inputMode = "numeric";
      input.className = "matrix-input";
      input.setAttribute("aria-label", `${title} ${prefix ? `P${i + 1}` : "Available"} R${j + 1}`);
      input.dataset.row = i;
      input.dataset.col = j;
      input.value = values ? values[i][j] : 0;
      td.appendChild(input);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.replaceChildren(table);
}

function buildMatrices(values = null) {
  try {
    const p = readCount(processCountInput, "Number of processes", 8);
    const r = readCount(resourceCountInput, "Number of resource types", 6);
    makeMatrixTable(allocationContainer, p, r, true, "Process", values?.allocation);
    makeMatrixTable(requestContainer, p, r, true, "Process", values?.request);
    makeMatrixTable(availableContainer, 1, r, false, "Resource", [values?.available || Array(r).fill(0)]);
    currentSystem = null;
    lastDetection = null;
    showEmptyResults();
  } catch (error) {
    showToast(error.message);
  }
}

function readMatrix(container, rows, cols) {
  const inputs = [...container.querySelectorAll("input")];
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (const input of inputs) {
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Matrix values must be whole numbers (0 or greater).");
    }
    matrix[Number(input.dataset.row)][Number(input.dataset.col)] = value;
  }
  return matrix;
}

function getSystemFromInputs() {
  const p = readCount(processCountInput, "Number of processes", 8);
  const r = readCount(resourceCountInput, "Number of resource types", 6);
  return {
    allocation: readMatrix(allocationContainer, p, r),
    request: readMatrix(requestContainer, p, r),
    available: readMatrix(availableContainer, 1, r)[0]
  };
}

function showEmptyResults() {
  document.getElementById("emptyResults").classList.remove("hidden");
  document.getElementById("resultContent").classList.add("hidden");
  document.getElementById("processToTerminate").disabled = true;
  document.getElementById("recoverBtn").disabled = true;
  document.getElementById("processToTerminate").innerHTML = '<option value="">Run detection first</option>';
  document.getElementById("recoveryMessage").classList.add("hidden");
}

function renderResults(result) {
  document.getElementById("emptyResults").classList.add("hidden");
  document.getElementById("resultContent").classList.remove("hidden");

  const title = document.getElementById("statusTitle");
  const description = document.getElementById("statusDescription");
  const badge = document.getElementById("statusBadge");

  if (result.deadlockDetected) {
    title.textContent = "Deadlock detected";
    description.textContent = "Some processes could not finish with the currently available resources.";
    badge.textContent = "DEADLOCK";
    badge.className = "status-badge danger";
  } else {
    title.textContent = "No deadlock detected";
    description.textContent = "All processes could finish during this detection run.";
    badge.textContent = "NO DEADLOCK";
    badge.className = "status-badge";
  }

  document.getElementById("sequenceValue").textContent =
    result.completionSequence.length ? result.completionSequence.join(" → ") : "None";
  document.getElementById("deadlockedValue").textContent =
    result.deadlockedProcesses.length ? result.deadlockedProcesses.join(", ") : "None";

  const select = document.getElementById("processToTerminate");
  select.replaceChildren();
  if (result.deadlockedProcesses.length) {
    result.deadlockedProcesses.forEach(processName => {
      const option = document.createElement("option");
      option.value = Number(processName.slice(1)) - 1;
      option.textContent = processName;
      select.appendChild(option);
    });
    select.disabled = false;
    document.getElementById("recoverBtn").disabled = false;
  } else {
    select.add(new Option("No unfinished process", ""));
    select.disabled = true;
    document.getElementById("recoverBtn").disabled = true;
  }
  document.getElementById("recoveryMessage").classList.add("hidden");
}

function runDetection() {
  try {
    currentSystem = getSystemFromInputs();
    lastDetection = detectDeadlock(
      currentSystem.allocation,
      currentSystem.request,
      currentSystem.available
    );
    renderResults(lastDetection);
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showToast(error.message);
  }
}

function loadSampleData() {
  processCountInput.value = 3;
  resourceCountInput.value = 2;
  const sample = {
    allocation: [[1, 0], [0, 1], [1, 0]],
    request: [[0, 1], [1, 0], [0, 1]],
    available: [0, 0]
  };
  buildMatrices(sample);
  showToast("Sample data loaded. Select Detect deadlock.");
}

function recoverSystem() {
  if (!currentSystem || !lastDetection || !lastDetection.deadlockDetected) return;
  const processIndex = Number(document.getElementById("processToTerminate").value);
  if (!Number.isInteger(processIndex) || processIndex < 0) {
    showToast("Select an unfinished process first.");
    return;
  }

  const recovered = recoverByTerminating(
    currentSystem.allocation,
    currentSystem.request,
    currentSystem.available,
    processIndex
  );
  currentSystem = recovered;
  makeMatrixTable(allocationContainer, recovered.allocation.length, recovered.available.length, true, "Process", recovered.allocation);
  makeMatrixTable(requestContainer, recovered.request.length, recovered.available.length, true, "Process", recovered.request);
  makeMatrixTable(availableContainer, 1, recovered.available.length, false, "Resource", [recovered.available]);

  lastDetection = detectDeadlock(recovered.allocation, recovered.request, recovered.available);
  renderResults(lastDetection);

  const message = document.getElementById("recoveryMessage");
  message.textContent = `Recovery demonstration: P${processIndex + 1} was terminated and its allocated resources were released. Detection has been run again.`;
  message.classList.remove("hidden");
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

function resetInputs() {
  processCountInput.value = 3;
  resourceCountInput.value = 2;
  buildMatrices();
  showToast("Inputs reset.");
}

document.getElementById("sampleBtn").addEventListener("click", loadSampleData);
document.getElementById("detectBtn").addEventListener("click", runDetection);
document.getElementById("recoverBtn").addEventListener("click", recoverSystem);
document.getElementById("resetBtn").addEventListener("click", resetInputs);
processCountInput.addEventListener("change", () => buildMatrices());
resourceCountInput.addEventListener("change", () => buildMatrices());

buildMatrices();
