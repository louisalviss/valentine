(()=>{
  const story=document.getElementById('story'),stage=document.getElementById('stage'),paper=document.getElementById('paper'),heroCopy=document.getElementById('heroCopy'),heroBuy=document.getElementById('heroBuy'),product=document.getElementById('productWrap'),halo=document.getElementById('halo'),detail=document.getElementById('detailCopy'),material=document.getElementById('materialNote'),sectionIndex=document.getElementById('sectionIndex'),acoustic=document.getElementById('acousticTitle'),tags=[...document.querySelectorAll('.tag')],railBar=document.getElementById('railBar'),scrollHint=document.getElementById('scrollHint');
  let target=0,current=0,raf=0;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const seg=(p,a,b)=>smooth((p-a)/(b-a));
  const qa=new URLSearchParams(location.search).get('frame');
  const fixed=qa!==null?clamp(parseFloat(qa)||0):null;

  // Readability failsafe: product should travel around copy, never visually over it.
  heroCopy.style.zIndex='12';
  if(detail.parentElement) detail.parentElement.style.zIndex='12';
  if(acoustic.parentElement) acoustic.parentElement.style.zIndex='12';

  function scrollProgress(){
    if(fixed!==null)return fixed;
    const r=story.getBoundingClientRect(),d=story.offsetHeight-innerHeight;
    return d>0?clamp(-r.top/d):0;
  }

  function poseRect(pose){
    const mobile=innerWidth<=760;
    const maxW=mobile?430:560;
    const w=Math.min(innerWidth*(pose.w/100),maxW);
    const h=w*1.25;
    const cx=innerWidth*(pose.x/100),cy=innerHeight*(pose.y/100);
    return {left:cx-w/2,right:cx+w/2,top:cy-h/2,bottom:cy+h/2,w,h};
  }

  function overlaps(a,b,gap){
    return !(a.right+gap<=b.left||a.left-gap>=b.right||a.bottom+gap<=b.top||a.top-gap>=b.bottom);
  }

  function avoidText(pose,textEl,prefer='right'){
    if(!textEl)return pose;
    const text=textEl.getBoundingClientRect();
    if(!text.width||!text.height)return pose;
    const mobile=innerWidth<=760;
    const gap=mobile?14:28;
    const edge=mobile?10:22;
    let box=poseRect(pose);
    if(!overlaps(box,text,gap))return pose;

    const rightX=text.right+gap+box.w/2;
    const leftX=text.left-gap-box.w/2;
    const rightFits=rightX+box.w/2<=innerWidth-edge;
    const leftFits=leftX-box.w/2>=edge;

    if(prefer==='right'&&rightFits) pose.x=rightX/innerWidth*100;
    else if(prefer==='left'&&leftFits) pose.x=leftX/innerWidth*100;
    else if(rightFits) pose.x=rightX/innerWidth*100;
    else if(leftFits) pose.x=leftX/innerWidth*100;

    box=poseRect(pose);
    if(!overlaps(box,text,gap))return pose;

    // Narrow screens often have no horizontal lane wide enough. In that case,
    // move the object below/above the active copy rather than crossing through it.
    const belowY=text.bottom+gap+box.h/2;
    const aboveY=text.top-gap-box.h/2;
    const belowOverflow=belowY+box.h/2-innerHeight;
    const aboveOverflow=edge-(aboveY-box.h/2);
    if(belowOverflow<=Math.max(30,box.h*.16)||belowOverflow<=aboveOverflow){
      pose.y=belowY/innerHeight*100;
    }else{
      pose.y=aboveY/innerHeight*100;
    }
    return pose;
  }

  function productState(p){
    const mobile=innerWidth<=760;
    let pose;

    // 01 / Hero: keep the product in the right-hand visual lane.
    if(p<.39){
      const t=seg(p,.20,.39);
      pose={
        x:mix(mobile?72:69,mobile?84:76,t),
        y:mix(mobile?67:50,mobile?70:51,t),
        w:mix(mobile?72:37,mobile?66:42,t),
        rot:mix(-4,2,t),
        scale:mix(.96,1.04,t)
      };
      pose=avoidText(pose,heroCopy,'right');
    }
    // 02 / Form: deliberately HOLD on the right while detail copy is readable.
    else if(p<.69){
      const t=seg(p,.39,.58);
      pose={
        x:mix(mobile?84:76,mobile?88:78,t),
        y:mix(mobile?70:51,mobile?66:51,t),
        w:mix(mobile?66:42,mobile?52:40,t),
        rot:mix(2,1,t),
        scale:mix(1.04,1.00,t)
      };
      pose=avoidText(pose,detail,'right');
    }
    // Handoff: only cross the canvas after detail copy has nearly faded.
    else if(p<.82){
      const t=seg(p,.69,.82);
      pose={
        x:mix(mobile?88:78,mobile?31:27,t),
        y:mix(mobile?66:51,mobile?69:59,t),
        w:mix(mobile?52:40,mobile?62:30,t),
        rot:mix(1,-7,t),
        scale:mix(1,.93,t)
      };
      // First half still respects detail; second half reserves the right side for heading.
      pose=avoidText(pose,t<.45?detail:acoustic,t<.45?'right':'left');
    }
    // 03 / Acoustics: lock to left lane, title owns the right side.
    else{
      pose={x:mobile?31:27,y:mobile?69:59,w:mobile?62:30,rot:-7,scale:.93};
      pose=avoidText(pose,acoustic,'left');
    }

    product.style.left=pose.x+'%';
    product.style.top=pose.y+'%';
    product.style.width=pose.w+'vw';
    product.style.maxWidth=mobile?'430px':'560px';
    product.style.transform=`translate(-50%,-50%) rotate(${pose.rot}deg) scale(${pose.scale})`;

    halo.style.left=pose.x+'%';
    halo.style.top=pose.y+'%';
    halo.style.width=(pose.w*1.05)+'vw';
    halo.style.opacity=String(1-seg(p,.24,.39));
  }

  function render(p){
    const wipe=seg(p,.27,.39);
    paper.style.transform=`translateY(${(1-wipe)*100}%)`;
    stage.classList.toggle('light',p>.34);

    const heroOut=1-seg(p,.20,.34);
    heroCopy.style.opacity=heroOut;
    heroCopy.style.transform=innerWidth<=760?`translateY(${-16*seg(p,.18,.34)}px)`:`translateY(calc(-55% - ${18*seg(p,.18,.34)}px))`;
    heroBuy.style.opacity=String(1-seg(p,.21,.33));
    heroBuy.style.pointerEvents=p<.3?'auto':'none';

    const dIn=seg(p,.34,.43),dOut=1-seg(p,.61,.73),dOp=dIn*dOut;
    detail.style.opacity=dOp;
    detail.style.transform=innerWidth<=760?`translateY(${mix(18,0,dIn)-10*(1-dOut)}px)`:`translateY(calc(-50% + ${mix(20,0,dIn)-12*(1-dOut)}px))`;
    material.style.opacity=String(dOp*.9);
    sectionIndex.style.opacity=String(dOp*.9);

    const aIn=seg(p,.69,.79);
    acoustic.style.opacity=aIn;
    acoustic.style.transform=innerWidth<=760?`translateY(${mix(18,0,aIn)}px)`:`translateY(calc(-56% + ${mix(22,0,aIn)}px))`;
    tags.forEach((el,i)=>{
      const o=seg(p,.73+i*.025,.82+i*.025);
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