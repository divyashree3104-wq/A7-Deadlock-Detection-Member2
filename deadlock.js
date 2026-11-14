// Frontend demonstration of the standard multiple-instance deadlock detection algorithm.
// The Java backend should eventually run the authoritative algorithm.

function detectDeadlock(allocation, request, available) {
  const processCount = allocation.length;
  const resourceCount = available.length;
  const work = [...available];

  // A process holding no resources can be considered finished for this detection test.
  const finish = allocation.map(row => row.every(value => value === 0));
  const sequence = [];

  let progress = true;
  while (progress) {
    progress = false;

    for (let i = 0; i < processCount; i++) {
      if (finish[i]) continue;

      const canFinish = request[i].every((needed, j) => needed <= work[j]);
      if (canFinish) {
        for (let j = 0; j < resourceCount; j++) {
          work[j] += allocation[i][j];
        }
        finish[i] = true;
        sequence.push(`P${i + 1}`);
        progress = true;
      }
    }
  }

  const deadlocked = finish
    .map((isFinished, i) => isFinished ? null : `P${i + 1}`)
    .filter(Boolean);

  return {
    deadlockDetected: deadlocked.length > 0,
    deadlockedProcesses: deadlocked,
    completionSequence: sequence,
    finalWork: work
  };
}

// Demonstration recovery: terminate one selected process and release its allocation.
// This changes only the simulator's in-browser data, not real operating-system processes.
function recoverByTerminating(allocation, request, available, processIndex) {
  const nextAllocation = allocation.map(row => [...row]);
  const nextRequest = request.map(row => [...row]);
  const nextAvailable = [...available];

  for (let j = 0; j < nextAvailable.length; j++) {
    nextAvailable[j] += nextAllocation[processIndex][j];
    nextAllocation[processIndex][j] = 0;
    nextRequest[processIndex][j] = 0;
  }

  return {
    allocation: nextAllocation,
    request: nextRequest,
    available: nextAvailable
  };
}
