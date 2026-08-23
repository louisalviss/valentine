(()=>{
  const story=document.getElementById('story'),stage=document.getElementById('stage'),paper=document.getElementById('paper'),heroCopy=document.getElementById('heroCopy'),heroBuy=document.getElementById('heroBuy'),product=document.getElementById('productWrap'),halo=document.getElementById('halo'),detail=document.getElementById('detailCopy'),material=document.getElementById('materialNote'),sectionIndex=document.getElementById('sectionIndex'),acousticStack=document.getElementById('acousticTitle'),detailTitle=document.getElementById('detailTitle'),detailTitleFront=document.getElementById('detailTitleFront'),acousticTitleBase=document.getElementById('acousticTitleBase'),acousticTitleFront=document.getElementById('acousticTitleFront'),heroGhost=document.getElementById('heroGhost'),detailGhost=document.getElementById('detailGhost'),acousticGhost=document.getElementById('acousticGhost'),tags=[...document.querySelectorAll('.tag')],railBar=document.getElementById('railBar'),scrollHint=document.getElementById('scrollHint');
  let target=0,current=0,raf=0;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const seg=(p,a,b)=>smooth((p-a)/(b-a));
  const qa=new URLSearchParams(location.search).get('frame');
  const fixed=qa!==null?clamp(parseFloat(qa)||0):null;

  function scrollProgress(){
    if(fixed!==null)return fixed;
    const r=story.getBoundingClientRect(),d=story.offsetHeight-innerHeight;
    return d>0?clamp(-r.top/d):0;
  }

  function maskTextWithProduct(baseEl,frontEl,boost=1){
    if(!baseEl||!frontEl)return;
    const pr=product.getBoundingClientRect(),tr=baseEl.getBoundingClientRect();
    if(!tr.width||!tr.height)return;
    const cx=pr.left+pr.width/2-tr.left;
    const cy=pr.top+pr.height/2-tr.top;
    const r=Math.min(pr.width,pr.height)*.42*boost;
    frontEl.style.clipPath=`circle(${r}px at ${cx}px ${cy}px)`;
  }

  function productState(p){
    const mobile=innerWidth<=760;
    let x,y,w,rot,scale;
    if(p<.39){
      const t=seg(p,.18,.39);
      x=mix(mobile?55:66,mobile?70:72,t);
      y=mix(mobile?65:50,mobile?68:51,t);
      w=mix(mobile?82:38,mobile?94:44,t);
      rot=mix(-4,2,t);
      scale=mix(.96,1.06,t);
    }else if(p<.70){
      const t=seg(p,.42,.70);
      x=mix(mobile?70:72,mobile?50:43,t);
      y=mix(mobile?68:51,mobile?73:58,t);
      w=mix(mobile?94:44,mobile?72:35,t);
      rot=mix(2,-3,t);
      scale=mix(1.06,.98,t);
    }else if(p<.84){
      const t=seg(p,.70,.84);
      x=mix(mobile?50:43,mobile?50:50,t);
      y=mix(mobile?73:58,mobile?67:60,t);
      w=mix(mobile?72:35,mobile?62:31,t);
      rot=mix(-3,-5,t);
      scale=mix(.98,.94,t);
    }else{
      x=50;y=mobile?67:60;w=mobile?62:31;rot=-5;scale=.94;
    }

    product.style.left=x+'%';
    product.style.top=y+'%';
    product.style.width=w+'vw';
    product.style.maxWidth=mobile?'430px':'560px';
    product.style.transform=`translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`;

    halo.style.left=x+'%';
    halo.style.top=y+'%';
    halo.style.width=(w*1.05)+'vw';
    halo.style.opacity=String(1-seg(p,.24,.39));

    maskTextWithProduct(detailTitle,detailTitleFront,1.05);
    maskTextWithProduct(acousticTitleBase,acousticTitleFront,1.05);
  }

  function render(p){
    const wipe=seg(p,.27,.39);
    paper.style.transform=`translateY(${(1-wipe)*100}%)`;
    stage.classList.toggle('light',p>.34);

    const heroOut=1-seg(p,.20,.35);
    heroCopy.style.opacity=heroOut;
    heroCopy.style.transform=innerWidth<=760?`translateY(${-14*seg(p,.18,.34)}px)`:`translateY(calc(-55% - ${18*seg(p,.18,.34)}px))`;
    heroBuy.style.opacity=String(1-seg(p,.21,.34));
    heroBuy.style.pointerEvents=p<.3?'auto':'none';
    heroGhost.style.opacity=String(.9*(1-seg(p,.23,.38)));
    heroGhost.style.transform=`translate(${mix(0,-2.5,seg(p,0,.36))}vw,-50%)`;

    const dIn=seg(p,.34,.43),dOut=1-seg(p,.62,.75),dOp=dIn*dOut;
    detail.style.opacity=dOp;
    detail.style.transform=innerWidth<=760?`translateY(${mix(18,0,dIn)-8*(1-dOut)}px)`:`translateY(calc(-50% + ${mix(20,0,dIn)-10*(1-dOut)}px))`;
    material.style.opacity=String(dOp*.9);
    sectionIndex.style.opacity=String(dOp*.9);
    detailGhost.style.opacity=String(.95*dIn*dOut);
    detailGhost.style.transform=`translate(${mix(2,-3,seg(p,.39,.72))}vw,-50%)`;

    const aIn=seg(p,.69,.80);
    acousticStack.style.opacity=aIn;
    acousticStack.style.transform=innerWidth<=760?`translateY(${mix(18,0,aIn)}px)`:`translateY(calc(-56% + ${mix(22,0,aIn)}px))`;
    acousticGhost.style.opacity=String(.9*aIn);
    acousticGhost.style.transform=`translate(${mix(-2,2.5,seg(p,.70,1))}vw,-50%)`;

    tags.forEach((el,i)=>{
      const o=seg(p,.74+i*.025,.83+i*.023);
      el.style.opacity=o;
      el.style.transform=`translateY(${mix(9,0,o)}px)`;
    });

    productState(p);
    railBar.style.transform=`scaleY(${p})`;
    scrollHint.style.opacity=String(1-seg(p,.03,.14));
  }

  function tick(){
    target=scrollProgress();
    current+=(target-current)*(fixed!==null?1:.16);
    if(Math.abs(target-current)<.0001)current=target;
    render(current);
    raf=requestAnimationFrame(tick);
  }

  document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>{
    const p=parseFloat(b.dataset.jump)||0,d=story.offsetHeight-innerHeight;
    scrollTo({top:story.offsetTop+d*p,behavior:'smooth'});
  }));
  addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();scrollBy({top:innerHeight*.72,behavior:'smooth'});}
    if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();scrollBy({top:-innerHeight*.72,behavior:'smooth'});}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(tick);
  });
  addEventListener('resize',()=>render(current),{passive:true});
  raf=requestAnimationFrame(tick);
})();