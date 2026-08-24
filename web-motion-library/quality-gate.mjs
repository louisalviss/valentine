import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const LIB_DIR=path.join(ROOT,'web-motion-library');
const library=JSON.parse(fs.readFileSync(path.join(LIB_DIR,'library.json'),'utf8'));
const quality=JSON.parse(fs.readFileSync(path.join(LIB_DIR,'quality.json'),'utf8'));
const allowed=new Set(['pass','review','fail']);
const errors=[];
const warnings=[];

function walk(dir,out=[]){
  if(!fs.existsSync(dir)) return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ent.name==='.git'||ent.name==='node_modules') continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p,out); else out.push(p);
  }
  return out;
}
function textFiles(files){
  return files.filter(f=>/\.(?:html?|css|js|mjs|json|svg|txt)$/i.test(f)&&fs.statSync(f).size<750000);
}
function localTarget(pattern){
  const raw=String(pattern.live||'').split(/[?#]/)[0];
  if(/^https?:/i.test(raw)) return null;
  return path.resolve(LIB_DIR,raw);
}
function localRefs(indexFile){
  const html=fs.readFileSync(indexFile,'utf8');
  const refs=[];
  for(const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)){
    let ref=m[1];
    if(!ref||/^(?:https?:|data:|blob:|mailto:|tel:|#|javascript:)/i.test(ref)) continue;
    ref=ref.split(/[?#]/)[0];
    if(!ref) continue;
    refs.push(path.resolve(path.dirname(indexFile),ref));
  }
  return refs;
}
function scoreOf(entry){
  return Math.round(Object.entries(quality.weights).reduce((sum,[key,weight])=>sum+weight*(quality.statusValue[entry.gates[key]]??0),0));
}
function decisionOf(pattern,entry,score){
  if(pattern.supersededBy||pattern.duplicateOf) return 'SUPERSEDE';
  if(entry.gates.distinctGrammar==='fail'||score<quality.thresholds.review) return 'DELETE';
  if(quality.critical.some(key=>entry.gates[key]!=='pass')) return 'REVIEW';
  if(score>=quality.thresholds.promote) return 'PROMOTE';
  if(score>=quality.thresholds.keepAsLab) return 'KEEP AS LAB';
  return 'REVIEW';
}
function readyOf(entry,score,decision){
  return decision==='PROMOTE'&&score>=quality.thresholds.clientReady&&['routeIntegrity','responsive','assetRights','dependencies','performance'].every(k=>entry.gates[k]==='pass');
}
function checkPattern(pattern){
  const entry=quality.patterns[pattern.id];
  if(!entry){errors.push(`${pattern.id}: missing quality entry`);return null;}
  for(const key of Object.keys(quality.weights)){
    if(!allowed.has(entry.gates?.[key])) errors.push(`${pattern.id}: invalid/missing gate ${key}`);
  }
  const target=localTarget(pattern);
  if(!target){errors.push(`${pattern.id}: live route must be repository-local for active library QA`);return null;}
  const indexFile=fs.existsSync(target)&&fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
  const routeOk=fs.existsSync(indexFile);
  if(entry.gates.routeIntegrity==='pass'&&!routeOk) errors.push(`${pattern.id}: routeIntegrity overclaimed; ${path.relative(ROOT,indexFile)} missing`);
  if(!routeOk) return null;
  for(const ref of localRefs(indexFile)) if(!fs.existsSync(ref)) errors.push(`${pattern.id}: broken local ref ${path.relative(ROOT,ref)}`);

  const base=fs.statSync(target).isDirectory()?target:path.dirname(target);
  const files=walk(base);
  const totalBytes=files.reduce((n,f)=>n+fs.statSync(f).size,0);
  const largest=files.reduce((n,f)=>Math.max(n,fs.statSync(f).size),0);
  const source=textFiles(files).map(f=>fs.readFileSync(f,'utf8')).join('\n');
  const html=fs.readFileSync(indexFile,'utf8');
  const viewport=/<meta[^>]+name=["']viewport["']/i.test(html);
  const responsiveEvidence=viewport&&(/@media\b/i.test(source)||/innerWidth|matchMedia|ResizeObserver/i.test(source));
  if(entry.gates.responsive==='pass'&&!responsiveEvidence) errors.push(`${pattern.id}: responsive overclaimed; no viewport + responsive source evidence`);
  const interactionEvidence=/addEventListener|onclick\s*=|onpointer|ontouch|<button\b|<input\b|<select\b/i.test(source);
  if(entry.gates.interaction==='pass'&&!interactionEvidence) errors.push(`${pattern.id}: interaction overclaimed; no interactive source evidence`);
  const reducedEvidence=/prefers-reduced-motion|matchMedia\s*\([^)]*reduce/i.test(source);
  if(entry.gates.reducedMotion==='pass'&&!reducedEvidence) errors.push(`${pattern.id}: reducedMotion overclaimed; no explicit reduced-motion path`);
  const externalRuntime=/<script[^>]+src=["']https?:\/\//i.test(source)||/\bfrom\s*["']https?:\/\//i.test(source)||/import\s*\(\s*["']https?:\/\//i.test(source);
  if(entry.gates.dependencies==='pass'&&externalRuntime) errors.push(`${pattern.id}: dependencies overclaimed; external runtime JS detected`);
  const externalMedia=/https?:\/\/[^\s"')>]+\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm)(?:[?#][^\s"')>]*)?/i.test(source);
  if(entry.gates.assetRights==='pass'&&externalMedia) errors.push(`${pattern.id}: assetRights overclaimed; externally hosted media detected`);
  if(entry.gates.performance==='pass'&&(totalBytes>2000000||largest>1200000)) errors.push(`${pattern.id}: performance overclaimed; source footprint ${(totalBytes/1e6).toFixed(2)}MB, largest ${(largest/1e6).toFixed(2)}MB`);
  const imgs=[...html.matchAll(/<img\b([^>]*)>/gi)];
  const missingAlt=imgs.filter(m=>!(/\balt\s*=/.test(m[1]))).length;
  const lang=/<html[^>]+lang=["'][^"']+["']/i.test(html);
  if(entry.gates.accessibility==='pass'&&(!lang||missingAlt)) errors.push(`${pattern.id}: accessibility overclaimed; missing lang or image alt`);

  const score=scoreOf(entry),decision=decisionOf(pattern,entry,score),ready=readyOf(entry,score,decision);
  if(decision==='DELETE'||decision==='SUPERSEDE') errors.push(`${pattern.id}: active catalog cannot contain decision ${decision}; remove or replace the entry`);
  if(decision==='REVIEW'&&pattern.status==='production') warnings.push(`${pattern.id}: production status conflicts with REVIEW decision; consider candidate/lab status`);
  if(pattern.clientReady!==ready) warnings.push(`${pattern.id}: legacy clientReady=${pattern.clientReady} differs from derived=${ready}`);
  return {id:pattern.id,score,decision,ready,debt:Object.entries(entry.gates).filter(([,v])=>v!=='pass').map(([k,v])=>`${k}:${v}`)};
}

const ids=new Set(library.patterns.map(p=>p.id));
for(const id of Object.keys(quality.patterns)) if(!ids.has(id)) errors.push(`${id}: quality entry has no library pattern`);
const results=library.patterns.map(checkPattern).filter(Boolean);
console.log('\nWEB MOTION QUALITY GATE v'+quality.version);
console.log('score  decision       ready  pattern');
for(const r of results) console.log(`${String(r.score).padStart(3)}    ${r.decision.padEnd(13)} ${r.ready?'YES ':'NO  '}  ${r.id}${r.debt.length?'  ['+r.debt.join(', ')+']':''}`);
if(warnings.length){console.log('\nWARNINGS');for(const w of warnings) console.log('- '+w);}
if(errors.length){console.error('\nQUALITY_GATE_FAILED');for(const e of errors) console.error('- '+e);process.exit(1);}
console.log(`\nQUALITY_GATE_OK ${results.length} patterns · ${results.filter(r=>r.ready).length} client-ready`);
