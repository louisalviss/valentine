(()=>{
  const heroGlow=document.getElementById('heroGlow');
  setTimeout(()=>heroGlow.style.opacity=.82,260);

  const wrap=document.getElementById('story');
  const phaseEl=document.getElementById('phase');
  const numEl=document.getElementById('num');
  const titleEl=document.getElementById('title');
  const descEl=document.getElementById('desc');
  const chipsEl=document.getElementById('chips');
  const bar=document.getElementById('bar');
  const pct=document.getElementById('pct');
  const ticks=[...document.querySelectorAll('.tick')];
  const shell=document.getElementById('modelShell');
  const storyGlow=document.getElementById('storyGlow');

  const parts={
    base:[...document.querySelectorAll('.part-base, .part-deck, .part-pool')],
    frame:[...document.querySelectorAll('.part-living, .part-gallery, .part-core, .part-soffit')],
    roof:[...document.querySelectorAll('.part-roof-main, .part-roof-wing')],
    life:[...document.querySelectorAll('.part-land-a, .part-land-b, .part-land-c, .part-tree-a, .part-tree-b')]
  };

  const data=[
    ['Phase 01','01 / 05','Podium','The project starts as landscape and stone datum. The base is low, horizontal and calm, giving the whole house a cleaner proportion than the previous stacked-box version.',['Low-slung massing','Stone datum']],
    ['Phase 02','02 / 05','Living level','A long glass pavilion slides onto the podium. The main living space stays transparent and light instead of bulky.',['Glass pavilion','Open plan']],
    ['Phase 03','03 / 05','Core','A compact stone service block anchors the composition and gives the house weight where it needs it.',['Stone core','Anchored composition']],
    ['Phase 04','04 / 05','Roof','Two thin roof plates arrive last and create the premium architectural silhouette: light, extended and controlled.',['Cantilever roof','Timber soffit']],
    ['Phase 05','05 / 05','Place','Water, trees and warm interior glow turn an object into an atmosphere. This is the real payoff screen.',['Water court','Warm night glow']]
  ];

  function setTransform(el, x, y, z, s, o){
    el.style.transform=`translate3d(${x}px,${y}px,${z}px) scale(${s})`;
    el.style.opacity=o;
  }
  function clamp(v){return Math.max(0,Math.min(1,v))}
  function ease(t){t=clamp(t);return 1-Math.pow(1-t,3)}
  function reveal(progress,start,len){return ease((progress-start)/len)}

  let lastStage=-1;
  function render(){
    const rect=wrap.getBoundingClientRect();
    const total=wrap.offsetHeight-innerHeight;
    const p=clamp(-rect.top/total);
    bar.style.width=(p*100)+'%';
    pct.textContent=Math.round(p*100)+'%';

    const stage=Math.min(4,Math.floor(p*5));
    if(stage!==lastStage){
      lastStage=stage;
      const d=data[stage];
      phaseEl.textContent=d[0];
      numEl.textContent=d[1];
      titleEl.textContent=d[2];
      descEl.textContent=d[3];
      chipsEl.innerHTML=d[4].map(v=>`<span class="chip">${v}</span>`).join('');
      ticks.forEach((t,i)=>t.classList.toggle('on',i===stage));
    }

    const a=reveal(p,0,.18);
    const b=reveal(p,.18,.18);
    const c=reveal(p,.38,.18);
    const d=reveal(p,.58,.18);
    const e=reveal(p,.78,.16);

    parts.base.forEach((el,i)=>setTransform(el,0,70*(1-a),18*(1-a),.92+.08*a,.05+.95*a));
    document.querySelector('.part-pool').style.filter=`saturate(${.7+a*.3})`;

    setTransform(document.querySelector('.part-living'),180*(1-b),-28*(1-b),70*(1-b),.92+.08*b,.02+.98*b);
    setTransform(document.querySelector('.part-gallery'),165*(1-b),-8*(1-b),86*(1-b),.92+.08*b,.02+.98*b);
    setTransform(document.querySelector('.part-soffit'),110*(1-b),-24*(1-b),60*(1-b),.9+.1*b,.03+.97*b);

    setTransform(document.querySelector('.part-core'),-120*(1-c),-20*(1-c),78*(1-c),.92+.08*c,.02+.98*c);

    setTransform(document.querySelector('.part-roof-main'),0,-190*(1-d),126*(1-d),.9+.1*d,.02+.98*d);
    setTransform(document.querySelector('.part-roof-wing'),70*(1-d),-160*(1-d),130*(1-d),.9+.1*d,.02+.98*d);

    [document.querySelector('.part-land-a'),document.querySelector('.part-land-b'),document.querySelector('.part-land-c'),document.querySelector('.part-tree-a'),document.querySelector('.part-tree-b')].forEach((el,idx)=>setTransform(el,-40*(1-e),95*(1-e),0,.9+.1*e,.02+.98*e));

    storyGlow.style.opacity=clamp((p-.84)/.12)*.92;
    shell.style.transform=`translateY(${Math.sin(p*Math.PI)*-8}px) rotateZ(${(-1.5+p*1.6)}deg)`;
    shell.style.filter=`drop-shadow(0 28px 34px rgba(31,23,17,${.14+p*.06})) saturate(${.94+p*.16})`;

    requestAnimationFrame(render);
  }
  render();
})();