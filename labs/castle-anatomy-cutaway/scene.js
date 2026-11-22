import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
// A procedural 3D study: all major architectural layers are real WebGL groups.
// This is an architectural fantasy, not a 2D image dragged across the screen.
const canvas=document.getElementById('scene'),loader=document.getElementById('loading');
const mobile=()=>innerWidth<=780,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
}catch(e){loader.remove();document.getElementById('fallback').style.display='block';throw e}
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0a1a28,.011);
const camera=new THREE.PerspectiveCamera(36,1,.1,140);
const world=new THREE.Group();scene.add(world);
const hemisphere=new THREE.HemisphereLight(0xbad4e6,0x223041,2.15);scene.add(hemisphere);
const key=new THREE.DirectionalLight(0xffe8cb,3.15);key.position.set(-12,20,14);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-23;key.shadow.camera.right=23;key.shadow.camera.top=23;key.shadow.camera.bottom=-23;scene.add(key);
const rim=new THREE.DirectionalLight(0x8bb6e3,2.35);rim.position.set(11,12,-12);scene.add(rim);
const fill=new THREE.DirectionalLight(0x6c90b7,1.15);fill.position.set(12,2,18);scene.add(fill);
const warmA=new THREE.PointLight(0xffa64e,28,14,2);warmA.position.set(-1,5,1);world.add(warmA);
const warmB=new THREE.PointLight(0xffc383,19,11,2);warmB.position.set(3,3,-.8);world.add(warmB);
let seed=28657;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function masonry(){
  const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');
  x.fillStyle='#b1abb0';x.fillRect(0,0,512,512);
  for(let row=0;row<26;row++){
    const yy=row*20,off=(row%2)*21;for(let col=-1;col<16;col++){
      const xx=col*43+off;const v=Math.floor(123+rand()*47);
      x.fillStyle='rgb('+v+','+Math.floor(v*.98)+','+Math.floor(v*.94)+')';
      x.fillRect(xx+1,yy+1,41,18);
      x.fillStyle='rgba(35,35,45,.15)';
      x.fillRect(xx,yy+18,42,2);
      x.fillRect(xx+41,yy,2,20);
      if(rand()<.5){x.strokeStyle='rgba(52,50,54,.17)';x.beginPath();x.moveTo(xx+4,yy+6);x.lineTo(xx+20+rand()*14,yy+7+rand()*4);x.stroke()}
    }
  }
  for(let i=0;i<4200;i++){const v=rand()>.5?255:22;x.fillStyle='rgba('+v+','+v+','+v+','+(rand()*.16)+')';x.fillRect(rand()*512,rand()*512,rand()*2+1,rand()*2+1)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const stoneMap=masonry();
const mat={
 stone:new THREE.MeshStandardMaterial({map:stoneMap,color:0xded5c8,roughness:.94,metalness:.02}),
 stone2:new THREE.MeshStandardMaterial({map:stoneMap,color:0xbab4b4,roughness:.97,metalness:0}),
 dark:new THREE.MeshStandardMaterial({color:0x3d4a59,roughness:.9,metalness:.12}),
 slate:new THREE.MeshStandardMaterial({color:0x30475e,roughness:.53,metalness:.23}),
 roofEdge:new THREE.MeshStandardMaterial({color:0x889aaa,roughness:.48,metalness:.33}),
 brass:new THREE.MeshStandardMaterial({color:0xcca474,roughness:.31,metalness:.68}),
 iron:new THREE.MeshStandardMaterial({color:0x292c37,roughness:.39,metalness:.68}),
 wood:new THREE.MeshStandardMaterial({color:0x73533a,roughness:.81}),
 woodDark:new THREE.MeshStandardMaterial({color:0x392b26,roughness:.82}),
 glass:new THREE.MeshPhysicalMaterial({color:0x426071,roughness:.18,metalness:.25,transmission:.15,transparent:true,opacity:.83,clearcoat:.85}),
 amber:new THREE.MeshStandardMaterial({color:0xd9a35e,emissive:0xff8c35,emissiveIntensity:1.6,roughness:.34,metalness:.1}),
 ruby:new THREE.MeshStandardMaterial({color:0x692a38,roughness:.83,side:THREE.DoubleSide}),
 blue:new THREE.MeshStandardMaterial({color:0x355f78,roughness:.7,metalness:.1}),
 rock:new THREE.MeshStandardMaterial({color:0x4c555a,roughness:1,flatShading:true}),
 grass:new THREE.MeshStandardMaterial({color:0x47564e,roughness:.97}),
 water:new THREE.MeshPhysicalMaterial({color:0x3a7289,transparent:true,opacity:.65,roughness:.22,metalness:.32,side:THREE.DoubleSide}),
 candle:new THREE.MeshBasicMaterial({color:0xffd59b}),
 stroke:new THREE.LineBasicMaterial({color:0xd8b78a,transparent:true,opacity:.32,depthWrite:false})
};
const boxGeo=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
function mesh(g,geo,m,x=0,y=0,z=0){const q=new THREE.Mesh(geo,m);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;g.add(q);return q}
function B(g,x,y,z,w,h,d,m=mat.stone){return mesh(g,boxGeo(w,h,d),m,x,y,z)}
function C(g,x,y,z,r1,r2,h,material=mat.stone,seg=16){return mesh(g,new THREE.CylinderGeometry(r1,r2,h,seg),material,x,y,z)}
function cone(g,x,y,z,r,h,material=mat.slate,seg=12){return mesh(g,new THREE.ConeGeometry(r,h,seg),material,x,y,z)}
function ring(g,x,y,z,r,t,material=mat.brass,segments=32){const a=mesh(g,new THREE.TorusGeometry(r,t,7,segments),material,x,y,z);a.rotation.x=Math.PI/2;return a}
function line(g,a,b,m=mat.stroke){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);const o=new THREE.Line(geo,m);g.add(o);return o}
function spike(g,x,y,z,h=.25,r=.025){cone(g,x,y+h/2,z,r,h,mat.brass,8)}
function finial(g,x,y,z){C(g,x,y,z,.055,.075,.18,mat.brass,10);ring(g,x,y+.14,z,.09,.022);spike(g,x,y+.15,z,.4,.064)}
function ledge(g,x,y,z,w,d){B(g,x,y,z,w,.11,d,mat.stone2);B(g,x,y+.075,z,w+.04,.035,d+.04,mat.brass)}
function windowG(g,x,y,z,s=.45,orientation=0,lit=true){
 const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=orientation;g.add(q);
 B(q,0,0,-.016,s*.66,s*1.45,.035,mat.iron);
 if(lit)B(q,0,0,.014,s*.54,s*1.28,.038,mat.amber);
 else B(q,0,0,.014,s*.54,s*1.28,.038,mat.glass);
 B(q,-s*.4,0,.053,s*.13,s*1.55,.09,mat.stone2);
 B(q,s*.4,0,.053,s*.13,s*1.55,.09,mat.stone2);
 const left=B(q,-s*.22,s*.84,.043,s*.12,s*.62,.09,mat.stone2);left.rotation.z=-.56;
 const right=B(q,s*.22,s*.84,.043,s*.12,s*.62,.09,mat.stone2);right.rotation.z=.56;
 B(q,0,-s*.04,.062,s*.08,s*1.35,.055,mat.iron);
 B(q,0,.17*s,.065,s*.66,s*.055,.055,mat.iron);
 B(q,0,-s*.83,.08,s*1.05,s*.12,.17,mat.stone2);
 return q;
}
function arrowSlit(g,x,y,z,rot=0){const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=rot;g.add(q);B(q,0,0,.008,.07,.48,.025,mat.iron);B(q,0,0,.033,.022,.36,.03,mat.amber);B(q,0,0,.046,.23,.038,.04,mat.iron)}
function banner(g,x,y,z,rot=0,s=1){
 const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=rot;g.add(q);
 const sh=new THREE.Shape();sh.moveTo(-.25*s,.52*s);sh.lineTo(.25*s,.52*s);sh.lineTo(.25*s,-.5*s);sh.lineTo(0,-.3*s);sh.lineTo(-.25*s,-.5*s);sh.closePath();
 const flag=mesh(q,new THREE.ShapeGeometry(sh),mat.ruby,0,0,.02);flag.material.side=THREE.DoubleSide;
 B(q,0,.54*s,0,.64*s,.047*s,.065*s,mat.brass);
 C(q,0,.55*s,0,.052*s,.052*s,.08*s,mat.brass);
 const emblem=mesh(q,new THREE.OctahedronGeometry(.12*s),mat.brass,0,.07*s,.056);emblem.scale.z=.15;
 return q;
}
function colonnade(g,x,y,z,n=4,spacing=.7,height=2.3){
 for(let i=0;i<n;i++){const px=x+(i-(n-1)/2)*spacing;
  C(g,px,y+height/2,z,.095,.12,height,mat.stone2,10);
  C(g,px,y+.06,z,.21,.21,.12,mat.stone,10);C(g,px,y+height-.08,z,.17,.19,.19,mat.stone2,10);
 }
 B(g,x,y+height+.07,z,n*spacing+.05,.22,.29,mat.stone2);
}
function battlements(g,axis,center,length,y,z,step=.44){
 const n=Math.max(2,Math.floor(length/step));
 for(let i=0;i<=n;i++){const dx=(i/n-.5)*length;
  if(axis==='x')B(g,center+dx,y,z,.26,.35,.43,mat.stone2);
  else B(g,center,y,z+dx,.43,.35,.26,mat.stone2);
 }
}
function roof(g,x,y,z,w,d,height=.9){
 const geom=new THREE.BufferGeometry();
 const vertices=[
 -w/2,0,-d/2,0,height,-d/2,w/2,0,-d/2,
 -w/2,0,d/2,w/2,0,d/2,0,height,d/2,
 -w/2,0,-d/2,-w/2,0,d/2,0,height,d/2,
 -w/2,0,-d/2,0,height,d/2,0,height,-d/2,
 w/2,0,-d/2,0,height,-d/2,0,height,d/2,
 w/2,0,-d/2,0,height,d/2,w/2,0,d/2
 ];
 geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.computeVertexNormals();
 const q=mesh(g,geom,mat.slate,x,y,z);q.material.side=THREE.DoubleSide;
 for(let k=0;k<3;k++){const zz=z+(k-1)*d/3;line(g,[x-w/2-.06,y-.03,zz],[x,y+height+.035,zz],new THREE.LineBasicMaterial({color:0x92a4b2,transparent:true,opacity:.45}));line(g,[x,y+height+.035,zz],[x+w/2+.06,y-.03,zz],new THREE.LineBasicMaterial({color:0x92a4b2,transparent:true,opacity:.45}))}
 for(let i=0;i<Math.max(5,Math.floor(d/.22));i++){
   const zz=z-d/2+(i+.5)*d/Math.max(5,Math.floor(d/.22));
   const lineMesh=B(g,x,y+height+.015,zz,.032,.033,.2,mat.roofEdge);
 }
 finial(g,x,y+height,z);return q;
}
function turret(g,x,z,r=0.7,h=4,upper=0){
 const t=new THREE.Group();t.position.set(x,upper,z);g.add(t);
 C(t,0,h/2,0,r*.94,r,h,mat.stone,16);
 C(t,0,h-.06,0,r*1.09,r*1.09,.17,mat.stone2,16);
 C(t,0,h+.11,0,r*1.13,r*1.13,.11,mat.brass,16);
 for(let k=0;k<12;k++){
  const a=k/12*Math.PI*2,xx=Math.sin(a)*r*1.02,zz=Math.cos(a)*r*1.02;
  C(t,xx,h+.31,zz,.12,.13,.38,mat.stone2,8);
  if(k%3===0){const s=mesh(t,new THREE.BoxGeometry(.09,.45,.12),mat.iron,Math.sin(a)*r*.96,h*.53,Math.cos(a)*r*.96);s.rotation.y=a}
 }
 for(let j=0;j<8;j++){const a=j/8*Math.PI*2;const s=mesh(t,new THREE.BoxGeometry(.11,.53,.06),mat.iron,Math.sin(a)*r*.982,h*.72,Math.cos(a)*r*.982);s.rotation.y=a}
 C(t,0,h+.46,0,r*1.04,r*1.12,.24,mat.stone2,16);
 cone(t,0,h+1.25,0,r*1.2,1.46,mat.slate,16);
 for(let j=0;j<16;j++){const a=j/16*Math.PI*2;const e=mesh(t,new THREE.BoxGeometry(.04,.6,.035),mat.roofEdge,Math.sin(a)*r*.65,h+1.17,Math.cos(a)*r*.65);e.rotation.y=a;e.rotation.x=-.08}
 finial(t,0,h+2.08,0);
 for(let k=0;k<3;k++){const a=(k+.2)*Math.PI*2/3;const l=new THREE.PointLight(0xffbc66,.75,1.8,2);l.position.set(Math.sin(a)*r*.8,h*.72,Math.cos(a)*r*.8);t.add(l)}
 return t;
}
const layers=[];
function layer(name,threshold,delta){const g=new THREE.Group();g.userData={name,threshold,delta:new THREE.Vector3(...delta),origin:g.position.clone()};world.add(g);layers.push(g);return g}
// 0. Foundation and geological anatomy.
const foundation=layer('foundation',1,[-.45,-3.8,-.35]);
C(foundation,0,-1.34,0,5.45,5.9,1.3,mat.rock,11);
C(foundation,0,-.72,0,5.7,5.35,.42,mat.rock,13);
C(foundation,0,-.37,0,5.35,5.42,.34,mat.grass,12);
for(let i=0;i<58;i++){const a=rand()*Math.PI*2,r=4.1+rand()*1.6;const stone=mesh(foundation,new THREE.DodecahedronGeometry(.13+rand()*.32,0),mat.rock,Math.sin(a)*r,-.3+rand()*.3,Math.cos(a)*r);stone.rotation.set(rand(),rand(),rand())}
for(let i=0;i<32;i++){const a=rand()*Math.PI*2,r=4.1+rand()*1.1;const h=.16+rand()*.35;cone(foundation,Math.sin(a)*r,-.12+h/2,Math.cos(a)*r,.09,h,mat.grass,5)}
for(let i=0;i<9;i++){const x=-2.9+i*.74;C(foundation,x,-1.62,3.8,.12,.12,.68,mat.stone2,8)}
B(foundation,0,-1.24,3.72,7,.17,.8,mat.dark);
for(let i=0;i<5;i++){const x=-2.25+i*1.14;C(foundation,x,-1.08,4.05,.15,.15,.28,mat.brass,12)}
// Waterwheel with visible spokes and bearings.
const wheel=new THREE.Group();wheel.position.set(3.55,-1.14,3.68);foundation.add(wheel);
for(let k=0;k<2;k++){const q=mesh(wheel,new THREE.TorusGeometry(.66,.065,8,40),mat.wood,k*.28-.14,0,0);q.rotation.y=Math.PI/2}
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const b=B(wheel,0,Math.sin(a)*.36,Math.cos(a)*.36,.36,.07,.07,mat.wood);b.rotation.x=a}
C(wheel,0,0,0,.16,.16,.45,mat.iron,12).rotation.z=Math.PI/2;
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const sl=B(wheel,0,Math.sin(a)*.66,Math.cos(a)*.66,.5,.12,.3,mat.woodDark);sl.rotation.x=a}
const river=mesh(foundation,new THREE.PlaneGeometry(2.4,1.35),mat.water,3.9,-1.72,4.1);river.rotation.x=-Math.PI/2;
// 1. Bridge and entrance.
const approach=layer('approach',2,[0,-.35,4.4]);
for(let k=0;k<5;k++){
 const z=4.2+k*.8;
 B(approach,0,.03,z,2.1,.22,.84,mat.stone);
 for(const side of [-1,1]){B(approach,side*1.05,.25,z,.12,.31,.75,mat.stone2);B(approach,side*1.05,.49,z,.18,.08,.8,mat.brass)}
 if(k>0&&k<4)for(let s of [-1,1]){C(approach,s*.9,-.48,z,.14,.16,.95,mat.stone2,8)}
}
for(let z=4.5;z<=7.5;z+=1.5)for(let s of [-1,1]){
 C(approach,s*1.05,.86,z,.038,.038,.92,mat.brass,8);const b=banner(approach,s*1.05,1.1,z,Math.PI/2,.52);b.rotation.y=s*Math.PI/2;
}
const gate=new THREE.Group();gate.position.set(0,1.6,3.24);approach.add(gate);
B(gate,0,.2,0,2.1,2.9,.75,mat.stone2);
B(gate,0,-.4,.41,1.2,1.75,.1,mat.woodDark);
for(let i=0;i<7;i++)B(gate,-.51+i*.17,-.4,.49,.048,1.77,.048,mat.iron);
for(let i=0;i<7;i++)B(gate,0,-1.18+i*.25,.52,1.18,.035,.035,mat.iron);
B(gate,0,.78,.5,1.32,.16,.2,mat.brass);
battlements(gate,'x',0,1.98,1.75,.01,.33);
banner(gate,0,.85,.55,0,.62);
for(let s of [-1,1])turret(approach,s*1.31,3.2,.46,2.2,.28);
// 2. The four walls and defense ring.
const defense=layer('defense',3,[.3,.85,.45]);
for(let z of [-3,3]){B(defense,0,2,z,7.3,2.25,.65,mat.stone);ledge(defense,0,3.23,z,7.6,.83);battlements(defense,'x',0,7.3,3.46,z,.43);for(let k=0;k<9;k++)arrowSlit(defense,-3.1+k*.78,2.12,z+(z>0?.36:-.36),z>0?0:Math.PI)}
for(let x of [-3.85,3.85]){B(defense,x,2,0,.65,2.25,6.1,mat.stone);ledge(defense,x,3.23,0,.79,6.4);battlements(defense,'z',x,6.2,3.46,0,.52);for(let k=0;k<8;k++)arrowSlit(defense,x+(x>0?.36:-.36),2.12,-2.55+k*.72,x>0?Math.PI/2:-Math.PI/2)}
for(let i=0;i<4;i++){const x=i%2?3.8:-3.8,z=i<2?3:-3;turret(defense,x,z,.64,3.35,0)}
for(let x=-2.7;x<=2.7;x+=.9){C(defense,x,1.07,-2.45,.12,.12,.22,mat.stone2,8);B(defense,x,1.2,-2.45,.18,.12,.25,mat.iron)}
// 3. Living architecture: open rooms, library, fireplace, chandeliers.
const living=layer('living',4,[-.1,2.5,.1]);
B(living,0,3.68,0,6.2,.35,5.15,mat.stone2);
B(living,0,4.61,-2.45,6.1,1.75,.26,mat.stone);
B(living,-3,4.6,0,.3,1.8,4.5,mat.stone);
B(living,3,4.6,0,.3,1.8,4.5,mat.stone);
for(let x=-2.3;x<=2.4;x+=.85){windowG(living,x,4.7,-2.31,.24,Math.PI,true)}
for(let x of [-2.5,-1.65,1.65,2.5]){C(living,x,4.61,1.74,.13,.16,1.75,mat.stone2,12);C(living,x,5.4,1.74,.21,.2,.18,mat.stone2,12)}
B(living,0,5.55,1.7,5.6,.18,.4,mat.wood);
for(let z=-1.8;z<=1.4;z+=.95){B(living,-.2,3.97,z,2.4,.2,.72,mat.wood);for(let x of [-1,.6]){B(living,x,3.82,z,.1,.25,.15,mat.woodDark)}}
for(let x of [-2.3,2.3])for(let z of [-1.4,-.8,-.2,.4]){
 B(living,x,4.49,z,.48,1.35,.42,mat.woodDark);
 for(let k=0;k<4;k++){B(living,x,4.12+k*.3,z+.24,.42,.07,.08,mat.brass)}
}
for(let x of [-1.6,0,1.6]){C(living,x,4.1,-1.52,.035,.05,.4,mat.brass,9);C(living,x,4.36,-1.52,.065,.045,.11,mat.candle,9)}
for(let x of [-2.65,2.65])banner(living,x,4.76,1.84,0,.65);
for(let x of [-1.2,1.2]){
 C(living,x,5.17,.32,.045,.045,.45,mat.brass);
 ring(living,x,4.84,.32,.42,.025,mat.brass);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const xx=x+Math.cos(a)*.42,zz=.32+Math.sin(a)*.42;C(living,xx,4.93,zz,.028,.028,.16,mat.brass);C(living,xx,5.03,zz,.045,.03,.12,mat.candle)}
}
// A stained-glass great hall door with visible tracery.
B(living,0,4.65,-2.17,1.25,1.45,.16,mat.dark);
windowG(living,0,4.7,-1.99,.55,Math.PI,true);
// 4. The upper palace: buttresses, rose window and varied rooflines.
const palace=layer('palace',5,[.25,4.4,-.1]);
B(palace,0,6.29,-.65,4.45,2.6,3.25,mat.stone2);
B(palace,-2.42,6.2,-.65,.45,3.6,3.5,mat.stone);
B(palace,2.42,6.2,-.65,.45,3.6,3.5,mat.stone);
for(let x of [-1.6,-.75,.75,1.6])windowG(palace,x,6.4,1,.36,0,true);
for(let x of [-1.75,0,1.75])windowG(palace,x,6.4,-2.28,.38,Math.PI,true);
for(let x of [-2.1,2.1])for(let z of [-1.7,.15,.95]){B(palace,x*1.13,6.3,z,.34,2.2,.4,mat.stone);C(palace,x*1.13,7.52,z,.2,.2,.21,mat.brass,8)}
ledge(palace,0,7.78,-.65,5.3,3.77);
roof(palace,0,7.95,-.66,5.38,3.9,2.05);
for(const x of [-1.8,1.8])for(const z of [-1.7,.4])turret(palace,x,z,.39,2.0,7.36);
turret(palace,0,-.9,.64,3.3,8.1);
const rose=new THREE.Group();rose.position.set(0,6.75,1.07);palace.add(rose);
const rosering=mesh(rose,new THREE.TorusGeometry(.67,.13,10,30),mat.brass);rosering.rotation.set(0,0,0);
const roseInner=mesh(rose,new THREE.CircleGeometry(.55,24),mat.amber,0,0,-.01);
for(let i=0;i<12;i++){const a=i*Math.PI/6;line(rose,[0,0,.06],[Math.cos(a)*.62,Math.sin(a)*.62,.06]);const petal=mesh(rose,new THREE.OctahedronGeometry(.13),i%2?mat.ruby:mat.glass,Math.cos(a)*.4,Math.sin(a)*.4,.08);petal.scale.z=.15}
for(let x of [-1.2,1.2])banner(palace,x,5.74,1.07,0,.62);
// 5. Watchtowers + arsenal as separate upper functions.
const observation=layer('observation',6,[-3.9,2.4,-.7]);
turret(observation,-4.8,-1.15,.88,4.4,1.5);
turret(observation,4.65,-1.8,.59,3.3,1.1);
B(observation,-4.8,5.9,-1.15,2.25,.15,2.25,mat.wood);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;C(observation,-4.8+Math.sin(a)*.85,6.22,-1.15+Math.cos(a)*.85,.055,.065,.66,mat.wood,7)}
ring(observation,-4.8,6.58,-1.15,.9,.02,mat.brass);
// 6. An anatomy overlay based on actual 3D positions.
const anatomy=layer('anatomy',7,[0,0,0]);
const guideMat=new THREE.LineDashedMaterial({color:0xd8ba87,dashSize:.17,gapSize:.11,transparent:true,opacity:.6});
for(const [x,z] of [[-3.9,-3],[3.9,-3],[-3.9,3],[3.9,3],[-1.1,0],[1.1,0]]){
 const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-1,z),new THREE.Vector3(x,14,z)]);
 const l=new THREE.Line(geom,guideMat);l.computeLineDistances();anatomy.add(l);
}
for(let i=0;i<5;i++){const y=1+i*2.5;const l=mesh(anatomy,new THREE.TorusGeometry(5.6,.012,3,90),mat.brass,0,y,0);l.rotation.x=Math.PI/2}
anatomy.visible=false;
const chapters=[
 ['WHOLE','Toàn bộ cấu trúc','Mỗi khối kiến trúc giữ đúng vị trí của nó trong tổng thể.'],
 ['FOUNDATION','Khối hạ tầng','Nền đá, hầm chứa và hệ thống nước tách khỏi công trình phía trên.'],
 ['APPROACH','Khối tiếp cận','Cầu, cổng thành và lối vào tạo nên một tuyến kiểm soát.'],
 ['DEFENSE','Khối phòng thủ','Tường thành, tháp canh, lỗ châu mai và đường tuần tra tạo thành vòng bảo vệ.'],
 ['LIVING','Khối sinh hoạt','Phòng ở, thư viện, đại sảnh và hành lang thể hiện nhịp sống bên trong.'],
 ['PALACE','Khối quyền lực','Tháp trung tâm, đại sảnh cao và mái chính định hình biểu tượng công trình.'],
 ['OBSERVATION','Khối quan sát','Đài vọng và tháp cao tách ra để cho thấy tầm nhìn chiến lược.'],
 ['ANATOMY','Sơ đồ kiến trúc','Các khối chức năng đã tách thành sơ đồ giải phẫu 3D có thể xoay tự do.']
];
const rail=document.getElementById('rail');
chapters.forEach((ch,i)=>{const button=document.createElement('button');button.type='button';button.className='dot'+(i===0?' on':'');button.setAttribute('aria-label',ch[1]);button.addEventListener('click',()=>document.getElementById('chapter-'+i).scrollIntoView({behavior:reduced?'instant':'smooth'}));rail.append(button)});
const dots=[...rail.children];
const intro=document.getElementById('intro'),detail=document.getElementById('detail'),idxEl=document.getElementById('stageIndex'),labelEl=document.getElementById('stageTitle');
const numEl=document.getElementById('detailNo'),titleEl=document.getElementById('detailTitle'),copyEl=document.getElementById('detailCopy');
let progress=0,angle=-.57,targetAngle=-.57,tilt=.08,targetTilt=.08,down=false,lastX=0,lastY=0;
function scrollState(){
 const range=document.documentElement.scrollHeight-innerHeight;
 progress=range?clamp(scrollY/range):0;
 const current=Math.min(7,Math.floor(progress*8+.05));
 labelEl.textContent=chapters[current][0];
 idxEl.textContent=String(current+1).padStart(2,'0');
 numEl.textContent=String(current+1).padStart(2,'0')+' / 08';
 titleEl.textContent=chapters[current][1];copyEl.textContent=chapters[current][2];
 intro.classList.toggle('hide',progress>.072);detail.classList.toggle('show',progress>.095);
 dots.forEach((d,i)=>d.classList.toggle('on',i===current));
}
scrollState();addEventListener('scroll',scrollState,{passive:true});
canvas.addEventListener('pointerdown',e=>{down=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointerup',()=>down=false);canvas.addEventListener('pointercancel',()=>down=false);
canvas.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;targetAngle+=dx*.0053;if(!mobile())targetTilt=clamp(targetTilt+dy*.0028,-.32,.38);lastX=e.clientX;lastY=e.clientY});
function size(){
 const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,mobile()?1.18:1.65);
 renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=mobile()?42:36;camera.updateProjectionMatrix();
}
size();addEventListener('resize',size);
let paused=false;addEventListener('visibilitychange',()=>paused=document.hidden);
const origin=layers.map(g=>g.position.clone());
const clock=new THREE.Clock();
let lastStage=-1;
function animate(){
 requestAnimationFrame(animate);
 if(paused)return;
 const dt=Math.min(clock.getDelta(),.07),t=clock.elapsedTime,move=reduced?1:Math.min(1,dt*5);
 angle+=(targetAngle-angle)*Math.min(1,dt*5);
 tilt+=(targetTilt-tilt)*Math.min(1,dt*3);
 const phase=progress*8;
 layers.forEach((g,i)=>{
  const start=g.userData.threshold-.8,amount=ease((phase-start)/1.25);
  g.position.copy(origin[i]).addScaledVector(g.userData.delta,amount);
  if(i===5){g.rotation.y=amount*-.18} else if(i===4){g.rotation.y=amount*.07}
  if(i===6){g.visible=phase>6.15;g.materialOpacity=amount}
 });
 if(!reduced)targetAngle+=dt*.013;
 world.rotation.y=angle;world.rotation.x=tilt;
 const m=mobile(),exp=ease((phase-2)/5),spread=m?1:1;
 const distance=m?35+exp*8:31+exp*9;
 const targetX=m?0:-2.0,ty=4.1+exp*1.25;
 const view=new THREE.Vector3(targetX,ty,0);
 const cameraTarget=new THREE.Vector3(17,12,20).normalize().multiplyScalar(distance).add(view);
 camera.position.lerp(cameraTarget,Math.min(1,dt*3));
 camera.lookAt(view);
 wheel.rotation.x=(!reduced?t*.13:0);
 if(!reduced){warmA.intensity=25+Math.sin(t*1.7)*3;warmB.intensity=19+Math.sin(t*1.27+2)*2}
 renderer.render(scene,camera);
}
loader.classList.add('done');setTimeout(()=>loader.remove(),1000);
animate();
