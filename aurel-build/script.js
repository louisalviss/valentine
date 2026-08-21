(()=>{
  const wrap=document.getElementById('build');
  const phase=document.getElementById('phase');
  const phaseName=document.getElementById('phaseName');
  const title=document.getElementById('title');
  const desc=document.getElementById('desc');
  const chips=document.getElementById('chips');
  const copy=document.getElementById('buildCopy');
  const bar=document.getElementById('bar');
  const pct=document.getElementById('pct');
  const pulse=document.getElementById('scenePulse');
  const steps=[...document.querySelectorAll('.stage-step')];
  const site=document.getElementById('site');
  const frame=document.getElementById('frame');
  const core=document.getElementById('core');
  const glass=document.getElementById('glassWing');
  const roof=document.getElementById('roofLayer');
  const life=document.getElementById('life');
  const warm=document.getElementById('warmInterior');
  const glow=document.getElementById('nightGlow');
  const callout=document.getElementById('stageCallout');
  const sun=document.getElementById('sun');
  const hills=document.getElementById('hills');
  const shadow=document.getElementById('groundShadow');
  const ripples=document.getElementById('ripples');

  const data=[
    ['01','SITE','Set the ground.','The villa starts as a low stone datum, water court and landscape. Nothing else is visible yet.',['Stone datum','Pool court']],
    ['02','FRAME','Raise the skeleton.','A dark structural frame rises hard from the site. The construction logic becomes unmistakable.',['Steel grid','Structural rhythm']],
    ['03','CORE + GLASS','Make it inhabitable.','The limestone core arrives from the left while the glass pavilion slides in from the right.',['Limestone core','Glass pavilion']],
    ['04','ROOF','Drop the roof.','A single thin roof plane falls into place with a long cantilever and warm timber soffit.',['Floating roof','Deep cantilever']],
    ['05','FINISHED','Turn it into a place.','Trees, water shimmer and warm interior light complete the house. This is the final reveal.',['Landscape','Warm light']]
  ];

  const clamp=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp(t);return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2};
  const seg=(p,start,end)=>ease((p-start)/(end-start));
  function set(el,x,y,s,o){el.style.transform=`translate(${x}px,${y}px) scale(${s})`;el.style.opacity=o}

  let lastStage=-1;
  function updateStage(stage){
    if(stage===lastStage)return;
    lastStage=stage;
    copy.classList.add('change');
    setTimeout(()=>{
      const d=data[stage];
      phase.textContent=d[0];phaseName.textContent=d[1];title.textContent=d[2];desc.textContent=d[3];
      chips.innerHTML=d[4].map(v=>`<span>${v}</span>`).join('');
      copy.classList.remove('change');
    },110);
    steps.forEach((el,i)=>{el.classList.toggle('active',i===stage);el.classList.toggle('done',i<stage)});
    pulse.classList.remove('fire');void pulse.offsetWidth;pulse.classList.add('fire');
  }

  function render(){
    const r=wrap.getBoundingClientRect();
    const max=wrap.offsetHeight-innerHeight;
    const p=clamp(-r.top/max);
    const stage=Math.min(4,Math.floor(p*5));
    updateStage(stage);
    bar.style.width=`${p*100}%`;pct.textContent=`${Math.round(p*100)}%`;

    const a=seg(p,0,.16);
    const b=seg(p,.18,.36);
    const c=seg(p,.38,.56);
    const d=seg(p,.58,.76);
    const e=seg(p,.78,.98);

    set(site,0,85*(1-a),.93+.07*a,.18+.82*a);
    set(frame,0,-320*(1-b),.95+.05*b,.02+.98*b);
    set(core,-310*(1-c),-16*(1-c),.94+.06*c,.02+.98*c);
    set(glass,360*(1-c),28*(1-c),.94+.06*c,.02+.98*c);
    set(roof,0,-390*(1-d),.92+.08*d,.02+.98*d);
    set(life,-70*(1-e),120*(1-e),.92+.08*e,.02+.98*e);

    warm.setAttribute('opacity',(0.2+.68*e).toFixed(2));
    glow.setAttribute('opacity',(0.5*e).toFixed(2));
    callout.setAttribute('opacity',clamp((p-.92)/.06).toFixed(2));
    ripples.style.opacity=(.35+.65*Math.abs(Math.sin(performance.now()/520))*e).toFixed(2);
    sun.setAttribute('opacity',(0.62-.20*e).toFixed(2));
    hills.setAttribute('opacity',(0.72+.12*e).toFixed(2));
    shadow.setAttribute('opacity',(0.08+.08*p).toFixed(2));

    const svg=document.getElementById('houseScene');
    svg.style.transform=`scale(${1+p*.035}) translateY(${Math.sin(p*Math.PI)*-5}px)`;
    requestAnimationFrame(render);
  }

  steps.forEach((button,i)=>button.addEventListener('click',()=>{
    const target=wrap.offsetTop+(wrap.offsetHeight-innerHeight)*(i/5+.02);
    window.scrollTo({top:target,behavior:'smooth'});
  }));
  render();
})();
