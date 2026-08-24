import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#scene');
const bar = document.querySelector('.progress i');
const counter = document.querySelector('#stageNow');
const mobile = () => innerWidth < 760;
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a,.065);
const camera = new THREE.PerspectiveCamera(35,1,.1,100);
camera.position.z = 8.7;

const product = new THREE.Group();
scene.add(product);
const metal = new THREE.MeshPhysicalMaterial({color:0xa3a29e,metalness:.9,roughness:.17,clearcoat:1,clearcoatRoughness:.07});
const black = new THREE.MeshPhysicalMaterial({color:0x111214,metalness:.55,roughness:.22,clearcoat:.8});
const glass = new THREE.MeshPhysicalMaterial({color:0xc9d5dc,roughness:.08,transmission:.8,thickness:.7,ior:1.45,transparent:true,opacity:.84});

const ring = new THREE.Mesh(new THREE.TorusGeometry(1.72,.34,36,128),metal);
ring.rotation.x = Math.PI/2; product.add(ring);
const core = new THREE.Mesh(new THREE.SphereGeometry(.78,48,48),glass);
core.scale.set(1,.68,1); product.add(core);
const iris = new THREE.Mesh(new THREE.TorusGeometry(.78,.055,16,80),black);
iris.rotation.x = Math.PI/2; product.add(iris);
const hub = new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.45,28),black);
hub.rotation.z = Math.PI/2; product.add(hub);

const sats=[];
for(let i=0;i<8;i++){
  const a=i/8*Math.PI*2, pivot=new THREE.Group();
  const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.34,6,12),i%2?black:metal);
  mesh.position.set(Math.cos(a)*2.16,0,Math.sin(a)*2.16); mesh.rotation.z=a;
  pivot.add(mesh); product.add(pivot); sats.push({pivot,mesh,a});
}
const ribs=[];
for(let i=0;i<4;i++){
  const r=new THREE.Mesh(new THREE.TorusGeometry(1.15+i*.18,.014,8,72),new THREE.MeshBasicMaterial({color:0xf3f0e9,transparent:true,opacity:.14}));
  r.rotation.set(Math.PI/2,0,i*.45); product.add(r); ribs.push(r);
}

function glowTexture(){
  const c=document.createElement('canvas'); c.width=c.height=192;
  const g=c.getContext('2d'),r=g.createRadialGradient(96,96,0,96,96,96);
  r.addColorStop(0,'rgba(255,255,255,.45)'); r.addColorStop(.22,'rgba(180,210,235,.1)'); r.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=r; g.fillRect(0,0,192,192); return new THREE.CanvasTexture(c);
}
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.58}));
glow.scale.set(6,6,1); glow.position.z=-1.5; product.add(glow);

const dustGeo=new THREE.BufferGeometry(), n=mobile()?180:340, pos=new Float32Array(n*3);
for(let i=0;i<n;i++){pos[i*3]=(Math.random()-.5)*16;pos[i*3+1]=(Math.random()-.5)*11;pos[i*3+2]=(Math.random()-.5)*12;}
dustGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xdce5e8,size:.016,transparent:true,opacity:.34,depthWrite:false})); scene.add(dust);

const key=new THREE.DirectionalLight(0xffffff,5); key.position.set(4,5,4); scene.add(key);
const rim=new THREE.PointLight(0x9ac5ff,24,20,2); rim.position.set(-4,1,-2); scene.add(rim);
const warm=new THREE.PointLight(0xffb36b,18,16,2); warm.position.set(4,-3,2); scene.add(warm);
scene.add(new THREE.HemisphereLight(0xffffff,0x14120e,1.5));
const disk=new THREE.Mesh(new THREE.CircleGeometry(5.2,80),new THREE.MeshBasicMaterial({color:0x171717,transparent:true,opacity:.7,depthWrite:false}));
disk.position.z=-3.2; scene.add(disk);

let target=0,smooth=0,px=0,py=0,dragX=0,dragY=0,down=false,lx=0,ly=0;
const clamp=v=>Math.min(1,Math.max(0,v));
const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const mix=THREE.MathUtils.lerp;

function onScroll(){
  const max=document.documentElement.scrollHeight-innerHeight;
  target=max?scrollY/max:0; bar.style.height=`${target*100}%`;
  counter.textContent=String(Math.min(5,Math.floor(target*5)+1)).padStart(2,'0');
}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('pointermove',e=>{
  px=(e.clientX/innerWidth-.5)*2; py=(e.clientY/innerHeight-.5)*2;
  if(down){dragX+=(e.clientX-lx)*.003;dragY+=(e.clientY-ly)*.003;lx=e.clientX;ly=e.clientY;}
},{passive:true});
addEventListener('pointerdown',e=>{down=true;lx=e.clientX;ly=e.clientY});
addEventListener('pointerup',()=>down=false); addEventListener('pointercancel',()=>down=false);

function resize(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.3:1.75)); renderer.setSize(innerWidth,innerHeight,false);
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
}
addEventListener('resize',resize,{passive:true}); resize();

function pose(p,t){
  const m=mobile(); let x,y,z,rx,ry,rz,s;
  if(p<.22){const u=ease(0,.22,p);x=mix(m?.55:2.15,m?0:2.8,u);y=mix(.15,-.35,u);z=mix(0,-.6,u);rx=mix(.35,.9,u);ry=mix(-.65,.2,u);rz=mix(-.15,.15,u);s=mix(.9,.78,u)}
  else if(p<.44){const u=ease(.22,.44,p);x=mix(m?0:2.8,m?.65:-2.6,u);y=mix(-.35,.15,u);z=mix(-.6,.2,u);rx=mix(.9,1.4,u);ry=mix(.2,1.55,u);rz=mix(.15,-.45,u);s=mix(.78,.92,u)}
  else if(p<.68){const u=ease(.44,.68,p);x=mix(m?.65:-2.6,m?-.2:2.5,u);y=mix(.15,-.1,u);z=mix(.2,-.15,u);rx=mix(1.4,.2,u);ry=mix(1.55,2.7,u);rz=mix(-.45,.2,u);s=mix(.92,.82,u)}
  else if(p<.84){const u=ease(.68,.84,p);x=mix(m?-.2:2.5,0,u);y=mix(-.1,.3,u);z=mix(-.15,.55,u);rx=mix(.2,.9,u);ry=mix(2.7,3.8,u);rz=mix(.2,0,u);s=mix(.82,1.1,u)}
  else{const u=ease(.84,1,p);x=mix(0,m?.4:2.45,u);y=mix(.3,-.05,u);z=mix(.55,-.1,u);rx=mix(.9,.15,u);ry=mix(3.8,4.8,u);rz=mix(0,-.25,u);s=mix(1.1,.9,u)}
  product.position.set(x,y,z); product.rotation.set(rx+py*.06+dragY,ry+px*.07+dragX,rz); product.scale.setScalar(s);

  const ex=ease(.61,.72,p)*(1-ease(.79,.88,p));
  sats.forEach((o,i)=>{o.pivot.rotation.y=ex*(i%2?1:-1)*(.65+i*.035);o.mesh.position.y=Math.sin(o.a*2)*ex*.95});
  ring.scale.setScalar(1+ex*.12); core.scale.set(1-ex*.16,.68-ex*.12,1-ex*.16);
  ribs.forEach((r,i)=>{r.position.y=(i-1.5)*ex*.32;r.rotation.z=i*.45+ex*(i%2?.9:-.9);r.material.opacity=.12+ex*.22});

  const cool=ease(.18,.46,p)*(1-ease(.62,.82,p));
  rim.intensity=mix(20,31,cool); warm.intensity=mix(18,6,cool); disk.material.opacity=mix(.7,.3,ease(.55,.76,p));
  glow.material.opacity=.44+.18*Math.sin(t*.0005+p*5); dust.rotation.y=p*1.1+t*.000015;
  camera.position.x=px*(m?.03:.11); camera.position.y=-py*(m?.02:.07); camera.position.z=mix(8.7,7.9,ease(.6,.8,p)); camera.lookAt(0,0,0);
}

function loop(t=0){
  smooth+=(target-smooth)*.075; dragX*=.94; dragY*=.94; pose(smooth,t); renderer.render(scene,camera); requestAnimationFrame(loop);
}
onScroll(); requestAnimationFrame(loop); requestAnimationFrame(()=>document.documentElement.classList.add('ready'));
