# agent-browser API Reference for QA

All browser automation uses `agent-browser`. Scripts run in a sandboxed QuickJS runtime — no `require`, no `fetch`, no `process`. Use the `browser` global.

## Page Names

Use stable page names so scripts resume after failures:
- `"qa-main"` — primary test browser
- `"qa-mobile"` — mobile viewport (separate `--browser` instance)
- `"qa-probe"` — port detection, disposable

## Connect to user's real browser (preferred when logged in)

```bash
agent-browser --connect <<'EOF'
const page = await browser.getPage("qa-main");
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
EOF
```

Use `--connect` when the user is already authenticated in their browser. Skips login steps, uses real sessions.

## Navigate + Snapshot

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.goto("https://example.com");
const snap = await page.snapshotForAI();
const buf = await page.screenshot();
const path = await saveScreenshot(buf, "page-name.png");
console.log(JSON.stringify({ url: page.url(), title: await page.title(), screenshot: path }));
console.log(snap.full);
EOF
```

## Inject Error Capture (run once after first goto)

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.evaluate(() => {
  if (window.__qaErrors) return;
  window.__qaErrors = [];
  window.onerror = (msg, src, line) => window.__qaErrors.push({ msg, src, line });
  window.addEventListener('unhandledrejection', e =>
    window.__qaErrors.push({ msg: String(e.reason) }));
});
EOF
```

## Check Console Errors

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
const errors = await page.evaluate(() => window.__qaErrors || []);
console.log(JSON.stringify({ errors, count: errors.length }));
EOF
```

## Get All Links

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
const links = await page.$$eval('a[href]', els =>
  els.map(e => ({ text: e.textContent.trim().slice(0, 60), href: e.href }))
     .filter(l => l.href && !l.href.startsWith('javascript:') && !l.href.startsWith('mailto:')));
console.log(JSON.stringify(links));
EOF
```

## Fill and Submit Form

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
await page.fill('input[type="email"]', 'test@example.com');
await page.fill('input[type="password"]', '[REDACTED]');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 5000 });
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
EOF
```

## Find Elements by Role (from snapshot)

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
const snap = await page.snapshotForAI();
// Read snap.full to find roles and accessible names, then:
await page.getByRole('button', { name: 'Sign in' }).click();
console.log(JSON.stringify({ url: page.url() }));
EOF
```

## Track DOM Changes (diff mode)

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
// First call with track ID establishes baseline
const before = await page.snapshotForAI({ track: "step-1" });
await page.click('button#submit');
// Second call returns incremental diff
const after = await page.snapshotForAI({ track: "step-1" });
console.log("BEFORE:", before.full);
console.log("AFTER:", after.incremental || after.full);
EOF
```

## Mobile Viewport

Use a separate browser instance with `--browser mobile`:

```bash
agent-browser --browser mobile <<'EOF'
const page = await browser.getPage("qa-mobile");
await page.goto("https://example.com");
// Browser starts headless at mobile dimensions
const buf = await page.screenshot();
console.log(await saveScreenshot(buf, "page-mobile.png"));
EOF
```

## Detect Port

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-probe");
for (const port of [3000, 4000, 5173, 8080, 5000]) {
  try {
    await page.goto(`http://localhost:${port}`, { timeout: 2000 });
    console.log(JSON.stringify({ found: true, url: page.url(), port }));
    break;
  } catch {}
}
EOF
```

## Run JavaScript in Page Context

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
const result = await page.evaluate(() => {
  return {
    localStorage: Object.keys(localStorage),
    cookies: document.cookie,
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
});
console.log(JSON.stringify(result));
EOF
```

## API / Fetch Testing

```bash
agent-browser <<'EOF'
const page = await browser.getPage("qa-main");
const result = await page.evaluate(async () => {
  const r = await fetch('/api/health');
  return { status: r.status, body: await r.json() };
});
console.log(JSON.stringify(result));
EOF
```

## Tips

- `snapshotForAI()` is better than screenshots for understanding UI structure. Use screenshots when layout/styling matters.
- Keep page names stable across scripts — you can resume after failures.
- `--connect` attaches to the user's running Chrome with all their sessions intact.
- Use short timeouts (`{ timeout: 3000 }`) so scripts fail fast instead of hanging.
