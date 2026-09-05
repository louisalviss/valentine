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
const browser = await puppeteer.launch({ executablePath:chrome, headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--hide-scrollbars'] });
const triggerAltPrefix = 'A desk lamp designed by Edouard Wilfrid Buquet';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const sampleTimes = [0, 50, 100, 150, 200, 250];

async function setupPage(url, width, height) {
  const page = await browser.newPage();
  await page.bringToFront();
  page.setDefaultNavigationTimeout(30000);
  await page.setViewport({ width, height, deviceScaleFactor:1 });
  await page.emulateMediaFeatures([{ name:'prefers-color-scheme', value:'light' }]);
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('theme', 'light'); } catch {}
  });
  await page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 });
  try { await page.waitForNetworkIdle({ idleTime:800, timeout:7000 }); } catch {}
  await sleep(1200);
  await page.evaluate(() => scrollTo(0,0));
  await sleep(100);
  const found = await page.evaluate(prefix => {
    const img=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
    return Boolean(img?.closest('button[aria-haspopup="dialog"]'));
  }, triggerAltPrefix);
  if (!found) throw new Error(`${url}: EB27 morphing-dialog trigger not found`);
  return page;
}

async function snapshot(page) {
  return page.evaluate(prefix => {
    const rect = el => {
      if (!el) return null;
      const r=el.getBoundingClientRect();
      return {x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left};
    };
    const sourceImg=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
    const trigger=sourceImg?.closest('button[aria-haspopup="dialog"]')||null;
    const dialog=document.querySelector('[role="dialog"]');
    const dialogImg=dialog?[...dialog.querySelectorAll('img')].find(x=>(x.alt||'').startsWith(prefix)):null;
    const close=document.querySelector('button[aria-label="Close dialog"]');
    const backdrop=[...document.body.children].find(el=>{
      const s=getComputedStyle(el), r=el.getBoundingClientRect();
      return s.position==='fixed' && r.width>=innerWidth*.95 && r.height>=innerHeight*.95 && !el.querySelector('[role="dialog"]');
    })||null;
    return {
      trigger:{exists:Boolean(trigger),expanded:trigger?.getAttribute('aria-expanded')||null,rect:rect(trigger)},
      dialog:{exists:Boolean(dialog),rect:rect(dialog)},
      dialogImage:{exists:Boolean(dialogImg),rect:rect(dialogImg)},
      close:{exists:Boolean(close),rect:rect(close)},
      backdrop:{exists:Boolean(backdrop),rect:rect(backdrop),opacity:backdrop?getComputedStyle(backdrop).opacity:null},
      bodyOverflow:getComputedStyle(document.body).overflow
    };
  }, triggerAltPrefix);
}

async function clickTrigger(page) {
  await page.evaluate(prefix => {
    const img=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
    const trigger=img?.closest('button[aria-haspopup="dialog"]');
    if (!trigger) throw new Error('trigger not found');
    trigger.click();
  }, triggerAltPrefix);
}

async function interactionAnimations(page) {
  return page.evaluate(prefix => {
    const sourceImg=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
    const trigger=sourceImg?.closest('button[aria-haspopup="dialog"]')||null;
    const dialog=document.querySelector('[role="dialog"]');
    const backdrop=[...document.body.children].find(el=>{
      const s=getComputedStyle(el), r=el.getBoundingClientRect();
      return s.position==='fixed' && r.width>=innerWidth*.95 && r.height>=innerHeight*.95 && !el.querySelector('[role="dialog"]');
    })||null;
    const belongs = target => Boolean(target && (
      target===trigger || trigger?.contains(target) || target===dialog || dialog?.contains(target) || target===backdrop || backdrop?.contains(target)
    ));
    return document.getAnimations({subtree:true}).filter(a=>belongs(a.effect?.target)).map(a=>{
      const target=a.effect?.target;
      let timing={}; try { timing=a.effect?.getTiming?.()||{}; } catch {}
      return {
        target:{tag:target?.tagName?.toLowerCase()||null,role:target?.getAttribute?.('role')||null,ariaLabel:target?.getAttribute?.('aria-label')||null},
        timing:{delay:Number(timing.delay||0),duration:typeof timing.duration==='number'?timing.duration:String(timing.duration||''),endDelay:Number(timing.endDelay||0),iterations:Number(timing.iterations||1),easing:String(timing.easing||'')}
      };
    });
  }, triggerAltPrefix);
}

async function setInteractionTime(page, time) {
  await page.evaluate((prefix,time) => {
    const sourceImg=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
    const trigger=sourceImg?.closest('button[aria-haspopup="dialog"]')||null;
    const dialog=document.querySelector('[role="dialog"]');
    const backdrop=[...document.body.children].find(el=>{
      const s=getComputedStyle(el), r=el.getBoundingClientRect();
      return s.position==='fixed' && r.width>=innerWidth*.95 && r.height>=innerHeight*.95 && !el.querySelector('[role="dialog"]');
    })||null;
    const belongs = target => Boolean(target && (
      target===trigger || trigger?.contains(target) || target===dialog || dialog?.contains(target) || target===backdrop || backdrop?.contains(target)
    ));
    for (const a of document.getAnimations({subtree:true}).filter(a=>belongs(a.effect?.target))) {
      try {
        a.pause();
        const timing=a.effect?.getTiming?.()||{};
        const duration=typeof timing.duration==='number'?timing.duration:time;
        a.currentTime=Math.max(0,Math.min(time,duration));
      } catch {}
    }
  }, triggerAltPrefix, time);
  await sleep(30);
}

async function captureDialog(page, file) {
  const dialog=await page.$('[role="dialog"]');
  if (!dialog) throw new Error('open dialog element missing');
  await dialog.screenshot({path:path.join(evidenceDir,file)});
}

async function deterministicScenario(url, side, viewport) {
  const page=await setupPage(url,viewport.width,viewport.height);
  const closed=await snapshot(page);
  await clickTrigger(page);
  await sleep(50);
  const signature=await interactionAnimations(page);
  const trajectory=[];
  for (const t of sampleTimes) {
    await setInteractionTime(page,t);
    trajectory.push({t,state:await snapshot(page)});
  }
  await setInteractionTime(page,250);
  const open=await snapshot(page);
  const dialogFile=`${viewport.label}-${side}-open-dialog.png`;
  const fullFile=`${viewport.label}-${side}-open-full.png`;
  await captureDialog(page,dialogFile);
  await page.screenshot({path:path.join(evidenceDir,fullFile),fullPage:false});
  await page.close();
  return {closed,trajectory,open,animation_signature:signature,screenshots:{open_dialog:`evidence/interaction/${dialogFile}`,open_full:`evidence/interaction/${fullFile}`}};
}

async function functionalScenario(url, viewport) {
  const page=await setupPage(url,viewport.width,viewport.height);
  const before=await snapshot(page);
  await clickTrigger(page);
  await sleep(450);
  const opened=await snapshot(page);
  await page.keyboard.press('Escape');
  await sleep(550);
  const closed=await snapshot(page);
  await page.close();
  return {before,opened,after_escape:closed};
}

const viewports=[{label:'desktop',width:1440,height:900},{label:'mobile',width:390,height:844}];
const report={version:'2.0',reference_id:referenceId,baseline_url:baselineUrl,local_url:localUrl,captured_at:new Date().toISOString(),scenario:'EB27 MorphingDialog deterministic WAAPI trajectory + active-page open/Escape functional test',viewports:[]};
for (const viewport of viewports) {
  const baseline=await deterministicScenario(baselineUrl,'baseline',viewport);
  const local=await deterministicScenario(localUrl,'local',viewport);
  const baselineFunctional=await functionalScenario(baselineUrl,viewport);
  const localFunctional=await functionalScenario(localUrl,viewport);
  report.viewports.push({...viewport,baseline,local,functional:{baseline:baselineFunctional,local:localFunctional}});
}
await browser.close();
fs.writeFileSync(path.join(evidenceDir,'interaction-capture.json'),JSON.stringify(report,null,2)+'\n');
console.log(`REFERENCE_INTERACTION_CAPTURE_OK id=${referenceId} protocol=v2 viewports=${viewports.length} deterministic_samples=${sampleTimes.length}`);
