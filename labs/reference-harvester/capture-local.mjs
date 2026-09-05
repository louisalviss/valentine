import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const referenceId = process.argv[2];
const localUrl = process.argv[3];
if (!referenceId || !localUrl) throw new Error('usage: node capture-local.mjs <reference-id> <local-url>');

function which(names) {
  for (const name of names) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return '';
}

const root = process.cwd();
const refDir = path.join(root, 'labs', 'references', referenceId);
const originalCapturePath = path.join(refDir, 'evidence', 'capture.json');
if (!fs.existsSync(originalCapturePath)) throw new Error(`${referenceId}: original evidence/capture.json missing`);
if (!fs.existsSync(path.join(refDir, 'index.html'))) throw new Error(`${referenceId}: local index.html missing`);
const original = JSON.parse(fs.readFileSync(originalCapturePath, 'utf8'));
const deterministicVisual = original.visual_state_policy === 'deterministic-static';
const outDir = path.join(refDir, 'evidence', 'local');
fs.mkdirSync(outDir, { recursive: true });

const chrome = process.env.CHROME_BIN || which(['google-chrome', 'chromium', 'chromium-browser']);
if (!chrome) throw new Error('Chrome/Chromium not found');
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(30000);
if (deterministicVisual) {
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
}

const settle = ms => new Promise(resolve => setTimeout(resolve, ms));
async function stabilizeVisualState(){
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
        if (Number.isFinite(endTime)) {
          animation.currentTime = Math.max(0, endTime);
        } else {
          animation.currentTime = 0;
        }
        animation.pause();
      } catch {}
    }
  });
  await settle(80);
}

async function navigate() {
  await page.goto(localUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 500, timeout: 4000 }); } catch {}
  await settle(700);
  await stabilizeVisualState();
}

const captures=[];
for (const viewport of original.viewports || []) {
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  for (const state of viewport.states || []) {
    await navigate();
    const ratio = Number(state.ratio || 0);
    await page.evaluate(r => {
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      scrollTo(0, Math.round(max * r));
    }, ratio);
    await settle(450);
    await stabilizeVisualState();
    const file = `${state.id}.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: false });
    captures.push({ id: state.id, ratio, width: viewport.width, height: viewport.height, screenshot: `evidence/local/${file}` });
  }
}

await browser.close();
fs.writeFileSync(path.join(outDir, 'capture.json'), JSON.stringify({
  version:'1.0', reference_id:referenceId, local_url:localUrl,
  visual_state_policy:original.visual_state_policy||'runtime',
  captured_at:new Date().toISOString(), states:captures
}, null, 2));
console.log(`REFERENCE_LOCAL_CAPTURE_OK id=${referenceId} visual=${original.visual_state_policy||'runtime'} states=${captures.length}`);
