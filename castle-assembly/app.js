import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
const $=s=>document.querySelector(s),canvas=$('#scene'),bar=$('.progress i'),stage=$('#stageNow');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),mobile=()=>innerWidth<760;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.35:1.8));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x08101c,.022);
const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,160);camera.position.set(0,8.5,27);
const world=new THREE.Group(),castle=new THREE.Group(),sky=new THREE.Group();scene.add(world);world.add(castle,sky);
scene.add(new THREE.HemisphereLight(0xbad8ff,0x111722,1.35),new THREE.AmbientLight(0x7285a6,.35));
const key=new THREE.DirectionalLight(0xdce8ff,2.55);key.position.set(11,15,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
const rim=new THREE.DirectionalLight(0x527cc0,1.2);rim.position.set(-9,5,-8);scene.add(rim);
const warm=new THREE.PointLight(0xffb96f,11,18,2);warm.position.set(0,4,1);scene.add(warm);
const M={stone:new THREE.MeshStandardMaterial({color:0x8593a7,roughness:.94,metalness:.02}),dark:new THREE.MeshStandardMaterial({color:0x5e6879,roughness:.97}),roof:new THREE.MeshStandardMaterial({color:0x25334b,roughness:.84,metalness:.04}),roof2:new THREE.MeshStandardMaterial({color:0x31425c,roughness:.83}),wood:new THREE.MeshStandardMaterial({color:0x75533a,roughness:.9}),grass:new THREE.MeshStandardMaterial({color:0x53695a,roughness:1}),rock:new THREE.MeshStandardMaterial({color:0x444e5d,roughness:1}),water:new THREE.MeshStandardMaterial({color:0x275575,roughness:.25,transparent:true,opacity:.86}),gold:new THREE.MeshStandardMaterial({color:0xc6a45c,roughness:.34,metalness:.38}),glow:new THREE.MeshBasicMaterial({color:0xffc878}),black:new THREE.MeshStandardMaterial({color:0x161d29,roughness:1})};
const box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m),cyl=(r1,r2,h,s,m)=>new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,s),m),cone=(r,h,s,m)=>new THREE.Mesh(new THREE.ConeGeometry(r,h,s),m);
const pieces=[];
function prep(o){o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});return o}
function add(o,offset,start=.2,span=.65,spin=0){prep(o);o.userData.o=o.position.clone();o.userData.d=offset;o.userData.s=start;o.userData.p=span;o.userData.r=spin;pieces.push(o);castle.add(o);return o}
function batt(w,d,n,y){const g=new THREE.Group(),gap=w/n;for(let i=0;i<n;i+=2){const b=box(gap*.55,.22,d,M.dark);b.position.set(-w/2+gap*i+gap/2,y,0);g.add(b)}return g}
function windows(g,w,h,d,y,z,count=3){for(let i=0;i<count;i++){const q=box(w,h,d,M.glow);q.position.set((i-(count-1)/2)*w*2.5,y,z);g.add(q)}}
function tower(h=5.6,r=.85){const g=new THREE.Group(),b=cyl(r,r*1.03,h,16,M.stone),ring=cyl(r*1.12,r*1.12,.24,16,M.dark),rf=cone(r*1.28,1.85,16,M.roof),sp=cyl(.04,.04,.8,6,M.gold);b.position.y=h/2;ring.position.y=h+.05;rf.position.y=h+1;sp.position.y=h+2;g.add(b,ring,rf,sp);for(let y=1;y<h-1;y+=1.2)for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,w=box(.12,.34,.04,M.glow);w.position.set(Math.cos(a)*(r+.02),y,Math.sin(a)*(r+.02));w.lookAt(Math.cos(a)*3,y,Math.sin(a)*3);g.add(w)}return g}
function wall(w=5.9,d=.72,h=1.45){const g=new THREE.Group(),b=box(w,h,d,M.stone);b.position.y=h/2;g.add(b,batt(w,d+.03,11,h+.11));windows(g,.1,.3,.04,h*.53,d/2+.03,4);return g}
function room(w=.82,h=.7,d=.92,roof=.65){const g=new THREE.Group(),b=box(w,h,d,M.stone),r=cone(Math.max(w,d)*.52,roof,4,M.roof2),win=box(.14,.26,.04,M.glow);b.position.y=h/2;r.position.y=h+roof*.45;r.rotation.y=Math.PI/4;r.scale.z=d/w;win.position.set(0,h*.55,d/2+.03);g.add(b,r,win);return g}
function keepFloor(w,h){const g=new THREE.Group(),b=box(w,h,w,M.stone);b.position.y=h/2;g.add(b);windows(g,.13,.34,.04,h*.56,w/2+.03,Math.max(2,Math.floor(w)));return g}
function island(){const g=new THREE.Group(),rock=new THREE.Mesh(new THREE.CylinderGeometry(6,6.8,1.55,36),M.rock),top=new THREE.Mesh(new THREE.CylinderGeometry(4.8,5.4,.4,36),M.grass),moat=new THREE.Mesh(new THREE.TorusGeometry(5.82,.62,16,64),M.water);rock.position.y=-.77;top.position.y=.08;moat.rotation.x=Math.PI/2;g.add(rock,top,moat);for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=4.4+Math.random()*.7,k=new THREE.Mesh(new THREE.DodecahedronGeometry(.2+Math.random()*.3),M.rock);k.position.set(Math.cos(a)*r,.15,Math.sin(a)*r);g.add(k)}return g}
add(island(),new THREE.Vector3(0,-5.2,0),.08,.7);
const walls=[[0,.22,3.1,0,0,.6,5.3],[0,.22,-3.1,0,0,.7,-5.3],[-3.1,.22,0,Math.PI/2,-5.3,.6,0],[3.1,.22,0,Math.PI/2,5.3,.6,0]];
walls.forEach(([x,y,z,ry,dx,dy,dz],i)=>{const q=wall();q.position.set(x,y,z);q.rotation.y=ry;add(q,new THREE.Vector3(dx,dy,dz),.18+i*.015,.62)});
[[-3.1,0,-3.1],[-3.1,0,3.1],[3.1,0,-3.1],[3.1,0,3.1]].forEach(([x,y,z],i)=>{const t=tower(5.2,.78);t.position.set(x,y,z);add(t,new THREE.Vector3(Math.sign(x)*5.3,1.6,Math.sign(z)*5.3),.3,.58,(i%2?.58:-.58))});
// bridge: three separate segments
for(let i=0;i<3;i++){const b=box(1.05,.12,1.05,M.wood);b.position.set(0,.25,4.15+i*.9);add(b,new THREE.Vector3(0,.4,3.8+i*1.2),.24+i*.025,.54,.12)}
// gatehouse opens in three architectural layers
const gateBase=new THREE.Group(),gb=box(2.15,1.85,1.7,M.stone),arch=box(.82,1.15,.18,M.black);gb.position.y=.92;arch.position.set(0,.73,.88);gateBase.add(gb,arch);gateBase.position.set(0,.25,3.72);add(gateBase,new THREE.Vector3(0,1,4.5),.32,.5);
const gateMid=new THREE.Group(),gm=box(1.85,1.05,1.5,M.dark);gm.position.y=.52;gateMid.add(gm,batt(1.85,1.53,5,1.1));windows(gateMid,.12,.3,.04,.57,.78,3);gateMid.position.set(0,2.2,3.72);add(gateMid,new THREE.Vector3(0,3.5,5.5),.4,.45,.35);
const gateRoof=cone(1.18,1.3,4,M.roof);gateRoof.rotation.y=Math.PI/4;gateRoof.position.set(0,3.82,3.72);add(gateRoof,new THREE.Vector3(0,6,6.3),.48,.4,.65);
// keep floors are separate modules
const pl=box(3.5,.55,3.5,M.dark);pl.position.set(0,.22,0);add(pl,new THREE.Vector3(0,-.3,0),.44,.48);
const f1=keepFloor(3,1.35);f1.position.set(0,.78,0);add(f1,new THREE.Vector3(0,2.8,0),.5,.43);
const f2=keepFloor(2.4,1.15);f2.position.set(0,2.28,0);add(f2,new THREE.Vector3(0,5.2,0),.57,.37,.25);
const f3=keepFloor(1.85,.95);f3.position.set(0,3.55,0);add(f3,new THREE.Vector3(0,7,0),.63,.32,-.28);
const kr=cone(1.55,2,4,M.roof);kr.rotation.y=Math.PI/4;kr.position.set(0,5.05,0);add(kr,new THREE.Vector3(0,9,0),.68,.28,.55);
// four wings
const wings=[[0,1.15,2.05,0,0,3.2,5],[0,1.15,-2.05,0,0,3.2,-5],[-2.05,1.15,0,Math.PI/2,-5,3.2,0],[2.05,1.15,0,Math.PI/2,5,3.2,0]];
wings.forEach(([x,y,z,ry,dx,dy,dz],i)=>{const r=room(1.15,.95,1.35,.95);r.position.set(x,y,z);r.rotation.y=ry;add(r,new THREE.Vector3(dx,dy,dz),.61+i*.012,.32,(i%2?.45:-.45))});
// individual rooms: open one after another, not all at once
const rooms=[[-.85,1,.85,-4.8,2.8,4.8],[.85,1,.85,4.8,2.8,4.8],[-.85,1,-.85,-4.8,2.8,-4.8],[.85,1,-.85,4.8,2.8,-4.8],[0,2.35,1,0,5.1,5.7],[0,2.35,-1,0,5.1,-5.7],[-1,2.35,0,-5.7,5.1,0],[1,2.35,0,5.7,5.1,0]];
rooms.forEach(([x,y,z,dx,dy,dz],i)=>{const r=room(.72,.62,.82,.55);r.position.set(x,y,z);add(r,new THREE.Vector3(dx,dy,dz),.7+i*.028,.23,(i%2?.75:-.75))});
// small connector bridges fly away last
[[0,3.55,1.45,0,6.6,4.8],[0,3.55,-1.45,0,6.6,-4.8],[-1.45,3.55,0,-4.8,6.6,0],[1.45,3.55,0,4.8,6.6,0]].forEach(([x,y,z,dx,dy,dz],i)=>{const g=new THREE.Group(),d=box(.32,.07,1.25,M.dark);g.add(d);g.position.set(x,y,z);g.rotation.y=i>1?Math.PI/2:0;add(g,new THREE.Vector3(dx,dy,dz),.8+i*.02,.18,.45)});
for(let i=0;i<42;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.012+Math.random()*.025,5,5),new THREE.MeshBasicMaterial({color:0xe5f0ff}));s.position.set((Math.random()-.5)*30,6+Math.random()*10,(Math.random()-.5)*28);s.userData.seed=Math.random()*6.28;sky.add(s)}
world.rotation.y=-.48;castle.scale.setScalar(.78);castle.position.y=-.25;
let drag=false,lastX=0,target=world.rotation.y;addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX});addEventListener('pointerup',()=>drag=false);addEventListener('pointerleave',()=>drag=false);addEventListener('pointermove',e=>{if(!drag)return;target+=(e.clientX-lastX)*.0045;lastX=e.clientX});
function progress(){const m=document.documentElement.scrollHeight-innerHeight,p=m?clamp(scrollY/m):0;bar.style.height=p*100+'%';stage.textContent=String(Math.min(10,Math.floor(p*10)+1)).padStart(2,'0');return p}
function explode(p){pieces.forEach((o,i)=>{const t=ease(clamp((p-o.userData.s)/o.userData.p));o.position.copy(o.userData.o).addScaledVector(o.userData.d,t*(.95+i*.012));o.rotation.y=(o.userData.r||0)*t})}
function loop(ms){const t=ms*.001,p=progress();explode(p);world.rotation.y+=(target-world.rotation.y)*.055;world.rotation.x=-.06+p*.08;camera.position.z=mobile()?24.5:28.5;camera.position.y=8.6+p*2.4;camera.position.x=Math.sin(world.rotation.y)*.7;camera.lookAt(0,2.6+p*1.6,0);warm.intensity=9+Math.sin(t*1.4);key.position.x=11+Math.sin(t*.18)*2;sky.children.forEach((s,i)=>s.position.y+=Math.sin(t*.3+s.userData.seed+i)*.001);renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
addEventListener('resize',()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.35:1.8));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});