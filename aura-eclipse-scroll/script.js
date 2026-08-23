(()=>{
  const story=document.getElementById('story'),stage=document.getElementById('stage'),paper=document.getElementById('paper'),heroCopy=document.getElementById('heroCopy'),heroBuy=document.getElementById('heroBuy'),product=document.getElementById('productWrap'),halo=document.getElementById('halo'),detail=document.getElementById('detailCopy'),material=document.getElementById('materialNote'),sectionIndex=document.getElementById('sectionIndex'),acoustic=document.getElementById('acousticTitle'),tags=[...document.querySelectorAll('.tag')],railBar=document.getElementById('railBar'),scrollHint=document.getElementById('scrollHint');
  let target=0,current=0,raf=0; const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)); const mix=(a,b,t)=>a+(b-a)*t; const smooth=t=>{t=clamp(t);return t*t*(3-2*t)}; const seg=(p,a,b)=>smooth((p-a)/(b-a));
  const qa=new URLSearchParams(location.search).get('frame'); const fixed=qa!==null?clamp(parseFloat(qa)||0):null;
  function scrollProgress(){if(fixed!==null)return fixed;const r=story.getBoundingClientRect(),d=story.offsetHeight-innerHeight;return d>0?clamp(-r.top/d):0}
  function productState(p){
    const mobile=innerWidth<=760; let x,y,w,rot,scale;
    if(p<.39){const t=seg(p,.20,.39);x=mix(mobile?55:66,mobile?70:74,t);y=mix(mobile?65:50,mobile?68:51,t);w=mix(mobile?82:38,mobile?96:45,t);rot=mix(-4,2,t);scale=mix(.96,1.07,t)}
    else if(p<.72){const t=seg(p,.58,.72);x=mix(mobile?70:74,mobile?52:30,t);y=mix(mobile?68:51,mobile?67:58,t);w=mix(mobile?96:45,mobile?70:31,t);rot=mix(2,-7,t);scale=mix(1.07,.93,t)}
    else{x=mobile?52:30;y=mobile?67:58;w=mobile?70:31;rot=-7;scale=.93}
    product.style.left=x+'%';product.style.top=y+'%';product.style.width=w+'vw';product.style.maxWidth=mobile?'430px':'560px';product.style.transform=`translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`;
    halo.style.left=x+'%';halo.style.top=y+'%';halo.style.width=(w*1.05)+'vw';halo.style.opacity=String(1-seg(p,.24,.39));
  }
  function render(p){
    const wipe=seg(p,.27,.39);paper.style.transform=`translateY(${(1-wipe)*100}%)`;stage.classList.toggle('light',p>.34);
    const heroOut=1-seg(p,.20,.34);heroCopy.style.opacity=heroOut;heroCopy.style.transform=innerWidth<=760?`translateY(${-16*seg(p,.18,.34)}px)`:`translateY(calc(-55% - ${18*seg(p,.18,.34)}px))`;heroBuy.style.opacity=String(1-seg(p,.21,.33));heroBuy.style.pointerEvents=p<.3?'auto':'none';
    const dIn=seg(p,.34,.43),dOut=1-seg(p,.61,.73),dOp=dIn*dOut;detail.style.opacity=dOp;detail.style.transform=innerWidth<=760?`translateY(${mix(18,0,dIn)-10*(1-dOut)}px)`:`translateY(calc(-50% + ${mix(20,0,dIn)-12*(1-dOut)}px))`;material.style.opacity=String(dOp*.9);sectionIndex.style.opacity=String(dOp*.9);
    const aIn=seg(p,.69,.79);acoustic.style.opacity=aIn;acoustic.style.transform=innerWidth<=760?`translateY(${mix(18,0,aIn)}px)`:`translateY(calc(-56% + ${mix(22,0,aIn)}px))`;
    tags.forEach((el,i)=>{const o=seg(p,.73+i*.025,.82+i*.025);el.style.opacity=o;el.style.transform=`translateY(${mix(9,0,o)}px)`});
    productState(p);railBar.style.transform=`scaleY(${p})`;scrollHint.style.opacity=String(1-seg(p,.03,.14));
  }
  function tick(){target=scrollProgress();current+= (target-current)*(fixed!==null?1:.16);if(Math.abs(target-current)<.0001)current=target;render(current);raf=requestAnimationFrame(tick)}
  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>{const p=parseFloat(b.dataset.jump)||0;const d=story.offsetHeight-innerHeight;scrollTo({top:story.offsetTop+d*p,behavior:'smooth'})}));
  addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();scrollBy({top:innerHeight*.72,behavior:'smooth'})}if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();scrollBy({top:-innerHeight*.72,behavior:'smooth'})}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(tick)});addEventListener('resize',()=>render(current),{passive:true});
  raf=requestAnimationFrame(tick);
})();