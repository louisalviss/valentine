import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const boot = document.querySelector('#boot');
const bootPercent = document.querySelector('#bootPercent');
const bootLine = document.querySelector('.boot__line i');
const scanEl = document.querySelector('#scan');
const cursor = document.querySelector('#cursor');
const fpsEl = document.querySelector('#fps');
const coordX = document.querySelector('#coordX');
const coordY = document.querySelector('#coordY');
const soundToggle = document.querySelector('#soundToggle');

const isMobile = matchMedia('(max-width: 760px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  pointer: new THREE.Vector2(0, 0),
  targetPointer: new THREE.Vector2(0, 0),
  scroll: 0,
  scan: 0,
  started: false,
  ambient: true,
  lastFrame: performance.now(),
  fps: 60,
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070908, isMobile ? 0.032 : 0.026);

const camera = new THREE.PerspectiveCamera(isMobile ? 47 : 41, innerWidth / innerHeight, 0.1, 120);
camera.position.set(isMobile ? 1.8 : 3.4, 1.1, isMobile ? 16.5 : 14.8);
camera.lookAt(1, 0.2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.35 : 1.8));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const world = new THREE.Group();
world.position.set(1.25, -0.25, 0);
world.rotation.set(-0.05, -0.12, -0.05);
scene.add(world);

scene.add(new THREE.HemisphereLight(0xcfe0d2, 0x090b0a, 0.45));
const key = new THREE.DirectionalLight(0xe7f4e7, 3.2);
key.position.set(-4, 8, 9);
key.castShadow = !isMobile;
scene.add(key);
const rim = new THREE.PointLight(0x9effbf, 5.5, 22, 2.2);
rim.position.set(7, 1.8, 2.5);
scene.add(rim);
const low = new THREE.PointLight(0x61786d, 1.4, 18, 2);
low.position.set(-5, -3, 2);
scene.add(low);

function hash(x) {
  const s = Math.sin(x * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

function roughenTube(geometry, strength = 0.045, seed = 1) {
  const p = geometry.attributes.position;
  const n = geometry.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    const px = p.getX(i), py = p.getY(i), pz = p.getZ(i);
    const h = (hash(i * 0.37 + seed) - .5) * 2;
    const wave = Math.sin(px * 4.7 + py * 2.2 + seed) * .35;
    const d = (h * .65 + wave) * strength;
    p.setXYZ(i, px + nx*d, py + ny*d, pz + nz*d);
  }
  p.needsUpdate = true;
  geometry.computeVertexNormals();
}

const bark = new THREE.MeshStandardMaterial({ color: 0x343934, roughness: 0.96, metalness: 0.02 });
const barkSoft = bark.clone(); barkSoft.color.setHex(0x4d544b);
const wireMat = new THREE.MeshBasicMaterial({ color: 0xc8ffda, wireframe: true, transparent: true, opacity: 0.0, depthWrite: false });
const branchMeshes = [];
const wireMeshes = [];

function makeBranch(points, radius, seed, material = bark) {
  const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)), false, 'catmullrom', 0.62);
  const geo = new THREE.TubeGeometry(curve, Math.max(28, points.length * 14), radius, isMobile ? 7 : 10, false);
  roughenTube(geo, radius * .23, seed);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = !isMobile; mesh.receiveShadow = !isMobile;
  const wire = new THREE.Mesh(geo.clone(), wireMat.clone());
  wire.scale.setScalar(1.008);
  branchMeshes.push(mesh); wireMeshes.push(wire);
  world.add(mesh, wire);
  return { mesh, wire, curve };
}

const mainBranch = makeBranch([
  [-7.8,-2.8,-1.0],[-5.9,-2.45,-.5],[-4.3,-1.7,.2],[-2.7,-1.05,.08],[-1.0,-.68,.45],[.7,.1,.05],[2.5,.65,.35],[4.4,1.65,-.1],[6.9,2.55,.1]
], .36, 3);
makeBranch([[-3.25,-1.3,.1],[-3.7,-.2,.15],[-4.35,.75,.05],[-5.05,1.7,-.16]], .16, 5, barkSoft);
makeBranch([[-.8,-.58,.37],[-.2,.2,.2],[.4,1.35,.1],[1.15,2.3,.25]], .145, 7, barkSoft);
makeBranch([[1.75,.42,.25],[2.45,1.05,.05],[3.15,1.45,.22],[4.1,1.42,.12]], .12, 11, barkSoft);
makeBranch([[3.7,1.36,-.05],[4.15,2.05,-.12],[4.65,2.7,-.05],[5.05,3.25,-.1]], .105, 13, barkSoft);
makeBranch([[5.05,1.98,.0],[5.8,2.25,.18],[6.55,2.18,.2],[7.2,1.92,.2]], .09, 17, barkSoft);

const budMat = new THREE.MeshPhysicalMaterial({ color: 0x89988a, roughness: .3, metalness: .05, clearcoat: .85, clearcoatRoughness: .22 });
const glowMat = new THREE.MeshStandardMaterial({ color: 0x9dffbd, emissive: 0x76ff9f, emissiveIntensity: 2.2, roughness: .35 });
for (let i=0;i<(isMobile?15:24);i++) {
  const t = .12 + hash(i*2.1)*.8;
  const p = mainBranch.curve.getPoint(t);
  const g = new THREE.IcosahedronGeometry(.055 + hash(i+40)*.09, 1);
  const m = new THREE.Mesh(g, i%7===0 ? glowMat : budMat);
  m.position.copy(p).add(new THREE.Vector3((hash(i+1)-.5)*.34, .18+hash(i+2)*.3, (hash(i+3)-.5)*.28));
  m.rotation.set(hash(i)*5,hash(i+1)*5,hash(i+2)*5); world.add(m);
}

const particleCount = isMobile ? 160 : 360;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount*3);
const seeds = new Float32Array(particleCount);
for(let i=0;i<particleCount;i++){
  positions[i*3] = (hash(i*.77)-.5)*22;
  positions[i*3+1] = (hash(i*.91+4)-.5)*12;
  positions[i*3+2] = (hash(i*1.17+8)-.5)*14-2;
  seeds[i]=hash(i*3.4);
}
particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
particleGeo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
const particleMat = new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixel:{value:renderer.getPixelRatio()}},vertexShader:`
attribute float aSeed; uniform float uTime; uniform float uPixel; varying float vA;
void main(){ vec3 p=position; p.y += sin(uTime*(.22+aSeed*.28)+aSeed*17.)*.42; p.x += cos(uTime*.14+aSeed*31.)*.28; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=(1.5+aSeed*3.6)*uPixel*(7.5/-mv.z); vA=.2+aSeed*.55; }`,fragmentShader:`
varying float vA; void main(){ vec2 q=gl_PointCoord-.5; float d=length(q); float a=smoothstep(.5,.0,d)*vA; gl_FragColor=vec4(.72,1.,.81,a); }`});
const particles = new THREE.Points(particleGeo,particleMat); scene.add(particles);

const moths=[];
function makeMoth(index){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.16,4,8),new THREE.MeshStandardMaterial({color:0x30342f,roughness:.6}));
  body.rotation.z=Math.PI/2; g.add(body);
  const wingGeo=new THREE.BufferGeometry();
  wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.11,.05,0,.36,.22,0,.27,-.05,0, 0,0,0,.27,-.05,0,.29,-.23,0,.08,-.08,0],3));
  wingGeo.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]); wingGeo.computeVertexNormals();
  const mat=new THREE.MeshPhysicalMaterial({color:index%2?0xc8d0c4:0xdfe8d9,roughness:.55,metalness:0,transparent:true,opacity:.72,side:THREE.DoubleSide,transmission:.04});
  const left=new THREE.Mesh(wingGeo,mat); const right=new THREE.Mesh(wingGeo,mat.clone());
  left.position.z=.025; right.position.z=-.025; right.scale.z=-1; right.scale.y=-1;
  g.add(left,right); g.scale.setScalar(.78+hash(index*2.3)*.55); world.add(g);
  const data={g,left,right,index,phase:hash(index*7.1)*Math.PI*2,speed:.26+hash(index+7)*.22,baseT:.2+hash(index+2)*.7,flee:0}; moths.push(data); return data;
}
for(let i=0;i<(isMobile?4:7);i++) makeMoth(i);

const shadow = new THREE.Mesh(new THREE.PlaneGeometry(24,14),new THREE.ShadowMaterial({color:0x000000,opacity:.34}));
shadow.rotation.x=-Math.PI/2; shadow.position.set(0,-3.28,-1.2); shadow.receiveShadow=!isMobile; scene.add(shadow);

function updateMoths(time){
  moths.forEach((m,i)=>{
    const t=time*m.speed + m.phase;
    const projected=m.g.position.clone().applyMatrix4(world.matrixWorld).project(camera);
    const d=Math.hypot(projected.x-state.targetPointer.x,projected.y-state.targetPointer.y);
    const near=d<.35;
    m.flee += ((near?1:0)-m.flee)*.055;
    const amp=.18+m.flee*.72;
    const pathT=(m.baseT + Math.sin(t*.22+i)*.035 + 1)%1;
    const anchor=mainBranch.curve.getPoint(pathT);
    const airborne=i!==0 || m.flee>.08 || Math.sin(t*.16)>-.25;
    const targetY=airborne ? anchor.y+1.15+Math.sin(t*.72)*.62+m.flee*1.3 : anchor.y+.24;
    const targetX=anchor.x+Math.cos(t*.55+i)*.7+m.flee*(projected.x<state.targetPointer.x?-1:1)*.9;
    const targetZ=anchor.z+Math.sin(t*.42+i)*.7+m.flee*.55;
    m.g.position.x += (targetX-m.g.position.x)*(.014+amp*.018);
    m.g.position.y += (targetY-m.g.position.y)*(.014+amp*.022);
    m.g.position.z += (targetZ-m.g.position.z)*(.014+amp*.018);
    m.g.rotation.y=Math.sin(t*.35)*.5; m.g.rotation.z=Math.sin(t*.28+i)*.18;
    const flap=(airborne?Math.sin(t*8.5):Math.sin(t*1.6)*.12)*(.65+m.flee*.5);
    m.left.rotation.y=.22+flap; m.right.rotation.y=-.22-flap;
    m.left.rotation.x=.1+Math.sin(t*4)*.08; m.right.rotation.x=-.1-Math.sin(t*4)*.08;
  });
}

function setScan(progress){
  const p=THREE.MathUtils.clamp(progress,0,1);
  state.scan=p;
  scanEl.style.setProperty('--scan-y',`${12+p*76}%`);
  branchMeshes.forEach(m=>{m.material.transparent=true;m.material.opacity=THREE.MathUtils.smoothstep(p,.18,.82)});
  wireMeshes.forEach(w=>{w.material.opacity=(1-THREE.MathUtils.smoothstep(p,.38,.92))*.68});
}

function bootSequence(){
  if(reduceMotion){boot.classList.add('is-done');branchMeshes.forEach(m=>m.material.opacity=1);return;}
  const start=performance.now(); scanEl.classList.add('is-active');
  function tick(now){
    const e=now-start; const p=Math.min(1,e/2200); const eased=1-Math.pow(1-p,3);
    const display=Math.floor(eased*100); bootPercent.textContent=String(display).padStart(3,'0')+'%'; bootLine.style.width=display+'%';
    if(e>720) setScan(Math.min(1,(e-720)/2300));
    if(e<2350) requestAnimationFrame(tick); else {boot.classList.add('is-done');state.started=true; setTimeout(()=>scanEl.classList.remove('is-active'),1700);}
  }
  requestAnimationFrame(tick);
}

function onPointer(e){
  const x=e.clientX/innerWidth, y=e.clientY/innerHeight;
  state.targetPointer.set(x*2-1,-(y*2-1));
  coordX.textContent=state.targetPointer.x.toFixed(2); coordY.textContent=state.targetPointer.y.toFixed(2);
  if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';}
}
window.addEventListener('pointermove',onPointer,{passive:true});
window.addEventListener('scroll',()=>{state.scroll=scrollY/Math.max(1,document.body.scrollHeight-innerHeight)},{passive:true});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.35:1.8));renderer.setSize(innerWidth,innerHeight,false)});
document.querySelectorAll('a,button').forEach(el=>{el.addEventListener('pointerenter',()=>cursor?.classList.add('is-link'));el.addEventListener('pointerleave',()=>cursor?.classList.remove('is-link'))});
soundToggle?.addEventListener('click',()=>{state.ambient=!state.ambient;soundToggle.style.opacity=state.ambient?'1':'.45';soundToggle.querySelector('.sound-dot').style.boxShadow=state.ambient?'0 0 9px var(--acid)':'none'});

const clock=new THREE.Clock(); let fpsAccum=0,fpsFrames=0;
function animate(){
  const dt=Math.min(clock.getDelta(),.05); const t=clock.elapsedTime;
  state.pointer.lerp(state.targetPointer,isMobile?.06:.035);
  const heroFade=THREE.MathUtils.clamp(1-state.scroll*2.2,0,1);
  const targetX=(isMobile?1.4:3.4)+state.pointer.x*(isMobile?.45:1.1)*heroFade;
  const targetY=1.05+state.pointer.y*(isMobile?.28:.58)*heroFade-state.scroll*1.25;
  camera.position.x += (targetX-camera.position.x)*.025;
  camera.position.y += (targetY-camera.position.y)*.025;
  camera.position.z += (((isMobile?16.5:14.8)+state.scroll*3.2)-camera.position.z)*.018;
  camera.lookAt(1.0+state.pointer.x*.45*heroFade,.05+state.pointer.y*.22*heroFade,-.2);
  world.rotation.y += ((-.12+state.pointer.x*.055*heroFade)-world.rotation.y)*.025;
  world.rotation.x += ((-.05-state.pointer.y*.025*heroFade)-world.rotation.x)*.025;
  world.position.y=-.25-state.scroll*.8;
  particleMat.uniforms.uTime.value=t;
  particles.rotation.y=t*.004; particles.rotation.z=Math.sin(t*.06)*.008;
  rim.intensity=state.ambient?5.5:2.4;
  updateMoths(t);
  renderer.render(scene,camera);
  fpsAccum+=dt;fpsFrames++; if(fpsAccum>.5){state.fps=Math.round(fpsFrames/fpsAccum);fpsEl.textContent=String(state.fps);fpsAccum=0;fpsFrames=0;}
  requestAnimationFrame(animate);
}

setScan(0);
bootSequence();
animate();
