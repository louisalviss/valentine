(() => {
  const story = document.querySelector('.story');
  const portrait = document.querySelector('.portrait');
  const worlds = [...document.querySelectorAll('.world')];
  const hero = document.querySelector('.hero-copy');
  const lens = document.querySelector('.lens-window');
  const product = document.querySelector('.product');
  const productImg = product.querySelector('img');
  const glow = document.querySelector('.product-glow');
  const megaA = document.querySelector('.mega-a');
  const megaB = document.querySelector('.mega-b');
  const megaC = document.querySelector('.mega-c');
  const megaD = document.querySelector('.mega-d');
  const specs = document.querySelector('.specs');
  const copyBlue = document.querySelector('.copy-blue');
  const copyOrange = document.querySelector('.copy-orange');
  const copyPaper = document.querySelector('.copy-paper');
  const orbit = document.querySelector('.orbit');
  const returnCopy = document.querySelector('.return-copy');
  const dots = [...document.querySelectorAll('.rail button')];
  const labelNum = document.querySelector('.chapter-label .num');
  const labelName = document.querySelector('.chapter-label .name');
  const names = ['Portrait','Detach','Orbit','Material','Return'];

  const clamp = (n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const range = (p,a,b)=>clamp((p-a)/(b-a));
  const lerp = (a,b,t)=>a+(b-a)*t;
  const smooth = t=>t*t*(3-2*t);
  const fade = (p,a,b,c,d)=>{
    if(p<a||p>d)return 0;
    if(p<b)return smooth(range(p,a,b));
    if(p<c)return 1;
    return 1-smooth(range(p,c,d));
  };

  let ticking=false;
  function render(){
    ticking=false;
    const rect=story.getBoundingClientRect();
    const total=story.offsetHeight-innerHeight;
    const p=clamp(-rect.top/total);
    const chapter=Math.min(4,Math.floor(p*5+.001));
    const local=(p*5)-chapter;
    document.documentElement.style.setProperty('--local',clamp(local));

    const portraitOp = p < .18 ? 1 : (p > .82 ? range(p,.82,.91) : 0);
    worlds[0].style.opacity = portraitOp;
    worlds[1].style.opacity = fade(p,.14,.22,.37,.45);
    worlds[2].style.opacity = fade(p,.35,.43,.61,.68);
    worlds[3].style.opacity = fade(p,.59,.67,.82,.88);
    worlds[1].style.transform = `scale(${lerp(1.08,1,p)})`;
    worlds[2].style.transform = `translateY(${lerp(8,0,range(p,.35,.5))}%)`;

    const intro=range(p,0,.2);
    portrait.style.transform=`scale(${lerp(1.04,1.42,smooth(intro))}) translate3d(${lerp(0,-6,intro)}%,${lerp(0,2,intro)}%,0)`;
    portrait.style.filter=`saturate(${lerp(1,.45,intro)}) contrast(${lerp(1,1.18,intro)})`;
    hero.style.opacity=1-smooth(range(p,.04,.15));
    hero.style.transform=`translateY(calc(-48% + ${lerp(0,-70,range(p,.02,.18))}px))`;

    const lensIn=range(p,.08,.19), lensOut=range(p,.19,.29);
    lens.style.opacity=Math.min(smooth(lensIn),1-smooth(lensOut));
    lens.style.transform=`translate(-50%,-50%) scale(${lerp(.72,1.26,smooth(lensIn))}) rotate(${lerp(-4,2,lensIn)}deg)`;
    lens.style.borderRadius=`${lerp(42,14,lensIn)}% ${lerp(58,14,lensIn)}% ${lerp(48,14,lensIn)}% ${lerp(52,14,lensIn)}% / ${lerp(53,14,lensIn)}% ${lerp(46,14,lensIn)}% ${lerp(54,14,lensIn)}% ${lerp(47,14,lensIn)}%`;

    let x=0,y=0,s=.34,rz=-3,ry=0,op=0;
    if(p>=.13&&p<.32){
      const t=smooth(range(p,.13,.32));
      x=lerp(22,0,t); y=lerp(-8,0,t); s=lerp(.34,.9,t); rz=lerp(-8,0,t); op=t;
    }else if(p>=.32&&p<.62){
      const t=range(p,.32,.62);
      s=lerp(.9,1.03,Math.sin(t*Math.PI)); ry=lerp(0,360,t); rz=lerp(0,3,t); op=1;
      y=lerp(0,2,Math.sin(t*Math.PI*2));
    }else if(p>=.62&&p<.82){
      const t=smooth(range(p,.62,.82));
      x=lerp(0,17,t); y=lerp(0,-4,t); s=lerp(.92,.62,t); ry=360; rz=lerp(3,-6,t); op=1;
    }else if(p>=.82){
      const t=smooth(range(p,.82,.96));
      x=lerp(17,24,t); y=lerp(-4,-9,t); s=lerp(.62,.34,t); ry=lerp(360,370,t); rz=lerp(-6,-9,t); op=1-range(p,.94,1);
    }
    product.style.opacity=op;
    product.style.transform=`translate3d(calc(-50% + ${x}vw),calc(-50% + ${y}vh),0) scale(${s}) rotateZ(${rz}deg)`;
    productImg.style.transform=`perspective(1100px) rotateY(${ry}deg)`;
    product.style.filter=`drop-shadow(0 ${lerp(18,55,Math.min(1,s))}px ${lerp(24,55,Math.min(1,s))}px rgba(0,0,0,.38))`;
    glow.style.opacity=fade(p,.19,.27,.75,.84)*.78;

    megaA.style.opacity=fade(p,.16,.23,.35,.43);
    megaA.style.transform=`translate3d(${lerp(-8,6,range(p,.16,.43))}vw,0,0)`;
    megaB.style.opacity=fade(p,.18,.25,.36,.44);
    megaB.style.transform=`translate3d(${lerp(7,-4,range(p,.18,.44))}vw,0,0)`;
    specs.style.opacity=fade(p,.22,.29,.38,.45);
    copyBlue.style.opacity=fade(p,.2,.27,.36,.43); copyBlue.style.transform=`translateY(${lerp(35,0,range(p,.2,.28))}px)`;

    megaC.style.opacity=fade(p,.38,.44,.58,.66);
    megaC.style.transform=`translateX(${lerp(-8,2,range(p,.38,.66))}vw)`;
    megaD.style.opacity=fade(p,.4,.47,.59,.67);
    copyOrange.style.opacity=fade(p,.4,.47,.58,.66); copyOrange.style.transform=`translateY(${lerp(-30,0,range(p,.4,.48))}px)`;
    orbit.style.opacity=fade(p,.4,.47,.6,.68); orbit.style.transform=`translate(-50%,-50%) rotateX(72deg) rotateZ(${lerp(0,38,range(p,.4,.68))}deg)`;

    copyPaper.style.opacity=fade(p,.62,.69,.78,.86); copyPaper.style.transform=`translateY(${lerp(30,0,range(p,.62,.7))}px)`;
    returnCopy.style.opacity=range(p,.84,.93); returnCopy.style.transform=`translateY(${lerp(30,0,range(p,.84,.93))}px)`;

    dots.forEach((d,i)=>d.classList.toggle('active',i===chapter));
    labelNum.textContent=`0${chapter+1} / 05`;
    labelName.textContent=names[chapter];
  }
  function request(){if(!ticking){ticking=true;requestAnimationFrame(render)}}
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});
  render();
})();
