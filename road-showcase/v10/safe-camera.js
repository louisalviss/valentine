import {THREE,camera,composer,curve,basisAt,UP,clamp,damp,cameraHud,coarse} from './core.js';

// Composition override: every shot must keep the full car and a readable stretch of road in frame.
// We intentionally avoid front-facing, extreme side, and high top-down shots.
const SHOTS=[
  [
    {name:'WIDE ROAD CHASE',back:8.8,height:3.1,side:1.55,ahead:.075,fov:49},
    {name:'SEA ROAD FOLLOW',back:7.5,height:2.45,side:-1.05,ahead:.08,fov:51}
  ],
  [
    {name:'FOREST CHASE',back:6.8,height:2.35,side:.65,ahead:.075,fov:51},
    {name:'FOREST WIDE',back:8.2,height:3.0,side:-1.25,ahead:.085,fov:50}
  ],
  [
    {name:'DESERT SWEEP',back:8.6,height:3.25,side:1.65,ahead:.085,fov:51},
    {name:'DESERT ROAD WIDE',back:9.4,height:4.05,side:-1.45,ahead:.095,fov:52}
  ],
  [
    {name:'CITY EXPRESSWAY',back:7.4,height:3.2,side:.8,ahead:.082,fov:52},
    {name:'NEON ROAD CHASE',back:6.7,height:2.45,side:-.9,ahead:.09,fov:53}
  ],
  [
    {name:'SUMMIT ROAD WIDE',back:8.4,height:3.55,side:1.35,ahead:.085,fov:51},
    {name:'FINAL ROAD PULLBACK',back:10.0,height:4.4,side:-1.1,ahead:.10,fov:52}
  ]
];

const lookMatrix=new THREE.Matrix4();
const desiredQuat=new THREE.Quaternion();
const pos=new THREE.Vector3();
let first=true;
let smoothProgress=.008;
let last=performance.now();

function smoothstep(t){return t*t*(3-2*t)}
function blend(a,b,t){
  const o={name:t<.5?a.name:b.name};
  for(const k of ['back','height','side','ahead','fov'])o[k]=THREE.MathUtils.lerp(a[k],b[k],t);
  return o;
}
function getShot(p){
  const wi=clamp(Math.floor(p*5),0,4);
  const local=p*5-wi;
  return blend(SHOTS[wi][0],SHOTS[wi][1],smoothstep(local));
}

const originalRender=composer.render.bind(composer);
composer.render=(...args)=>{
  const now=performance.now();
  const dt=Math.min((now-last)/1000,.05);last=now;
  const total=Math.max(document.documentElement.scrollHeight-innerHeight,1);
  const target=.008+(scrollY/total)*.984;
  smoothProgress=damp(smoothProgress,target,4.2,dt);

  const shot=getShot(smoothProgress);
  const {p,tangent,side,normal}=basisAt(smoothProgress);
  const desired=p.clone()
    .addScaledVector(tangent,-shot.back)
    .addScaledVector(normal,shot.height)
    .addScaledVector(side,shot.side);

  if(first){pos.copy(desired);first=false}else pos.lerp(desired,1-Math.exp(-dt*4.0));
  camera.position.copy(pos);

  // Aim at a point just ahead of the car, not far into the scenery. This keeps both
  // the vehicle and the road surface visually dominant in every biome.
  const roadAhead=curve.getPointAt(clamp(smoothProgress+shot.ahead,0,1));
  const carAnchor=p.clone().addScaledVector(UP,.62);
  const focus=carAnchor.lerp(roadAhead.clone().addScaledVector(UP,.42),.58);
  lookMatrix.lookAt(camera.position,focus,UP);
  desiredQuat.setFromRotationMatrix(lookMatrix);
  camera.quaternion.slerp(desiredQuat,1-Math.exp(-dt*5.0));

  // Mobile gets an even wider safety frame.
  camera.fov=damp(camera.fov,shot.fov+(coarse?4:0),5.0,dt);
  camera.updateProjectionMatrix();
  cameraHud.textContent=shot.name;

  originalRender(...args);
};
