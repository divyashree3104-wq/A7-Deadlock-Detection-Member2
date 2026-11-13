# A7 — Deadlock Detection Lab (Member 2)

A Java multiple-instance deadlock detection simulator with an interactive browser dashboard. This module is focused on **detection**; process termination and recovery belong to the separate recovery module.

## Included features
- Java Work/Finish multiple-instance deadlock detection algorithm.
- Editable Available vector, Allocation matrix and Request matrix.
- Three sample scenarios: Circular wait, Resolvable and Partial finish.
- Browser dashboard served by Java's built-in HTTP server; no external Java libraries.
- Live bipartite Resource Allocation Graph with allocation and request edges.
- Animated step-by-step algorithm trace, pause/resume and Show all controls.
- Resource analytics for allocated, available and outstanding-request counts by resource type.
- What-if comparison between consecutive runs.
- Input validation, self-tests, Windows run/test scripts and Eclipse metadata.

## Requirements
JDK 17 or later (JDK 21 recommended). Check in a new Command Prompt using `java -version` and `javac -version`.

## Run on Windows
1. Extract the ZIP.
2. Open the extracted `A7_Deadlock_Detection_Member2` folder.
3. Double-click `run.bat`.
4. Open `http://localhost:8080` in Chrome or Edge.
5. To stop, return to the command window and press Ctrl+C.

If port 8080 is occupied, open Command Prompt in the project folder and run `run.bat 8081`, then visit `http://localhost:8081`.

## Import into Eclipse
1. Extract the ZIP.
2. In Eclipse choose **File → Import → General → Existing Projects into Workspace**.
3. Select the extracted `A7_Deadlock_Detection_Member2` folder (the folder containing `.project`).
4. Ensure the project is checked and click **Finish**.
5. Configure an installed JDK 17+ if Eclipse requests one.
6. Easiest dashboard launch: run `run.bat` from the project folder. If launching `a7.deadlock.DeadlockServer` inside Eclipse, set the working directory to the project root so the `web` folder is found.

## Run tests
Double-click `test.bat` from Windows. The self-test covers deadlock, resolvable and partial-finish examples.

## Input format
- Available: comma-separated vector, e.g. `1, 0, 2`.
- Allocation: one process per line; comma-separated resource counts.
- Request: one process per line, with the same dimensions as Allocation.
- All values must be non-negative whole numbers.

## Algorithm summary
1. Set `Work = Available`.
2. Initially mark a process finished if its Allocation row is all zero.
3. Find an unfinished process whose Request is component-wise less than or equal to Work.
4. Assume it finishes, release its Allocation back to Work, and mark it finished.
5. Repeat until no further process can finish.
6. Remaining unfinished processes are reported as deadlocked.

The graph is a visual aid. With multiple instances of a resource type, a cycle alone is not conclusive; the Work/Finish algorithm is authoritative. This is a classroom simulator using user-entered state, not a live OS monitor.
