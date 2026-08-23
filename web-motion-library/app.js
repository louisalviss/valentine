(()=>{
  const FALLBACK_LIBRARY=[{
    id:'aura-scroll-product-story',index:'001',title:'Scroll Product Story',family:['product','scroll','typography','interaction'],status:'production',live:'../aura-eclipse-scroll/',preview:'../aura-eclipse-scroll/?frame=.55&library=1',source:'https://github.com/louisalviss/valentine/tree/main/aura-eclipse-scroll',description:'A pinned product narrative with one continuous hero object, scene wipe, editorial type layering and interactive feature hotspots.',bestFor:['Premium hardware','Fashion accessories','Automotive detail','High-end DTC'],stack:['HTML','CSS','JavaScript'],tags:['Pinned scroll','Layered type','Feature hotspots'],primitives:[{name:'ScrollProduct',description:'Moves one focal product through several narrative compositions while preserving object continuity.'},{name:'SceneWipe',description:'Transitions between dark hero and light editorial surface using one scroll-scrubbed sheet.'},{name:'ProductMaskText',description:'Splits typography into foreground/background layers so the product can pass through type intentionally.'},{name:'FeatureHotspot',description:'Turns floating feature pills into compact detail disclosures without replacing the composition.'}]
  }];

  const grid=document.getElementById('patternGrid');
  const filters=document.getElementById('filters');
  const searchInput=document.getElementById('searchInput');
  const resultCount=document.getElementById('resultCount');
  const patternCount=document.getElementById('patternCount');
  const primitiveCount=document.getElementById('primitiveCount');
  const patternDialog=document.getElementById('patternDialog');
  const useDialog=document.getElementById('useDialog');
  const aboutDialog=document.getElementById('aboutDialog');
  const detailFrame=document.getElementById('detailFrame');
  const detailIndex=document.getElementById('detailIndex');
  const detailFamily=document.getElementById('detailFamily');
  const detailTitle=document.getElementById('detailTitle');
  const detailDescription=document.getElementById('detailDescription');
  const primitiveList=document.getElementById('primitiveList');
  const bestFor=document.getElementById('bestFor');
  const stack=document.getElementById('stack');
  const openLive=document.getElementById('openLive');
  const openSource=document.getElementById('openSource');
  const usePattern=document.getElementById('usePattern');
  const useForm=document.getElementById('useForm');
  const briefOutput=document.getElementById('briefOutput');
  const briefText=document.getElementById('briefText');
  const copyBrief=document.getElementById('copyBrief');
  let library=FALLBACK_LIBRARY;
  let activeFilter='all';
  let activePattern=library[0];

  function esc(value){return String(value??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
  function normalize(value){return String(value||'').toLowerCase().trim();}

  function hydrateStats(){
    patternCount.textContent=String(library.length).padStart(2,'0');
    const primitives=new Set(library.flatMap(p=>(p.primitives||[]).map(x=>x.name)));
    primitiveCount.textContent=String(primitives.size).padStart(2,'0');
  }

  function filtered(){
    const q=normalize(searchInput.value);
    return library.filter(pattern=>{
      const family=pattern.family||[];
      const filterOk=activeFilter==='all'||family.includes(activeFilter);
      if(!filterOk)return false;
      if(!q)return true;
      const hay=[pattern.title,pattern.description,...family,...(pattern.tags||[]),...(pattern.bestFor||[]),...(pattern.primitives||[]).flatMap(x=>[x.name,x.description])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function card(pattern){
    const tags=(pattern.tags||[]).slice(0,4).map(tag=>`<span>${esc(tag)}</span>`).join('');
    return `<article class="pattern-card" tabindex="0" role="button" aria-label="Open ${esc(pattern.title)}" data-pattern="${esc(pattern.id)}">
      <div class="card-meta"><span>${esc(pattern.index)} / ${esc((pattern.family||[])[0]||'pattern')}</span><span>${esc(pattern.status||'production')}</span></div>
      <div class="preview-shell">
        <iframe src="${esc(pattern.preview||pattern.live)}" title="${esc(pattern.title)} preview" loading="lazy" tabindex="-1"></iframe>
        <div class="preview-shade"></div><div class="preview-badge">Open pattern ↗</div>
      </div>
      <div class="card-body">
        <div><h3>${esc(pattern.title)}</h3><p>${esc(pattern.description)}</p></div>
        <div class="tag-list">${tags}</div>
      </div>
    </article>`;
  }

  function render(){
    const items=filtered();
    resultCount.textContent=`${String(items.length).padStart(2,'0')} ${items.length===1?'result':'results'}`;
    grid.innerHTML=items.length?items.map(card).join(''):`<div class="empty">No matching production pattern yet.</div>`;
  }

  function showPattern(pattern){
    activePattern=pattern;
    detailIndex.textContent=pattern.index||'001';
    detailFamily.textContent=(pattern.family||[]).slice(0,3).join(' / ').toUpperCase();
    detailTitle.textContent=pattern.title;
    detailDescription.textContent=pattern.description||'';
    primitiveList.innerHTML=(pattern.primitives||[]).map(p=>`<div class="primitive-row"><span class="primitive-chip">${esc(p.name)}</span><p>${esc(p.description)}</p></div>`).join('');
    bestFor.textContent=(pattern.bestFor||[]).join(' · ');
    stack.textContent=(pattern.stack||[]).join(' / ');
    openLive.href=pattern.live;
    openSource.href=pattern.source||pattern.live;
    detailFrame.src=pattern.live;
    patternDialog.showModal();
  }

  function closePattern(){
    if(patternDialog.open)patternDialog.close();
    detailFrame.src='about:blank';
  }

  filters.addEventListener('click',event=>{
    const button=event.target.closest('[data-filter]');
    if(!button)return;
    activeFilter=button.dataset.filter;
    filters.querySelectorAll('.filter').forEach(el=>el.classList.toggle('active',el===button));
    render();
  });
  searchInput.addEventListener('input',render);
  grid.addEventListener('click',event=>{
    const el=event.target.closest('[data-pattern]');
    if(!el)return;
    const pattern=library.find(p=>p.id===el.dataset.pattern);
    if(pattern)showPattern(pattern);
  });
  grid.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const el=event.target.closest('[data-pattern]');
    if(!el)return;
    event.preventDefault();
    const pattern=library.find(p=>p.id===el.dataset.pattern);
    if(pattern)showPattern(pattern);
  });

  document.querySelector('[data-close-dialog]').addEventListener('click',closePattern);
  patternDialog.addEventListener('click',event=>{if(event.target===patternDialog)closePattern();});
  patternDialog.addEventListener('cancel',event=>{event.preventDefault();closePattern();});

  usePattern.addEventListener('click',()=>{
    closePattern();
    briefOutput.hidden=true;
    useDialog.showModal();
  });
  document.querySelector('[data-close-use]').addEventListener('click',()=>useDialog.close());
  useDialog.addEventListener('click',event=>{if(event.target===useDialog)useDialog.close();});

  useForm.addEventListener('submit',event=>{
    event.preventDefault();
    const data=Object.fromEntries(new FormData(useForm).entries());
    const p=activePattern;
    const brief=`BUILD FROM WEB MOTION LIBRARY\n\nPattern: ${p.title} [${p.index}]\nLive reference: ${new URL(p.live,location.href).href}\n\nClient / brand: ${data.brand}\nProduct / offer: ${data.product}\nIndustry: ${data.industry||'Not specified'}\nArt direction: ${data.direction}\n\nPreserve these interaction primitives:\n${(p.primitives||[]).map(x=>`- ${x.name}: ${x.description}`).join('\n')}\n\nChange for this build:\n${data.changes||'- Replace brand, copy, product asset, palette and feature content while preserving the interaction grammar.'}\n\nAcceptance:\n- Keep one dominant focal idea per viewport.\n- Preserve readable hierarchy at 390x844, 768x1024 and 1440x900.\n- Recreate assets rather than hotlinking unstable third-party media.\n- Reduced motion must remain usable.\n- Publish the demo in its own subfolder in louisalviss/valentine.\n- Do not copy the reference surface literally when a better brand-specific composition is possible.`;
    briefText.textContent=brief;
    briefOutput.hidden=false;
    briefOutput.scrollIntoView({behavior:'smooth',block:'nearest'});
  });

  copyBrief.addEventListener('click',async()=>{
    const text=briefText.textContent;
    try{await navigator.clipboard.writeText(text);copyBrief.textContent='Copied';}
    catch{const range=document.createRange();range.selectNodeContents(briefText);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);document.execCommand('copy');copyBrief.textContent='Copied';}
    setTimeout(()=>copyBrief.textContent='Copy brief',1200);
  });

  document.getElementById('openAbout').addEventListener('click',()=>aboutDialog.showModal());
  document.querySelector('[data-close-about]').addEventListener('click',()=>aboutDialog.close());
  aboutDialog.addEventListener('click',event=>{if(event.target===aboutDialog)aboutDialog.close();});

  async function load(){
    try{
      const response=await fetch('./library.json',{cache:'no-store'});
      if(!response.ok)throw new Error('library');
      const data=await response.json();
      if(Array.isArray(data.patterns)&&data.patterns.length)library=data.patterns;
    }catch{}
    hydrateStats();
    render();
  }
  load();
})();
