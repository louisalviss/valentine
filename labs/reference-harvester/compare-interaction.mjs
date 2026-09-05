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
const runtimeTrialCount = 3;

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
      sourceImage:{exists:Boolean(sourceImg),rect:rect(sourceImg)},
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

async function captureRuntimeTrajectory(page) {
  return page.evaluate(async prefix => {
    const rect = el => {
      if (!el) return null;
      const r=el.getBoundingClientRect();
      return {x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left};
    };
    const readNodes = () => {
      const sourceImg=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
      const trigger=sourceImg?.closest('button[aria-haspopup="dialog"]')||null;
      const dialog=document.querySelector('[role="dialog"]');
      const dialogImg=dialog?[...dialog.querySelectorAll('img')].find(x=>(x.alt||'').startsWith(prefix)):null;
      const close=document.querySelector('button[aria-label="Close dialog"]');
      const backdrop=[...document.body.children].find(el=>{
        const s=getComputedStyle(el), r=el.getBoundingClientRect();
        return s.position==='fixed' && r.width>=innerWidth*.95 && r.height>=innerHeight*.95 && !el.querySelector('[role="dialog"]');
      })||null;
      return {sourceImg,trigger,dialog,dialogImg,close,backdrop};
    };
    const readState = () => {
      const {sourceImg,trigger,dialog,dialogImg,close,backdrop}=readNodes();
      return {
        sourceImage:{exists:Boolean(sourceImg),rect:rect(sourceImg)},
        trigger:{exists:Boolean(trigger),expanded:trigger?.getAttribute('aria-expanded')||null,rect:rect(trigger)},
        dialog:{exists:Boolean(dialog),rect:rect(dialog)},
        dialogImage:{exists:Boolean(dialogImg),rect:rect(dialogImg)},
        close:{exists:Boolean(close),rect:rect(close)},
        backdrop:{exists:Boolean(backdrop),rect:rect(backdrop),opacity:backdrop?getComputedStyle(backdrop).opacity:null},
        bodyOverflow:getComputedStyle(document.body).overflow
      };
    };
    const readAnimations = () => {
      const {trigger,dialog,backdrop}=readNodes();
      const belongs = target => Boolean(target && (
        target===trigger || trigger?.contains(target) || target===dialog || dialog?.contains(target) || target===backdrop || backdrop?.contains(target)
      ));
      return document.getAnimations({subtree:true}).filter(a=>belongs(a.effect?.target)).map(a=>{
        const target=a.effect?.target;
        let timing={}; try { timing=a.effect?.getTiming?.()||{}; } catch {}
        return {
          target:{tag:target?.tagName?.toLowerCase()||null,role:target?.getAttribute?.('role')||null,ariaLabel:target?.getAttribute?.('aria-label')||null},
          timing:{
            delay:Number(timing.delay||0),
            duration:typeof timing.duration==='number'?timing.duration:String(timing.duration||''),
            endDelay:Number(timing.endDelay||0),
            iterations:Number(timing.iterations||1),
            easing:String(timing.easing||'')
          }
        };
      });
    };

    const sourceImg=[...document.images].find(x=>(x.alt||'').startsWith(prefix));
    const trigger=sourceImg?.closest('button[aria-haspopup="dialog"]');
    if (!trigger) throw new Error('trajectory trigger not found');

    const samples=[];
    let animationSignature=[];
    let animationSignatureCaptureT=null;
    const clickAt=performance.now();
    trigger.click();
    return await new Promise((resolve,reject) => {
      let dialogStart=null;
      const frame = now => {
        const state=readState();
        if (state.dialog.exists && dialogStart===null) dialogStart=now;
        if (dialogStart!==null) {
          samples.push({t:now-dialogStart,state});
          const currentSignature=readAnimations();
          if (currentSignature.length>animationSignature.length) {
            animationSignature=currentSignature;
            animationSignatureCaptureT=now-dialogStart;
          }
        }
        if (dialogStart!==null && now-dialogStart>=340) {
          resolve({
            click_to_dialog_ms:dialogStart-clickAt,
            samples,
            animation_signature:animationSignature,
            animation_signature_capture_t_ms:animationSignatureCaptureT,
          });
          return;
        }
        if (now-clickAt>1200) {
          reject(new Error('dialog trajectory did not settle within capture window'));
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }, triggerAltPrefix);
}

async function captureDialog(page, file) {
  const dialog=await page.$('[role="dialog"]');
  if (!dialog) throw new Error('open dialog element missing');
  await dialog.screenshot({path:path.join(evidenceDir,file)});
}

async function runtimeTrial(url, side, viewport, trialIndex) {
  const page=await setupPage(url,viewport.width,viewport.height);
  const closed=await snapshot(page);
  const runtime=await captureRuntimeTrajectory(page);
  await sleep(120);
  const open=await snapshot(page);
  let screenshots=null;
  if (trialIndex===0) {
    const dialogFile=`${viewport.label}-${side}-open-dialog.png`;
    const fullFile=`${viewport.label}-${side}-open-full.png`;
    await captureDialog(page,dialogFile);
    await page.screenshot({path:path.join(evidenceDir,fullFile),fullPage:false});
    screenshots={open_dialog:`evidence/interaction/${dialogFile}`,open_full:`evidence/interaction/${fullFile}`};
  }
  await page.close();
  return {
    trial:trialIndex+1,
    closed,
    runtime_trajectory:runtime.samples,
    click_to_dialog_ms:runtime.click_to_dialog_ms,
    open,
    animation_signature:runtime.animation_signature,
    animation_signature_capture_t_ms:runtime.animation_signature_capture_t_ms,
    screenshots,
  };
}

async function deterministicScenario(url, side, viewport) {
  const runtimeTrials=[];
  for (let i=0;i<runtimeTrialCount;i++) {
    runtimeTrials.push(await runtimeTrial(url,side,viewport,i));
  }
  const primary=runtimeTrials[0];
  return {
    closed:primary.closed,
    runtime_trajectory:primary.runtime_trajectory,
    click_to_dialog_ms:primary.click_to_dialog_ms,
    open:primary.open,
    animation_signature:primary.animation_signature,
    animation_signature_capture_t_ms:primary.animation_signature_capture_t_ms,
    screenshots:primary.screenshots,
    runtime_trials:runtimeTrials,
  };
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
const report={
  version:'3.3',
  reference_id:referenceId,
  baseline_url:baselineUrl,
  local_url:localUrl,
  captured_at:new Date().toISOString(),
  runtime_trial_count:runtimeTrialCount,
  scenario:'EB27 MorphingDialog 3-trial rAF spatial/temporal trajectory + live scoped animation signature + active-page open/Escape functional test',
  viewports:[]
};
for (const viewport of viewports) {
  const baseline=await deterministicScenario(baselineUrl,'baseline',viewport);
  const local=await deterministicScenario(localUrl,'local',viewport);
  const baselineFunctional=await functionalScenario(baselineUrl,viewport);
  const localFunctional=await functionalScenario(localUrl,viewport);
  report.viewports.push({...viewport,baseline,local,functional:{baseline:baselineFunctional,local:localFunctional}});
}
await browser.close();
fs.writeFileSync(path.join(evidenceDir,'interaction-capture.json'),JSON.stringify(report,null,2)+'\n');
console.log(`REFERENCE_INTERACTION_CAPTURE_OK id=${referenceId} protocol=v3.3 viewports=${viewports.length} runtime=raf trials=${runtimeTrialCount} live_signature=true`);
