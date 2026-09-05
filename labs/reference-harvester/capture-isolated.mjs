import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const [referenceId, localUrl] = process.argv.slice(2);
if (!referenceId || !localUrl) {
  throw new Error('usage: node capture-isolated.mjs <reference-id> <local-url>');
}

function which(names) {
  for (const name of names) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return '';
}

const root = process.cwd();
const refDir = path.join(root, 'labs', 'references', referenceId);
const originalCapturePath = path.join(refDir, 'evidence', 'capture.json');
if (!fs.existsSync(originalCapturePath)) throw new Error(`${referenceId}: evidence/capture.json missing`);
if (!fs.existsSync(path.join(refDir, 'index.html'))) throw new Error(`${referenceId}: local index.html missing`);
const original = JSON.parse(fs.readFileSync(originalCapturePath, 'utf8'));
const deterministicVisual = original.visual_state_policy === 'deterministic-static';
const outDir = path.join(refDir, 'evidence', 'isolation');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const chrome = process.env.CHROME_BIN || which(['google-chrome', 'chromium', 'chromium-browser']);
if (!chrome) throw new Error('Chrome/Chromium not found');
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars']
});
const settle = ms => new Promise(resolve => setTimeout(resolve, ms));
const blocked = [];
const blockedKeys = new Set();

function recordBlocked(request) {
  const key = `${request.resourceType()} ${request.url()}`;
  if (blockedKeys.has(key)) return;
  blockedKeys.add(key);
  let origin = null;
  try { origin = new URL(request.url()).origin; } catch {}
  blocked.push({ url: request.url(), origin, resource_type: request.resourceType() });
}

async function newIsolatedPage(width, height, { deterministic = false } = {}) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (deterministic) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  } else {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  }
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('theme', 'light'); } catch {}
  });
  await page.setRequestInterception(true);
  page.on('request', request => {
    let parsed;
    try { parsed = new URL(request.url()); } catch { request.continue(); return; }
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const local = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
      if (!local) {
        recordBlocked(request);
        request.abort('blockedbyclient');
        return;
      }
    }
    request.continue();
  });
  return page;
}

async function stabilizeVisualState(page) {
  if (!deterministicVisual) return;
  await page.evaluate(() => {
    if (!document.getElementById('valentine-deterministic-visual')) {
      const style = document.createElement('style');
      style.id = 'valentine-deterministic-visual';
      style.textContent = `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0.001s !important;
          animation-iteration-count: 1 !important;
          transition-delay: 0s !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
          caret-color: transparent !important;
        }
      `;
      document.head.appendChild(style);
    }
    for (const animation of document.getAnimations({ subtree: true })) {
      try {
        const timing = animation.effect?.getComputedTiming?.();
        const endTime = Number(timing?.endTime);
        animation.currentTime = Number.isFinite(endTime) ? Math.max(0, endTime) : 0;
        animation.pause();
      } catch {}
    }
  });
  await settle(80);
}

async function navigate(page) {
  await page.goto(localUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 800, timeout: 7000 }); } catch {}
  await settle(1200);
  await stabilizeVisualState(page);
}

const captures = [];
for (const viewport of original.viewports || []) {
  for (const state of viewport.states || []) {
    const page = await newIsolatedPage(viewport.width, viewport.height, { deterministic: deterministicVisual });
    await navigate(page);
    const ratio = Number(state.ratio || 0);
    await page.evaluate(r => {
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      scrollTo(0, Math.round(max * r));
    }, ratio);
    await settle(450);
    await stabilizeVisualState(page);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewport_width: innerWidth,
      viewport_height: innerHeight,
      scroll_x: scrollX,
      scroll_y: scrollY
    }));
    const file = `${state.id}.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: false });
    captures.push({
      id: state.id,
      ratio,
      width: viewport.width,
      height: viewport.height,
      dimensions,
      screenshot: `evidence/isolation/${file}`
    });
    await page.close();
  }
}

const triggerAltPrefix = 'A desk lamp designed by Edouard Wilfrid Buquet';
async function interactionScenario(viewport) {
  const page = await newIsolatedPage(viewport.width, viewport.height, { deterministic: false });
  await page.goto(localUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 800, timeout: 7000 }); } catch {}
  await settle(1200);
  await page.evaluate(() => scrollTo(0, 0));
  await settle(100);

  const result = await page.evaluate(async prefix => {
    const findTrigger = () => {
      const img = [...document.images].find(x => (x.alt || '').startsWith(prefix));
      return img?.closest('button[aria-haspopup="dialog"]') || null;
    };
    const trigger = findTrigger();
    if (!trigger) return { ok: false, reason: 'trigger-not-found', animation_signature_count: 0 };
    const before = { dialog: Boolean(document.querySelector('[role="dialog"]')), expanded: trigger.getAttribute('aria-expanded') };
    let maxSignature = [];
    const clickAt = performance.now();
    trigger.click();
    const trajectory = await new Promise((resolve, reject) => {
      let start = null;
      const samples = [];
      const frame = now => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog && start === null) start = now;
        if (start !== null) {
          const animations = document.getAnimations({ subtree: true }).filter(animation => {
            const target = animation.effect?.target;
            return Boolean(target && (target === dialog || dialog?.contains(target) || target === trigger || trigger.contains(target)));
          });
          if (animations.length > maxSignature.length) {
            maxSignature = animations.map(animation => {
              let timing = {};
              try { timing = animation.effect?.getTiming?.() || {}; } catch {}
              return {
                duration: typeof timing.duration === 'number' ? timing.duration : String(timing.duration || ''),
                delay: Number(timing.delay || 0),
                easing: String(timing.easing || '')
              };
            });
          }
          samples.push(now - start);
          if (now - start >= 340) return resolve({ click_to_dialog_ms: start - clickAt, sample_count: samples.length });
        }
        if (now - clickAt > 1200) return reject(new Error('dialog-open-timeout'));
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await new Promise(resolve => setTimeout(resolve, 120));
    const opened = {
      dialog: Boolean(document.querySelector('[role="dialog"]')),
      close: Boolean(document.querySelector('button[aria-label="Close dialog"]'))
    };
    return { before, opened, trajectory, animation_signature: maxSignature };
  }, triggerAltPrefix).catch(error => ({ ok: false, reason: String(error?.message || error), animation_signature_count: 0 }));

  if (result.ok === false) {
    await page.close();
    return result;
  }
  await page.keyboard.press('Escape');
  await settle(550);
  const afterEscape = await page.evaluate(() => ({ dialog: Boolean(document.querySelector('[role="dialog"]')) }));
  await page.close();
  const signatureCount = Array.isArray(result.animation_signature) ? result.animation_signature.length : 0;
  return {
    ok: result.before?.dialog === false && result.opened?.dialog === true && result.opened?.close === true && afterEscape.dialog === false && signatureCount > 0,
    before: result.before,
    opened: result.opened,
    after_escape: afterEscape,
    trajectory: result.trajectory,
    animation_signature: result.animation_signature,
    animation_signature_count: signatureCount
  };
}

const interaction = [];
for (const viewport of [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 }
]) {
  interaction.push({ viewport: viewport.label, ...(await interactionScenario(viewport)) });
}

await browser.close();
const blockedOrigins = [...new Set(blocked.map(x => x.origin).filter(Boolean))].sort();
const report = {
  version: '1.0',
  reference_id: referenceId,
  local_url: localUrl,
  isolation_policy: 'abort all http(s) requests whose hostname is not localhost or 127.0.0.1',
  captured_at: new Date().toISOString(),
  visual_state_policy: original.visual_state_policy || 'runtime',
  states: captures,
  interaction,
  blocked_request_count: blocked.length,
  blocked_origins: blockedOrigins,
  blocked_requests: blocked
};
fs.writeFileSync(path.join(outDir, 'capture.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`REFERENCE_ISOLATION_CAPTURE_OK id=${referenceId} states=${captures.length} interactions=${interaction.filter(x => x.ok).length}/${interaction.length} blocked=${blocked.length}`);
