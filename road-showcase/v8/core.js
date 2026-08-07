import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export {THREE};
export const canvas=document.querySelector('#scene'),loaderEl=document.querySelector('#loader'),loadBar=document.querySelector('#loadBar'),loadStatus=document.querySelector('#loadStatus');
export const chapters=[...document.querySelectorAll('.chapter')],worldIndex=document.querySelector('#worldIndex'),worldName=document.querySelector('#worldName'),worldMeta=document.querySelector('#worldMeta');
export const coarse=matchMedia('(pointer:coarse)').matches,reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches,lowPower=coarse||(navigator.hardwareConcurrency||8)<=4;
export const clamp=THREE.MathUtils.clamp,damp=THREE.MathUtils.damp,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,-1);
export const renderer=new THREE.WebGLRenderer({canvas,antialias:!lowPower,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.15:1.65));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=!lowPower;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
export const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1c28);scene.fog=new THREE.FogExp2(0x0b1c28,.012);
export const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.04,260);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();
export const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));export const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),lowPower?.22:.36,.55,.82);composer.addPass(bloom);composer.addPass(new OutputPass());
export const hemi=new THREE.HemisphereLight(0xcfe9ff,0x152015,1.7);scene.add(hemi);export const sunLight=new THREE.DirectionalLight(0xffedcf,3.5);sunLight.position.set(-4,9,2);sunLight.castShadow=!lowPower;scene.add(sunLight);export const rim=new THREE.PointLight(0x9cecff,10,16,2);scene.add(rim);

const controlPoints=[new THREE.Vector3(0,.3,8),new THREE.Vector3(-2,.55,-8),new THREE.Vector3(3,.7,-25),new THREE.Vector3(-2,.45,-43),new THREE.Vector3(1.5,.35,-62),new THREE.Vector3(4,.4,-82),new THREE.Vector3(-3,.6,-102),new THREE.Vector3(2.4,1.2,-122),new THREE.Vector3(-2,2.4,-142),new THREE.Vector3(2.2,4.2,-163),new THREE.Vector3(0,6.3,-184)];
export const curve=new THREE.CatmullRomCurve3(controlPoints,false,'catmullrom',.7);
export function basisAt(t){t=clamp(t,0,1);const p=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();let side=new THREE.Vector3().crossVectors(tangent,UP).normalize();if(side.lengthSq()<.2)side.set(1,0,0);const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();return{p,tangent,side,normal}}
export const WORLD=[
 {from:0,to:.2,name:'ocean',width:5.2,road:0xd9dde0,rough:.46,metal:.06,edge:0xf8ffff,line:0xffffff,fog:0x6f9db0,bg:0x6f9db0},
 {from:.2,to:.4,name:'forest',width:4.45,road:0x101614,rough:.88,metal:.02,edge:0x6e7358,line:0xc9c1a2,fog:0x23372d,bg:0x182a23},
 {from:.4,to:.6,name:'desert',width:4.7,road:0x4a4034,rough:.92,metal:.01,edge:0xb57d45,line:0xf3d59b,fog:0xbd8450,bg:0xd6995a},
 {from:.6,to:.8,name:'city',width:5.1,road:0x080b10,rough:.22,metal:.5,edge:0x4cdfff,line:0xd5faff,fog:0x11172b,bg:0x070b14},
 {from:.8,to:1,name:'alpine',width:4.5,road:0x171b20,rough:.55,metal:.18,edge:0xd9f9ff,line:0xe8f6ff,fog:0x15233b,bg:0x07101f}
];
const roadGroup=new THREE.Group();scene.add(roadGroup);
export function makeRibbon(from,to,width,material,yLift=0){const segs=Math.max(24,Math.round((to-from)*500)),pos=[],uv=[],idx=[];for(let i=0;i<=segs;i++){const t=from+(to-from)*(i/segs),{p,side,normal}=basisAt(t),l=p.clone().addScaledVector(side,width/2).addScaledVector(normal,yLift),r=p.clone().addScaledVector(side,-width/2).addScaledVector(normal,yLift);pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,i/segs,1,i/segs);if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;roadGroup.add(m);return m}
function lineSegment(from,to,offset,color,opacity=.7){const pts=[],steps=Math.max(20,Math.round((to-from)*350));for(let i=0;i<=steps;i++){const t=from+(to-from)*i/steps,{p,side,normal}=basisAt(t);pts.push(p.clone().addScaledVector(side,offset).addScaledVector(normal,.028))}const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity}));roadGroup.add(l)}
const terrainForest=new THREE.MeshStandardMaterial({color:0x1b2e20,roughness:1}),terrainDesert=new THREE.MeshStandardMaterial({color:0xc98a4b,roughness:1}),terrainCity=new THREE.MeshStandardMaterial({color:0x080a0d,roughness:.55,metalness:.12}),terrainSnow=new THREE.MeshStandardMaterial({color:0xcdd9df,roughness:.92});
makeRibbon(.2,.4,34,terrainForest,-.16);makeRibbon(.4,.6,42,terrainDesert,-.2);makeRibbon(.6,.8,38,terrainCity,-.18);makeRibbon(.8,1,32,terrainSnow,-.2);
WORLD.forEach((w,wi)=>{const mat=new THREE.MeshPhysicalMaterial({color:w.road,roughness:w.rough,metalness:w.metal,clearcoat:wi===3?.85:.14,clearcoatRoughness:wi===3?.12:.55,emissive:wi===3?0x07101a:0,emissiveIntensity:wi===3?.4:0});makeRibbon(w.from,w.to,w.width,mat,.002);lineSegment(w.from,w.to,w.width/2,w.edge,wi===3?.85:.55);lineSegment(w.from,w.to,-w.width/2,w.edge,wi===3?.85:.55);const dashMat=new THREE.MeshBasicMaterial({color:w.line,toneMapped:false,transparent:true,opacity:wi===1?.45:.85});for(let t=w.from+.01;t<w.to-.005;t+=wi===3?.016:.021){const {p,tangent,normal}=basisAt(t),dash=new THREE.Mesh(new THREE.BoxGeometry(.075,.018,wi===3?.72:.5),dashMat);dash.position.copy(p).addScaledVector(normal,.033);dash.quaternion.setFromUnitVectors(FORWARD,tangent);roadGroup.add(dash)}});
export function boxAt(t,offset,w,h,d,mat,y=0){const {p,tangent,side,normal}=basisAt(t),m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.copy(p).addScaledVector(side,offset).addScaledVector(normal,y+h/2);m.quaternion.setFromUnitVectors(FORWARD,tangent);m.castShadow=!lowPower;m.receiveShadow=true;scene.add(m);return m}
export function rockAt(t,offset,s,mat){const {p,side}=basisAt(t),m=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),mat);m.scale.y=.65+Math.random()*.9;m.position.copy(p).addScaledVector(side,offset);m.position.y+=s*.35;m.rotation.set(Math.random(),Math.random(),Math.random());m.castShadow=!lowPower;scene.add(m);return m}
export function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.15:1.65));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();composer.setSize(innerWidth,innerHeight)}
