'use strict';
// Banking Statement Converter — vanilla JS SPA
// All user / API data rendered via esc() before touching the DOM.

// ── Config ────────────────────────────────────────────────────────────────────
const FORMATS = ['MT940', 'MT942', 'CAMT052', 'CAMT053'];
const ENGINES = ['PROWIDE', 'VELOCITY'];
const FMT_COLOR = { MT940:'#E64A19', MT942:'#FF9800', CAMT052:'#FFC107', CAMT053:'#FF7043' };
const ENG_COLOR = { PROWIDE:'#E64A19', VELOCITY:'#7B1FA2' };
const STA_COLOR = { COMPLETED:'#4CAF50', FAILED:'#F44336', STARTED:'#FF9800', STARTING:'#FF9800' };
const VIEWS     = ['dashboard', 'generate', 'convert', 'history', 'benchmarks', 'diagrams'];

// ── State ─────────────────────────────────────────────────────────────────────
let theme      = localStorage.getItem('theme') || 'light';
let pollTimer  = null;
let chartObjs  = [];
let mermaidOn  = false;

// ── Helpers ───────────────────────────────────────────────────────────────────
const $   = id => document.getElementById(id);
const esc = s  => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const dt  = d  => d ? new Date(d).toLocaleString() : '—';

// show() is only called with developer-authored HTML templates;
// all API / user values are always passed through esc() first.
const show = html => { $('main').innerHTML = html; };

function chip(status) {
  const cls = { COMPLETED:'ok', FAILED:'fail', STARTED:'warn', STARTING:'warn', RUNNING:'warn' }[status] || 'dim';
  return `<span class="chip ${cls}">${esc(status)}</span>`;
}

// ── API ───────────────────────────────────────────────────────────────────────
const api = {
  health:   ()  => fetch('/actuator/health').then(r => r.json()).catch(() => ({ status: 'DOWN' })),
  info:     ()  => fetch('/actuator/info').then(r => r.json()).catch(() => ({})),
  jobs:     ()  => fetch('/api/conversions/jobs').then(r => r.json()).catch(() => []),
  generate: (p) => post(`/api/random-statements?loadProfile=${p}`),
  convert:  (b) => post('/api/conversions', b),
  deleteAll:()  => fetch('/api/data', { method:'DELETE' }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
  jobFile:  (id)=> fetch(`/api/conversions/jobs/${id}/file`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }),
};

async function post(url, body) {
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function setTheme(t) {
  theme = t;
  document.documentElement.dataset.theme = t;
  localStorage.setItem('theme', t);
  const btn = $('theme-btn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}

// ── Navigation ────────────────────────────────────────────────────────────────
function go(view) {
  if (!VIEWS.includes(view)) view = 'dashboard';
  clearInterval(pollTimer);
  chartObjs.forEach(c => c.destroy?.());
  chartObjs = [];
  window.location.hash = view;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  show('<div class="spinner-wrap"><div class="spinner"></div></div>');
  setTimeout(() => ({ dashboard, generate, convert, history, benchmarks: viewCharts, diagrams }[view])(), 0);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function dashboard() {
  show(`
    <h2>📊 Dashboard</h2>
    <div class="g2" style="margin-bottom:16px">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>System Health</b>
          <span id="health-badge"><span class="spin-sm"></span></span>
        </div>
        <hr><p id="health-text" class="muted">Checking…</p>
      </div>
      <div class="card">
        <b>Application Info</b>
        <hr><div id="info-text" class="muted">Loading…</div>
      </div>
    </div>

    <b>Job Summary</b>
    <div class="g3" style="margin:10px 0 20px">
      <div class="card" style="text-align:center;padding:20px">
        <div class="big" id="s-total">—</div><div class="muted">Total Jobs</div>
      </div>
      <div class="card" style="text-align:center;padding:20px">
        <div class="big green" id="s-ok">—</div><div class="muted">Completed</div>
      </div>
      <div class="card" style="text-align:center;padding:20px">
        <div class="big red" id="s-fail">—</div><div class="muted">Failed</div>
      </div>
    </div>

    <b>Quick Actions</b>
    <div class="g3" style="margin:10px 0 20px">
      <div class="card link" onclick="go('generate')"><b>➕ Generate Statements</b><p class="muted sm">Create random data in H2</p></div>
      <div class="card link" onclick="go('convert')"><b>▶ Run Conversion</b><p class="muted sm">Export via Spring Batch</p></div>
      <div class="card link" onclick="go('history')"><b>📋 History</b><p class="muted sm">Browse past jobs</p></div>
      <div class="card link" onclick="go('benchmarks')"><b>📊 Benchmarks</b><p class="muted sm">Performance analytics</p></div>
      <div class="card link" onclick="window.open('/swagger-ui/index.html')"><b>📖 Swagger UI</b><p class="muted sm">Interactive API docs</p></div>
      <div class="card link" onclick="window.open('/actuator/health')"><b>❤️ Actuator</b><p class="muted sm">Health &amp; info endpoints</p></div>
    </div>

    <button class="btn" onclick="go('generate')">➕ Generate Statements</button>
    &nbsp;
    <button class="btn outline" onclick="go('convert')">▶ Run Conversion</button>
  `);

  const [health, info, jobs] = await Promise.all([api.health(), api.info(), api.jobs()]);

  $('health-badge').innerHTML = health.status === 'UP'
    ? '<span class="chip ok">✓ UP</span>'
    : `<span class="chip fail">✗ ${esc(health.status)}</span>`;

  $('health-text').textContent = `Actuator status: ${health.status}`;

  $('info-text').innerHTML =
    `<b>Name:</b> ${esc(info.app?.name || 'Banking Statement Converter')}<br>` +
    `<b>Version:</b> ${esc(info.app?.version || '1.0.0')}<br>` +
    `<b>Author:</b> ${esc(info.app?.author || 'Wallace Espindola')}`;

  $('s-total').textContent = jobs.length;
  $('s-ok').textContent    = jobs.filter(j => j.status === 'COMPLETED').length;
  $('s-fail').textContent  = jobs.filter(j => j.status === 'FAILED').length;
}

// ── Generate ──────────────────────────────────────────────────────────────────
function generate() {
  show(`
    <h2>➕ Generate Statement Data</h2>
    <p class="muted" style="margin-bottom:16px">
      Generate random bank statements in H2. Use the returned ID in the Conversion Runner.
    </p>
    <div class="g3" style="margin-bottom:16px">
      <div class="card">
        <b>⚡ Low Load</b><hr>
        <p>10 accounts · 100 transactions · 5 statements</p>
        <button class="btn full" id="btn-low" onclick="doGenerate('LOW')" style="margin-top:12px">▶ Generate Low</button>
      </div>
      <div class="card">
        <b>🚀 Medium Load</b><hr>
        <p>100 accounts · 1 000 transactions · 50 statements</p>
        <button class="btn full" id="btn-medium" onclick="doGenerate('MEDIUM')" style="margin-top:12px">🚀 Generate Medium</button>
      </div>
      <div class="card">
        <b>🔥 High Load</b><hr>
        <p>1 000 accounts · 10 000 transactions · 500 statements</p>
        <button class="btn full" id="btn-high" onclick="doGenerate('HIGH')" style="margin-top:12px">🔥 Generate High</button>
      </div>
    </div>
    <div class="card" style="border-color:var(--red);margin-bottom:16px">
      <b class="red">🗑 Danger Zone</b><hr>
      <p>Delete all generated statements, all conversion history and all files in the output folder, to start fresh.</p>
      <button class="btn danger" id="btn-delete-all" onclick="doDeleteAll()" style="margin-top:12px">🗑 Delete All Data</button>
    </div>
    <div id="gen-result"></div>
  `);
}

const PROFILE_LABELS = { LOW: '▶ Generate Low', MEDIUM: '🚀 Generate Medium', HIGH: '🔥 Generate High' };

async function doDeleteAll() {
  if (!confirm('Delete ALL generated statements, conversion history and output files? This cannot be undone.')) return;
  const btn = $('btn-delete-all');
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    const r = await api.deleteAll();
    localStorage.removeItem('lastStatementId');
    $('gen-result').innerHTML = `
      <div class="card success-border">
        <b class="green">✓ All data deleted — ready for a fresh start</b><hr>
        <div class="g4" style="margin:12px 0">
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.statementsDeleted)}</div><div class="muted sm">Statements</div>
          </div>
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.transactionsDeleted)}</div><div class="muted sm">Transactions</div>
          </div>
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.jobsDeleted)}</div><div class="muted sm">Jobs</div>
          </div>
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.filesDeleted)}</div><div class="muted sm">Output Files</div>
          </div>
        </div>
        <p class="muted sm">${esc(dt(r.timestamp))}</p>
      </div>`;
  } catch (e) {
    $('gen-result').innerHTML = `<p class="red" style="margin-top:12px">Error: ${esc(e.message)}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🗑 Delete All Data';
  }
}

async function doGenerate(profile) {
  const allBtns = ['low', 'medium', 'high'].map(p => $('btn-' + p)).filter(Boolean);
  allBtns.forEach(b => { b.disabled = true; });
  const btn = $('btn-' + profile.toLowerCase());
  btn.textContent = 'Generating…';

  try {
    const r = await api.generate(profile);
    localStorage.setItem('lastStatementId', r.firstStatementId);
    $('gen-result').innerHTML = `
      <div class="card success-border">
        <b class="green">✓ Generated successfully</b><hr>
        <div class="g4" style="margin:12px 0">
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.firstStatementId)}</div><div class="muted sm">First Statement ID</div>
          </div>
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.accountsGenerated)}</div><div class="muted sm">Accounts</div>
          </div>
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.statementsGenerated)}</div><div class="muted sm">Statements</div>
          </div>
          <div class="card" style="text-align:center">
            <div class="big">${esc(r.transactionsGenerated)}</div><div class="muted sm">Transactions</div>
          </div>
        </div>
        <p class="muted sm">${esc(dt(r.timestamp))}</p>
        <button class="btn" onclick="go('convert')" style="margin-top:12px">Go to Conversion Runner →</button>
      </div>`;
  } catch (e) {
    $('gen-result').innerHTML = `<p class="red" style="margin-top:12px">Error: ${esc(e.message)}</p>`;
  } finally {
    allBtns.forEach(b => { b.disabled = false; });
    btn.textContent = PROFILE_LABELS[profile];
  }
}

// ── Conversion Runner ─────────────────────────────────────────────────────────
function convert() {
  const last = esc(localStorage.getItem('lastStatementId') || '');
  show(`
    <h2>▶ Conversion Runner</h2>
    <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">

      <div class="card" style="flex:0 0 260px">
        <b>Configuration</b><hr>
        <label class="lbl">Statement ID</label>
        <input id="stmt-id" type="number" class="inp" value="${last}" min="1" placeholder="e.g. 1">
        <p class="muted sm" style="margin-top:4px">From the Generate step</p>
        <label class="lbl">Target Format</label>
        <select id="fmt" class="inp">${FORMATS.map(f => `<option>${f}</option>`).join('')}</select>
        <label class="lbl">Engine</label>
        <select id="eng" class="inp">${ENGINES.map(e => `<option>${e}</option>`).join('')}</select>
        <button class="btn full" id="btn-run" onclick="doConvert()" style="margin-top:12px">▶ Run Conversion</button>
        <hr>
        <button class="btn outline full" id="btn-all" onclick="doRunAll()">▶▶ Run All 8 Combinations</button>
        <button class="btn outline full" id="btn-sel" onclick="doRunSelected()" style="margin-top:8px">☑ Run Selected Combinations</button>
        <p class="muted sm" style="margin-top:6px;text-align:center">4 formats × 2 engines sequentially</p>
      </div>

      <div id="conv-result" style="flex:1;min-width:280px">
        <div class="card" style="text-align:center;padding:40px">
          <div style="font-size:3rem">▶</div>
          <p class="muted" style="margin-top:8px">Enter a Statement ID and run a conversion</p>
        </div>
      </div>
    </div>
  `);
}

async function doConvert() {
  const id  = $('stmt-id')?.value?.trim();
  const fmt = $('fmt')?.value;
  const eng = $('eng')?.value;
  if (!id || isNaN(+id)) {
    $('conv-result').innerHTML = `<p class="red">Enter a valid Statement ID.</p>`;
    return;
  }
  const btnR = $('btn-run'), btnA = $('btn-all'), btnS = $('btn-sel');
  btnR.disabled = btnA.disabled = btnS.disabled = true;
  btnR.textContent = 'Running…';

  try {
    const r = await api.convert({ statementId: +id, targetFormat: fmt, engine: eng });
    $('conv-result').innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>Result</b>${chip(r.status)}
        </div><hr>
        <div class="g4" style="margin-bottom:12px">
          <div><div class="muted sm">Job ID</div><b>#${esc(r.jobId)}</b></div>
          <div><div class="muted sm">Format</div><b>${esc(r.targetFormat)}</b></div>
          <div><div class="muted sm">Engine</div><b>${esc(r.engine)}</b></div>
          <div><div class="muted sm">Output File</div><code>${esc(r.outputFile || '—')}</code></div>
        </div>
        ${r.status === 'COMPLETED' && r.outputFile
          ? `<button class="btn sm" style="margin-bottom:12px" onclick="viewFile(${Number(r.jobId)}, '${esc(r.outputFile)}')">View Output File</button>`
          : ''}
        ${r.fileContent ? `<p class="muted sm" style="margin-bottom:6px">Preview (6 000 chars):</p>
          <pre>${esc(r.fileContent.slice(0, 6000))}${r.fileContent.length > 6000 ? '\n…' : ''}</pre>` : ''}
      </div>`;
  } catch (e) {
    $('conv-result').innerHTML = `<p class="red">Failed: ${esc(e.message)}</p>`;
  } finally {
    btnR.disabled = btnA.disabled = btnS.disabled = false;
    btnR.textContent = '▶ Run Conversion';
  }
}

async function doRunAll(combos) {
  const id = $('stmt-id')?.value?.trim();
  if (!id || isNaN(+id)) {
    $('conv-result').innerHTML = `<p class="red">Enter a valid Statement ID.</p>`;
    return;
  }
  const btnR = $('btn-run'), btnA = $('btn-all'), btnS = $('btn-sel');
  btnA.disabled = btnR.disabled = btnS.disabled = true;
  btnA.textContent = 'Running…';

  const picked = combos || FORMATS.flatMap(f => ENGINES.map(e => ({ f, e })));
  const rows = picked.map(c => ({ ...c, st:'PENDING', ms:null, jobId:null, file:null }));

  function paint() {
    const done = rows.filter(r => r.st !== 'PENDING' && r.st !== 'RUNNING').length;
    const all  = rows.every(r => r.st !== 'PENDING' && r.st !== 'RUNNING');
    $('conv-result').innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>${rows.length === 8 ? 'All 8' : rows.length} Combination${rows.length !== 1 ? 's' : ''}</b><span class="muted">${done} / ${rows.length}</span>
        </div>
        <div class="progress"><div class="bar" style="width:${Math.round(done/rows.length*100)}%"></div></div>
        <table>
          <thead><tr><th>Format</th><th>Engine</th><th>Status</th><th>ms</th><th>Job ID</th><th>Output</th><th>File</th></tr></thead>
          <tbody>${rows.map(r => `<tr>
            <td><b>${esc(r.f)}</b></td>
            <td>${esc(r.e)}</td>
            <td>${chip(r.st)}</td>
            <td>${r.ms !== null ? r.ms : r.st === 'RUNNING' ? '<span class="spin-sm"></span>' : '—'}</td>
            <td>${r.jobId !== null ? '#' + r.jobId : '—'}</td>
            <td class="muted sm">${r.file ? esc(r.file) : '—'}</td>
            <td>${r.file
              ? `<button class="btn sm" onclick="viewFile(${Number(r.jobId)}, '${esc(r.file)}')">View</button>`
              : '—'}</td>
          </tr>`).join('')}</tbody>
        </table>
        ${all ? `<p class="green" style="margin-top:10px">✓ All ${rows.length} combinations completed.</p>` : ''}
      </div>`;
  }

  paint();
  for (const row of rows) {
    row.st = 'RUNNING'; paint();
    const t = Date.now();
    try {
      const r = await api.convert({ statementId: +id, targetFormat: row.f, engine: row.e });
      Object.assign(row, { st:'COMPLETED', ms: Date.now()-t, jobId: r.jobId, file: r.outputFile });
    } catch {
      Object.assign(row, { st:'FAILED', ms: Date.now()-t });
    }
    paint();
  }
  btnA.disabled = btnR.disabled = btnS.disabled = false;
  btnA.textContent = '▶▶ Run All 8 Combinations';
}

function doRunSelected() {
  const id = $('stmt-id')?.value?.trim();
  if (!id || isNaN(+id)) {
    $('conv-result').innerHTML = `<p class="red">Enter a valid Statement ID.</p>`;
    return;
  }
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.width = 'min(440px, 100%)';

  const head = document.createElement('div');
  head.className = 'modal-head';
  const titleEl = document.createElement('b');
  titleEl.textContent = '☑ Select Combinations';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = closeModal;
  head.append(titleEl, closeBtn);

  const body = document.createElement('div');
  body.className = 'combo-grid';
  const boxes = [];
  FORMATS.forEach(f => ENGINES.forEach(e => {
    const label = document.createElement('label');
    label.className = 'combo-opt';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    boxes.push({ cb, f, e });
    label.append(cb, document.createTextNode(` ${f} · ${e}`));
    body.appendChild(label);
  }));

  const foot = document.createElement('div');
  foot.className = 'modal-foot';
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn sm outline';
  toggleBtn.textContent = 'Toggle All';
  toggleBtn.onclick = () => {
    const anyOn = boxes.some(b => b.cb.checked);
    boxes.forEach(b => { b.cb.checked = !anyOn; });
  };
  const runBtn = document.createElement('button');
  runBtn.className = 'btn sm';
  runBtn.textContent = '▶ Run Selected';
  runBtn.onclick = () => {
    const combos = boxes.filter(b => b.cb.checked).map(b => ({ f: b.f, e: b.e }));
    if (!combos.length) return;
    closeModal();
    doRunAll(combos);
  };
  foot.append(toggleBtn, runBtn);

  modal.append(head, body, foot);
  overlay.appendChild(modal);
  overlay.onclick = ev => { if (ev.target === overlay) closeModal(); };
  document.body.appendChild(overlay);
}

// ── History ───────────────────────────────────────────────────────────────────
async function history() {
  show(`
    <h2>📋 Conversion History
      <button class="btn sm" onclick="paintHistory()" style="margin-left:8px">🔄 Refresh</button>
    </h2>
    <p class="muted" style="margin-bottom:12px">Auto-refreshes every 15 s.</p>
    <div id="hist-body"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `);
  await paintHistory();
  pollTimer = setInterval(paintHistory, 15000);
}

async function paintHistory() {
  const jobs   = await api.jobs();
  const sorted = [...jobs].sort((a, b) => b.jobId - a.jobId);
  const el     = $('hist-body');
  if (!el) return;

  if (!sorted.length) {
    el.innerHTML = `<div class="card" style="text-align:center;padding:40px"><p class="muted">No jobs yet — run a conversion first.</p></div>`;
    return;
  }

  const ok   = sorted.filter(j => j.status === 'COMPLETED').length;
  const fail = sorted.filter(j => j.status === 'FAILED').length;

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b>${sorted.length} job${sorted.length !== 1 ? 's' : ''}</b>
        <span>${chip('COMPLETED')} ${ok} &nbsp; ${chip('FAILED')} ${fail}</span>
      </div>
      <table>
        <thead><tr><th>#</th><th>Format</th><th>Engine</th><th>Status</th><th>ms</th><th>Output</th><th>Started</th><th>File</th></tr></thead>
        <tbody>${sorted.map(j => `<tr>
          <td><b>${esc(j.jobId)}</b></td>
          <td><span class="chip" style="background:${FMT_COLOR[j.targetFormat]||'#999'};color:#fff">${esc(j.targetFormat)}</span></td>
          <td>${esc(j.engine)}</td>
          <td>${chip(j.status)}</td>
          <td>${j.durationMs > 0 ? j.durationMs : '—'}</td>
          <td class="muted sm">${esc(j.outputFile || '—')}</td>
          <td class="muted sm">${esc(dt(j.startTime))}</td>
          <td>${j.status === 'COMPLETED' && j.outputFile
            ? `<button class="btn sm" onclick="viewFile(${Number(j.jobId)}, '${esc(j.outputFile)}')">View</button>`
            : '—'}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

// ── File viewer modal ─────────────────────────────────────────────────────────
async function viewFile(jobId, fileName) {
  openModal(`📄 Job #${jobId} — ${fileName}`, 'Loading…');
  try {
    const content = await api.jobFile(jobId);
    const body = document.querySelector('#modal-overlay .modal-body');
    if (body) body.textContent = content;
  } catch (e) {
    const body = document.querySelector('#modal-overlay .modal-body');
    if (body) body.textContent = `Error loading file: ${e.message}`;
  }
}

function openModal(title, bodyText) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = 'modal';
  const head = document.createElement('div');
  head.className = 'modal-head';
  const titleEl = document.createElement('b');
  titleEl.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '✕';
  closeBtn.onclick = closeModal;
  head.append(titleEl, closeBtn);
  const body = document.createElement('pre');
  body.className = 'modal-body';
  body.textContent = bodyText;
  modal.append(head, body);
  overlay.appendChild(modal);
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  document.body.appendChild(overlay);
}

function closeModal() {
  $('modal-overlay')?.remove();
}

// ── Benchmarks ────────────────────────────────────────────────────────────────
async function viewCharts() {
  show(`
    <h2>📊 Benchmarks
      <button class="btn sm" onclick="refreshCharts()" style="margin-left:8px">🔄 Refresh</button>
    </h2>
    <p class="muted" style="margin-bottom:12px">Auto-refreshes every 30 s.</p>
    <div id="benchmarks-body"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `);
  await paintCharts();
  pollTimer = setInterval(refreshCharts, 30000);
}

async function refreshCharts() {
  chartObjs.forEach(c => c.destroy?.());
  chartObjs = [];
  await paintCharts();
}

async function paintCharts() {
  const jobs = await api.jobs();
  const el   = $('benchmarks-body');
  if (!el) return;

  if (!jobs.length) {
    el.innerHTML = `<p class="muted">No jobs yet — run some conversions first.</p>`;
    return;
  }

  const { byFmt, byEng, last20, bySta } = metrics(jobs);

  const summCards = byFmt.map(m => `
    <div class="card">
      <span class="chip" style="background:${FMT_COLOR[m.fmt]||'#999'};color:#fff">${esc(m.fmt)}</span>
      <span class="muted sm" style="float:right">${m.count} jobs</span><hr>
      <div style="display:flex;justify-content:space-between">
        <div><div class="muted sm">Avg</div><b>${m.avg > 0 ? m.avg+' ms' : '—'}</b></div>
        <div style="text-align:right"><div class="muted sm">Success</div>
          <b style="color:${m.rate>=80?'var(--green)':'var(--red)'}">${m.rate}%</b>
        </div>
      </div>
    </div>`).join('');

  const bench    = benchmark(jobs);
  const benchRows = bench.map(r => `
    <tr>
      <td><span class="chip" style="background:${FMT_COLOR[r.fmt]||'#999'};color:#fff">${esc(r.fmt)}</span></td>
      <td><span class="chip" style="background:${ENG_COLOR[r.eng]||'#999'};color:#fff">${esc(r.eng)}</span></td>
      <td style="text-align:right">${r.n}</td>
      <td style="text-align:right">${r.min > 0 ? r.min+' ms' : '—'}</td>
      <td style="text-align:right">${r.avg > 0 ? r.avg+' ms' : '—'}</td>
      <td style="text-align:right">${r.max > 0 ? r.max+' ms' : '—'}</td>
      <td style="text-align:right">${r.p95 > 0 ? r.p95+' ms' : '—'}</td>
      <td style="text-align:right"><b style="color:${r.rate>=80?'var(--green)':'var(--red)'}">${r.rate}%</b></td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="g4" style="margin-bottom:16px">${summCards}</div>
    <div class="g2" style="margin-bottom:16px">
      <div class="card"><b>Avg Duration by Format (ms)</b><hr><canvas id="c-fmt"></canvas></div>
      <div class="card"><b>Avg Duration by Engine (ms)</b><hr>
        ${byEng.length ? '<canvas id="c-eng"></canvas>' : '<p class="muted">No completed jobs with timing yet.</p>'}
      </div>
    </div>
    <div class="g2" style="margin-bottom:16px">
      <div class="card"><b>Duration — Last ${Math.min(20, last20.length)} Runs</b><hr>
        ${last20.length ? '<canvas id="c-runs"></canvas>' : '<p class="muted">No timing data yet.</p>'}
      </div>
      <div class="card"><b>Jobs by Status</b><hr><canvas id="c-sta"></canvas></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <b>⚡ Strategy Benchmark — Prowide vs Velocity</b>
      <p class="muted sm" style="margin:4px 0 12px">Avg duration (ms) per format, grouped by engine. Only COMPLETED jobs with timing data.</p>
      ${bench.some(r => r.avg > 0) ? '<canvas id="c-bench" style="max-height:260px"></canvas>' : '<p class="muted">No timing data yet — run some conversions first.</p>'}
    </div>
    <div class="card">
      <b>📊 Full Benchmark Stats — All 8 Strategy Combinations</b>
      <p class="muted sm" style="margin:4px 0 12px">Per-combination min / avg / max / p95 and success rate.</p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:.875rem">
          <thead>
            <tr style="text-align:left;border-bottom:1px solid var(--border)">
              <th style="padding:6px 8px">Format</th>
              <th style="padding:6px 8px">Engine</th>
              <th style="padding:6px 8px;text-align:right">Jobs</th>
              <th style="padding:6px 8px;text-align:right">Min</th>
              <th style="padding:6px 8px;text-align:right">Avg</th>
              <th style="padding:6px 8px;text-align:right">Max</th>
              <th style="padding:6px 8px;text-align:right">p95</th>
              <th style="padding:6px 8px;text-align:right">Success</th>
            </tr>
          </thead>
          <tbody>${benchRows}</tbody>
        </table>
      </div>
    </div>`;

  if (typeof Chart === 'undefined') return;

  function bar(id, labels, data, colors) {
    const c = document.getElementById(id);
    if (!c) return;
    chartObjs.push(new Chart(c, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    }));
  }

  bar('c-fmt',  byFmt.map(m => m.fmt), byFmt.map(m => m.avg),  byFmt.map(m => FMT_COLOR[m.fmt]||'#999'));
  bar('c-sta',  bySta.map(m => m.st),  bySta.map(m => m.cnt),  bySta.map(m => STA_COLOR[m.st]||'#999'));
  if (byEng.length)
    bar('c-eng', byEng.map(m => m.eng), byEng.map(m => m.avg), byEng.map(m => ENG_COLOR[m.eng]||'#999'));

  if (last20.length) {
    const c = document.getElementById('c-runs');
    if (c) chartObjs.push(new Chart(c, {
      type: 'line',
      data: {
        labels: last20.map(p => '#' + p.id),
        datasets: [{ label:'ms', data: last20.map(p => p.ms), borderColor:'#E64A19', backgroundColor:'rgba(230,74,25,.1)', borderWidth:2, tension:.25 }],
      },
      options: { scales: { y: { beginAtZero: true } } },
    }));
  }

  const cBench = document.getElementById('c-bench');
  if (cBench && bench.some(r => r.avg > 0)) {
    const prowideData  = FORMATS.map(f => { const r = bench.find(b => b.fmt===f && b.eng==='PROWIDE');  return r ? r.avg : 0; });
    const velocityData = FORMATS.map(f => { const r = bench.find(b => b.fmt===f && b.eng==='VELOCITY'); return r ? r.avg : 0; });
    chartObjs.push(new Chart(cBench, {
      type: 'bar',
      data: {
        labels: FORMATS,
        datasets: [
          { label: 'PROWIDE',  data: prowideData,  backgroundColor: ENG_COLOR.PROWIDE  + 'cc' },
          { label: 'VELOCITY', data: velocityData, backgroundColor: ENG_COLOR.VELOCITY + 'cc' },
        ],
      },
      options: {
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Avg duration (ms)' } } },
      },
    }));
  }
}

function metrics(jobs) {
  const fD={}, fC={}, fOk={};
  for (const j of jobs) {
    fC[j.targetFormat] = (fC[j.targetFormat]||0) + 1;
    if (j.status === 'COMPLETED') {
      fOk[j.targetFormat] = (fOk[j.targetFormat]||0) + 1;
      if (j.durationMs > 0) { (fD[j.targetFormat] = fD[j.targetFormat]||[]).push(j.durationMs); }
    }
  }
  const byFmt = Object.keys(fC).map(f => {
    const d = fD[f] || [], avg = d.length ? Math.round(d.reduce((a,b)=>a+b,0)/d.length) : 0;
    return { fmt:f, avg, count:fC[f], rate: fC[f] ? Math.round((fOk[f]||0)/fC[f]*100) : 0 };
  });

  const eD={};
  for (const j of jobs)
    if (j.status === 'COMPLETED' && j.durationMs > 0)
      (eD[j.engine] = eD[j.engine]||[]).push(j.durationMs);
  const byEng = Object.keys(eD).map(e => ({ eng:e, avg: Math.round(eD[e].reduce((a,b)=>a+b,0)/eD[e].length) }));

  const last20 = jobs.filter(j => j.durationMs > 0).sort((a,b) => a.jobId-b.jobId).slice(-20).map(j => ({ id:j.jobId, ms:j.durationMs }));

  const sM={};
  for (const j of jobs) sM[j.status] = (sM[j.status]||0) + 1;
  const bySta = Object.entries(sM).map(([st,cnt]) => ({ st, cnt }));

  return { byFmt, byEng, last20, bySta };
}

function benchmark(jobs) {
  return FORMATS.flatMap(fmt => ENGINES.map(eng => {
    const all  = jobs.filter(j => j.targetFormat === fmt && j.engine === eng);
    const ok   = all.filter(j => j.status === 'COMPLETED');
    const durs = ok.map(j => j.durationMs).filter(d => d > 0).sort((a, b) => a - b);
    const n    = all.length;
    const min  = durs.length ? durs[0] : 0;
    const max  = durs.length ? durs[durs.length - 1] : 0;
    const avg  = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0;
    const p95  = durs.length ? durs[Math.floor(durs.length * 0.95)] || durs[durs.length - 1] : 0;
    const rate = n ? Math.round(ok.length / n * 100) : 0;
    return { fmt, eng, n, min, avg, max, p95, rate };
  }));
}

// ── Diagrams ──────────────────────────────────────────────────────────────────
async function diagrams() {
  show(
    '<h2>🔀 Architecture Diagrams</h2>' +
    '<p class="muted" style="margin-bottom:16px">Architecture, design patterns, batch flow, conversion pipeline, and DB schema.</p>' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
    DIAGRAMS.map(d =>
      `<div class="card">
        <b style="color:var(--pri)">${esc(d.title)}</b>
        <p class="muted sm" style="margin:4px 0 12px">${esc(d.desc)}</p><hr>
        <div class="diag-wrap" id="${d.id}"><div class="spinner-wrap"><div class="spinner"></div></div></div>
      </div>`
    ).join('') +
    '</div>'
  );

  if (typeof mermaid === 'undefined') {
    DIAGRAMS.forEach(d => { const el=$(d.id); if(el) el.innerHTML='<p class="red">Mermaid CDN unavailable.</p>'; });
    return;
  }
  const baseCfg = { startOnLoad:false, theme:'base', securityLevel:'loose',
    themeVariables:{ primaryColor:'#00838F', primaryTextColor:'#fff', lineColor:'#555', fontSize:'14px' } };
  const erCfg  = { startOnLoad:false, theme:'base', securityLevel:'loose',
    themeVariables:{ primaryColor:'#006064', primaryTextColor:'#B2EBF2', lineColor:'#555', fontSize:'14px',
      attributeBackgroundColorEven:'#004D40', attributeBackgroundColorOdd:'#006064' } };
  if (!mermaidOn) { mermaid.initialize(baseCfg); mermaidOn = true; }
  for (const d of DIAGRAMS) {
    const el = $(d.id);
    if (!el) continue;
    try {
      if (d.id === 'd-db') mermaid.initialize(erCfg);
      const { svg } = await mermaid.render(d.id + '-svg', d.chart);
      el.innerHTML = svg;  // safe: mermaid-generated SVG from a static string constant
      if (d.id === 'd-db') mermaid.initialize(baseCfg);
    } catch(e) {
      el.innerHTML = `<pre class="red">${esc(String(e))}</pre>`;
    }
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTheme(theme);
  $('theme-btn')?.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
  document.querySelectorAll('nav a').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.view); })
  );
  const hash = window.location.hash.slice(1);
  go(VIEWS.includes(hash) ? hash : 'dashboard');
});

// ── Diagram Definitions ───────────────────────────────────────────────────────
// Kept at bottom so the view logic above stays readable.
const DIAGRAMS = [
  {
    id: 'd-arch', title: '1. System Architecture',
    desc: 'HTML/JS SPA → REST API → Spring Batch → Strategy Pattern → output files',
    chart: `graph TB
  subgraph FE["🖥 HTML/JS SPA"]
    UI["Dashboard · Generate · Runner · History · Benchmarks · Diagrams"]
  end
  subgraph API["🔌 REST API"]
    RS["POST /api/random-statements"]
    CV["POST /api/conversions\nGET /api/conversions/jobs"]
    ACT["GET /actuator/health\nGET /actuator/info"]
  end
  subgraph Batch["⚙ Spring Batch Pipeline"]
    JL[JobLauncher] --> JOB[statementExportJob] --> STEP[step]
    STEP --> R[ItemReader] --> DB[(H2)]
    STEP --> P[Processor] --> SF[StrategyFactory]
    STEP --> W[FileWriter] --> OUT[output/]
  end
  SF --> PW["Prowide: MT940·MT942·camt052·camt053"]
  SF --> VL["Velocity: MT940·MT942·camt052·camt053"]
  UI --> API
  RS --> DB
  CV --> JL
  classDef fe fill:#E64A19,stroke:#BF360C,color:#fff
  classDef api fill:#1565C0,stroke:#0D47A1,color:#fff
  classDef batch fill:#2E7D32,stroke:#1B5E20,color:#fff
  class UI fe
  class RS,CV,ACT api
  class JL,JOB,STEP,R,P,W,SF batch`,
  },
  {
    id: 'd-strategy', title: '2. Strategy Pattern — Class Diagram',
    desc: '8 implementations (4 formats × 2 engines) behind one interface, resolved by a factory',
    chart: `classDiagram
  class StatementExportStrategy {
    <<interface>>
    +export(BankStatement) GeneratedBankingFile
    +targetFormat() ConversionTargetFormat
    +engine() ConversionEngine
  }
  class StatementExportStrategyFactory {
    +getStrategy(format, engine)
  }
  class AbstractMtProwideStrategy { <<abstract>> }
  StatementExportStrategy <|.. AbstractMtProwideStrategy
  StatementExportStrategy <|.. InternalToCamt052ProwideStrategy
  StatementExportStrategy <|.. InternalToCamt053ProwideStrategy
  StatementExportStrategy <|.. InternalToMt940VelocityStrategy
  StatementExportStrategy <|.. InternalToMt942VelocityStrategy
  StatementExportStrategy <|.. InternalToCamt052VelocityStrategy
  StatementExportStrategy <|.. InternalToCamt053VelocityStrategy
  AbstractMtProwideStrategy <|-- InternalToMt940ProwideStrategy
  AbstractMtProwideStrategy <|-- InternalToMt942ProwideStrategy
  StatementExportStrategyFactory --> StatementExportStrategy`,
  },
  {
    id: 'd-seq', title: '3. Batch Execution — Sequence Diagram',
    desc: 'Statement generation then Spring Batch conversion job lifecycle',
    chart: `sequenceDiagram
  participant FE as Frontend
  participant API as REST API
  participant Batch as Spring Batch
  participant DB as H2
  participant FS as output/
  Note over FE,DB: Phase 1 — Generate
  FE->>API: POST /api/random-statements?loadProfile=LOW
  API->>DB: save BankStatementEntity
  API-->>FE: firstStatementId · accountsGenerated · statementsGenerated · transactionsGenerated
  Note over FE,FS: Phase 2 — Convert
  FE->>API: POST /api/conversions {statementId, format, engine}
  API->>Batch: launch job
  Batch->>DB: load statement + transactions
  Batch->>Batch: resolve strategy, export file
  Batch->>FS: write output file
  API-->>FE: jobId, status, outputFile, fileContent`,
  },
  {
    id: 'd-flow', title: '4. Conversion Flow — Engines & Formats',
    desc: 'Domain model → validation → 2 engines → 4 output formats',
    chart: `flowchart LR
  IN["BankStatement\n(domain record)"] --> V["InternalStatementValidator"]
  V --> PW["Prowide Engine"]
  V --> VL["Velocity Engine"]
  PW --> O1["statement.mt940"]
  PW --> O2["statement.mt942"]
  PW --> O3["statement.camt052.xml"]
  PW --> O4["statement.camt053.xml"]
  VL --> O1
  VL --> O2
  VL --> O3
  VL --> O4`,
  },
  {
    id: 'd-db', title: '5. Database Schema (H2 In-Memory)',
    desc: 'bank_statements 1:N bank_transactions',
    chart: `%%{init: {"themeVariables": {"primaryTextColor": "#B2EBF2", "attributeBackgroundColorEven": "#006064", "attributeBackgroundColorOdd": "#00838F"}}}%%
erDiagram
  bank_statements {
    bigint id PK
    varchar statement_reference
    varchar account_iban
    varchar account_currency
    date statement_date
    decimal opening_balance
    decimal closing_balance
  }
  bank_transactions {
    bigint id PK
    bigint statement_id FK
    date booking_date
    date value_date
    decimal amount
    varchar debit_credit_indicator
    varchar transaction_reference
    varchar remittance_information
  }
  bank_statements ||--o{ bank_transactions : "contains"`,
  },
  {
    id: 'd-comp', title: '6. Component Diagram',
    desc: 'Package-level components and their dependencies',
    chart: `%%{init: {"themeVariables": {"lineColor": "#555555", "fontSize": "13px"}}}%%
graph LR
  subgraph API["🔌  api/"]
    RC[RandomStatementController]
    CC[StatementConversionController]
    GEH[GlobalExceptionHandler]
  end
  subgraph BATCH["⚙  batch/"]
    IR[BankStatementItemReader]
    IP[StatementExportProcessor]
    IW[BankingFileWriter]
    BJS[BatchJobService]
    BML[BatchJobMetricsListener]
  end
  subgraph CONV["🔀  conversion/"]
    SSF[StatementExportStrategyFactory]
    SSI[StatementExportStrategy]
    subgraph PROWIDE["strategy/prowide/"]
      PM940[Mt940ProwideStrategy]
      PM942[Mt942ProwideStrategy]
      PC052[Camt052ProwideStrategy]
      PC053[Camt053ProwideStrategy]
    end
    subgraph VELOCITY["strategy/velocity/"]
      VM940[Mt940VelocityStrategy]
      VM942[Mt942VelocityStrategy]
      VC052[Camt052VelocityStrategy]
      VC053[Camt053VelocityStrategy]
    end
  end
  subgraph SERVICES["🛠  services/"]
    RSS[RandomStatementService]
    BSM[BankStatementMapper]
    ISV[InternalStatementValidator]
    VR[VelocityRenderer]
  end
  subgraph DOMAIN["🗄  domain/ + persistence/"]
    BS[BankStatement record]
    BT[BankTransaction record]
    BSE[BankStatementEntity]
    BTE[BankTransactionEntity]
    REPO[BankStatementRepository]
  end
  RC --> RSS
  CC --> BJS
  BJS --> IR
  BJS --> IP
  BJS --> IW
  IP --> BSM
  IP --> ISV
  IP --> SSF
  SSF --> SSI
  PM940 -.->|implements| SSI
  PM942 -.->|implements| SSI
  PC052 -.->|implements| SSI
  PC053 -.->|implements| SSI
  VM940 -.->|implements| SSI
  VM942 -.->|implements| SSI
  VC052 -.->|implements| SSI
  VC053 -.->|implements| SSI
  VM940 --> VR
  VM942 --> VR
  VC052 --> VR
  VC053 --> VR
  BSM --> BSE
  IR --> REPO
  REPO --> BSE
  BSE --> BTE
  classDef apiCls    fill:#1565C0,stroke:#0D47A1,color:#fff
  classDef batchCls  fill:#2E7D32,stroke:#1B5E20,color:#fff
  classDef factCls   fill:#00838F,stroke:#006064,color:#fff
  classDef intCls    fill:#455A64,stroke:#263238,color:#fff
  classDef prowCls   fill:#BF360C,stroke:#7F0000,color:#fff
  classDef velCls    fill:#7B1FA2,stroke:#4A148C,color:#fff
  classDef svcCls    fill:#E65100,stroke:#BF360C,color:#fff
  classDef domainCls fill:#5D4037,stroke:#3E2723,color:#fff
  class RC,CC,GEH apiCls
  class IR,IP,IW,BJS,BML batchCls
  class SSF factCls
  class SSI intCls
  class PM940,PM942,PC052,PC053 prowCls
  class VM940,VM942,VC052,VC053 velCls
  class RSS,BSM,ISV,VR svcCls
  class BS,BT,BSE,BTE,REPO domainCls
  style API      fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
  style BATCH    fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
  style CONV     fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
  style PROWIDE  fill:#FBE9E7,stroke:#BF360C,stroke-width:2px
  style VELOCITY fill:#EDE7F6,stroke:#7B1FA2,stroke-width:2px
  style SERVICES fill:#FFF8E1,stroke:#E65100,stroke-width:2px
  style DOMAIN   fill:#EFEBE9,stroke:#5D4037,stroke-width:2px`,
  },
  {
    id: 'd-deploy', title: '7. Deployment Diagram',
    desc: 'Build → runtime → browser — localhost:8080',
    chart: `%%{init: {"themeVariables": {"lineColor": "#555555", "fontSize": "14px"}}}%%
graph TB
  subgraph DEV["💻  Developer Machine  —  Build"]
    SRC["Source Code\nsrc/main/java + resources\nVanilla HTML/CSS/JS (static/)"]
    MVN["Maven Build\nmvn clean package"]
    JAR["Spring Boot JAR\ncamt-mt-converters-*.jar"]
    SRC --> MVN
    MVN --> JAR
  end
  subgraph RUNTIME["🚀  Runtime  —  localhost:8080"]
    SB["Spring Boot App"]
    H2[("H2 In-Memory DB\nbank_statements · bank_transactions")]
    OUTPUT["output/\n*.mt940 · *.mt942 · *.xml"]
    STATIC_SRV["Static Resources\nVanilla JS SPA served at /"]
    SB --> H2
    SB --> OUTPUT
    SB --> STATIC_SRV
  end
  subgraph BROWSER["🌐  Browser  —  localhost:8080"]
    SPA["Vanilla JS SPA\nDashboard · Runner · Benchmarks · Diagrams"]
    SWAGGER["Swagger UI\n/swagger-ui.html"]
    ACTUATOR["Actuator\n/actuator/health · /actuator/info"]
  end
  JAR --> SB
  SPA --> STATIC_SRV
  SPA --> SB
  SWAGGER --> SB
  ACTUATOR --> SB
  classDef buildCls   fill:#37474F,stroke:#263238,color:#fff
  classDef runtimeCls fill:#1565C0,stroke:#0D47A1,color:#fff
  classDef dbCls      fill:#5D4037,stroke:#3E2723,color:#fff
  classDef outCls     fill:#546E7A,stroke:#37474F,color:#fff
  classDef browserCls fill:#2E7D32,stroke:#1B5E20,color:#fff
  class SRC,MVN,JAR buildCls
  class SB,STATIC_SRV runtimeCls
  class H2 dbCls
  class OUTPUT outCls
  class SPA,SWAGGER,ACTUATOR browserCls
  style DEV     fill:#F5F5F5,stroke:#37474F,stroke-width:2px
  style RUNTIME fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
  style BROWSER fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px`,
  },
];
