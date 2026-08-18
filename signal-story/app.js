(()=>{
const c=document.getElementById('c'),x=c.getContext('2d'),q=id=>document.getElementById(id);
const hero=q('hero'),clock=q('clock'),progress=q('progress'),chargeEl=q('charge'),num=q('num'),tag=q('tag'),title=q('title'),desc=q('desc'),task=q('task');
const chapters=[
['BLACKOUT','The road wakes alone.','Scroll into the blackout and find the first relay.','SCROLL TO DRIVE','04:17'],
['WIND FARM','Wake the ridge.','Drag sideways until the frozen turbines turn.','DRAG SIDEWAYS TO START THE WIND','04:31'],
['FLOODED VILLAGE','Water has cut the road.','Hold the screen to open the spill gate. Houses behind you stay lit.','PRESS AND HOLD TO DRAIN THE ROAD','04:46'],
['CANYON','Look back.','The grid behind you is still alive. Your earlier actions remain visible in the world.','KEEP DRIVING · LOOK BACK','05:04'],
['DEAD FOREST','The old road remembers.','Sweep across the screen. Fireflies reconstruct the lost path and revive its memory.','SWEEP TO REBUILD THE MEMORY PATH','05:27'],
['OBSERVATORY','Send it before dawn.','Restore every relay, then hold to charge the mountain transmitter.','HOLD TO TRANSMIT','05:44']
];
let W=0,H=0,D=1,last=0,t=0,p=0,s=0,down=false,mx=.5,lx=.5,drag=0,sweep=0;
const st={wind:false,flood:false,canyon:false,forest:false,gate:0,charge:0,done:false};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,m)=>a+(b-a)*m;
function resize(){D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*D;c.height=H*D;x.setTransform(D,0,0,D,0,0)}
resize();addEventListener('resize',resize,{passive:true});
addEventListener('scroll',()=>{p=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight),0,1)},{passive:true});
addEventListener('pointerdown',e=>{down=true;mx=lx=e.clientX/W});
addEventListener('pointerup',()=>down=false);addEventListener('pointercancel',()=>down=false);
addEventListener('pointermove',e=>{const n=clamp(e.clientX/W,0,1);if(down){drag+=Math.abs(n-lx)*5;sweep+=Math.abs(n-lx)*W}lx=mx=n});
function sec(v){return v<.14?0:v<.30?1:v<.46?2:v<.62?3:v<.80?4:5}
function all(){return st.wind&&st.flood&&st.canyon&&st.forest}
function poly(a){x.beginPath();x.moveTo(a[0][0],a[0][1]);for(let i=1;i<a.length;i++)x.lineTo(a[i][0],a[i][1]);x.closePath();x.fill()}
function updateUI(k){const d=chapters[k];num.textContent=String(k+1).padStart(2,'0')+' / 06';tag.textContent=d[0];title.textContent=d[1];desc.textContent=d[2];clock.textContent=st.done?'05:52':d[4];hero.classList.toggle('hide',p>.14);progress.style.width=(p*100).toFixed(1)+'%';chargeEl.style.width=(st.charge*100).toFixed(0)+'%';let txt=d[3];if(k===5&&!all())txt='RESTORE EVERY RELAY FIRST';if(st.done)txt='TRANSMISSION RECEIVED · 05:52';task.textContent=txt}
function background(k){let top='#071018',bot='#17232d';if(k===1&&st.wind){top='#17364d';bot='#263c46'}if(k===2&&st.flood){top='#294c5d';bot='#33493d'}if(k===4&&st.forest){top='#203a37';bot='#26362b'}if(k===5&&st.done){top='#02050d';bot='#071018'}const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(0,0,W,H);for(let j=0;j<3;j++){const y=H*(.5+j*.09),amp=28+j*9;x.fillStyle=['#172733','#20323e','#2b3b44'][j];x.beginPath();x.moveTo(0,H);x.lineTo(0,y);for(let xx=0;xx<W;xx+=20)x.lineTo(xx,y+Math.sin(j+xx*.01+t*.03)*amp);x.lineTo(W,H);x.fill()}}
function road(){const bend=(mx-.5)*28+Math.sin(t+s*14)*4,ty=H*.45,by=H*1.02,tx=W*.5+bend*.2,bx=W*.5+bend,tw=W*.07,bw=W*.58;x.fillStyle='#899297';poly([[tx-tw,ty],[bx-bw,by],[bx+bw,by],[tx+tw,ty]]);x.fillStyle='#353f46';poly([[tx-tw*.84,ty],[bx-bw*.9,by],[bx+bw*.9,by],[tx+tw*.84,ty]]);for(let i=0;i<20;i++){const z=(i+(t*(down?4:2.2)%1))/20,e=z*z,yy=lerp(ty,by,e),xx=lerp(tx,bx,z);x.fillStyle='#efe8c4';x.fillRect(xx-3,yy,6,lerp(5,30,e))}}
function poles(){const on=[st.wind,st.flood,st.canyon,st.forest];for(const side of[-1,1])for(let i=0;i<8;i++){const z=i/7,yy=lerp(H*.47,H*.86,z*z),xx=lerp(W*.5+side*W*.12,W*.5+side*W*.42,z),h=lerp(18,58,z);x.strokeStyle='#65717b';x.lineWidth=3;x.beginPath();x.moveTo(xx,yy);x.lineTo(xx,yy-h);x.stroke();const id=Math.min(3,Math.floor(z*4));if(on[id]){x.fillStyle='rgba(220,255,144,.9)';x.beginPath();x.arc(xx,yy-h,3+z*3,0,Math.PI*2);x.fill()}}}
function chapterFX(k){
if(k===1||st.wind){const spin=st.wind?t*4:drag*2;for(let i=0;i<4;i++){const xx=W*(.2+i*.17),yy=H*.49,h=80+i*12;x.strokeStyle='#a4b0b8';x.lineWidth=4;x.beginPath();x.moveTo(xx,yy);x.lineTo(xx,yy-h);x.stroke();for(let j=0;j<3;j++){const a=spin+j*Math.PI*2/3;x.beginPath();x.moveTo(xx,yy-h);x.lineTo(xx+Math.cos(a)*32,yy-h+Math.sin(a)*32);x.stroke()}}}
if(k===2||st.flood){const water=st.flood?.12:clamp(1-st.gate,.2,1);for(let i=0;i<7;i++){const xx=W*.06+i*W*.1,h=28+(i%3)*15;x.fillStyle='#2b3942';x.fillRect(xx,H*.67-h,34,h);if(st.flood){x.fillStyle='#ffe39a88';x.fillRect(xx+8,H*.67-h+8,5,5)}}x.fillStyle=`rgba(80,135,165,${.3+.3*water})`;x.fillRect(0,H*.66,W*.65,90*water)}
if(k===3){x.strokeStyle='#dcff90';x.lineWidth=3;x.beginPath();for(let i=0;i<6;i++){const xx=W*(.15+i*.14),yy=H*(.58-Math.sin(i*.9)*.1);i?x.lineTo(xx,yy):x.moveTo(xx,yy)}x.stroke();x.fillStyle='rgba(220,255,144,.08)';x.fillRect(W*.60,H*.12,W*.30,H*.12)}
if(k===4||st.forest){const a=st.forest?1:clamp(sweep/420,0,1);for(let i=0;i<35;i++){x.fillStyle=`rgba(220,255,144,${.08+a*.7})`;x.beginPath();x.arc((i*83+t*40)%W,H*.45+Math.sin(i+t)*40,2+a*2,0,Math.PI*2);x.fill()}}
if(k===5){x.fillStyle='#d2d9de';x.beginPath();x.arc(W*.82,H*.54,32,Math.PI,0);x.fill();if(st.charge>0){x.strokeStyle='#dcff90';x.lineWidth=4;x.beginPath();x.moveTo(W*.82,H*.50);x.lineTo(W*.82,H*.14);x.stroke()}}
if(st.done){x.fillStyle='rgba(3,8,14,.93)';x.fillRect(0,0,W,H);x.strokeStyle='#dcff90';x.lineWidth=3;x.beginPath();for(let i=0;i<10;i++){const xx=lerp(W*.1,W*.9,i/9),yy=H*.52+Math.sin(i*.9)*H*.1;i?x.lineTo(xx,yy):x.moveTo(xx,yy)}x.stroke();x.fillStyle='white';x.font='700 40px sans-serif';x.fillText('Transmission received.',W*.1,H*.25);x.fillStyle='#dcff90';x.font='italic 34px Georgia';x.fillText('05:52',W*.1,H*.33)}}
function loop(ts){if(!last)last=ts;const dt=Math.min(.033,(ts-last)/1000);last=ts;t+=dt;s=lerp(s,p,.08);const k=sec(s);if(k>=3)st.canyon=true;if(k===1&&!st.wind){drag=Math.max(0,drag-dt*.1);if(drag>1.3)st.wind=true}if(k===2&&!st.flood){st.gate=down?clamp(st.gate+dt*.8,0,1):Math.max(0,st.gate-dt*.3);if(st.gate>.95)st.flood=true}if(k===4&&!st.forest){sweep=Math.max(0,sweep-dt*25);if(sweep>420)st.forest=true}if(k===5&&all()&&!st.done){st.charge=down?clamp(st.charge+dt*.3,0,1):Math.max(0,st.charge-dt*.1);if(st.charge>=1)st.done=true}updateUI(k);background(k);road();poles();chapterFX(k);requestAnimationFrame(loop)}requestAnimationFrame(loop);
})();
