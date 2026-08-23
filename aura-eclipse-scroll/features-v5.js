(()=>{
  const story=document.getElementById('story');
  const nav=document.getElementById('featureNav');
  const panel=document.getElementById('featurePanel');
  const buttons=[...document.querySelectorAll('.feature-btn')];
  const indexEl=document.getElementById('featureIndex');
  const statEl=document.getElementById('featureStat');
  const titleEl=document.getElementById('featureTitle');
  const bodyEl=document.getElementById('featureBody');
  const metaA=document.getElementById('featureMetaA');
  const metaB=document.getElementById('featureMetaB');

  if(!story||!nav||!panel||!buttons.length)return;

  const features={
    driver:{
      index:'01 / 05',stat:'40 MM',title:'Titanium-coated driver',
      body:'A rigid low-mass diaphragm delivers faster transient response, cleaner detail and lower distortion across the audible range.',
      metaA:'Fast transient response',metaB:'Low distortion'
    },
    cavity:{
      index:'02 / 05',stat:'RIGID\nCORE',title:'Reinforced acoustic cavity',
      body:'A braced internal chamber suppresses unwanted resonance so bass lands with more control while vocals remain open and sharply separated.',
      metaA:'Resonance control',metaB:'Tighter low end'
    },
    magnet:{
      index:'03 / 05',stat:'HIGH\nFLUX',title:'High-flux neodymium motor',
      body:'A concentrated magnetic field gives the driver stronger control at low volume and more headroom when the mix becomes dense or dynamic.',
      metaA:'Higher sensitivity',metaB:'Dynamic headroom'
    },
    spatial:{
      index:'04 / 05',stat:'360°',title:'Kinetic spatial sound stage',
      body:'Spatial processing expands depth and directional separation without pushing the center image away from the listener.',
      metaA:'Layered depth',metaB:'Directional imaging'
    },
    anc:{
      index:'05 / 05',stat:'−45 DB',title:'Adaptive noise cancellation',
      body:'A multi-microphone cancellation system continuously reshapes its response to reduce low-frequency travel noise and steady environmental hum.',
      metaA:'Adaptive filtering',metaB:'Ambient control'
    }
  };

  let active='driver';
  let swapTimer=0;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const fixedParam=new URLSearchParams(location.search).get('frame');
  const fixed=fixedParam!==null?clamp(parseFloat(fixedParam)||0):null;

  function selectFeature(key,button){
    const data=features[key];
    if(!data||key===active&&button?.classList.contains('active'))return;
    active=key;
    panel.classList.remove('switching');
    void panel.offsetWidth;
    panel.classList.add('switching');
    clearTimeout(swapTimer);

    indexEl.textContent=data.index;
    statEl.textContent=data.stat;
    titleEl.textContent=data.title;
    bodyEl.textContent=data.body;
    metaA.textContent=data.metaA;
    metaB.textContent=data.metaB;

    buttons.forEach(btn=>{
      const on=btn.dataset.feature===key;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
    });

    if(button&&innerWidth<=760){
      button.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    }
    swapTimer=setTimeout(()=>panel.classList.remove('switching'),360);
  }

  buttons.forEach((btn,i)=>{
    btn.setAttribute('aria-pressed',i===0?'true':'false');
    btn.addEventListener('click',()=>selectFeature(btn.dataset.feature,btn));
    btn.addEventListener('keydown',e=>{
      if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
      e.preventDefault();
      const dir=e.key==='ArrowRight'?1:-1;
      const next=buttons[(i+dir+buttons.length)%buttons.length];
      next.focus();
      selectFeature(next.dataset.feature,next);
    });
  });

  function progress(){
    if(fixed!==null)return fixed;
    const r=story.getBoundingClientRect();
    const d=story.offsetHeight-innerHeight;
    return d>0?clamp(-r.top/d):0;
  }

  let queued=false;
  function render(){
    queued=false;
    const p=progress();
    const navIn=smooth((p-.70)/.10);
    const panelIn=smooth((p-.74)/.10);
    nav.style.opacity=navIn;
    nav.style.transform=`translateY(${(1-navIn)*12}px)`;
    panel.style.opacity=panelIn;
    panel.style.transform=`translateY(${(1-panelIn)*18}px) scale(${.985+.015*panelIn})`;
    panel.style.pointerEvents=panelIn>.72?'auto':'none';
    nav.style.pointerEvents=navIn>.72?'auto':'none';
    nav.classList.toggle('ready',navIn>.98);
    panel.classList.toggle('ready',panelIn>.98);
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(render)}

  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  render();
})();