import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const [referenceId, baselineUrl, localUrl] = process.argv.slice(2);
if (!referenceId || !baselineUrl || !localUrl) {
  throw new Error('usage: node compare-interaction.mjs <reference-id> <baseline-url> <local-url>');
}

function which(names) {
  for (const name of names) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return '';
}

const chrome = process.env.CHROME_BIN || which(['google-chrome', 'chromium', 'chromium-browser']);
if (!chrome) throw new Error('Chrome/Chromium not found');

const root = process.cwd();
const evidenceDir = path.join(root, 'labs', 'references', referenceId, 'evidence', 'interaction');
fs.mkdirSync(evidenceDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars']
});

const triggerAltPrefix = 'A desk lamp designed by Edouard Wilfrid Buquet';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function newPage(url, width, height) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 800, timeout: 7000 }); } catch {}
  await sleep(1200);
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(120);
  const found = await page.evaluate(prefix => {
    const img = [...document.images].find(x => (x.alt || '').startsWith(prefix));
    const trigger = img?.closest('button[aria-haspopup="dialog"]');
    return Boolean(img && trigger);
  }, triggerAltPrefix);
  if (!found) throw new Error(`${url}: EB27 morphing-dialog trigger not found`);
  return page;
}

async function snapshot(page) {
  return page.evaluate(prefix => {
    const rect = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x:r.x, y:r.y, width:r.width, height:r.height, top:r.top, right:r.right, bottom:r.bottom, left:r.left };
    };
    const img = [...document.images].find(x => (x.alt || '').startsWith(prefix));
    const trigger = img?.closest('button[aria-haspopup="dialog"]') || null;
    const dialog = document.querySelector('[role="dialog"]');
    const dialogImg = dialog ? [...dialog.querySelectorAll('img')].find(x => (x.alt || '').startsWith(prefix)) : null;
    const close = document.querySelector('button[aria-label="Close dialog"]');
    const backdrop = [...document.body.children].find(el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.position === 'fixed' && r.width >= innerWidth * .95 && r.height >= innerHeight * .95 && !el.querySelector('[role="dialog"]');
    }) || null;
    const animations = document.getAnimations({ subtree:true }).map((a, index) => {
      let timing = {};
      let computed = {};
      try { timing = a.effect?.getTiming?.() || {}; } catch {}
      try { computed = a.effect?.getComputedTiming?.() || {}; } catch {}
      const target = a.effect?.target;
      return {
        index,
        playState:a.playState,
        currentTime:Number.isFinite(Number(a.currentTime)) ? Number(a.currentTime) : null,
        playbackRate:a.playbackRate,
        timing:{
          delay:Number(timing.delay || 0),
          duration:typeof timing.duration === 'number' ? timing.duration : String(timing.duration || ''),
          endDelay:Number(timing.endDelay || 0),
          iterations:Number(timing.iterations || 1),
          easing:String(timing.easing || '')
        },
        progress:Number.isFinite(Number(computed.progress)) ? Number(computed.progress) : null,
        target:target ? { tag:target.tagName?.toLowerCase() || null, role:target.getAttribute?.('role') || null, ariaLabel:target.getAttribute?.('aria-label') || null } : null
      };
    });
    return {
      trigger:{ exists:Boolean(trigger), expanded:trigger?.getAttribute('aria-expanded') || null, rect:rect(trigger) },
      dialog:{ exists:Boolean(dialog), rect:rect(dialog) },
      dialogImage:{ exists:Boolean(dialogImg), rect:rect(dialogImg) },
      close:{ exists:Boolean(close), rect:rect(close) },
      backdrop:{ exists:Boolean(backdrop), rect:rect(backdrop), opacity:backdrop ? getComputedStyle(backdrop).opacity : null },
      bodyOverflow:getComputedStyle(document.body).overflow,
      activeElement:{ tag:document.activeElement?.tagName?.toLowerCase() || null, ariaLabel:document.activeElement?.getAttribute?.('aria-label') || null },
      animations
    };
  }, triggerAltPrefix);
}

async function clickTrigger(page) {
  await page.evaluate(prefix => {
    const img = [...document.images].find(x => (x.alt || '').startsWith(prefix));
    const trigger = img?.closest('button[aria-haspopup="dialog"]');
    if (!trigger) throw new Error('trigger not found');
    trigger.click();
  }, triggerAltPrefix);
}

async function pressEscape(page) {
  await page.keyboard.press('Escape');
}

const viewports = [
  { label:'desktop', width:1440, height:900 },
  { label:'mobile', width:390, height:844 }
];
const sampleTimes = [0, 50, 100, 150, 250, 400];
const report = {
  version:'1.0',
  reference_id:referenceId,
  baseline_url:baselineUrl,
  local_url:localUrl,
  captured_at:new Date().toISOString(),
  scenario:'EB27 MorphingDialog closed -> open trajectory -> settled open -> Escape -> closed',
  viewports:[]
};

for (const viewport of viewports) {
  const baseline = await newPage(baselineUrl, viewport.width, viewport.height);
  const local = await newPage(localUrl, viewport.width, viewport.height);

  const closed = { baseline:await snapshot(baseline), local:await snapshot(local) };
  await Promise.all([clickTrigger(baseline), clickTrigger(local)]);

  const trajectory=[];
  let elapsed = 0;
  for (const t of sampleTimes) {
    const wait = Math.max(0, t - elapsed);
    if (wait) await sleep(wait);
    trajectory.push({ t, baseline:await snapshot(baseline), local:await snapshot(local) });
    elapsed = t;
  }

  await sleep(160);
  const open = { baseline:await snapshot(baseline), local:await snapshot(local) };
  const baselineOpenFile = `${viewport.label}-baseline-open.png`;
  const localOpenFile = `${viewport.label}-local-open.png`;
  await baseline.screenshot({ path:path.join(evidenceDir, baselineOpenFile), fullPage:false });
  await local.screenshot({ path:path.join(evidenceDir, localOpenFile), fullPage:false });

  await Promise.all([pressEscape(baseline), pressEscape(local)]);
  await sleep(450);
  const afterClose = { baseline:await snapshot(baseline), local:await snapshot(local) };
  const baselineClosedFile = `${viewport.label}-baseline-after-close.png`;
  const localClosedFile = `${viewport.label}-local-after-close.png`;
  await baseline.screenshot({ path:path.join(evidenceDir, baselineClosedFile), fullPage:false });
  await local.screenshot({ path:path.join(evidenceDir, localClosedFile), fullPage:false });

  report.viewports.push({
    ...viewport,
    closed,
    trajectory,
    open,
    after_close:afterClose,
    screenshots:{
      baseline_open:`evidence/interaction/${baselineOpenFile}`,
      local_open:`evidence/interaction/${localOpenFile}`,
      baseline_after_close:`evidence/interaction/${baselineClosedFile}`,
      local_after_close:`evidence/interaction/${localClosedFile}`
    }
  });

  await baseline.close();
  await local.close();
}

await browser.close();
fs.writeFileSync(path.join(evidenceDir, 'interaction-capture.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`REFERENCE_INTERACTION_CAPTURE_OK id=${referenceId} viewports=${viewports.length} samples=${sampleTimes.length}`);
