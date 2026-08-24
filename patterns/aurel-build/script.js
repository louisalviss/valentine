(()=>{
  const wrap=document.getElementById('build');
  const phaseNo=document.getElementById('phaseNo');
  const phaseName=document.getElementById('phaseName');
  const phaseTitle=document.getElementById('phaseTitle');
  const phaseDesc=document.getElementById('phaseDesc');
  const chips=document.getElementById('chips');
  const copy=document.getElementById('buildCopy');
  const bar=document.getElementById('bar');
  const pct=document.getElementById('pct');
  const visualNo=document.getElementById('visualNo');
  const visualName=document.getElementById('visualName');
  const frames=[...document.querySelectorAll('.stage-image')];
  const steps=[...document.querySelectorAll('.stage-step')];

  const data=[
    ['01','SITE','Begin with the ground.','A calm datum establishes the footprint before structure appears.',['Datum','Foundation']],
    ['02','STRUCTURE','Give it a frame.','The structural rhythm rises and makes the future volume immediately legible.',['Steel frame','Structural grid']],
    ['03','CORE + ENCLOSURE','Define the heart.','Solid core walls and enclosure create the first inhabitable rooms around the courtyard.',['Stone core','Enclosure']],
    ['04','ROOF + FINISHES','Shape the silhouette.','The dark floating roof and material palette turn the framework into architecture.',['Floating roof','Warm finishes']],
    ['05','LIFE','Make it a place.','Water, planting, furniture and warm light complete the same house shown in the hero.',['Landscape','Water + light']]
  ];

  const clamp=v=>Math.max(0,Math.min(1,v));
  let last=-1;
  function setStage(stage){
    if(stage===last)return;
    last=stage;
    copy.classList.add('change');
    setTimeout(()=>{
      const d=data[stage];
      phaseNo.textContent=d[0];phaseName.textContent=d[1];phaseTitle.textContent=d[2];phaseDesc.textContent=d[3];
      chips.innerHTML=d[4].map(v=>`<span>${v}</span>`).join('');
      visualNo.textContent=`${d[0]} / 05`;visualName.textContent=d[1];
      copy.classList.remove('change');
    },90);
    frames.forEach((f,i)=>f.classList.toggle('active',i===stage));
    steps.forEach((s,i)=>{s.classList.toggle('active',i===stage);s.classList.toggle('done',i<stage)});
  }

  function render(){
    const r=wrap.getBoundingClientRect();
    const max=Math.max(1,wrap.offsetHeight-innerHeight);
    const p=clamp(-r.top/max);
    const stage=Math.min(4,Math.floor(p*5));
    setStage(stage);
    bar.style.width=`${p*100}%`;
    pct.textContent=`${Math.round(p*100)}%`;
    requestAnimationFrame(render);
  }

  steps.forEach((btn,i)=>btn.addEventListener('click',()=>{
    const target=wrap.offsetTop+(wrap.offsetHeight-innerHeight)*(i/5+.02);
    window.scrollTo({top:target,behavior:'smooth'});
  }));

  setStage(0);
  render();
})();
