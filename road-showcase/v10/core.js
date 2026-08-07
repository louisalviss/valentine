import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export {THREE};
export const canvas=document.querySelector('#scene'),loaderEl=document.querySelector('#loader'),loadBar=document.querySelector('#loadBar'),loadStatus=document.querySelector('#loadStatus');
export const chapters=[...document.querySelectorAll('.chapter')],worldIndex=document.querySelector('#worldIndex'),worldName=document.querySelector('#worldName'),worldMeta=document.querySelector('#worldMeta'),cameraHud=document.querySelector('#cameraHud');
export const coarse=matchMedia('(pointer:coarse)').matches,reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches,lowPower=coarse||(navigator.hardwareConcurrency||8)<=4;
export const clamp=THREE.MathUtils.clamp,damp=THREE.MathUtils.damp,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,-1);
export const renderer=new THREE.WebGLRenderer({canvas,antialias:!lowPower,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.1:1.6));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=!lowPower;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
export const scene=new THREE.Scene();scene.background=new THREE.Color(0x6aa7bf);scene.fog=new THREE.FogExp2(0x6aa7bf,.009);
export const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.04,320);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();
export const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));export const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),lowPower?.18:.3,.48,.84);composer.addPass(bloom);composer.addPass(new OutputPass());
export const hemi=new THREE.HemisphereLight(0xe7f8ff,0x263128,1.55);scene.add(hemi);export const sunLight=new THREE.DirectionalLight(0xffedcf,3.8);sunLight.position.set(-7,12,4);sunLight.castShadow=!lowPower;scene.add(sunLight);export const rim=new THREE.PointLight(0x9cecff,11,18,2);scene.add(rim);

const controlPoints=[
new THREE.Vector3(0,.45,10),new THREE.Vector3(-3,.7,-6),new THREE.Vector3(4,.65,-21),new THREE.Vector3(-4,.55,-37),
new THREE.Vector3(-8,.7,-49),new THREE.Vector3(-2,.55,-62),new THREE.Vector3(6,.85,-75),
new THREE.Vector3(13,1,-90),new THREE.Vector3(5,1.25,-106),new THREE.Vector3(-8,1.45,-122),
new THREE.Vector3(-3,2.3,-138),new THREE.Vector3(7,3.2,-153),new THREE.Vector3(3,4.3,-168),
new THREE.Vector3(-6,6.3,-183),new THREE.Vector3(5,8.3,-198),new THREE.Vector3(0,10.4,-214)
];
export const curve=new THREE.CatmullRomCurve3(controlPoints,false,'catmullrom',.62);
export function basisAt(t){t=clamp(t,0,1);const p=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();let side=new THREE.Vector3().crossVectors(tangent,UP).normalize();if(side.lengthSq()<.2)side.set(1,0,0);const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();return{p,tangent,side,normal}}
export const WORLD=[
 {from:0,to:.2,name:'ocean',width:5.7,road:0xcfd3d0,rough:.65,metal:.04,edge:0xf7ffff,line:0xffffff,fog:0x70a9c0,bg:0x75b7ce},
 {from:.2,to:.4,name:'forest',width:4.1,road:0x151a17,rough:.96,metal:.01,edge:0x4c6251,line:0xded8b7,fog:0x294338,bg:0x1b3129},
 {from:.4,to:.6,name:'desert',width:4.8,road:0x55453a,rough:.95,metal:.01,edge:0xad7546,line:0xf7d9a1,fog:0xbd7e4c,bg:0xd79a61},
 {from:.6,to:.8,name:'city',width:6.2,road:0x070b10,rough:.24,metal:.48,edge:0x59eaff,line:0xe0fbff,fog:0x10172c,bg:0x060a13},
 {from:.8,to:1,name:'alpine',width:4.25,road:0x1a2029,rough:.62,metal:.12,edge:0xe9fbff,line:0xf5ffff,fog:0x182a44,bg:0x07111f}
];
const roadGroup=new THREE.Group();scene.add(roadGroup);
export function makeRibbon(from,to,width,material,yLift=0){const segs=Math.max(26,Math.round((to-from)*560)),pos=[],uv=[],idx=[];for(let i=0;i<=segs;i++){const t=from+(to-from)*(i/segs),{p,side,normal}=basisAt(t),l=p.clone().addScaledVector(side,width/2).addScaledVector(normal,yLift),r=p.clone().addScaledVector(side,-width/2).addScaledVector(normal,yLift);pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,i/segs,1,i/segs);if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;roadGroup.add(m);return m}
function lineSegment(from,to,offset,color,opacity=.7){const pts=[],steps=Math.max(20,Math.round((to-from)*380));for(let i=0;i<=steps;i++){const t=from+(to-from)*i/steps,{p,side,normal}=basisAt(t);pts.push(p.clone().addScaledVector(side,offset).addScaledVector(normal,.03))}const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity}));roadGroup.add(l)}
const terrainForest=new THREE.MeshStandardMaterial({color:0x203727,roughness:1,flatShading:true}),terrainDesert=new THREE.MeshStandardMaterial({color:0xc4864a,roughness:1,flatShading:true}),terrainCity=new THREE.MeshStandardMaterial({color:0x07090d,roughness:.58,metalness:.1,flatShading:true}),terrainSnow=new THREE.MeshStandardMaterial({color:0xcfdbe3,roughness:.96,flatShading:true});
makeRibbon(.2,.4,38,terrainForest,-.2);makeRibbon(.4,.6,48,terrainDesert,-.24);makeRibbon(.6,.8,44,terrainCity,-.2);makeRibbon(.8,1,36,terrainSnow,-.24);
WORLD.forEach((w,wi)=>{const mat=new THREE.MeshPhysicalMaterial({color:w.road,roughness:w.rough,metalness:w.metal,clearcoat:wi===3?.9:.08,clearcoatRoughness:wi===3?.11:.65,flatShading:true,emissive:wi===3?0x06131b:0,emissiveIntensity:wi===3?.45:0});makeRibbon(w.from,w.to,w.width,mat,.002);lineSegment(w.from,w.to,w.width/2,w.edge,wi===3?.95:.58);lineSegment(w.from,w.to,-w.width/2,w.edge,wi===3?.95:.58);const dashMat=new THREE.MeshBasicMaterial({color:w.line,toneMapped:false,transparent:true,opacity:wi===1?.5:.88});const lanes=wi===3?3:wi===0?2:1;for(let t=w.from+.012;t<w.to-.006;t+=wi===3?.015:.022){const {p,tangent,side,normal}=basisAt(t);const offsets=lanes===3?[-w.width*.23,0,w.width*.23]:lanes===2?[-w.width*.18,w.width*.18]:[0];offsets.forEach(off=>{const dash=new THREE.Mesh(new THREE.BoxGeometry(.07,.018,wi===3?.75:.5),dashMat);dash.position.copy(p).addScaledVector(side,off).addScaledVector(normal,.034);dash.quaternion.setFromUnitVectors(FORWARD,tangent);roadGroup.add(dash)})}});
export function boxAt(t,offset,w,h,d,mat,y=0){const {p,tangent,side,normal}=basisAt(t),m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.copy(p).addScaledVector(side,offset).addScaledVector(normal,y+h/2);m.quaternion.setFromUnitVectors(FORWARD,tangent);m.castShadow=!lowPower;m.receiveShadow=true;scene.add(m);return m}
export function rockAt(t,offset,s,mat){const {p,side}=basisAt(t),m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),mat);m.scale.set(1,.55+Math.random()*.8,.75+Math.random()*.7);m.position.copy(p).addScaledVector(side,offset);m.position.y+=s*.32;m.rotation.set(Math.random(),Math.random(),Math.random());m.castShadow=!lowPower;scene.add(m);return m}
export function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.1:1.6));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();composer.setSize(innerWidth,innerHeight)}
