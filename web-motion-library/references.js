(()=>{
  const grid=document.getElementById('referenceGrid');
  const count=document.getElementById('referenceCount');
  const feed=document.getElementById('feedStatus');
  const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));

  function fidelityState(ref){
    const visual=ref.fidelity?.visual||{};
    const motion=ref.fidelity?.motion_interaction||{};
    const score=Number(visual.score);
    const status=visual.status||'pending';
    return {score:Number.isFinite(score)?score:null,status,motion:motion.status||'pending'};
  }

  function card(ref){
    const f=fidelityState(ref);
    const preview=ref.preview||ref.live||'';
    const title=esc(ref.title||ref.id);
    const tags=(ref.tags||[]).slice(0,4).map(x=>`<span>${esc(x)}</span>`).join('');
    const score=f.score===null?'—':f.score.toFixed(f.score%1?1:0);
    const href=ref.live||ref.source_url;
    const mode=esc(ref.reconstruction_mode||'pending');
    return `<article class="reference-card"><div class="card-meta"><span>${esc(ref.index||'REF')} / ${esc(ref.status||'candidate')}</span><span class="fidelity ${esc(f.status)}"><b>${score}</b> · VISUAL ${esc(f.status)} · MOTION ${esc(f.motion)}</span></div><a href="${esc(href)}" ${/^https?:/.test(href)?'target="_blank" rel="noopener"':''}><div class="preview-shell">${preview?`<iframe src="about:blank" data-src="${esc(preview)}" title="${title} preview" loading="lazy" tabindex="-1"></iframe>`:''}<div class="preview-shade"></div><div class="preview-badge">Open reference ↗</div></div><div class="card-body"><div><h3>${title}</h3><p>${esc(ref.description||'Reconstructed external reference candidate.')}</p><p style="margin-top:8px;font-size:10px">${mode} · source: ${esc(ref.source_url||'—')}</p></div><div class="tag-list">${tags}</div></div></a></article>`;
  }

  function armPreviews(){
    const frames=[...grid.querySelectorAll('iframe[data-src]')];
    const load=f=>{if(f.dataset.src){f.src=f.dataset.src;f.removeAttribute('data-src')}};
    if(!('IntersectionObserver'in window)){frames.forEach(load);return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){load(e.target);observer.unobserve(e.target)}}),{rootMargin:'320px 0px'});
    frames.forEach(f=>observer.observe(f));
  }

  async function load(){
    try{
      const response=await fetch('../labs/reference-harvester/reference-registry.json',{cache:'no-store'});
      if(!response.ok) throw new Error(`registry HTTP ${response.status}`);
      const data=await response.json();
      const refs=Array.isArray(data.references)?data.references:[];
      feed.textContent=`Feed — ${data.feed_authority?.status||'unknown'}`;
      count.textContent=`${String(refs.length).padStart(2,'0')} ${refs.length===1?'reference':'references'}`;
      if(!refs.length){
        grid.innerHTML=`<div class="reference-empty"><h2>No reconstructed references yet.</h2><p>The harvester foundation is active, but the existing site-library feed has not been connected. This state is intentional: no duplicate discovery database and no fabricated reference records.</p></div>`;
        return;
      }
      grid.innerHTML=refs.map(card).join('');
      armPreviews();
    }catch(error){
      feed.textContent='Feed — error';
      count.textContent='00 references';
      grid.innerHTML=`<div class="reference-empty"><h2>Reference registry unavailable.</h2><p>${esc(error.message)}</p></div>`;
    }
  }
  load();
})();
