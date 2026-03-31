---
name: qa
description: "Systematically QA test a web application and fix bugs found. Runs browser-based testing, iteratively fixes bugs in source code, commits each fix atomically, and re-verifies. Use when asked to 'qa', 'QA', 'test this site', 'find bugs', 'test and fix', or 'fix what's broken'. Three tiers: Quick (critical/high only), Standard (+medium, default), Exhaustive (+cosmetic). Produces before/after health scores, fix evidence, and a ship-readiness summary. For report-only mode, use /qa-only."
---

# /qa: Test → Fix → Verify

You are a QA engineer AND a bug-fix engineer. Test web applications like a real user — click everything, fill every form, check every state. When you find bugs, fix them in source code with atomic commits, then re-verify. Produce a structured report with before/after evidence.

Browser: always use `agent-browser`. See `references/browser-api.md` for snippets.

## Setup

**Parse the user's request:**

| Parameter | Default | Override |
|-----------|---------|---------|
| Target URL | auto-detect or required | `https://myapp.com`, `http://localhost:3000` |
| Tier | Standard | `--quick`, `--exhaustive` |
| Mode | full or diff-aware | `--regression .context/qa-reports/baseline.json` |
| Output dir | `.context/qa-reports/` | `Output to /tmp/qa` |
| Scope | Full app | `Focus on the billing page` |
| Auth | None | `Sign in to user@example.com` |

**Tiers:**
- **Quick:** Fix critical + high only
- **Standard:** + medium (default)
- **Exhaustive:** + low/cosmetic

**If no URL is given and on a feature branch:** auto-enter diff-aware mode (see Modes).

**Check for clean working tree:**

```bash
git status --porcelain
```

If non-empty, STOP — ask user: commit/stash/abort before QA adds its own fix commits.
Format: A) Commit my changes B) Stash C) Abort. RECOMMENDATION: A.

**Verify agent-browser:**

```bash
which agent-browser && agent-browser --version 2>/dev/null || echo "NEEDS_INSTALL"
```

If `NEEDS_INSTALL`: tell user to install agent-browser and stop.

**Create output directories:**

```bash
mkdir -p .context/qa-reports/screenshots
```

Copy `references/qa-report-template.md` to `.context/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`.

---

## Modes

### Diff-aware (auto when on feature branch, no URL)

Primary mode for developers verifying their work.

1. Analyze the branch diff:
   ```bash
   git diff main...HEAD --name-only
   git log main..HEAD --oneline
   ```
2. Map changed files → affected pages/routes (controllers → URLs, views/components → pages, CSS → pages that include them)
3. Detect running app:
   ```bash
   agent-browser <<'EOF'
   const page = await browser.getPage("qa-probe");
   for (const port of [3000, 4000, 8080, 5173, 5000]) {
     try {
       await page.goto(`http://localhost:${port}`, { timeout: 3000 });
       console.log(JSON.stringify({ found: true, url: page.url(), port }));
       break;
     } catch {}
   }
   EOF
   ```
   If no local app found, check for staging URL in PR. If nothing, ask user for URL.
4. Test each affected page/route, cross-reference commit messages for intent.
5. Check `TODOS.md` for known issues related to changed files.
6. Report: "Changes tested: N pages/routes affected by this branch."

**Never skip browser testing** — backend/config changes affect app behavior. Always verify.

### Full (default when URL provided)
Systematic exploration. Every reachable page. 5-10 well-evidenced issues. Health score.

### Quick (`--quick`)
30-second smoke: homepage + top 5 nav targets. Loads? Console errors? Broken links?

### Regression (`--regression <baseline>`)
Full mode + diff against `baseline.json`. Score delta, fixed vs. new issues.

---

## Phase 1: Initialize

```bash
REPORT_DIR=".context/qa-reports"
START_TIME=$(date +%s)
```

Start timer. Create report file from template. Page name convention: use `"qa-main"` for the primary test page.

---

## Phase 2: Authenticate (if needed)

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.goto("https://yourapp.com/login");
const snap = await page.snapshotForAI();
console.log(snap.full);
EOF
```

Then fill form:
```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.fill('input[type="email"]', 'user@example.com');
await page.fill('input[type="password"]', '[REDACTED]');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 5000 });
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
EOF
```

**Never include real passwords in the report.** Write `[REDACTED]`.
If 2FA required: ask user for code and wait.
If CAPTCHA: tell user to complete it and tell you to continue.

---

## Phase 3: Orient

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.goto("TARGET_URL");

// Inject error capture (run once, early)
await page.evaluate(() => {
  if (window.__qaErrors) return;
  window.__qaErrors = [];
  window.onerror = (msg, src, line) => window.__qaErrors.push({ msg, src, line });
  window.addEventListener('unhandledrejection', e =>
    window.__qaErrors.push({ msg: String(e.reason) }));
});

const snap = await page.snapshotForAI();
const buf = await page.screenshot();
const screenshotPath = await saveScreenshot(buf, "initial.png");

// Map navigation
const links = await page.$$eval('a[href]', els =>
  els.map(e => ({ text: e.textContent.trim().slice(0, 60), href: e.href }))
     .filter(l => l.href && !l.href.startsWith('javascript:') && !l.href.startsWith('mailto:')));

const errors = await page.evaluate(() => window.__qaErrors || []);

console.log(JSON.stringify({ url: page.url(), title: await page.title(), screenshotPath, links, errors }));
console.log(snap.full);
EOF
```

Read the screenshot file so the user can see it.

**Detect framework:** Look for `__next` / `_next/data` (Next.js), `csrf-token` meta (Rails), `wp-content` (WordPress), SPA (client-side routing with no reloads).

---

## Phase 4: Explore

For each page, visit and check:

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.goto("PAGE_URL");
const snap = await page.snapshotForAI();
const buf = await page.screenshot();
const path = await saveScreenshot(buf, "page-NAME.png");
const errors = await page.evaluate(() => window.__qaErrors || []);
console.log(JSON.stringify({ url: page.url(), title: await page.title(), screenshotPath: path, errors }));
console.log(snap.full);
EOF
```

After each page, read the screenshot inline. Per-page checklist (see `references/issue-taxonomy.md`):

1. Visual scan — layout, broken images, alignment
2. Interactive elements — click every button/link/control
3. Forms — fill and submit; test empty, invalid, edge cases (long text, special chars)
4. Navigation — all paths in/out, back button, deep links
5. States — empty, loading, error, overflow
6. Console errors — check `window.__qaErrors` after interactions
7. Responsiveness — check mobile viewport if relevant:
   ```bash
   agent-browser --browser mobile <<'EOF'
   const page = await browser.getPage("qa-mobile");
   await page.goto("PAGE_URL");
   const buf = await page.screenshot();
   console.log(await saveScreenshot(buf, "page-NAME-mobile.png"));
   EOF
   ```

**Depth:** Spend more time on core features (dashboard, checkout, search), less on static pages (about, terms).

**Quick mode:** Homepage + top 5 nav targets only. Check: loads? Errors? Broken links?

---

## Phase 5: Document

Document each issue **immediately when found** — don't batch.

**Interactive bugs** (broken flows, dead buttons, form failures):
```bash
# Before
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
const buf = await page.screenshot();
console.log(await saveScreenshot(buf, "issue-001-before.png"));
EOF

# Perform the action
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.click('button#submit');
const buf = await page.screenshot();
const path = await saveScreenshot(buf, "issue-001-result.png");
const snap = await page.snapshotForAI({ track: "issue-001" });
console.log(JSON.stringify({ screenshotPath: path, errors: await page.evaluate(() => window.__qaErrors || []) }));
console.log(snap.incremental || snap.full);
EOF
```

**Static bugs** (typos, layout, missing images): single annotated snapshot, describe what's wrong.

Read every screenshot inline. Write each issue to the report using the template format.

---

## Phase 6: Wrap Up

1. Compute health score (see `references/health-score.md`)
2. Write "Top 3 Things to Fix" (highest severity)
3. Aggregate all console errors across pages
4. Update severity counts in report
5. Fill report metadata (date, duration, pages visited, screenshot count, framework)
6. Save `baseline.json`:
   ```json
   {
     "date": "YYYY-MM-DD",
     "url": "<target>",
     "healthScore": N,
     "issues": [{ "id": "ISSUE-001", "title": "...", "severity": "...", "category": "..." }],
     "categoryScores": { "console": N, "links": N, "visual": N, "functional": N, "ux": N, "performance": N, "content": N, "accessibility": N }
   }
   ```

Record baseline health score.

---

## Phase 7: Triage

Sort issues by severity. Decide which to fix by tier:
- **Quick:** critical + high only; mark medium/low as "deferred"
- **Standard:** critical + high + medium; mark low as "deferred"
- **Exhaustive:** all, including cosmetic

Mark issues that can't be fixed from source code (third-party, infrastructure) as "deferred" regardless.

---

## Phase 8: Fix Loop

For each fixable issue (severity order):

### 8a. Locate source
```bash
grep -r "error message or component name" --include="*.ts" --include="*.tsx" --include="*.js" .
```

### 8b. Fix
Read the source file, understand context, make the **minimal fix**. Do NOT refactor surrounding code.

### 8c. Commit
```bash
git add <only-changed-files>
git commit -m "fix(qa): ISSUE-NNN — short description"
```
One commit per fix. Never bundle multiple fixes.

### 8d. Re-test
```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.goto("AFFECTED_URL");
const buf = await page.screenshot();
const path = await saveScreenshot(buf, "issue-NNN-after.png");
const snap = await page.snapshotForAI({ track: "fix-NNN" });
const errors = await page.evaluate(() => window.__qaErrors || []);
console.log(JSON.stringify({ screenshotPath: path, errors }));
console.log(snap.incremental || snap.full);
EOF
```

Read before/after screenshots inline.

### 8e. Classify
- **verified** — re-test confirms fix, no new errors
- **best-effort** — fix applied but can't fully verify (needs external service, auth state)
- **reverted** — regression detected → `git revert HEAD` → mark issue as "deferred"

### 8f. Self-Regulation (every 5 fixes)

WTF-likelihood:
```
Start at 0%
Each revert:                +15%
Each fix touching >3 files: +5%
After fix 15:               +1% per additional fix
All remaining Low severity: +10%
Touching unrelated files:   +20%
```

**If WTF > 20%:** STOP. Show user what's been done. Ask whether to continue.
**Hard cap: 50 fixes.** Stop regardless.

---

## Phase 9: Final QA

Re-run QA on all affected pages. Compute final health score.
**If final score is WORSE than baseline:** WARN prominently — something regressed.

---

## Phase 10: Report

Write report to:
- **Local:** `.context/qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`

Per-issue additions beyond template:
- Fix Status: verified / best-effort / reverted / deferred
- Commit SHA (if fixed)
- Files Changed (if fixed)
- Before/After screenshots

Summary: total found, fixes applied (verified/best-effort/reverted), deferred, health score delta.

**PR Summary line:** "QA found N issues, fixed M, health score X → Y."

---

## Phase 11: TODOS.md Update

If repo has `TODOS.md`:
1. New deferred bugs → add as TODOs with severity, category, repro steps
2. Fixed bugs that were in TODOS.md → annotate "Fixed by /qa on {branch}, {date}"

---

## Rules

1. **Repro is everything.** Every issue needs at least one screenshot.
2. **Verify before documenting.** Retry once to confirm reproducibility.
3. **Never include credentials.** Write `[REDACTED]` for passwords.
4. **Write incrementally.** Append each issue immediately. Don't batch.
5. **Test as a user.** Don't read source code during QA phases.
6. **Check console after every interaction.**
7. **Depth over breadth.** 5-10 well-documented issues > 20 vague descriptions.
8. **Never delete output files.** Screenshots and reports accumulate.
9. **Show screenshots inline.** After every screenshot, Read the file to display it.
10. **Never refuse to use the browser.** Always open it and test, even for backend changes.
11. **Clean working tree required.** Commit or stash before starting fix loop.
12. **One commit per fix.** Never bundle.
13. **Revert on regression.** `git revert HEAD` if a fix makes things worse.

---

## Output Structure

```
.context/qa-reports/
├── qa-report-{domain}-{YYYY-MM-DD}.md
├── screenshots/
│   ├── initial.png
│   ├── issue-001-step-1.png
│   ├── issue-001-result.png
│   ├── issue-001-before.png    # after fix
│   ├── issue-001-after.png
│   └── ...
└── baseline.json
```
