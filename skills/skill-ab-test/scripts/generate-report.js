#!/usr/bin/env node
/**
 * Generate an HTML report from A/B test results and optionally serve it
 * with a feedback collection server.
 *
 * Usage:
 *   node generate-report.js <iteration-dir>              # generate static files
 *   node generate-report.js <iteration-dir> --serve       # serve with feedback
 *   node generate-report.js <iteration-dir> --serve -p 3118
 *   node generate-report.js <iteration-dir> --previous <prev-iteration-dir>
 *
 * Zero dependencies — Node.js stdlib only.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execSync } = require("child_process");

// --- CLI args ---

const args = process.argv.slice(2);
const iterationDir = args.find((a) => !a.startsWith("-"));
const shouldServe = args.includes("--serve");
const portIdx = args.indexOf("-p");
const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 3118;
const prevIdx = args.indexOf("--previous");
const prevDir = prevIdx !== -1 ? path.resolve(args[prevIdx + 1]) : null;

if (!iterationDir) {
  console.error(
    "Usage: node generate-report.js <iteration-dir> [--serve] [-p PORT] [--previous <prev-dir>]",
  );
  process.exit(1);
}

const absDir = path.resolve(iterationDir);
if (!fs.existsSync(absDir)) {
  console.error(`Directory not found: ${absDir}`);
  process.exit(1);
}

// --- Load data ---

function loadData() {
  const benchmarkPath = path.join(absDir, "benchmark.json");
  let benchmark;
  try {
    benchmark = JSON.parse(fs.readFileSync(benchmarkPath, "utf-8"));
  } catch {
    console.error(`Cannot read ${benchmarkPath}`);
    process.exit(1);
  }

  const evalDirs = fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const gradings = {};
  for (const evalName of evalDirs) {
    const evalDir = path.join(absDir, evalName);
    for (const variant of ["new_skill", "old_skill"]) {
      const gradingPath = path.join(evalDir, variant, "grading.json");
      if (fs.existsSync(gradingPath)) {
        try {
          const g = JSON.parse(fs.readFileSync(gradingPath, "utf-8"));
          if (!gradings[evalName]) gradings[evalName] = {};
          gradings[evalName][variant] = g;
        } catch {}
      }
    }
  }

  // Load previous feedback
  let previousFeedback = {};
  if (prevDir) {
    const prevFbPath = path.join(prevDir, "feedback.json");
    if (fs.existsSync(prevFbPath)) {
      try {
        const fb = JSON.parse(fs.readFileSync(prevFbPath, "utf-8"));
        for (const r of fb.reviews || []) {
          if (r.feedback && r.feedback.trim()) {
            previousFeedback[r.eval_name || r.run_id] = r.feedback;
          }
        }
      } catch {}
    }
  }

  return { benchmark, gradings, previousFeedback };
}

// --- Markdown ---

function generateMarkdown(benchmark, gradings) {
  const meta = benchmark.metadata || {};
  const runs = benchmark.runs || [];
  const summary = benchmark.summary || {};
  const notes = benchmark.notes || [];

  const lines = [
    `# A/B Test Report: ${meta.skill_name || "unknown"}`,
    "",
    `**Skill**: ${meta.skill_path || "unknown"}`,
    `**Date**: ${meta.timestamp || new Date().toISOString()}`,
    `**Model**: ${meta.model || "unknown"}`,
    meta.changes_summary ? `**Changes**: ${meta.changes_summary}` : "",
    "",
    "## Results",
    "",
    "| Eval | New Skill | Baseline | Delta |",
    "|------|-----------|----------|-------|",
  ];

  for (const run of runs) {
    const newPr = run.new_skill
      ? `${run.new_skill.assertions_passed}/${run.new_skill.assertions_total} (${Math.round(run.new_skill.pass_rate * 100)}%)`
      : "N/A";
    const oldPr = run.old_skill
      ? `${run.old_skill.assertions_passed}/${run.old_skill.assertions_total} (${Math.round(run.old_skill.pass_rate * 100)}%)`
      : "N/A";
    const delta =
      run.new_skill && run.old_skill
        ? `${run.new_skill.pass_rate > run.old_skill.pass_rate ? "+" : ""}${Math.round((run.new_skill.pass_rate - run.old_skill.pass_rate) * 100)}%`
        : "N/A";
    lines.push(`| ${run.eval_name} | ${newPr} | ${oldPr} | ${delta} |`);
  }

  if (summary.new_skill && summary.old_skill) {
    lines.push(
      `| **Total** | **${summary.new_skill.total_passed}/${summary.new_skill.total_assertions} (${Math.round(summary.new_skill.mean_pass_rate * 100)}%)** | **${summary.old_skill.total_passed}/${summary.old_skill.total_assertions} (${Math.round(summary.old_skill.mean_pass_rate * 100)}%)** | **${summary.delta?.pass_rate || "N/A"}** |`,
    );
  }

  lines.push(
    "",
    `**Verdict**: ${summary.verdict || "unknown"}${summary.verdict === "improvement" ? " (no regressions)" : ""}`,
  );

  const regressions = findRegressions(gradings);
  if (regressions.length > 0) {
    lines.push("", "## Regressions", "");
    for (const r of regressions) {
      lines.push(
        `- **${r.eval}**: "${r.assertion}" -- old: PASS, new: FAIL`,
      );
    }
  }

  lines.push("", "## Per-Eval Details");
  for (const evalName of Object.keys(gradings)) {
    lines.push("", `### ${evalName}`, "");
    lines.push("| Assertion | New | Old |");
    lines.push("|-----------|-----|-----|");
    const newExps = gradings[evalName]?.new_skill?.expectations || [];
    const oldExps = gradings[evalName]?.old_skill?.expectations || [];
    for (let i = 0; i < Math.max(newExps.length, oldExps.length); i++) {
      const text = (newExps[i] || oldExps[i])?.text || "?";
      lines.push(
        `| ${text} | ${newExps[i]?.passed ? "PASS" : "FAIL"} | ${oldExps[i]?.passed ? "PASS" : "FAIL"} |`,
      );
    }
  }

  if (notes.length > 0) {
    lines.push("", "## Notes", "");
    for (const n of notes) lines.push(`- ${n}`);
  }

  return lines.filter((l) => l !== undefined).join("\n");
}

function findRegressions(gradings) {
  const regressions = [];
  for (const evalName of Object.keys(gradings)) {
    const newExps = gradings[evalName]?.new_skill?.expectations || [];
    const oldExps = gradings[evalName]?.old_skill?.expectations || [];
    for (let i = 0; i < Math.min(newExps.length, oldExps.length); i++) {
      if (oldExps[i].passed && !newExps[i].passed) {
        regressions.push({ eval: evalName, assertion: newExps[i].text });
      }
    }
  }
  return regressions;
}

// --- HTML ---

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateHTML(benchmark, gradings, previousFeedback) {
  const meta = benchmark.metadata || {};
  const runs = benchmark.runs || [];
  const summary = benchmark.summary || {};

  const verdictColors = {
    improvement: "#22c55e",
    regression: "#ef4444",
    no_change: "#6b7280",
    mixed: "#f59e0b",
  };
  const verdictColor = verdictColors[summary.verdict] || "#6b7280";

  // Build eval data for JS
  const evalData = [];
  for (const run of runs) {
    const evalName = run.eval_name;
    const newExps = gradings[evalName]?.new_skill?.expectations || [];
    const oldExps = gradings[evalName]?.old_skill?.expectations || [];
    evalData.push({
      name: evalName,
      new_skill: run.new_skill,
      old_skill: run.old_skill,
      new_expectations: newExps,
      old_expectations: oldExps,
      previous_feedback: previousFeedback[evalName] || "",
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A/B Test: ${esc(meta.skill_name || "Skill")}</title>
<style>
  :root { --bg: #0a0a0a; --fg: #e5e5e5; --muted: #737373; --border: #262626; --card: #171717; --green: #22c55e; --red: #ef4444; --blue: #3b82f6; --amber: #f59e0b; --accent: #d97757; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; background: var(--bg); color: var(--fg); line-height: 1.6; height: 100vh; display: flex; flex-direction: column; }

  .header { background: #111; padding: 1rem 2rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .header h1 { font-size: 1.25rem; }
  .meta { color: var(--muted); font-size: 0.8rem; margin-top: 0.25rem; }
  .meta span { margin-right: 1.5rem; }
  .verdict { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600; font-size: 0.8rem; margin-top: 0.5rem; }

  .tabs { display: flex; background: #111; border-bottom: 1px solid var(--border); padding: 0 2rem; flex-shrink: 0; }
  .tab { padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; border: none; background: none; color: var(--muted); border-bottom: 2px solid transparent; font-family: inherit; }
  .tab:hover { color: var(--fg); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  .panel { display: none; flex: 1; overflow: auto; padding: 1.5rem 2rem; }
  .panel.active { display: block; }

  /* Summary table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
  th { color: var(--muted); font-weight: 500; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .bar-cell { position: relative; min-width: 180px; }
  .bar-cell span { position: relative; z-index: 1; }
  .bar { position: absolute; top: 0; left: 0; height: 100%; opacity: 0.15; border-radius: 2px; }
  .bar.new { background: var(--green); }
  .bar.old { background: var(--blue); }
  .positive { color: var(--green); font-weight: 600; }
  .negative { color: var(--red); font-weight: 600; }
  .neutral { color: var(--muted); }
  .pass { color: var(--green); }
  .fail { color: var(--red); }
  tr.win { background: rgba(34, 197, 94, 0.05); }
  tr.loss { background: rgba(239, 68, 68, 0.05); }
  .summary-row { font-weight: 600; background: var(--card); }

  /* Eval details */
  .eval-detail { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
  .eval-detail h3 { font-size: 0.95rem; margin-bottom: 0.75rem; }
  .eval-detail table { margin: 0; }
  .evidence { color: var(--muted); font-size: 0.7rem; margin-top: 0.2rem; font-style: italic; }

  /* Feedback */
  .feedback-section { margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; }
  .feedback-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.4rem; }
  .feedback-textarea { width: 100%; min-height: 80px; padding: 0.6rem; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; font-size: 0.8rem; line-height: 1.5; resize: vertical; color: var(--fg); background: var(--bg); }
  .feedback-textarea:focus { outline: none; border-color: var(--accent); }
  .feedback-status { font-size: 0.7rem; color: var(--muted); margin-top: 0.3rem; min-height: 1em; }
  .prev-feedback { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 0.5rem 0.6rem; margin-bottom: 0.6rem; font-size: 0.75rem; color: var(--muted); line-height: 1.5; }
  .prev-feedback-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.2rem; color: var(--amber); }

  /* Done button */
  .done-bar { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; padding: 0.75rem 2rem; background: #111; border-top: 1px solid var(--border); flex-shrink: 0; }
  .done-btn { padding: 0.4rem 1.25rem; border: none; border-radius: 4px; font-family: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer; background: var(--accent); color: #fff; }
  .done-btn:hover { opacity: 0.9; }
  .done-status { font-size: 0.75rem; color: var(--muted); }

  /* Notes */
  .notes ul { list-style: none; }
  .notes li { padding: 0.25rem 0; color: var(--muted); font-size: 0.8rem; }
  .notes li::before { content: "- "; }

  /* Done overlay */
  .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; justify-content: center; align-items: center; }
  .overlay.visible { display: flex; }
  .overlay-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; max-width: 400px; text-align: center; }
  .overlay-card h2 { margin-bottom: 0.5rem; }
  .overlay-card p { color: var(--muted); font-size: 0.85rem; margin-bottom: 1rem; }
  .overlay-card button { padding: 0.4rem 1rem; border: 1px solid var(--border); border-radius: 4px; background: var(--card); color: var(--fg); font-family: inherit; cursor: pointer; margin: 0 0.25rem; }
</style>
</head>
<body>
  <div class="header">
    <h1>A/B Test: ${esc(meta.skill_name || "Skill")}</h1>
    <div class="meta">
      <span>${esc(meta.skill_path || "")}</span>
      <span>${esc(meta.timestamp || "")}</span>
      <span>${esc(meta.model || "")}</span>
    </div>
    ${meta.changes_summary ? `<div style="color: var(--muted); font-size: 0.8rem; margin-top: 0.25rem;">${esc(meta.changes_summary)}</div>` : ""}
    <div class="verdict" style="background: ${verdictColor}22; color: ${verdictColor}; border: 1px solid ${verdictColor}44;">
      ${esc((summary.verdict || "unknown").toUpperCase())}${summary.delta ? ` (${esc(summary.delta.pass_rate)})` : ""}
    </div>
  </div>

  <div class="tabs">
    <button class="tab active" onclick="showPanel('results')">Results</button>
    <button class="tab" onclick="showPanel('details')">Per-Eval Details</button>
  </div>

  <div class="panel active" id="panel-results">
    <table>
      <thead><tr><th>Eval</th><th>New Skill</th><th>Old Skill (Baseline)</th><th>Delta</th></tr></thead>
      <tbody id="results-body"></tbody>
    </table>
    <div class="notes" id="notes-section"></div>
  </div>

  <div class="panel" id="panel-details"></div>

  <div class="done-bar">
    <span class="done-status" id="global-status"></span>
    <button class="done-btn" onclick="submitDone()">Done Reviewing</button>
  </div>

  <div class="overlay" id="done-overlay">
    <div class="overlay-card">
      <h2>Review Complete</h2>
      <p>Your feedback has been saved to <code>feedback.json</code>. Go back to Claude Code and tell the agent you're done reviewing.</p>
      <button onclick="document.getElementById('done-overlay').classList.remove('visible')">Close</button>
    </div>
  </div>

<script>
const DATA = ${JSON.stringify({ evals: evalData, summary, notes: benchmark.notes || [], meta })};
const feedbackMap = {};
let saveTimer = null;

// --- Tabs ---
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelector('[onclick="showPanel(\\'' + id + '\\')"]').classList.add('active');
}

// --- Results table ---
(function renderResults() {
  const tbody = document.getElementById('results-body');
  for (const ev of DATA.evals) {
    const newPr = ev.new_skill ? Math.round(ev.new_skill.pass_rate * 100) : 0;
    const oldPr = ev.old_skill ? Math.round(ev.old_skill.pass_rate * 100) : 0;
    const delta = newPr - oldPr;
    const cls = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
    tbody.innerHTML += '<tr>'
      + '<td>' + esc(ev.name) + '</td>'
      + '<td><div class="bar-cell"><div class="bar new" style="width:' + newPr + '%"></div><span>'
        + (ev.new_skill ? ev.new_skill.assertions_passed + '/' + ev.new_skill.assertions_total : 'N/A')
        + ' (' + newPr + '%)</span></div></td>'
      + '<td><div class="bar-cell"><div class="bar old" style="width:' + oldPr + '%"></div><span>'
        + (ev.old_skill ? ev.old_skill.assertions_passed + '/' + ev.old_skill.assertions_total : 'N/A')
        + ' (' + oldPr + '%)</span></div></td>'
      + '<td class="' + cls + '">' + (delta > 0 ? '+' : '') + delta + '%</td></tr>';
  }
  if (DATA.summary.new_skill && DATA.summary.old_skill) {
    const s = DATA.summary;
    const dp = parseFloat(s.delta?.pass_rate || '0');
    tbody.innerHTML += '<tr class="summary-row"><td>Total</td>'
      + '<td>' + s.new_skill.total_passed + '/' + s.new_skill.total_assertions + ' (' + Math.round(s.new_skill.mean_pass_rate * 100) + '%)</td>'
      + '<td>' + s.old_skill.total_passed + '/' + s.old_skill.total_assertions + ' (' + Math.round(s.old_skill.mean_pass_rate * 100) + '%)</td>'
      + '<td class="' + (dp > 0 ? 'positive' : dp < 0 ? 'negative' : 'neutral') + '">' + (s.delta?.pass_rate || '0') + '</td></tr>';
  }
  // Notes
  if (DATA.notes.length) {
    const sec = document.getElementById('notes-section');
    sec.innerHTML = '<h3 style="color:var(--muted);font-size:0.85rem;margin-bottom:0.5rem;">Notes</h3><ul>'
      + DATA.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>';
  }
})();

// --- Details with feedback ---
(function renderDetails() {
  const panel = document.getElementById('panel-details');
  for (const ev of DATA.evals) {
    const maxLen = Math.max(ev.new_expectations.length, ev.old_expectations.length);
    let rows = '';
    for (let i = 0; i < maxLen; i++) {
      const ne = ev.new_expectations[i];
      const oe = ev.old_expectations[i];
      const text = (ne || oe)?.text || '?';
      const np = ne?.passed;
      const op = oe?.passed;
      const rowCls = np && !op ? ' class="win"' : !np && op ? ' class="loss"' : '';
      const newEvidence = ne?.evidence || '';
      const oldEvidence = oe?.evidence || '';
      rows += '<tr' + rowCls + '><td>' + esc(text)
        + (newEvidence || oldEvidence ? '<div class="evidence">' + esc(newEvidence || oldEvidence) + '</div>' : '')
        + '</td><td class="' + (np ? 'pass' : 'fail') + '">' + (np ? 'PASS' : 'FAIL')
        + '</td><td class="' + (op ? 'pass' : 'fail') + '">' + (op ? 'PASS' : 'FAIL') + '</td></tr>';
    }

    let prevHtml = '';
    if (ev.previous_feedback) {
      prevHtml = '<div class="prev-feedback"><div class="prev-feedback-label">Previous iteration feedback</div>'
        + esc(ev.previous_feedback) + '</div>';
    }

    panel.innerHTML += '<div class="eval-detail"><h3>' + esc(ev.name) + '</h3>'
      + '<table><thead><tr><th>Assertion</th><th>New</th><th>Old</th></tr></thead><tbody>' + rows + '</tbody></table>'
      + '<div class="feedback-section">'
      + prevHtml
      + '<div class="feedback-label">Your feedback for this eval</div>'
      + '<textarea class="feedback-textarea" data-eval="' + esc(ev.name) + '" '
      + 'placeholder="What should change? Flag wrong grades, suggest better assertions, note observations..."'
      + ' oninput="onFeedbackInput(this)"></textarea>'
      + '<div class="feedback-status" id="status-' + esc(ev.name) + '"></div>'
      + '</div></div>';
  }
})();

// --- Feedback save ---
function onFeedbackInput(textarea) {
  const evalName = textarea.dataset.eval;
  feedbackMap[evalName] = textarea.value;
  document.getElementById('status-' + evalName).textContent = '';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveFeedback, 1000);
}

function saveFeedback() {
  const reviews = [];
  const ts = new Date().toISOString();
  for (const ev of DATA.evals) {
    reviews.push({
      eval_name: ev.name,
      feedback: feedbackMap[ev.name] || '',
      timestamp: ts
    });
  }
  const payload = JSON.stringify({ reviews, status: 'in_progress' }, null, 2);

  fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  }).then(() => {
    for (const ev of DATA.evals) {
      const el = document.getElementById('status-' + ev.name);
      if (el && feedbackMap[ev.name]) el.textContent = 'Saved';
    }
  }).catch(() => {
    // Static mode — feedback will download on submit
    for (const ev of DATA.evals) {
      const el = document.getElementById('status-' + ev.name);
      if (el && feedbackMap[ev.name]) el.textContent = 'Will save on submit';
    }
  });
}

function submitDone() {
  const reviews = [];
  const ts = new Date().toISOString();
  for (const ev of DATA.evals) {
    reviews.push({
      eval_name: ev.name,
      feedback: feedbackMap[ev.name] || '',
      timestamp: ts
    });
  }
  const payload = JSON.stringify({ reviews, status: 'complete' }, null, 2);

  fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  }).then(() => {
    document.getElementById('done-overlay').classList.add('visible');
    document.getElementById('global-status').textContent = 'Feedback saved';
  }).catch(() => {
    // Static mode — download as file
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback.json';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('done-overlay').classList.add('visible');
  });
}

// Load saved feedback on startup
(async function loadSavedFeedback() {
  try {
    const resp = await fetch('/api/feedback');
    if (resp.ok) {
      const data = await resp.json();
      for (const r of (data.reviews || [])) {
        if (r.feedback && r.feedback.trim()) {
          feedbackMap[r.eval_name] = r.feedback;
          const ta = document.querySelector('[data-eval="' + r.eval_name + '"]');
          if (ta) ta.value = r.feedback;
        }
      }
    }
  } catch {}
})();

function esc(s) {
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}
</script>
</body>
</html>`;
}

// --- Server ---

function startServer(absDir, port) {
  const feedbackPath = path.join(absDir, "feedback.json");

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      // Re-generate on each load to pick up new grading data
      const { benchmark, gradings, previousFeedback } = loadData();
      const html = generateHTML(benchmark, gradings, previousFeedback);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } else if (req.method === "GET" && req.url === "/api/feedback") {
      let data = "{}";
      try {
        if (fs.existsSync(feedbackPath)) {
          data = fs.readFileSync(feedbackPath, "utf-8");
        }
      } catch {}
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
    } else if (req.method === "POST" && req.url === "/api/feedback") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          fs.writeFileSync(feedbackPath, JSON.stringify(parsed, null, 2) + "\n");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end('{"ok":true}');
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  // Kill existing process on port
  try {
    const pids = execSync(`lsof -ti :${port} 2>/dev/null`, {
      encoding: "utf-8",
    }).trim();
    for (const pid of pids.split("\n")) {
      if (pid) {
        try {
          process.kill(parseInt(pid, 10), "SIGTERM");
        } catch {}
      }
    }
  } catch {}

  server.listen(port, "127.0.0.1", () => {
    const url = `http://localhost:${port}`;
    console.log(`
  A/B Test Viewer
  ─────────────────────────────
  URL:       ${url}
  Workspace: ${absDir}
  Feedback:  ${feedbackPath}
${prevDir ? `  Previous:  ${prevDir}\n` : ""}
  Press Ctrl+C to stop.
`);
    try {
      if (process.platform === "darwin") execSync(`open "${url}"`);
      else if (process.platform === "linux") execSync(`xdg-open "${url}"`);
    } catch {}
  });
}

// --- Main ---

const { benchmark, gradings, previousFeedback } = loadData();

// Always generate static files
const markdown = generateMarkdown(benchmark, gradings);
const html = generateHTML(benchmark, gradings, previousFeedback);

fs.writeFileSync(path.join(absDir, "report.md"), markdown);
fs.writeFileSync(path.join(absDir, "report.html"), html);
console.log(`Generated: ${path.join(absDir, "report.md")}`);
console.log(`Generated: ${path.join(absDir, "report.html")}`);

if (shouldServe) {
  startServer(absDir, port);
} else {
  // Print markdown summary
  console.log("\n" + markdown);
}
