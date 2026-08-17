const root=document.documentElement;
const canvas=document.querySelector('#scene');
const scan=document.querySelector('#scan');
const fx=document.querySelector('#fxLayer')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'fxLayer',className:'fx-layer'});
const hint=document.querySelector('#touchHint')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'touchHint',className:'touch-hint',innerHTML:'<b>TAP / DRAG</b><span>disturb the field</span>'});
let tx=.68,ty=.42,x=tx,y=ty,energy=0,lastAuto=performance.now();
function setPoint(px,py){tx=px/innerWidth;ty=py/innerHeight;root.style.setProperty('--px',`${tx*100}%`);root.style.setProperty('--py',`${ty*100}%`)}
function burst(px,py,auto=false){setPoint(px,py);energy=1;hint.classList.add('is-gone');scan?.classList.add('is-active','is-pulse');scan?.style.setProperty('--scan-y',`${Math.max(8,Math.min(92,py/innerHeight*100))}%`);setTimeout(()=>scan?.classList.remove('is-active','is-pulse'),720);
 const ring=document.createElement('i');ring.className='shockwave';ring.style.cssText=`left:${px}px;top:${py}px`;fx.appendChild(ring);setTimeout(()=>ring.remove(),1200);
 for(let i=0;i<(innerWidth<760?22:34);i++){const s=document.createElement('b');s.className='burst-particle';const a=Math.random()*Math.PI*2,d=45+Math.random()*(innerWidth<760?190:280);s.style.cssText=`left:${px}px;top:${py}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;--sz:${1+Math.random()*4}px;--delay:${Math.random()*80}ms`;fx.appendChild(s);setTimeout(()=>s.remove(),1050)}
 if(!auto) lastAuto=performance.now();
}
addEventListener('pointermove',e=>setPoint(e.clientX,e.clientY),{passive:true});
addEventListener('pointerdown',e=>burst(e.clientX,e.clientY),{passive:true});
addEventListener('touchmove',e=>{const t=e.touches[0];if(t)setPoint(t.clientX,t.clientY)},{passive:true});
function loop(now){x+=(tx-x)*.085;y+=(ty-y)*.085;energy*=.92;root.style.setProperty('--tilt-x',`${(x-.5)*18}deg`);root.style.setProperty('--tilt-y',`${-(y-.5)*12}deg`);root.style.setProperty('--scene-x',`${(x-.5)*-42}px`);root.style.setProperty('--scene-y',`${(y-.5)*-28}px`);root.style.setProperty('--energy',energy.toFixed(3));if(now-lastAuto>7200){burst(innerWidth*(.25+Math.random()*.5),innerHeight*(.25+Math.random()*.42),true);lastAuto=now}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
setTimeout(()=>burst(innerWidth*.7,innerHeight*.4,true),3600);
