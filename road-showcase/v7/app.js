import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas=document.querySelector('#scene');
const loaderEl=document.querySelector('#loader');
const loadBar=document.querySelector('#loadBar');
const loadStatus=document.querySelector('#loadStatus');
const chapters=[...document.querySelectorAll('.chapter')];
const chapterNum=document.querySelector('#chapterNum');
const chapterName=document.querySelector('#chapterName');
const chapterMeta=document.querySelector('#chapterMeta');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const lowPower=coarse || (navigator.hardwareConcurrency||8)<=4;
const clamp=THREE.MathUtils.clamp;
const damp=(a,b,s,dt)=>THREE.MathUtils.damp(a,b,s,dt);

const renderer=new THREE.WebGLRenderer({canvas,antialias:!lowPower,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.25:1.8));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=!lowPower;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x04060a);
scene.fog=new THREE.FogExp2(0x060910,0.022);
const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.05,180);

const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
pmrem.dispose();

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),lowPower?.34:.52,.68,.76);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const hemi=new THREE.HemisphereLight(0xa8c8ff,0x08070b,1.25);scene.add(hemi);
const key=new THREE.DirectionalLight(0xd9f5ff,4.5);key.position.set(4,7,3);key.castShadow=!lowPower;scene.add(key);
const rim=new THREE.PointLight(0x80dfff,18,18,2);scene.add(rim);
const warm=new THREE.PointLight(0xffc786,12,22,2);scene.add(warm);

const controlPoints=[
 new THREE.Vector3(0,0,4),new THREE.Vector3(-1.8,.05,-6),new THREE.Vector3(2.6,.2,-17),new THREE.Vector3(-2.2,.4,-29),
 new THREE.Vector3(1.5,.15,-41),new THREE.Vector3(0,1.3,-54),new THREE.Vector3(-3.4,3.1,-67),new THREE.Vector3(2.8,4.6,-79),
 new THREE.Vector3(-1.3,5.0,-91),new THREE.Vector3(0,5.2,-105)
];
const curve=new THREE.CatmullRomCurve3(controlPoints,false,'catmullrom',.62);
const UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,-1);
function basisAt(t){
 const p=curve.getPointAt(clamp(t,0,1));
 const tangent=curve.getTangentAt(clamp(t,0,1)).normalize();
 let side=new THREE.Vector3().crossVectors(tangent,UP).normalize();
 if(side.lengthSq()<.1)side.set(1,0,0);
 const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();
 return {p,tangent,side,normal};
}

function makeRoad(){
 const segs=520,width=4.2,positions=[],uvs=[],indices=[],leftPts=[],rightPts=[];
 for(let i=0;i<=segs;i++){
   const t=i/segs,{p,side}=basisAt(t);const wave=Math.sin(t*Math.PI*9)*.05;
   const l=p.clone().addScaledVector(side,width/2+wave),r=p.clone().addScaledVector(side,-width/2-wave);
   positions.push(l.x,l.y,l.z,r.x,r.y,r.z);uvs.push(0,t*40,1,t*40);leftPts.push(l.clone().addScaledVector(UP,.018));rightPts.push(r.clone().addScaledVector(UP,.018));
   if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,b,c,b,d,c)}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const mat=new THREE.MeshPhysicalMaterial({color:0x0b0e14,roughness:.28,metalness:.52,clearcoat:.6,clearcoatRoughness:.3,emissive:0x071019,emissiveIntensity:.45});
 const road=new THREE.Mesh(geo,mat);road.receiveShadow=true;scene.add(road);
 const edgeMat=new THREE.LineBasicMaterial({color:0x91efff,transparent:true,opacity:.38});scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftPts),edgeMat),new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightPts),edgeMat.clone()));
 const dashGeo=new THREE.BoxGeometry(.08,.018,.62),dashMat=new THREE.MeshBasicMaterial({color:0xcdf8ff,toneMapped:false});
 for(let i=5;i<98;i+=2){const t=i/100,{p,tangent,normal}=basisAt(t);const dash=new THREE.Mesh(dashGeo,dashMat);dash.position.copy(p).addScaledVector(normal,.025);dash.quaternion.setFromUnitVectors(FORWARD,tangent);scene.add(dash)}
 return {road,edgeMat};
}
const roadSystem=makeRoad();

function createShadowTexture(){
 const cn=document.createElement('canvas');cn.width=256;cn.height=128;const cx=cn.getContext('2d');const g=cx.createRadialGradient(128,64,2,128,64,100);g.addColorStop(0,'rgba(0,0,0,.66)');g.addColorStop(.48,'rgba(0,0,0,.36)');g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(0,0,256,128);return new THREE.CanvasTexture(cn);
}
const carRig=new THREE.Group();scene.add(carRig);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.5,1.15),new THREE.MeshBasicMaterial({map:createShadowTexture(),transparent:true,depthWrite:false,toneMapped:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;carRig.add(shadow);
const underGlow=new THREE.PointLight(0x65ddff,5.5,3.8,2);underGlow.position.y=.18;carRig.add(underGlow);

function proceduralCar(){
 const g=new THREE.Group();
 const paint=new THREE.MeshPhysicalMaterial({color:0x0a121d,metalness:.92,roughness:.12,clearcoat:1,clearcoatRoughness:.08,emissive:0x061526,emissiveIntensity:.4});
 const glass=new THREE.MeshPhysicalMaterial({color:0x244866,metalness:.05,roughness:.05,transmission:.58,transparent:true,opacity:.76});
 const body=new THREE.Mesh(new RoundedBoxGeometry(1.55,.34,3.25,8,.15),paint);body.position.y=.39;body.castShadow=true;g.add(body);
 const nose=new THREE.Mesh(new RoundedBoxGeometry(1.42,.16,1.2,6,.14),paint);nose.position.set(0,.48,-1.72);nose.rotation.x=-.07;g.add(nose);
 const cabin=new THREE.Mesh(new RoundedBoxGeometry(1.18,.45,1.42,8,.18),glass);cabin.position.set(0,.72,-.15);cabin.scale.set(.92,1,.95);g.add(cabin);
 const wheelMat=new THREE.MeshStandardMaterial({color:0x060708,metalness:.65,roughness:.28});const rimMat=new THREE.MeshStandardMaterial({color:0x718093,metalness:1,roughness:.14});
 const wheelGeo=new THREE.CylinderGeometry(.35,.35,.18,24),rimGeo=new THREE.CylinderGeometry(.19,.19,.19,16);
 [[-.84,.35,-1.05],[.84,.35,-1.05],[-.84,.35,1.05],[.84,.35,1.05]].forEach(([x,y,z])=>{const wh=new THREE.Mesh(wheelGeo,wheelMat);wh.rotation.z=Math.PI/2;wh.position.set(x,y,z);wh.castShadow=true;g.add(wh);const rr=new THREE.Mesh(rimGeo,rimMat);rr.rotation.z=Math.PI/2;rr.position.set(x,y,z);g.add(rr)});
 const tail=new THREE.Mesh(new THREE.BoxGeometry(1.18,.045,.035),new THREE.MeshBasicMaterial({color:0xff365f,toneMapped:false}));tail.position.set(0,.51,1.64);g.add(tail);
 const headMat=new THREE.MeshBasicMaterial({color:0xcffcff,toneMapped:false});[-.47,.47].forEach(x=>{const h=new THREE.Mesh(new THREE.BoxGeometry(.36,.035,.035),headMat);h.position.set(x,.5,-2.33);g.add(h)});
 g.userData.fallback=true;return g;
}
let carModel=proceduralCar();carRig.add(carModel);

function fitLoadedCar(root){
 root.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
 if(size.x>size.z){root.rotation.y=Math.PI/2;root.updateMatrixWorld(true);box.setFromObject(root);size=box.getSize(new THREE.Vector3())}
 const desired=3.5,scale=desired/Math.max(size.z,size.x);root.scale.setScalar(scale);root.updateMatrixWorld(true);box.setFromObject(root);
 const center=box.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=box.min.y;
 root.traverse(o=>{if(o.isMesh){o.castShadow=!lowPower;o.receiveShadow=true;if(o.material){o.material.envMapIntensity=1.35}}});
 return root;
}
const modelUrl='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb';
loadStatus.textContent='Loading concept car';
new GLTFLoader().load(modelUrl,(gltf)=>{
 try{const root=fitLoadedCar(gltf.scene);carRig.remove(carModel);carModel=root;carRig.add(carModel);loadBar.style.setProperty('--load','100%');loadStatus.textContent='Ready';setTimeout(()=>loaderEl.classList.add('done'),450)}catch(e){loadStatus.textContent='Fallback car ready';setTimeout(()=>loaderEl.classList.add('done'),500)}
},xhr=>{if(xhr.total){const pct=20+Math.min(75,xhr.loaded/xhr.total*75);loadBar.style.width=pct+'%'}},()=>{loadStatus.textContent='Fallback car ready';loadBar.style.width='100%';setTimeout(()=>loaderEl.classList.add('done'),450)});
setTimeout(()=>{if(!loaderEl.classList.contains('done')){loadBar.style.width='100%';loadStatus.textContent='Scene ready';loaderEl.classList.add('done')}},7000);

function placeBox(t,offset,height,width,depth,material){const {p,tangent,side}=basisAt(t);const m=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),material);m.position.copy(p).addScaledVector(side,offset);m.position.y+=height/2-.05;m.quaternion.setFromUnitVectors(FORWARD,tangent);m.castShadow=!lowPower;m.receiveShadow=true;scene.add(m);return m}

const monoMat=new THREE.MeshStandardMaterial({color:0x090b10,metalness:.7,roughness:.3});
for(let i=0;i<18;i++){const t=.025+i*.009,side=i%2?1:-1;placeBox(t,side*(3.7+(i%4)*1.05),2.8+(i%5)*1.35,.8+(i%3)*.22,.75,monoMat)}
const eclipseBasis=basisAt(.16);const eclipse=new THREE.Group();eclipse.position.copy(eclipseBasis.p).add(new THREE.Vector3(0,7,-4));const halo=new THREE.Mesh(new THREE.RingGeometry(4.5,4.85,96),new THREE.MeshBasicMaterial({color:0xffc88c,side:THREE.DoubleSide,transparent:true,opacity:.62,toneMapped:false}));const disc=new THREE.Mesh(new THREE.CircleGeometry(4.5,96),new THREE.MeshBasicMaterial({color:0x030407,side:THREE.DoubleSide}));eclipse.add(halo,disc);eclipse.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),eclipseBasis.tangent.clone().negate());scene.add(eclipse);

const cityDark=new THREE.MeshStandardMaterial({color:0x08101b,roughness:.3,metalness:.7,emissive:0x050a11,emissiveIntensity:.7});
const neonA=new THREE.MeshStandardMaterial({color:0x111821,roughness:.25,metalness:.8,emissive:0x48d7ff,emissiveIntensity:3.2});
const neonB=new THREE.MeshStandardMaterial({color:0x151021,roughness:.25,metalness:.8,emissive:0x9a5cff,emissiveIntensity:2.7});
for(let i=0;i<64;i++){const t=.20+i*.0032,side=i%2?1:-1,off=side*(3.3+(i%6)*.72);placeBox(t,off,2.5+(i*7%10)*.72,.7+(i%4)*.22,1.05, i%5===0?(i%2?neonA:neonB):cityDark)}
const rainGeo=new THREE.BufferGeometry(),rainPos=[];for(let i=0;i<(lowPower?600:1300);i++){rainPos.push((Math.random()-.5)*14,Math.random()*8+1,-15-Math.random()*28)}rainGeo.setAttribute('position',new THREE.Float32BufferAttribute(rainPos,3));const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xb7ecff,size:.025,transparent:true,opacity:.42,depthWrite:false}));scene.add(rain);

const frameMatA=new THREE.MeshStandardMaterial({color:0x0e1420,metalness:.8,roughness:.18,emissive:0x5de6ff,emissiveIntensity:2.0});
const frameMatB=new THREE.MeshStandardMaterial({color:0x120d1b,metalness:.8,roughness:.18,emissive:0x9c66ff,emissiveIntensity:1.9});
const frames=[];
for(let i=0;i<24;i++){
 const t=.41+i*.0071,{p,tangent}=basisAt(t);const group=new THREE.Group();group.position.copy(p).addScaledVector(UP,2.35);group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),tangent);
 const mat=i%2?frameMatA:frameMatB;const top=new THREE.Mesh(new THREE.BoxGeometry(6.8,.1,.1),mat),left=new THREE.Mesh(new THREE.BoxGeometry(.1,4.7,.1),mat),right=left.clone();top.position.y=2.2;left.position.set(-3.35,0,0);right.position.set(3.35,0,0);group.add(top,left,right);group.userData.spin=(i%2?1:-1)*(.14+(i%5)*.014);scene.add(group);frames.push(group)
}

const cloudMat=new THREE.MeshBasicMaterial({color:0xd9f2ff,transparent:true,opacity:.075,depthWrite:false});
const clouds=[];for(let i=0;i<(lowPower?38:72);i++){const t=.61+Math.random()*.18,{p,side}=basisAt(t);const c=new THREE.Mesh(new THREE.SphereGeometry(.7+Math.random()*1.8,10,7),cloudMat);c.scale.set(1.8,.55,1);c.position.copy(p).addScaledVector(side,(Math.random()-.5)*16);c.position.y-=1.4+Math.random()*3.6;scene.add(c);clouds.push(c)}
const sunBasis=basisAt(.78);const sun=new THREE.Mesh(new THREE.SphereGeometry(7,48,24),new THREE.MeshBasicMaterial({color:0xffddb0,toneMapped:false}));sun.position.copy(sunBasis.p).add(new THREE.Vector3(8,9,-9));scene.add(sun);const sunGlow=new THREE.PointLight(0xffbb78,28,45,2);sunGlow.position.copy(sun.position);scene.add(sunGlow);

const crystalMatA=new THREE.MeshPhysicalMaterial({color:0x9edfff,metalness:.76,roughness:.13,transparent:true,opacity:.72,emissive:0x356ca5,emissiveIntensity:.72});
const crystalMatB=new THREE.MeshPhysicalMaterial({color:0xbfa3ff,metalness:.76,roughness:.13,transparent:true,opacity:.68,emissive:0x6d45a0,emissiveIntensity:.72});
const crystals=[];for(let i=0;i<45;i++){const t=.80+Math.random()*.18,{p,side}=basisAt(t);const h=1.1+Math.random()*4.3;const mesh=new THREE.Mesh(new THREE.ConeGeometry(.25+Math.random()*.55,h,4),i%2?crystalMatA:crystalMatB);mesh.position.copy(p).addScaledVector(side,(i%2?1:-1)*(3+Math.random()*6));mesh.position.y+=h/2-.1;mesh.rotation.y=Math.random()*Math.PI;mesh.rotation.z=(Math.random()-.5)*.18;scene.add(mesh);crystals.push(mesh)}
const end=basisAt(.985);const portal=new THREE.Mesh(new THREE.TorusGeometry(4.2,.055,12,96),new THREE.MeshBasicMaterial({color:0xcdf7ff,toneMapped:false,transparent:true,opacity:.72}));portal.position.copy(end.p).addScaledVector(UP,2.2);portal.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),end.tangent);scene.add(portal);

const streakCount=lowPower?70:160,streakGeo=new THREE.BufferGeometry(),streakPos=[];for(let i=0;i<streakCount;i++)streakPos.push((Math.random()-.5)*12,(Math.random()-.5)*7,-Math.random()*18);streakGeo.setAttribute('position',new THREE.Float32BufferAttribute(streakPos,3));const streakMat=new THREE.PointsMaterial({color:0xc9f5ff,size:.025,transparent:true,opacity:0,depthWrite:false});const streaks=new THREE.Points(streakGeo,streakMat);camera.add(streaks);scene.add(camera);

let targetProgress=.012,progress=.012,lastScroll=scrollY,lastTarget=.012,scrollVelocity=0;
function syncScroll(){const total=Math.max(document.documentElement.scrollHeight-innerHeight,1);targetProgress=.012+(scrollY/total)*.965;targetProgress=clamp(targetProgress,.012,.977);const raw=Math.abs(scrollY-lastScroll);lastScroll=scrollY;scrollVelocity=Math.min(1,scrollVelocity+raw/800)}
addEventListener('scroll',syncScroll,{passive:true});syncScroll();
function syncChapter(){const total=Math.max(document.documentElement.scrollHeight-innerHeight,1);const p=scrollY/total;const idx=clamp(Math.floor(p*chapters.length),0,chapters.length-1);const ch=chapters[idx];chapterNum.textContent=String(idx+1).padStart(2,'0');chapterName.textContent=ch.dataset.name;chapterMeta.textContent=ch.dataset.meta;document.documentElement.style.setProperty('--progress',`${p*100}%`)}

const clock=new THREE.Clock();let first=true;
function render(){
 const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;
 progress=damp(progress,targetProgress,reduceMotion?16:5.7,dt);scrollVelocity=damp(scrollVelocity,Math.abs(targetProgress-lastTarget)*55,5.8,dt);lastTarget=targetProgress;syncChapter();
 const {p,tangent,side,normal}=basisAt(progress);
 const contactLift=.025+Math.sin(time*9)*.002;carRig.position.copy(p).addScaledVector(normal,contactLift);carRig.quaternion.setFromUnitVectors(FORWARD,tangent);
 const behind=coarse?5.25:6.15,camHeight=coarse?2.05:2.45,sideOffset=coarse?.08:.34;
 const desired=p.clone().addScaledVector(tangent,-behind).addScaledVector(normal,camHeight).addScaledVector(side,sideOffset);
 camera.position.lerp(desired,1-Math.exp(-dt*6.8));
 const lookT=clamp(progress+.045+scrollVelocity*.008,0,1),look=curve.getPointAt(lookT).addScaledVector(UP,.75);
 camera.lookAt(look);camera.fov=damp(camera.fov,45+scrollVelocity*4.2,4.2,dt);camera.updateProjectionMatrix();
 rim.position.copy(p).addScaledVector(side,-2.2).addScaledVector(normal,1.8).addScaledVector(tangent,-1);warm.position.copy(p).addScaledVector(side,2.3).addScaledVector(normal,2.5).addScaledVector(tangent,1);
 roadSystem.road.material.emissiveIntensity=.38+scrollVelocity*.5;roadSystem.edgeMat.opacity=.28+scrollVelocity*.28;
 bloom.strength=(lowPower?.26:.44)+scrollVelocity*.25;streakMat.opacity=scrollVelocity*.32;streaks.position.z=(time*12)%8;
 document.documentElement.style.setProperty('--speed-opacity',String(scrollVelocity*.7));
 frames.forEach((f,i)=>{f.rotation.z=Math.sin(time*.42+i*.38)*.09 + time*f.userData.spin*.12});
 rain.position.y=-((time*8)%3);clouds.forEach((c,i)=>c.position.x+=Math.sin(time*.12+i)*.0006);crystals.forEach((c,i)=>c.rotation.y+=dt*(.04+(i%5)*.008));portal.rotation.z+=dt*.055;
 scene.fog.density=.018+(.5-Math.abs(progress-.5))*.006;
 if(first){first=false;setTimeout(()=>{if(!loaderEl.classList.contains('done'))loaderEl.classList.add('done')},2200)}
 composer.render();requestAnimationFrame(render)
}
render();

addEventListener('resize',()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.25:1.8));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();composer.setSize(innerWidth,innerHeight)});
