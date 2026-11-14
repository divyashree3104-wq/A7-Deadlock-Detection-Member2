# Deadlock Detection & Recovery Simulator — Frontend

A beginner-friendly frontend starter built with HTML, CSS and vanilla JavaScript.

## Current features
- Responsive landing page and simulation workspace
- User-selectable process and resource counts
- Dynamically generated Allocation, Request and Available input matrices
- Frontend demonstration of the multiple-instance deadlock detection algorithm
- Recovery demonstration by terminating a selected unfinished process and releasing its allocation
- Results showing completion order and unfinished processes

## Run in VS Code
1. Extract the project ZIP.
2. Open the `deadlock-frontend-starter` folder in VS Code.
3. Install the **Live Server** extension (by Ritwick Dey), if you do not already have it.
4. Right-click `index.html` and select **Open with Live Server**.
5. Your browser should open the simulator.

You can also open `index.html` directly in a browser, but Live Server is recommended.

## Important: frontend demo vs Java backend
At this stage, detection and recovery run in the browser using `js/deadlock.js`. This lets you test the interface before the Java backend is ready. It does not yet call Java.

When your backend teammate provides the server URL, API endpoint paths and JSON request/response format, update `js/api.js` and then connect those functions in `js/script.js`.

## Input model
- `allocation[i][j]`: instances of resource type j currently held by process i
- `request[i][j]`: additional instances of resource type j currently requested by process i
- `available[j]`: currently available instances of resource type j

The detection routine repeatedly finds an unfinished process whose request is less than or equal to the current work vector, then adds that process's allocation back to work. Processes still unfinished at the end are reported as deadlocked by this detection test.

## Suggested GitHub workflow
```bash
git init
git add .
git commit -m "Add frontend simulator"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

For later changes:
```bash
git add .
git commit -m "Describe your change"
git push
```

## Before submission
- Test with several input sets.
- Confirm your team's Java API contract and integrate it.
- Do not commit passwords, tokens, private configuration, generated build folders or IDE cache files.
