import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const [sourceUrl, localUrl] = process.argv.slice(2);
if (!sourceUrl || !localUrl) throw new Error('usage: node native-content-contract.mjs <source-url> <local-url>');

function which(names) {
  for (const name of names) {
    try { return execFileSync('which', [name], { encoding: 'utf8' }).trim(); } catch {}
  }
  return '';
}
const chrome = process.env.CHROME_BIN || which(['google-chrome','chromium','chromium-browser']);
if (!chrome) throw new Error('Chrome/Chromium not found');

const root = process.cwd();
const outDir = path.join(root, 'labs', 'references', 'native-content', 'evidence');
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--hide-scrollbars'] });
const settle = ms => new Promise(resolve => setTimeout(resolve, ms));
const viewports = [
  { label:'desktop', width:1440, height:900, ratios:[0,.25,.5,.75] },
  { label:'tablet', width:768, height:1024, ratios:[0,.5] },
  { label:'mobile', width:390, height:844, ratios:[0,.5] }
];
const projectTitles = ['Patron','The WrapBook','Toyota','Air Jordan','Vera Bradley','Smartfood','Red Robin','Simon Malls','Patron'];

async function newPage(kind, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor:1 });
  page.setDefaultNavigationTimeout(30000);
  const blocked = [];
  if (kind === 'local') {
    await page.setRequestInterception(true);
    page.on('request', req => {
      let u;
      try { u = new URL(req.url()); } catch { req.continue(); return; }
      if ((u.protocol === 'http:' || u.protocol === 'https:') && !['127.0.0.1','localhost'].includes(u.hostname)) {
        blocked.push({ url:req.url(), type:req.resourceType() });
        req.abort('blockedbyclient');
      } else req.continue();
    });
  }
  return { page, blocked };
}
async function navigate(page, url) {
  await page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 });
  try { await page.waitForNetworkIdle({ idleTime:800, timeout:7000 }); } catch {}
  await settle(1200);
}
const rect = r => r ? ({ x:r.x, y:r.y, width:r.width, height:r.height }) : null;

async function collect(page, kind, expectedIndex) {
  return page.evaluate(({ kind, expectedIndex, projectTitles }) => {
    const clean = r => r ? ({x:r.x,y:r.y,width:r.width,height:r.height}) : null;
    const visible = el => {
      if (!el) return false;
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const byText = (selector, text) => [...document.querySelectorAll(selector)].find(el => visible(el) && (el.textContent || '').trim().toLowerCase() === text.toLowerCase());
    const exactNav = ['Directors','Collaborators','Post','About','Contact'];
    const nav = {};
    for (const text of exactNav) {
      const el = byText('a', text);
      nav[text.toLowerCase()] = el ? { text:(el.textContent||'').trim(), rect:clean(el.getBoundingClientRect()) } : null;
    }
    const social = {};
    for (const text of ['Instagram','LinkedIn']) {
      const el = [...document.querySelectorAll('a')].find(a => visible(a) && (a.textContent||'').trim().toLowerCase().startsWith(text.toLowerCase()));
      social[text.toLowerCase()] = el ? { text, rect:clean(el.getBoundingClientRect()) } : null;
    }
    let logo;
    if (kind === 'source') logo = document.querySelector('nav a[aria-label="Link to the home page"]');
    else logo = document.querySelector('[data-ref="logo"]');

    const sections = [...document.querySelectorAll('section')];
    const section = sections[Math.max(0, Math.min(expectedIndex, sections.length - 1))];
    let title = null, director = null;
    if (kind === 'source') {
      const links = section ? [...section.querySelectorAll('a.type-title')].filter(visible) : [];
      title = links.find(a => projectTitles.includes((a.textContent||'').trim())) || links[0] || null;
      director = links.find(a => /^directed by/i.test((a.textContent||'').trim())) || null;
    } else if (innerWidth <= 600) {
      title = document.querySelector('[data-ref="mobile-project-title"]');
      director = document.querySelector('[data-ref="mobile-project-director"]');
    } else {
      title = document.querySelector('[data-ref="project-title"]');
      director = document.querySelector('[data-ref="project-director"]');
    }
    const menuToggle = kind === 'source'
      ? [...document.querySelectorAll('button')].find(b => visible(b) && ['menu','close'].includes((b.textContent||'').trim().toLowerCase()))
      : document.querySelector('[data-ref="menu-toggle"]');
    return {
      dimensions:{ width:document.documentElement.scrollWidth, height:document.documentElement.scrollHeight, viewport_width:innerWidth, viewport_height:innerHeight, scroll_y:scrollY },
      logo:logo && visible(logo) ? { rect:clean(logo.getBoundingClientRect()) } : null,
      nav,
      social,
      section:section ? { index:expectedIndex, rect:clean(section.getBoundingClientRect()) } : null,
      title:title && visible(title) ? { text:(title.textContent||'').trim(), rect:clean(title.getBoundingClientRect()) } : null,
      director:director && visible(director) ? { text:(director.textContent||'').trim(), rect:clean(director.getBoundingClientRect()) } : null,
      menu_toggle:menuToggle && visible(menuToggle) ? { text:(menuToggle.textContent||'').trim(), rect:clean(menuToggle.getBoundingClientRect()) } : null,
    };
  }, { kind, expectedIndex, projectTitles });
}

function normRectError(a, b, width, height) {
  if (!a && !b) return 0;
  if (!a || !b) return 1;
  return Math.max(
    Math.abs(a.x-b.x)/width,
    Math.abs(a.y-b.y)/height,
    Math.abs(a.width-b.width)/width,
    Math.abs(a.height-b.height)/height
  );
}
function compareNode(a,b,width,height,{text=true}={}) {
  if (!a && !b) return { score:100, error:0, text_match:true };
  if (!a || !b) return { score:0, error:1, text_match:false };
  const error = normRectError(a.rect,b.rect,width,height);
  const textMatch = !text || String(a.text||'').toLowerCase() === String(b.text||'').toLowerCase();
  return { score: textMatch ? Math.max(0,100*(1-error)) : 0, error, text_match:textMatch };
}

const states=[];
let blockedRequests=[];
for (const viewport of viewports) {
  for (const ratio of viewport.ratios) {
    const sourceCtx = await newPage('source', viewport.width, viewport.height);
    const localCtx = await newPage('local', viewport.width, viewport.height);
    await navigate(sourceCtx.page, sourceUrl);
    await navigate(localCtx.page, localUrl);
    for (const page of [sourceCtx.page, localCtx.page]) {
      await page.evaluate(r => {
        const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        scrollTo(0, Math.round(max*r));
      }, ratio);
    }
    await settle(500);
    const sourceIndex = await sourceCtx.page.evaluate(() => Math.max(0, Math.min(document.querySelectorAll('section').length-1, Math.round(scrollY/Math.max(1,innerHeight)))));
    const localIndex = await localCtx.page.evaluate(() => Math.max(0, Math.min(document.querySelectorAll('section').length-1, Math.round(scrollY/Math.max(1,innerHeight)))));
    const expectedIndex = sourceIndex;
    const source = await collect(sourceCtx.page,'source',expectedIndex);
    const local = await collect(localCtx.page,'local',expectedIndex);
    blockedRequests.push(...localCtx.blocked);
    const parts=[];
    parts.push({name:'logo', ...compareNode(source.logo,local.logo,viewport.width,viewport.height,{text:false})});
    if (viewport.width > 600) {
      for (const key of ['directors','collaborators','post','about','contact']) parts.push({name:`nav:${key}`,...compareNode(source.nav[key],local.nav[key],viewport.width,viewport.height)});
    } else parts.push({name:'menu-toggle',...compareNode(source.menu_toggle,local.menu_toggle,viewport.width,viewport.height)});
    for (const key of ['instagram','linkedin']) parts.push({name:`social:${key}`,...compareNode(source.social[key],local.social[key],viewport.width,viewport.height)});
    parts.push({name:'project-title',...compareNode(source.title,local.title,viewport.width,viewport.height)});
    parts.push({name:'project-director',...compareNode(source.director,local.director,viewport.width,viewport.height)});
    const pageHeightError=Math.abs(source.dimensions.height-local.dimensions.height)/Math.max(1,source.dimensions.height);
    parts.push({name:'page-height',score:Math.max(0,100*(1-pageHeightError)),error:pageHeightError,text_match:true});
    const minScore=Math.min(...parts.map(p=>p.score));
    states.push({ id:`${viewport.label}-${ratio===0?'initial':`scroll-${Math.round(ratio*100)}`}`, viewport, ratio, source_index:sourceIndex, local_index:localIndex, expected_title:projectTitles[expectedIndex], score:Number(minScore.toFixed(4)), parts, source, local });
    await sourceCtx.page.close(); await localCtx.page.close();
  }
}

async function mobileMenuContract(kind,url) {
  const ctx=await newPage(kind,390,844); await navigate(ctx.page,url);
  const result=await ctx.page.evaluate(async kind => {
    const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
    const toggle=kind==='source'?[...document.querySelectorAll('button')].find(b=>visible(b)&&(b.textContent||'').trim().toLowerCase()==='menu'):document.querySelector('[data-ref="menu-toggle"]');
    if(!toggle)return {ok:false,reason:'menu-toggle-missing'};
    toggle.click();
    await new Promise(r=>setTimeout(r,650));
    const menu=kind==='source'?[...document.querySelectorAll('nav')].find(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return r.width>=innerWidth*.95&&r.height>=innerHeight*.95&&s.backgroundColor==='rgb(31, 46, 255)'}):document.querySelector('[data-ref="mobile-menu"]');
    const links=menu?[...menu.querySelectorAll('a')].filter(visible).map(a=>({text:(a.textContent||'').trim(),rect:(()=>{const r=a.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()})):[];
    const r=menu?.getBoundingClientRect();
    const open={toggle_text:(toggle.textContent||'').trim(),menu_visible:Boolean(menu&&visible(menu)),menu_rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,bg:menu?getComputedStyle(menu).backgroundColor:null,links};
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    await new Promise(r=>setTimeout(r,650));
    const after={toggle_text:(toggle.textContent||'').trim(),menu_visible:Boolean(menu&&visible(menu)&&getComputedStyle(menu).pointerEvents!=='none')};
    return {ok:true,open,after};
  },kind);
  blockedRequests.push(...ctx.blocked); await ctx.page.close(); return result;
}
const sourceMenu=await mobileMenuContract('source',sourceUrl);
const localMenu=await mobileMenuContract('local',localUrl);
function menuScore(a,b){
  if(!a.ok||!b.ok||!a.open?.menu_visible||!b.open?.menu_visible)return 0;
  if(a.open.bg!==b.open.bg)return 0;
  const geom=normRectError(a.open.menu_rect,b.open.menu_rect,390,844);
  const sourceTexts=a.open.links.map(x=>x.text.toLowerCase());
  const localTexts=b.open.links.map(x=>x.text.toLowerCase());
  const textMatch=sourceTexts.length===localTexts.length&&sourceTexts.every((x,i)=>x===localTexts[i]);
  return textMatch?Math.max(0,100*(1-geom)):0;
}
const menu_score=Number(menuScore(sourceMenu,localMenu).toFixed(4));
const minimum_score=Number(Math.min(menu_score,...states.map(s=>s.score)).toFixed(4));
const network_status=blockedRequests.length===0?'pass':'fail';
const menu_functional_status=localMenu.ok&&localMenu.open?.menu_visible&&localMenu.after?.toggle_text?.toLowerCase()==='menu'?'pass':'fail';
const status=minimum_score>=98&&network_status==='pass'&&menu_functional_status==='pass'?'pass':'fail';
const report={
  version:'1.0',reference_id:'native-content',profile:'commercial-media-contract',source_url:sourceUrl,local_url:localUrl,
  policy:{geometry_min:98,commercial_media_pixels:'explicitly excluded from acceptance; raw screenshot score reported separately',network_external_requests_required:0,mobile_menu_required:true},
  minimum_score,menu_score,network_status,menu_functional_status,status,blocked_requests:blockedRequests,states,mobile_menu:{source:sourceMenu,local:localMenu}
};
fs.writeFileSync(path.join(outDir,'native-contract.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
console.log(`NATIVE_CONTENT_CONTRACT_${status.toUpperCase()} min=${minimum_score} menu=${menu_score} network=${network_status} menu_fn=${menu_functional_status}`);
if(status!=='pass')process.exitCode=1;
