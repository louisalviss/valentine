import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const targetFile = process.argv[2];
if (!targetFile) throw new Error('usage: node capture-browser.mjs <target.json>');
const target = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
if (!target.id || !/^[a-z0-9][a-z0-9-]*$/.test(target.id)) throw new Error('target.id must be lowercase kebab-case');
if (!/^https:\/\//.test(target.source_url || '')) throw new Error('target.source_url must be https');

function which(names) {
  for (const name of names) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return '';
}

const chrome = process.env.CHROME_BIN || which(['google-chrome', 'chromium', 'chromium-browser']);
if (!chrome) throw new Error('Chrome/Chromium not found');

const root = process.cwd();
const outDir = path.join(root, 'labs', 'references', target.id);
const evidenceDir = path.join(outDir, 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars']
});

const page = await browser.newPage();
page.setDefaultNavigationTimeout(60000);
page.setDefaultTimeout(30000);

const responses = [];
page.on('response', response => {
  const request = response.request();
  responses.push({
    url: response.url(),
    status: response.status(),
    method: request.method(),
    resource_type: request.resourceType(),
    content_type: response.headers()['content-type'] || ''
  });
});

async function settle(ms=1200){ await new Promise(resolve => setTimeout(resolve, ms)); }

async function captureViewport(width, height, label, scrollRatios=[0]) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(target.source_url, { waitUntil: 'networkidle2' });
  await settle();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewport_width: innerWidth,
    viewport_height: innerHeight
  }));
  const shots=[];
  for (const ratio of scrollRatios) {
    await page.evaluate(r => {
      const max=Math.max(0, document.documentElement.scrollHeight-innerHeight);
      scrollTo(0, Math.round(max*r));
    }, ratio);
    await settle(450);
    const suffix = ratio===0 ? 'initial' : `scroll-${Math.round(ratio*100)}`;
    const file = `${label}-${suffix}.png`;
    await page.screenshot({ path: path.join(evidenceDir, file), fullPage: false });
    shots.push({ id:`${label}-${suffix}`, kind:ratio===0?'initial':'scroll', ratio, screenshot:`evidence/${file}` });
  }
  return { width, height, label, dimensions, states:shots };
}

const desktop = await captureViewport(1440, 900, 'desktop', [0,.25,.5,.75]);
const tablet = await captureViewport(768, 1024, 'tablet', [0,.5]);
const mobile = await captureViewport(390, 844, 'mobile', [0,.5]);

// Return to desktop for structural evidence.
await page.setViewport({ width:1440, height:900, deviceScaleFactor:1 });
await page.goto(target.source_url, { waitUntil:'networkidle2' });
await settle(1500);

const structural = await page.evaluate(() => {
  const pickStyle = style => ({
    display:style.display, position:style.position, overflow:style.overflow,
    width:style.width, height:style.height,
    margin:style.margin, padding:style.padding, gap:style.gap,
    fontFamily:style.fontFamily, fontSize:style.fontSize, fontWeight:style.fontWeight,
    lineHeight:style.lineHeight, letterSpacing:style.letterSpacing, textTransform:style.textTransform,
    color:style.color, backgroundColor:style.backgroundColor, backgroundImage:style.backgroundImage,
    border:style.border, borderRadius:style.borderRadius,
    boxShadow:style.boxShadow, opacity:style.opacity, transform:style.transform,
    zIndex:style.zIndex
  });
  const visible = el => {
    const r=el.getBoundingClientRect();
    const s=getComputedStyle(el);
    return r.width>0 && r.height>0 && s.display!=='none' && s.visibility!=='hidden';
  };
  const elements = Array.from(document.querySelectorAll('body *')).filter(visible).slice(0,1800).map((el,index)=>{
    const r=el.getBoundingClientRect();
    return {
      index,
      tag:el.tagName.toLowerCase(), id:el.id||null,
      className:typeof el.className==='string'?el.className.slice(0,240):null,
      text:(el.childElementCount===0 ? (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,220) : ''),
      rect:{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left},
      style:pickStyle(getComputedStyle(el))
    };
  });
  const fonts = Array.from(document.fonts || []).map(f=>({family:f.family,style:f.style,weight:f.weight,stretch:f.stretch,status:f.status}));
  const assets = [
    ...Array.from(document.images).map(x=>({type:'image',src:x.currentSrc||x.src,width:x.naturalWidth,height:x.naturalHeight,alt:x.alt||''})),
    ...Array.from(document.querySelectorAll('video')).map(x=>({type:'video',src:x.currentSrc||x.src,poster:x.poster||'',autoplay:x.autoplay,muted:x.muted,loop:x.loop})),
    ...Array.from(document.querySelectorAll('source')).map(x=>({type:'source',src:x.src||'',media:x.media||'',mime:x.type||''}))
  ];
  const dependencies = Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"][href]')).map(el=>({
    type:el.tagName==='SCRIPT'?'script':'stylesheet', url:el.src||el.href
  }));
  const animations = document.getAnimations().slice(0,400).map((a,index)=>{
    let timing={};
    try { timing=a.effect?.getTiming?.()||{}; } catch {}
    const target=a.effect?.target;
    return {index,playState:a.playState,currentTime:a.currentTime,playbackRate:a.playbackRate,timing,target:target?{tag:target.tagName?.toLowerCase(),id:target.id||null,className:typeof target.className==='string'?target.className.slice(0,180):null}:null};
  });
  const resources = performance.getEntriesByType('resource').map(r=>({name:r.name,initiatorType:r.initiatorType,duration:r.duration,transferSize:r.transferSize,decodedBodySize:r.decodedBodySize}));
  return {
    title:document.title,
    final_url:location.href,
    dimensions:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport_width:innerWidth,viewport_height:innerHeight},
    elements, fonts, assets, dependencies, animations, resources,
    links:Array.from(document.links).slice(0,1000).map(a=>({href:a.href,text:(a.textContent||'').trim().replace(/\s+/g,' ').slice(0,160)}))
  };
});

const html = await page.content();
fs.writeFileSync(path.join(evidenceDir,'hydrated.html'), html);
const htmlHash = crypto.createHash('sha256').update(html).digest('hex');
const allStates = [...desktop.states, ...tablet.states, ...mobile.states];
const capture = {
  version:'1.0', reference_id:target.id, source_url:target.source_url,
  discovery_source:target.discovery_source||null,
  captured_at:new Date().toISOString(), browser:'system-chrome+puppeteer-core',
  final_url:structural.final_url, title:structural.title,
  hydrated_html_sha256:htmlHash,
  viewports:[desktop,tablet,mobile], states:allStates,
  structure:structural,
  responses
};
fs.writeFileSync(path.join(evidenceDir,'capture.json'), JSON.stringify(capture,null,2));

const manifest = {
  version:'1.0',
  reference_id:target.id,
  source:{url:target.source_url,discovery_source:target.discovery_source||null,captured_at:capture.captured_at},
  capture:{
    viewports:[desktop,tablet,mobile].map(v=>({width:v.width,height:v.height})),
    states:allStates.map(s=>({...s,original_screenshot:s.screenshot,reconstruction_screenshot:null})),
    dom:{path:'evidence/hydrated.html',sha256:htmlHash,element_count:structural.elements.length},
    styles_geometry:{path:'evidence/capture.json',element_count:structural.elements.length},
    fonts:structural.fonts,
    assets:structural.assets,
    dependencies:structural.dependencies,
    network:structural.resources
  },
  reconstruction:{mode:target.reconstruction_mode||'render-equivalent-rebuild',local_path:`labs/references/${target.id}/`,essential_origin_dependency:true,notes:'Capture complete; local reconstruction not yet implemented.'},
  fidelity:{visual:{score:0,status:'pending',method:'original-vs-local screenshot comparison pending',exceptions:[]},motion_interaction:{status:'pending',states_verified:[],notes:'Animation inventory captured; reconstruction evidence pending.'}},
  provenance:{code:'Browser-delivered public frontend evidence captured for analysis; authored-source identity not claimed.',assets:'External assets inventoried only; reuse rights not inferred from public accessibility.',rights_status:'unreviewed'}
};
fs.writeFileSync(path.join(outDir,'capture-manifest.json'), JSON.stringify(manifest,null,2));

await browser.close();
console.log(`REFERENCE_BROWSER_CAPTURE_OK id=${target.id} elements=${structural.elements.length} states=${allStates.length} responses=${responses.length}`);
