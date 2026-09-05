import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const targetFile = process.argv[2];
if (!targetFile) throw new Error('usage: node capture-browser.mjs <target.json>');
const target = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
if (!target.id || !/^[a-z0-9][a-z0-9-]*$/.test(target.id)) throw new Error('target.id must be lowercase kebab-case');
if (!/^https:\/\//.test(target.source_url || '')) throw new Error('target.source_url must be https');
if (target.browser_capture_enabled === false) {
  console.log(`REFERENCE_BROWSER_CAPTURE_SKIPPED id=${target.id} reason=disabled`);
  process.exit(0);
}
const captureUrl = target.capture_url || target.source_url;
const deterministicVisual = target.deterministic_visual === true || target.baseline_kind === 'source-build-control';
if (target.capture_url && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(target.capture_url)) {
  throw new Error('capture_url override is restricted to localhost source-build controls');
}
const visualExclusionDefinitions = Array.isArray(target.visual_exclusions) ? target.visual_exclusions : [];

function which(names) {
  for (const name of names) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return '';
}
const chrome = process.env.CHROME_BIN || which(['google-chrome', 'chromium', 'chromium-browser']);
if (!chrome) throw new Error('Chrome/Chromium not found');

const root = process.cwd();
const finalOutDir = path.join(root, 'labs', 'references', target.id);
const tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), `valentine-capture-${target.id}-`));
const evidenceDir = path.join(tempOutDir, 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(30000);
page.setDefaultTimeout(30000);
if (deterministicVisual) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

const responses=[];
page.on('response', response => {
  const request=response.request();
  responses.push({url:response.url(),status:response.status(),method:request.method(),resource_type:request.resourceType(),content_type:response.headers()['content-type']||''});
});
const settle = ms => new Promise(resolve => setTimeout(resolve, ms));
async function stabilizeVisualState(){
  if (!deterministicVisual) return;
  await page.evaluate(() => {
    if (!document.getElementById('valentine-deterministic-visual')) {
      const style=document.createElement('style');
      style.id='valentine-deterministic-visual';
      style.textContent=`*,*::before,*::after{animation-delay:0s!important;animation-duration:.001s!important;animation-iteration-count:1!important;transition-delay:0s!important;transition-duration:0s!important;scroll-behavior:auto!important;caret-color:transparent!important}`;
      document.head.appendChild(style);
    }
    for (const animation of document.getAnimations({subtree:true})) {
      try {
        const end=Number(animation.effect?.getComputedTiming?.()?.endTime);
        animation.currentTime=Number.isFinite(end)?Math.max(0,end):0;
        animation.pause();
      } catch {}
    }
  });
  await settle(80);
}
async function navigate(){
  await page.goto(captureUrl,{waitUntil:'domcontentloaded',timeout:30000});
  try { await page.waitForNetworkIdle({idleTime:800,timeout:7000}); } catch {}
  await settle(1200);
  await stabilizeVisualState();
}
async function collectVisualExclusions(){
  return page.evaluate(definitions => definitions.map(definition => {
    const rects=[...document.querySelectorAll(definition.selector)].map(element => {
      const r=element.getBoundingClientRect();
      const clipped={
        x:Math.max(0,r.left), y:Math.max(0,r.top),
        width:Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left)),
        height:Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))
      };
      return {
        rect:{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left},
        clipped_rect:clipped,
        visible:clipped.width>0&&clipped.height>0
      };
    });
    return {...definition,matched_elements:rects.length,rects};
  }), visualExclusionDefinitions);
}
async function captureViewport(width,height,label,scrollRatios=[0]) {
  await page.setViewport({width,height,deviceScaleFactor:1});
  await navigate();
  const dimensions=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport_width:innerWidth,viewport_height:innerHeight}));
  const shots=[];
  for (const ratio of scrollRatios) {
    await page.evaluate(r=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);scrollTo(0,Math.round(max*r));},ratio);
    await settle(450);
    await stabilizeVisualState();
    const suffix=ratio===0?'initial':`scroll-${Math.round(ratio*100)}`;
    const file=`${label}-${suffix}.png`;
    const visual_exclusions=await collectVisualExclusions();
    await page.screenshot({path:path.join(evidenceDir,file),fullPage:false});
    shots.push({id:`${label}-${suffix}`,kind:ratio===0?'initial':'scroll',ratio,screenshot:`evidence/${file}`,visual_exclusions});
  }
  return {width,height,label,dimensions,states:shots};
}

try {
  const desktop=await captureViewport(1440,900,'desktop',[0,.25,.5,.75]);
  const tablet=await captureViewport(768,1024,'tablet',[0,.5]);
  const mobile=await captureViewport(390,844,'mobile',[0,.5]);
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
  await navigate();
  const structural=await page.evaluate(() => {
    const pickStyle=s=>({display:s.display,position:s.position,overflow:s.overflow,width:s.width,height:s.height,margin:s.margin,padding:s.padding,gap:s.gap,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,textTransform:s.textTransform,color:s.color,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,border:s.border,borderRadius:s.borderRadius,boxShadow:s.boxShadow,opacity:s.opacity,transform:s.transform,zIndex:s.zIndex});
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
    const elements=[...document.querySelectorAll('body *')].filter(visible).slice(0,1800).map((el,index)=>{const r=el.getBoundingClientRect();return {index,tag:el.tagName.toLowerCase(),id:el.id||null,className:typeof el.className==='string'?el.className.slice(0,240):null,text:el.childElementCount===0?(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,220):'',rect:{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left},style:pickStyle(getComputedStyle(el))};});
    const fonts=[...(document.fonts||[])].map(f=>({family:f.family,style:f.style,weight:f.weight,stretch:f.stretch,status:f.status}));
    const assets=[...document.images].map(x=>({type:'image',src:x.currentSrc||x.src,width:x.naturalWidth,height:x.naturalHeight,alt:x.alt||''}));
    const dependencies=[...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(el=>({type:el.tagName==='SCRIPT'?'script':'stylesheet',url:el.src||el.href}));
    const animations=document.getAnimations().slice(0,400).map((a,index)=>{let timing={};try{timing=a.effect?.getTiming?.()||{};}catch{}const t=a.effect?.target;return {index,playState:a.playState,currentTime:a.currentTime,playbackRate:a.playbackRate,timing,target:t?{tag:t.tagName?.toLowerCase(),id:t.id||null,className:typeof t.className==='string'?t.className.slice(0,180):null}:null};});
    const resources=performance.getEntriesByType('resource').map(r=>({name:r.name,initiatorType:r.initiatorType,duration:r.duration,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize}));
    return {title:document.title,body_text:(document.body?.innerText||'').replace(/\s+/g,' ').trim().slice(0,4000),final_url:location.href,dimensions:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport_width:innerWidth,viewport_height:innerHeight},elements,fonts,assets,dependencies,animations,resources,links:[...document.links].slice(0,1000).map(a=>({href:a.href,text:(a.textContent||'').trim().replace(/\s+/g,' ').slice(0,160)}))};
  });
  const challengeText=`${structural.title}\n${structural.body_text}`.toLowerCase();
  const challengeSignals=['vercel security checkpoint','failed to verify your browser','checking your browser','security challenge','captcha','access denied','just a moment...'];
  const challengeResource=responses.some(r=>/\/\.well-known\/vercel\/security\/|challenge\./i.test(r.url));
  if (challengeSignals.some(s=>challengeText.includes(s))||challengeResource) throw new Error(`REFERENCE_CAPTURE_REJECTED id=${target.id} reason=challenge-shell title=${JSON.stringify(structural.title)}`);
  const minimumElements=Number(target.min_visible_elements??12);
  if (!(structural.elements.length>=minimumElements||structural.assets.length>0||structural.dependencies.length>0)) throw new Error(`REFERENCE_CAPTURE_REJECTED id=${target.id} reason=thin-body`);

  const html=await page.content();
  fs.writeFileSync(path.join(evidenceDir,'hydrated.html'),html);
  const htmlHash=crypto.createHash('sha256').update(html).digest('hex');
  const allStates=[...desktop.states,...tablet.states,...mobile.states];
  const capture={version:'1.1',reference_id:target.id,source_url:target.source_url,capture_url:target.capture_url||null,baseline_kind:target.baseline_kind||'live-browser',visual_state_policy:deterministicVisual?'deterministic-static':'runtime',discovery_source:target.discovery_source||null,captured_at:new Date().toISOString(),browser:'system-chrome+puppeteer-core',final_url:structural.final_url,title:structural.title,hydrated_html_sha256:htmlHash,visual_exclusion_definitions:visualExclusionDefinitions,viewports:[desktop,tablet,mobile],states:allStates,structure:structural,responses};
  fs.writeFileSync(path.join(evidenceDir,'capture.json'),JSON.stringify(capture,null,2));
  const manifest={version:'1.0',reference_id:target.id,source:{url:target.source_url,discovery_source:target.discovery_source||null,captured_at:capture.captured_at,baseline_kind:capture.baseline_kind,visual_state_policy:capture.visual_state_policy},capture:{visual_state_policy:capture.visual_state_policy,visual_exclusions:visualExclusionDefinitions,viewports:[desktop,tablet,mobile].map(v=>({width:v.width,height:v.height})),states:allStates.map(s=>({...s,original_screenshot:s.screenshot,reconstruction_screenshot:null})),dom:{path:'evidence/hydrated.html',sha256:htmlHash,element_count:structural.elements.length},styles_geometry:{path:'evidence/capture.json',element_count:structural.elements.length},fonts:structural.fonts,assets:structural.assets,dependencies:structural.dependencies,network:structural.resources},reconstruction:{mode:target.reconstruction_mode||'render-equivalent-rebuild',local_path:`labs/references/${target.id}/`,essential_origin_dependency:true,notes:'Capture complete; local reconstruction not yet implemented.'},fidelity:{visual:{score:0,status:'pending',method:'original-vs-local screenshot comparison pending',exceptions:[]},motion_interaction:{status:'pending',states_verified:[],notes:'Animation inventory captured; reconstruction evidence pending.'}},provenance:{code:target.provenance_code||'Browser-delivered public frontend evidence captured for analysis; authored-source identity not claimed.',assets:target.provenance_assets||'External assets inventoried only; reuse rights not inferred from public accessibility.',rights_status:target.rights_status||'unreviewed'}};
  fs.writeFileSync(path.join(tempOutDir,'capture-manifest.json'),JSON.stringify(manifest,null,2));
  fs.mkdirSync(finalOutDir,{recursive:true});
  fs.rmSync(path.join(finalOutDir,'evidence'),{recursive:true,force:true});
  fs.cpSync(evidenceDir,path.join(finalOutDir,'evidence'),{recursive:true});
  fs.copyFileSync(path.join(tempOutDir,'capture-manifest.json'),path.join(finalOutDir,'capture-manifest.json'));
  console.log(`REFERENCE_BROWSER_CAPTURE_OK id=${target.id} baseline=${capture.baseline_kind} visual=${capture.visual_state_policy} elements=${structural.elements.length} states=${allStates.length} exclusions=${visualExclusionDefinitions.length} responses=${responses.length}`);
} finally {
  await browser.close();
  fs.rmSync(tempOutDir,{recursive:true,force:true});
}
