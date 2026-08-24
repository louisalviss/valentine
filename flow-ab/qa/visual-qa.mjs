import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.QA_BASE || 'http://127.0.0.1:4173/flow-ab';
const variants = {
  A: 'no-flow/',
  B: 'with-flow/',
  C: 'flow-c/',
  D: 'flow-d/',
  E: 'flow-e/',
  F: 'flow-f/',
  G: 'full-flow-g/',
  H: 'full-flow-h/'
};
const viewports = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 }
};

fs.mkdirSync('flow-ab/qa/output/screens', { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = { generated_at: new Date().toISOString(), base, variants: {}, interaction_checks: {} };

for (const [viewName, viewport] of Object.entries(viewports)) {
  for (const [key, path] of Object.entries(variants)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => pageErrors.push(String(err)));
    const url = `${base}/${path}?qa=1`;
    let navigationError = null;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.addStyleTag({ content: '.experiment{display:none!important}' }).catch(() => {});
      await page.waitForTimeout(900);
    } catch (err) {
      navigationError = String(err);
    }

    const metrics = navigationError ? null : await page.evaluate(() => {
      const de = document.documentElement;
      const body = document.body;
      const h1 = document.querySelector('h1');
      const r = h1?.getBoundingClientRect();
      const interactive = [...document.querySelectorAll('button,a,input,[role="button"]')].filter(el => {
        const cs = getComputedStyle(el);
        const rr = el.getBoundingClientRect();
        return cs.visibility !== 'hidden' && cs.display !== 'none' && rr.width > 0 && rr.height > 0;
      });
      return {
        title: document.title,
        scrollWidth: Math.max(de.scrollWidth, body?.scrollWidth || 0),
        clientWidth: innerWidth,
        horizontalOverflow: Math.max(de.scrollWidth, body?.scrollWidth || 0) > innerWidth + 3,
        h1: r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } : null,
        h1HorizontalClip: r ? (r.left < -3 || r.right > innerWidth + 3) : false,
        visibleInteractiveCount: interactive.length,
        bodyTextLength: (body?.innerText || '').trim().length
      };
    });

    const screenshot = `flow-ab/qa/output/screens/${key}-${viewName}.png`;
    if (!navigationError) await page.screenshot({ path: screenshot, fullPage: false });
    results.variants[`${key}-${viewName}`] = {
      key, view: viewName, viewport, url, screenshot,
      navigationError, consoleErrors, pageErrors, metrics
    };
    await context.close();
  }
}

// Interaction checks on desktop. These are functional smoke tests, not design scoring.
{
  const context = await browser.newContext({ viewport: viewports.desktop, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/${variants.E}?qa=interaction`, { waitUntil: 'domcontentloaded' });
  const before = await page.locator('#laneTag').textContent();
  await page.locator('[data-lane="seo"]').click();
  const after = await page.locator('#laneTag').textContent();
  results.interaction_checks.E_inspector = { pass: before !== after && after?.includes('Technical SEO'), before, after };
  await context.close();
}
{
  const context = await browser.newContext({ viewport: viewports.desktop, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/${variants.H}?qa=interaction`, { waitUntil: 'domcontentloaded' });
  const before = await page.locator('#detail h2').textContent();
  await page.locator('.node[data-key="seo"]').click();
  const after = await page.locator('#detail h2').textContent();
  const t0 = await page.locator('#world').evaluate(el => getComputedStyle(el).transform);
  await page.locator('#plus').click();
  const t1 = await page.locator('#world').evaluate(el => getComputedStyle(el).transform);
  await page.locator('#reset').click();
  results.interaction_checks.H_canvas = { pass: before !== after && t0 !== t1, before, after, zoomChanged: t0 !== t1 };
  await context.close();
}

await browser.close();
fs.writeFileSync('flow-ab/qa/output/qa-metrics.json', JSON.stringify(results, null, 2));

const failures = [];
for (const [id, row] of Object.entries(results.variants)) {
  if (row.navigationError) failures.push(`${id}: navigation error`);
  if (row.metrics?.horizontalOverflow) failures.push(`${id}: horizontal overflow ${row.metrics.scrollWidth}px > ${row.metrics.clientWidth}px`);
  if (row.metrics?.h1HorizontalClip) failures.push(`${id}: h1 horizontally clipped`);
  if (row.pageErrors.length) failures.push(`${id}: page error: ${row.pageErrors.join(' | ')}`);
}
for (const [name, check] of Object.entries(results.interaction_checks)) {
  if (!check.pass) failures.push(`${name}: interaction smoke failed`);
}

fs.writeFileSync('flow-ab/qa/output/runtime-failures.txt', failures.join('\n') + (failures.length ? '\n' : 'PASS\n'));
console.log(JSON.stringify({ failures, interaction_checks: results.interaction_checks }, null, 2));
if (failures.length) process.exitCode = 2;
