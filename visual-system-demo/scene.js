import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js';

const canvas = document.querySelector('#scene');
const buttons = [...document.querySelectorAll('[data-variant]')];
const progressBar = document.querySelector('#progressBar');
const progressIndex = document.querySelector('#progressIndex');
const chapterMeta = document.querySelector('#chapterMeta');
const motionToggle = document.querySelector('#motionToggle');
const fallback = document.querySelector('.fallback');

const mobile = () => innerWidth < 850;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const chapters = ['WHOLE', 'GROUND', 'FRAME', 'SKIN', 'LIGHT', 'ANATOMY', 'SYSTEM'];

const PRESETS = {
  shoji: {
    bg: 0x0a0a09, fog: 0x0a0a09, fogDensity: 0.026,
    frame: 0x241d18, frame2: 0x4d3024, skin: 0xb9ad96, roof: 0x171513,
    ground: 0x4b4237, accent: 0xd34b2a, core: 0xf4d8a1, water: 0x171b1a,
    key: 0xffe0b3, rim: 0xc24f31, ambient: 0xb7a589,
    exposure: 1.03, finOpen: 0.72, roofLift: 1.0, float: 0.02, cameraBias: 0.0,
  },
  brut: {
    bg: 0x0b0c0c, fog: 0x0b0c0c, fogDensity: 0.031,
    frame: 0x858178, frame2: 0x55534f, skin: 0x6f6d68, roof: 0x2b2c2a,
    ground: 0x3f4140, accent: 0xb94825, core: 0xd97942, water: 0x171918,
    key: 0xd8d2c4, rim: 0x8d3a24, ambient: 0x9a978f,
    exposure: 0.92, finOpen: 0.38, roofLift: 0.35, float: 0.0, cameraBias: -0.22,
  },
  orbital: {
    bg: 0x05080a, fog: 0x05080a, fogDensity: 0.022,
    frame: 0xbcc8ca, frame2: 0x4f666d, skin: 0x23383f, roof: 0x0b1215,
    ground: 0x182226, accent: 0x7ce7ff, core: 0x9af3ff, water: 0x071217,
    key: 0xb8f5ff, rim: 0x5bdcf7, ambient: 0x78969e,
    exposure: 1.12, finOpen: 1.06, roofLift: 1.55, float: 0.06, cameraBias: 0.28,
  }
};

let renderer, scene, camera, world, pavilion, guides, water, coreLight, keyLight, rimLight, hemi;
let variant = 'shoji';
let preset = PRESETS[variant];
let paused = false;
let dragging = false;
let lastX = 0;
let orbitTarget = -0.52;
let orbit = -0.52;
let currentProgress = 0;
let raf = 0;
const pieces = [];
const skins = [];
const roofs = [];
const materials = {};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function mat(name, options) {
  const m = new THREE.MeshStandardMaterial(options);
  materials[name] = m;
  return m;
}
function physical(name, options) {
  const m = new THREE.MeshPhysicalMaterial(options);
  materials[name] = m;
  return m;
}
function box(w, h, d, material, bevel = 0) {
  if (!bevel) return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  const shape = new THREE.Shape();
  const x = w / 2, z = d / 2, r = Math.min(bevel, x * .45, z * .45);
  shape.moveTo(-x + r, -z); shape.lineTo(x - r, -z); shape.quadraticCurveTo(x, -z, x, -z + r);
  shape.lineTo(x, z - r); shape.quadraticCurveTo(x, z, x - r, z); shape.lineTo(-x + r, z);
  shape.quadraticCurveTo(-x, z, -x, z - r); shape.lineTo(-x, -z + r); shape.quadraticCurveTo(-x, -z, -x + r, -z);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  geo.rotateX(Math.PI / 2); geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, material);
}
function register(mesh, group, origin, explode, stage, spin = 0) {
  mesh.position.copy(origin);
  mesh.userData = { origin: origin.clone(), explode: explode.clone(), stage, spin, baseRot: mesh.rotation.clone() };
  mesh.castShadow = !mobile(); mesh.receiveShadow = !mobile();
  group.add(mesh); pieces.push(mesh); return mesh;
}
function stageT(p, stage, width = .13) {
  const start = stage / 6.4;
  return smooth(clamp((p - start) / width));
}

function createScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile(), alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !mobile();
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(mobile() ? 40 : 34, innerWidth / innerHeight, .1, 120);
  world = new THREE.Group(); pavilion = new THREE.Group(); guides = new THREE.Group();
  world.add(pavilion, guides); scene.add(world);

  materials.frame = mat('frame', { color: preset.frame, roughness: .78, metalness: .05 });
  materials.frame2 = mat('frame2', { color: preset.frame2, roughness: .84, metalness: .03 });
  materials.skin = physical('skin', { color: preset.skin, roughness: .74, metalness: 0, transparent: true, opacity: .76, transmission: .05, side: THREE.DoubleSide });
  materials.roof = mat('roof', { color: preset.roof, roughness: .8, metalness: .06 });
  materials.ground = mat('ground', { color: preset.ground, roughness: .92, metalness: 0 });
  materials.accent = mat('accent', { color: preset.accent, roughness: .46, metalness: .16 });
  materials.core = physical('core', { color: preset.core, emissive: preset.core, emissiveIntensity: 1.35, roughness: .28, transmission: .22, transparent: true, opacity: .92 });
  materials.water = physical('water', { color: preset.water, roughness: .19, metalness: .1, transparent: true, opacity: .88, transmission: .05 });

  hemi = new THREE.HemisphereLight(preset.ambient, preset.bg, 1.0); scene.add(hemi);
  keyLight = new THREE.DirectionalLight(preset.key, 3.5); keyLight.position.set(-6, 11, 8); keyLight.castShadow = !mobile(); scene.add(keyLight);
  rimLight = new THREE.DirectionalLight(preset.rim, 2.4); rimLight.position.set(8, 4, -6); scene.add(rimLight);
  coreLight = new THREE.PointLight(preset.core, 10, 14, 2); coreLight.position.set(0, 2.5, 0); scene.add(coreLight);

  const plane = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.7, .42, 56), materials.ground);
  register(plane, pavilion, new THREE.Vector3(0, -.2, 0), new THREE.Vector3(0, -3.8, 0), .68);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(4.35, 4.35, .16, 48), materials.frame2);
  register(inner, pavilion, new THREE.Vector3(0, .11, 0), new THREE.Vector3(0, -2.3, 0), .7);
  water = new THREE.Mesh(new THREE.RingGeometry(4.46, 5.22, 64), materials.water); water.rotation.x = -Math.PI / 2; water.position.y = .04; pavilion.add(water);

  const step1 = box(2.7, .18, 1.4, materials.frame2, .1); register(step1, pavilion, new THREE.Vector3(0, .22, 4.4), new THREE.Vector3(0, -.5, 3.7), .74);
  const step2 = box(2.1, .16, 1.0, materials.frame2, .08); register(step2, pavilion, new THREE.Vector3(0, .34, 3.6), new THREE.Vector3(0, -.3, 2.8), .76);

  const columnPositions = [[-2.55,0,-2.55],[2.55,0,-2.55],[-2.55,0,2.55],[2.55,0,2.55],[-2.55,0,0],[2.55,0,0],[0,0,-2.55],[0,0,2.55]];
  columnPositions.forEach((p, i) => {
    const c = box(.24, 3.75, .24, i % 3 === 0 ? materials.accent : materials.frame, .035);
    const dir = new THREE.Vector3(p[0], 1.7, p[2]).normalize().multiplyScalar(4.2);
    dir.y = 2 + (i % 2) * .7;
    register(c, pavilion, new THREE.Vector3(p[0], 2.05, p[2]), dir, 1.72, (i % 2 ? 1 : -1) * .18);
  });

  const beams = [
    [0,4.05,-2.55,5.35,.18,.24,0],[0,4.05,2.55,5.35,.18,.24,0],[-2.55,4.05,0,.24,.18,5.35,0],[2.55,4.05,0,.24,.18,5.35,0]
  ];
  beams.forEach((b, i) => {
    const q = box(b[3], b[4], b[5], materials.frame, .03);
    register(q, pavilion, new THREE.Vector3(b[0], b[1], b[2]), new THREE.Vector3((i<2?0:(i===2?-5.5:5.5)),4.7,(i<2?(i===0?-5.5:5.5):0)), 1.78, (i%2?.24:-.24));
  });

  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 6; i++) {
      const t = (i - 2.5) * .82;
      const fin = box(.085, 3.35, .54, materials.skin, .025);
      let pos, rotY = 0, explode;
      if (side === 0) { pos = new THREE.Vector3(t, 2.1, 2.8); explode = new THREE.Vector3(t * .25, 2.2, 6.0); }
      if (side === 1) { pos = new THREE.Vector3(t, 2.1, -2.8); explode = new THREE.Vector3(t * .25, 2.2, -6.0); }
      if (side === 2) { pos = new THREE.Vector3(-2.8, 2.1, t); explode = new THREE.Vector3(-6.0, 2.2, t * .25); rotY = Math.PI/2; }
      if (side === 3) { pos = new THREE.Vector3(2.8, 2.1, t); explode = new THREE.Vector3(6.0, 2.2, t * .25); rotY = Math.PI/2; }
      fin.rotation.y = rotY;
      register(fin, pavilion, pos, explode, 2.72, (i - 2.5) * .055 * (side % 2 ? -1 : 1));
      fin.userData.finIndex = i; fin.userData.side = side; skins.push(fin);
    }
  }

  const roofA = box(6.15, .24, 1.25, materials.roof, .06); register(roofA, pavilion, new THREE.Vector3(0,4.45,-1.72), new THREE.Vector3(0,8.0,-4.0), 2.0, -.08); roofs.push(roofA);
  const roofB = box(6.15, .24, 1.25, materials.roof, .06); register(roofB, pavilion, new THREE.Vector3(0,4.45,1.72), new THREE.Vector3(0,8.8,4.0), 2.05, .08); roofs.push(roofB);
  const roofC = box(1.38, .18, 3.2, materials.frame2, .04); register(roofC, pavilion, new THREE.Vector3(0,4.62,0), new THREE.Vector3(0,10.0,0), 2.12, .14); roofs.push(roofC);

  const lantern = box(1.6, 2.6, 1.6, materials.core, .08); register(lantern, pavilion, new THREE.Vector3(0,2.02,0), new THREE.Vector3(0,6.6,0), 3.72, 0);
  const innerFrame = box(2.05, .08, 2.05, materials.accent, .02); register(innerFrame, pavilion, new THREE.Vector3(0, .62, 0), new THREE.Vector3(0,4.7,0), 3.8, .3);

  const benchA = box(2.2,.16,.46,materials.frame2,.05); register(benchA,pavilion,new THREE.Vector3(-1.35,.63,1.35),new THREE.Vector3(-4.3,1.2,3.4),3.9,-.2);
  const benchB = box(2.2,.16,.46,materials.frame2,.05); register(benchB,pavilion,new THREE.Vector3(1.35,.63,-1.35),new THREE.Vector3(4.3,1.2,-3.4),3.9,.2);

  createGuides();
  pavilion.scale.setScalar(mobile() ? .64 : .82);
  world.rotation.set(-.07, orbit, 0);
  resize();
}

function createGuides() {
  const mk = (pts, color, opacity=.42) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent:true, opacity:0, depthWrite:false }));
    line.userData.targetOpacity = opacity; guides.add(line); return line;
  };
  mk([[-7,.18,0],[7,.18,0]], preset.accent, .5);
  mk([[0,.18,-7],[0,.18,7]], preset.accent, .5);
  mk([[-3.3,4.55,-3.3],[3.3,4.55,-3.3],[3.3,4.55,3.3],[-3.3,4.55,3.3],[-3.3,4.55,-3.3]], preset.frame2, .38);
  for (let i=0;i<4;i++) mk([[0,.2,0],[Math.cos(i*Math.PI/2+Math.PI/4)*7,5.2,Math.sin(i*Math.PI/2+Math.PI/4)*7]], preset.frame2, .25);
}

function applyPreset(name) {
  variant = name; preset = PRESETS[name]; document.body.dataset.variant = name;
  materials.frame.color.setHex(preset.frame); materials.frame2.color.setHex(preset.frame2); materials.skin.color.setHex(preset.skin); materials.roof.color.setHex(preset.roof); materials.ground.color.setHex(preset.ground); materials.accent.color.setHex(preset.accent); materials.core.color.setHex(preset.core); materials.core.emissive.setHex(preset.core); materials.water.color.setHex(preset.water);
  scene.background.setHex(preset.bg); scene.fog.color.setHex(preset.fog); scene.fog.density = preset.fogDensity; renderer.toneMappingExposure = preset.exposure;
  hemi.color.setHex(preset.ambient); hemi.groundColor.setHex(preset.bg); keyLight.color.setHex(preset.key); rimLight.color.setHex(preset.rim); coreLight.color.setHex(preset.core);
  guides.children.forEach((g,i) => g.material.color.setHex(i<2?preset.accent:preset.frame2));
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === name)));
}

function scrollProgress() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  return clamp(scrollY / max);
}

function updatePieces(p) {
  pieces.forEach(piece => {
    const t = stageT(p, piece.userData.stage, piece.userData.stage > 3.5 ? .12 : .15);
    const explodeT = smooth(clamp((p - .69) / .17));
    const amount = Math.max(t, explodeT);
    piece.position.copy(piece.userData.origin).lerp(piece.userData.explode, amount);
    piece.rotation.copy(piece.userData.baseRot);
    piece.rotation.y += piece.userData.spin * amount;
  });

  const skinPhase = smooth(clamp((p - .38) / .17));
  skins.forEach(fin => {
    const local = (fin.userData.finIndex - 2.5) / 2.5;
    const sideSign = fin.userData.side < 2 ? 1 : -1;
    fin.rotation.y += skinPhase * local * preset.finOpen * sideSign;
    if (variant === 'brut') fin.scale.z = 1.15;
    else if (variant === 'orbital') fin.scale.z = .7;
    else fin.scale.z = .92;
  });

  const roofPhase = smooth(clamp((p - .27) / .16));
  roofs.forEach((roof,i) => {
    roof.position.y += roofPhase * preset.roofLift * (i === 2 ? .22 : .1);
    if (variant === 'orbital') roof.rotation.z += (i-1) * .025 * roofPhase;
  });

  const anatomy = smooth(clamp((p - .7) / .14));
  guides.children.forEach(g => g.material.opacity = anatomy * g.userData.targetOpacity);
  materials.skin.opacity = lerp(variant === 'brut' ? .88 : .72, .28, anatomy);
  coreLight.intensity = lerp(7.5, variant === 'orbital' ? 15 : 11.5, smooth(clamp((p-.54)/.18)));
}

function updateCamera(p, time) {
  const m = mobile();
  const beats = [
    {p:0,    pos:[m?8.2:10.6, m?7.3:6.4, m?18.5:16.4], look:[0,2.0,0]},
    {p:.17,  pos:[m?7.2:9.2,  m?6.7:5.6, m?18.0:15.5], look:[0,1.5,0]},
    {p:.34,  pos:[m?9.0:11.6, m?6.2:5.1, m?16.8:13.7], look:[0,2.4,0]},
    {p:.51,  pos:[m?7.5:8.7,  m?7.7:7.2, m?17.2:14.5], look:[0,2.5,0]},
    {p:.68,  pos:[m?5.8:6.4,  m?8.8:8.5, m?18.2:15.8], look:[0,3.0,0]},
    {p:.84,  pos:[m?10.0:12.8,m?9.2:8.9,m?20.5:18.0], look:[0,2.7,0]},
    {p:1,    pos:[m?8.8:10.4, m?7.7:7.0, m?17.4:15.2], look:[0,2.4,0]}
  ];
  let a=beats[0],b=beats[1];
  for(let i=0;i<beats.length-1;i++){if(p>=beats[i].p&&p<=beats[i+1].p){a=beats[i];b=beats[i+1];break}}
  const t=smooth(clamp((p-a.p)/Math.max(.001,b.p-a.p)));
  const targetPos=new THREE.Vector3(lerp(a.pos[0],b.pos[0],t),lerp(a.pos[1],b.pos[1],t),lerp(a.pos[2],b.pos[2],t));
  targetPos.x += preset.cameraBias;
  camera.position.lerp(targetPos, reduceMotion ? .2 : .065);
  const look=new THREE.Vector3(lerp(a.look[0],b.look[0],t),lerp(a.look[1],b.look[1],t),lerp(a.look[2],b.look[2],t));
  camera.lookAt(look);
  if(!paused&&!reduceMotion){keyLight.position.x=-6+Math.sin(time*.12)*1.0;coreLight.position.y=2.5+Math.sin(time*.7)*preset.float;}
}

function updateChapter(p) {
  const idx = Math.min(chapters.length-1, Math.floor(p * chapters.length));
  progressBar.style.height = `${p * 100}%`;
  progressIndex.textContent = String(idx+1).padStart(2,'0');
  chapterMeta.textContent = `${chapters[idx]} / ${String(idx+1).padStart(2,'0')}`;
}

function animate(ms) {
  const time = ms * .001;
  currentProgress = scrollProgress();
  updatePieces(currentProgress); updateCamera(currentProgress,time); updateChapter(currentProgress);
  orbit += (orbitTarget - orbit) * .055;
  world.rotation.y = orbit;
  world.rotation.x = -.055 + currentProgress * .04;
  if (!paused && !reduceMotion && variant === 'orbital') pavilion.position.y = Math.sin(time*.36)*.035;
  else pavilion.position.y *= .9;
  renderer.render(scene,camera);
  raf=requestAnimationFrame(animate);
}

function resize() {
  const m=mobile();
  renderer.setPixelRatio(Math.min(devicePixelRatio,m?1.2:1.65)); renderer.setSize(innerWidth,innerHeight,false);
  camera.aspect=innerWidth/innerHeight; camera.fov=m?40:34; camera.updateProjectionMatrix();
  pavilion.scale.setScalar(m?.64:.82);
}

function destroy() { cancelAnimationFrame(raf); renderer?.dispose(); }

try {
  createScene(); applyPreset('shoji');
  buttons.forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.variant)));
  addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX});
  addEventListener('pointerup',()=>dragging=false); addEventListener('pointercancel',()=>dragging=false);
  addEventListener('pointermove',e=>{if(!dragging)return;orbitTarget+=(e.clientX-lastX)*.0045;lastX=e.clientX});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{paused=document.hidden||motionToggle.getAttribute('aria-pressed')==='true'});
  motionToggle.addEventListener('click',()=>{const next=motionToggle.getAttribute('aria-pressed')!=='true';motionToggle.setAttribute('aria-pressed',String(next));motionToggle.textContent=next?'RESUME MOTION':'PAUSE MOTION';paused=next});
  animate(performance.now());
  window.addEventListener('pagehide',destroy,{once:true});
} catch (error) {
  console.error(error); canvas.style.display='none'; fallback.style.display='block'; chapterMeta.textContent='STATIC FALLBACK';
}
