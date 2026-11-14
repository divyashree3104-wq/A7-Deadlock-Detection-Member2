
const $ = id => document.getElementById(id);

const cases = {
    deadlock: {
        available: '0, 0',
        allocation: '1, 0\n0, 1',
        request: '0, 1\n1, 0'
    },
    safe: {
        available: '1, 1',
        allocation: '1, 0\n0, 1',
        request: '0, 1\n1, 0'
    },
    partial: {
        available: '0, 0',
        allocation: '1, 0\n0, 1\n0, 0',
        request: '0, 1\n1, 0\n0, 0'
    }
};

let prior = null;
let current = null;
let timer = null;
let tracePos = 0;

// ----------------------------------
// INPUT VALIDATION
// ----------------------------------

function vector(s) {
    let a = s.split(',').map(x => Number(x.trim()));

    if (!a.length || a.some(x => !Number.isInteger(x) || x < 0)) {
        throw Error('Use non-negative whole numbers separated by commas.');
    }

    return a;
}

function matrix(s, n, name) {
    let a = s.trim().split(/\n+/)
        .map(x => x.split(',').map(v => Number(v.trim())));

    if (!a.length || a.some(r =>
        r.length !== n ||
        r.some(v => !Number.isInteger(v) || v < 0)
    )) {
        throw Error(
            name + ' must have the same number of columns as Available and non-negative whole numbers.'
        );
    }

    return a;
}

function input() {
    let available = vector($('available').value);

    let allocation = matrix(
        $('allocation').value,
        available.length,
        'Allocation'
    );

    let request = matrix(
        $('request').value,
        available.length,
        'Request'
    );

    if (allocation.length !== request.length) {
        throw Error('Allocation and Request need the same process count.');
    }

    return { available, allocation, request };
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

// ----------------------------------
// DETECTION
// ----------------------------------

async function run() {
    let d;

    try {
        d = input();
    } catch (e) {
        $('verdict').textContent = 'Input error: ' + e.message;
        $('verdict').className = 'verdict bad';
        updateRecoveryControls(null);
        return;
    }

    $('detect').disabled = true;

    try {
        let res = await fetch('/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                available: d.available.join(','),
                allocation: d.allocation.map(r => r.join(',')).join(';'),
                request: d.request.map(r => r.join(',')).join(';')
            })
        });

        let r = await res.json();

        if (!res.ok || r.error) {
            throw Error(r.error || 'Detection failed');
        }

        prior = current;
        current = { input: d, result: r };

        render(r);
        graph(d);
        analytics(d);
        compare();

    } catch (e) {
        $('verdict').textContent = e.message;
        $('verdict').className = 'verdict bad';
        updateRecoveryControls(null);

    } finally {
        $('detect').disabled = false;
    }
}

// ----------------------------------
// DISPLAY DETECTION RESULTS
// ----------------------------------

function render(r) {
    $('verdict').className = 'verdict ' +
        (r.deadlock ? 'bad' : 'good');

    $('verdict').textContent = r.deadlock
        ? 'DEADLOCK DETECTED — unfinished: ' +
          r.deadlockedProcesses.map(p => 'P' + p).join(', ')
        : 'NO DEADLOCK — all processes can finish';

    $('deadlocked').textContent =
        r.deadlockedProcesses.length
            ? r.deadlockedProcesses.map(p => 'P' + p).join(', ')
            : 'None';

    $('order').textContent =
        r.completionOrder.map(p => 'P' + p).join(' → ') || '—';

    $('work').textContent =
        '[' + r.finalWork.join(', ') + ']';

    clearInterval(timer);
    timer = null;
    tracePos = 0;

    $('play').textContent = '▶ Play';
    $('play').disabled = false;
    $('all').disabled = false;

    trace(r.trace, 0);

    updateRecoveryControls(r);
}

function updateRecoveryControls(r) {
    const victimSelect = $('victim');
    const recoverButton = $('recover');

    victimSelect.innerHTML = '';

    if (!r || !r.deadlock || !r.deadlockedProcesses.length) {
        victimSelect.add(new Option('No deadlocked process available', ''));

        victimSelect.disabled = true;
        recoverButton.disabled = true;

        return;
    }

    r.deadlockedProcesses.forEach(p => {
        victimSelect.add(
            new Option('Process P' + p, String(p))
        );
    });

    victimSelect.disabled = false;
    recoverButton.disabled = false;
}

// ----------------------------------
// ALGORITHM TRACE
// ----------------------------------

function trace(lines, n) {
    $('trace').innerHTML = lines.map((s, i) =>
        `<div class="step ${i < n ? 'shown' : ''} ${i === n - 1 ? 'active' : ''}">
            <i>${i + 1}</i>${esc(s)}
        </div>`
    ).join('');
}

// ----------------------------------
// RESOURCE ALLOCATION GRAPH
// ----------------------------------

function graph(d) {
    let p = d.allocation.length;
    let r = d.available.length;

    let h = Math.max(270, Math.max(p, r) * 78 + 60);

    let py = i => p === 1
        ? h / 2
        : 35 + i * (h - 70) / (p - 1);

    let ry = i => r === 1
        ? h / 2
        : 35 + i * (h - 70) / (r - 1);

    let x1 = 160;
    let x2 = 660;

    let edges = '';
    let nodes = '';

    for (let i = 0; i < p; i++) {
        for (let j = 0; j < r; j++) {

            if (d.allocation[i][j]) {
                edges += `
                    <path class="alloc"
                    d="M ${x2 - 28} ${ry(j)}
                    Q 420 ${(ry(j) + py(i)) / 2}
                    ${x1 + 45} ${py(i)}"/>
                    <text x="410"
                    y="${(ry(j) + py(i)) / 2 - 5}"
                    class="edgeLabel">${d.allocation[i][j]}</text>`;
            }

            if (d.request[i][j]) {
                edges += `
                    <path class="req"
                    d="M ${x1 + 45} ${py(i)}
                    Q 420 ${(ry(j) + py(i)) / 2}
                    ${x2 - 28} ${ry(j)}"/>
                    <text x="430"
                    y="${(ry(j) + py(i)) / 2 + 14}"
                    class="edgeLabel">${d.request[i][j]}</text>`;
            }
        }
    }

    for (let i = 0; i < p; i++) {
        nodes += `
            <rect x="${x1 - 43}" y="${py(i) - 20}"
            width="86" height="40" rx="10" class="pn"/>
            <text x="${x1}" y="${py(i) + 5}"
            class="node">P${i}</text>`;
    }

    for (let j = 0; j < r; j++) {
        nodes += `
            <circle cx="${x2}" cy="${ry(j)}"
            r="25" class="rn"/>
            <text x="${x2}" y="${ry(j) + 5}"
            class="node">R${j}</text>
            <text x="${x2}" y="${ry(j) + 42}"
            class="sub">Available ${d.available[j]}</text>`;
    }

    $('graph').innerHTML = `
        <svg viewBox="0 0 820 ${h}"
        role="img" aria-label="Resource allocation graph">

            <defs>
                <marker id="ma" markerWidth="8"
                markerHeight="8" refX="6" refY="3"
                orient="auto">
                    <path d="M0 0 L0 6 L6 3"
                    fill="#5bd6a4"/>
                </marker>

                <marker id="mr" markerWidth="8"
                markerHeight="8" refX="6" refY="3"
                orient="auto">
                    <path d="M0 0 L0 6 L6 3"
                    fill="#ffb45f"/>
                </marker>
            </defs>

            <text x="${x1}" y="18" class="caption">
                PROCESSES
            </text>

            <text x="${x2}" y="18" class="caption">
                RESOURCE TYPES
            </text>

            ${edges}
            ${nodes}

        </svg>`;
}

// ----------------------------------
// RESOURCE ANALYTICS
// ----------------------------------

function analytics(d) {
    let a = d.available.map((_, j) =>
        d.allocation.reduce((s, row) => s + row[j], 0)
    );

    let q = d.available.map((_, j) =>
        d.request.reduce((s, row) => s + row[j], 0)
    );

    $('analytics').innerHTML = d.available.map((v, j) => {
        let total = a[j] + v;
        let den = Math.max(1, total, q[j]);

        return `
            <article class="stat">
                <b>Resource R${j}</b>

                <div class="bar">
                    <i style="width:${a[j] / den * 100}%"></i>
                    <i style="width:${v / den * 100}%"></i>
                    <i style="width:${q[j] / den * 100}%"></i>
                </div>

                <p>
                    Allocated <b>${a[j]}</b>
                    Available <b>${v}</b>
                    Requested <b>${q[j]}</b>
                </p>

                <small>
                    Total available to system: ${total} units
                    (allocated + currently available)
                </small>
            </article>`;
    }).join('');
}

// ----------------------------------
// WHAT-IF COMPARISON
// ----------------------------------

function compare() {
    if (!prior) {
        $('whatif').innerHTML = `
            <b>What-if baseline saved</b>
            <p>
                Change any matrix or Available value,
                then run again to compare outcomes.
            </p>`;
        return;
    }

    let a = prior.result;
    let b = current.result;

    let old = a.deadlockedProcesses.map(x => 'P' + x).join(', ') || 'None';
    let now = b.deadlockedProcesses.map(x => 'P' + x).join(', ') || 'None';

    $('whatif').innerHTML = `
        <b>What-if comparison</b>

        <div class="compare">
            <div>
                PREVIOUS
                <strong>${a.deadlock ? 'Deadlock' : 'No deadlock'}</strong>
                <small>Unfinished: ${old}</small>
            </div>

            <div>
                NEW RUN
                <strong>${b.deadlock ? 'Deadlock' : 'No deadlock'}</strong>
                <small>Unfinished: ${now}</small>
            </div>
        </div>

        <p>
            ${a.deadlock === b.deadlock
                ? 'The deadlock status is unchanged. Compare the unfinished process sets above.'
                : b.deadlock
                ? 'The changed inputs now produce a deadlock.'
                : 'The changed inputs now produce a deadlock-free state.'}
        </p>`;
}

// ----------------------------------
// RECOVERY
// ----------------------------------

async function recover() {
    if (!current || !current.result.deadlock) {
        $('recoveryResult').textContent =
            'Run detection and find a deadlock before recovery.';
        return;
    }

    const method = $('recoveryMethod').value;
    const victim = $('victim').value;

    if (victim === '') {
        $('recoveryResult').textContent =
            'Please select a victim process.';
        return;
    }

    const d = current.input;

    $('recover').disabled = true;
    $('recoveryResult').textContent = 'Running recovery...';

    try {
        const response = await fetch('/recover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                available: d.available.join(','),
                allocation: d.allocation.map(r => r.join(',')).join(';'),
                request: d.request.map(r => r.join(',')).join(';'),
                method: method,
                victim: victim
            })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw Error(result.error || 'Recovery failed.');
        }

        // Update dashboard inputs with recovered system state.
        $('available').value = result.available.join(',');

        $('allocation').value =
            result.allocation.map(row => row.join(',')).join('\n');

        $('request').value =
            result.request.map(row => row.join(',')).join('\n');

        // Display recovery messages.
        $('recoveryResult').className = 'verdict ' +
            (result.deadlock ? 'bad' : 'good');

        $('recoveryResult').innerHTML =
            '<b>Recovery completed</b><br><br>' +
            result.messages.map(m => esc(m)).join('<br>') +
            '<br><br><b>Detection after recovery:</b> ' +
            (result.deadlock
                ? 'Deadlock still exists.'
                : 'No deadlock detected.');

        // Run detection again with updated inputs.
        await run();

        // Keep the recovery summary visible.
        $('recoveryResult').className = 'verdict ' +
            (result.deadlock ? 'bad' : 'good');

    } catch (e) {
        $('recoveryResult').className = 'verdict bad';
        $('recoveryResult').textContent = 'Recovery error: ' + e.message;

    } finally {
        $('recover').disabled =
            !current || !current.result.deadlock;
    }
}

// ----------------------------------
// BUTTON EVENTS
// ----------------------------------

$('detect').onclick = run;

$('reset').onclick = () => {
    let s = cases.deadlock;

    $('available').value = s.available;
    $('allocation').value = s.allocation;
    $('request').value = s.request;

    $('recoveryResult').textContent =
        'Run detection to begin recovery.';

    run();
};

document.querySelectorAll('[data-case]').forEach(b => {
    b.onclick = () => {
        let s = cases[b.dataset.case];

        $('available').value = s.available;
        $('allocation').value = s.allocation;
        $('request').value = s.request;

        $('recoveryResult').textContent =
            'Run detection to begin recovery.';

        run();
    };
});

$('recover').onclick = recover;

$('play').onclick = () => {
    if (!current) return;

    if (timer) {
        clearInterval(timer);
        timer = null;
        $('play').textContent = '▶ Resume';
        return;
    }

    let lines = current.result.trace;

    if (tracePos >= lines.length) {
        tracePos = 0;
    }

    $('play').textContent = 'Ⅱ Pause';

    timer = setInterval(() => {
        tracePos++;
        trace(lines, tracePos);

        if (tracePos >= lines.length) {
            clearInterval(timer);
            timer = null;
            $('play').textContent = '▶ Replay';
        }
    }, 850);
};

$('all').onclick = () => {
    if (current) {
        clearInterval(timer);
        timer = null;

        tracePos = current.result.trace.length;

        $('play').textContent = '▶ Replay';
        trace(current.result.trace, tracePos);
    }
};

// ----------------------------------
// INITIAL LOAD
// ----------------------------------

run();
