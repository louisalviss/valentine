import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const $=s=>document.querySelector(s);
const canvas=$('#scene'),loader=$('#loader'),sections=[...document.querySelectorAll('section')],step=$('#step'),place=$('#place'),meta=$('#meta'),rail=[...document.querySelectorAll('.route-rail i')];
const coarse=matchMedia('(pointer:coarse)').matches,reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=THREE.MathUtils.clamp,damp=THREE.MathUtils.damp,UP=new THREE.Vector3(0,1,0),FORWARD=new THREE.Vector3(0,0,-1);
const portrait=()=>innerWidth/innerHeight<.78;

const C={paper:0xf4ecdc,paper2:0xe3d7c3,ink:0x25343a,road:0x3e494f,roadEdge:0x817f74,lane:0xf7efd9,sea:0x2698c2,seaHi:0x58c6de,sand:0xe7c98c,leaf:0x347356,leaf2:0x5d9368,wood:0x8c6747,coral:0xd76550,cream:0xf6efe2,brick:0xa65335,brickDark:0x733c2d,white:0xf6f3ea,rock:0xa8896f,rockDark:0x765f51,sky:0xcce8ef,hill:0x789472};
const mat=(color,rough=.72,metal=.02,flat=false)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,flatShading:flat});
const paperMat=color=>new THREE.MeshStandardMaterial({color,roughness:.86,metalness:0,side:THREE.DoubleSide});

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.35:1.65));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(C.sky);scene.fog=new THREE.FogExp2(C.sky,.0048);
const camera=new THREE.PerspectiveCamera(portrait()?60:48,innerWidth/innerHeight,.05,520);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new OutputPass());
const hemi=new THREE.HemisphereLight(0xf8fcff,0x58664f,1.85);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffefd0,4.6);sun.position.set(-10,16,7);sun.castShadow=true;sun.shadow.mapSize.set(coarse?768:1024,coarse?768:1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.camera.near=.5;sun.shadow.camera.far=80;sun.shadow.bias=-.0008;scene.add(sun);
const fill=new THREE.DirectionalLight(0x9ed7e5,1.1);fill.position.set(8,8,-4);scene.add(fill);

const pts=[new THREE.Vector3(0,.35,14),new THREE.Vector3(-2,.42,-10),new THREE.Vector3(1,.48,-35),new THREE.Vector3(-5,.6,-60),new THREE.Vector3(-9,.72,-86),new THREE.Vector3(-2,.82,-112),new THREE.Vector3(7,.96,-138),new THREE.Vector3(12,1.15,-165),new THREE.Vector3(5,1.38,-194),new THREE.Vector3(-6,1.6,-222),new THREE.Vector3(-10,1.85,-250),new THREE.Vector3(-3,2.1,-280),new THREE.Vector3(5,2.45,-310),new THREE.Vector3(0,2.8,-342)];
const curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',.58);
function basis(t){t=clamp(t,0,1);const p=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();let side=new THREE.Vector3().crossVectors(tangent,UP).normalize();if(side.lengthSq()<.2)side.set(1,0,0);const normal=new THREE.Vector3().crossVectors(side,tangent).normalize();return{p,tangent,side,normal}}
function ribbon(from,to,inner,outer,material,y=0){const seg=Math.max(24,Math.round((to-from)*620)),pos=[],idx=[];for(let i=0;i<=seg;i++){const t=from+(to-from)*i/seg,{p,side,normal}=basis(t),a=p.clone().addScaledVector(side,inner).addScaledVector(normal,y),b=p.clone().addScaledVector(side,outer).addScaledVector(normal,y);pos.push(a.x,a.y,a.z,b.x,b.y,b.z);if(i<seg){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;scene.add(m);return m}
function fullRibbon(width,material,y=0){return ribbon(0,1,width/2,-width/2,material,y)}
function lineAlong(offset,color,opacity=.8){const pts=[];for(let i=0;i<=520;i++){const {p,side,normal}=basis(i/520);pts.push(p.clone().addScaledVector(side,offset).addScaledVector(normal,.05))}const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity}));scene.add(l);return l}
function placeAt(t,offset,obj,y=0){const {p,tangent,side,normal}=basis(t);obj.position.copy(p).addScaledVector(side,offset).addScaledVector(normal,y);obj.quaternion.setFromUnitVectors(FORWARD,tangent);scene.add(obj);return obj}

fullRibbon(49,paperMat(C.paper2),-.30);fullRibbon(48,paperMat(C.paper),-.22);fullRibbon(7.2,mat(C.roadEdge,.88,0),-.015);fullRibbon(6.35,mat(C.road,.82,.02),.01);lineAlong(3.18,C.lane,.86);lineAlong(-3.18,C.lane,.86);
for(let t=.012;t<.995;t+=.021){const {p,tangent,normal}=basis(t),d=new THREE.Mesh(new RoundedBoxGeometry(.09,.018,.72,2,.02),new THREE.MeshBasicMaterial({color:C.lane}));d.position.copy(p).addScaledVector(normal,.055);d.quaternion.setFromUnitVectors(FORWARD,tangent);scene.add(d)}

ribbon(0,.33,-5,-12,paperMat(C.sand),-.19);ribbon(0,.33,-12,-42,mat(C.sea,.28,.02,true),-.28);
ribbon(.31,.57,5,23,paperMat(0xa8b897),-.22);ribbon(.31,.57,-5,-20,paperMat(0xb9c39d),-.22);
ribbon(.56,.79,-5,-26,mat(C.sea,.3,.02,true),-.27);ribbon(.56,.79,5,22,paperMat(0x9dac88),-.22);
ribbon(.78,1,-5,-35,mat(C.sea,.27,.02,true),-.28);ribbon(.78,1,5,21,paperMat(0x9caf91),-.22);

function shadowBlob(w=4,d=2,opacity=.18){const c=document.createElement('canvas');c.width=256;c.height=128;const q=c.getContext('2d'),g=q.createRadialGradient(128,64,4,128,64,96);g.addColorStop(0,`rgba(24,38,42,${opacity})`);g.addColorStop(1,'rgba(24,38,42,0)');q.fillStyle=g;q.fillRect(0,0,256,128);const tex=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));m.rotation.x=-Math.PI/2;m.position.y=.015;return m}
function rounded(w,h,d,color,r=.12){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat(color,.68,.01));m.castShadow=true;m.receiveShadow=true;return m}
function paperPlane(w,h,color=C.cream){const m=new THREE.Mesh(new RoundedBoxGeometry(w,.07,h,2,.08),paperMat(color));m.castShadow=true;m.receiveShadow=true;return m}

function palm(t,off,s=2.5){const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.07,.12,s,7),mat(C.wood,.95,0,true));tr.position.y=s/2;tr.rotation.z=.04;g.add(tr);for(let k=0;k<7;k++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.11,1.0,4),mat(k%2?C.leaf:C.leaf2,.86,0,true));leaf.position.y=s;leaf.rotation.z=Math.PI/2;leaf.rotation.y=k*Math.PI*2/7;leaf.position.x=Math.cos(k*Math.PI*2/7)*.32;leaf.position.z=Math.sin(k*Math.PI*2/7)*.32;g.add(leaf)}placeAt(t,off,g);return g}
for(let t=.025,i=0;t<.31;t+=.026,i++)palm(t,-7.2-(i%2)*.45,2.1+(i%3)*.22);
for(let t=.025,i=0;t<.31;t+=.032,i++){const h=3.2+(i%5)*1.15,b=rounded(1.25,h,1.15,i%3?0xe5dfd4:0xd2d9d7,.1);b.position.y=h/2;placeAt(t,7.0+(i%3)*1.1,b);if(i%3===0){const awning=rounded(1.1,.08,.22,C.coral,.04);awning.position.set(0,-h/2+.9,-.68);b.add(awning)}}
for(let t=.025;t<.31;t+=.035){const {p,side}=basis(t);for(let k=0;k<3;k++){const wave=new THREE.Mesh(new THREE.PlaneGeometry(1.3+.35*k,.045),new THREE.MeshBasicMaterial({color:0xe9fbff,transparent:true,opacity:.62,side:THREE.DoubleSide}));wave.rotation.x=-Math.PI/2;wave.position.copy(p).addScaledVector(side,-15-k*5-(Math.sin(t*70+k)*1.2));wave.position.y-=.19;scene.add(wave)}}

function treeAt(t,off,s=1){const g=new THREE.Group(),tr=new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.14*s,1.5*s,6),mat(C.wood,.95,0,true));tr.position.y=.75*s;g.add(tr);for(let i=0;i<2;i++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry((.78-i*.12)*s,1),mat(i?C.leaf:C.leaf2,.92,0,true));crown.scale.y=.85;crown.position.y=(1.65+i*.45)*s;g.add(crown)}placeAt(t,off,g);return g}
for(let i=0;i<56;i++){const t=.33+Math.random()*.23,s=i%2?1:-1;treeAt(t,s*(6+Math.random()*9),.7+Math.random()*.55)}
for(let i=0;i<38;i++){const t=.58+Math.random()*.2,s=i%2?1:-1;treeAt(t,s*(6+Math.random()*10),.65+Math.random()*.5)}
for(let i=0;i<42;i++){const t=.8+Math.random()*.19,s=i%2?1:-1;treeAt(t,s*(7+Math.random()*9),.62+Math.random()*.45)}

function makeCar(){const g=new THREE.Group(),body=mat(C.coral,.38,.12),body2=mat(0xe99a82,.46,.05),dark=mat(0x182126,.3,.55),glass=mat(0x507d8e,.22,.2),chrome=mat(0xcad4d2,.24,.65),lightMat=new THREE.MeshStandardMaterial({color:0xf8ffff,emissive:0xbef4ff,emissiveIntensity:2.4});
 const lower=new THREE.Mesh(new RoundedBoxGeometry(1.92,.42,3.35,4,.16),body);lower.position.y=.5;g.add(lower);
 const nose=new THREE.Mesh(new RoundedBoxGeometry(1.72,.25,1.25,4,.12),body2);nose.position.set(0,.72,-1.17);nose.rotation.x=-.055;g.add(nose);
 const cabin=new THREE.Mesh(new RoundedBoxGeometry(1.27,.66,1.38,4,.18),glass);cabin.position.set(0,.96,.08);cabin.scale.set(1,.92,.96);g.add(cabin);
 const roof=new THREE.Mesh(new RoundedBoxGeometry(1.04,.08,.84,3,.08),dark);roof.position.set(0,1.32,.08);g.add(roof);
 const bumper=new THREE.Mesh(new RoundedBoxGeometry(1.7,.08,.18,2,.04),dark);bumper.position.set(0,.33,-1.73);g.add(bumper);
 for(const [x,z] of [[-.9,-1.03],[.9,-1.03],[-.9,1.02],[.9,1.02]]){const tire=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.23,16),dark);tire.rotation.z=Math.PI/2;tire.position.set(x,.35,z);g.add(tire);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.245,10),chrome);rim.rotation.z=Math.PI/2;rim.position.copy(tire.position);g.add(rim);g.userData.wheels??=[];g.userData.wheels.push(tire,rim)}
 for(const x of[-.55,.55]){const l=new THREE.Mesh(new RoundedBoxGeometry(.34,.075,.04,2,.02),lightMat);l.position.set(x,.68,-1.69);g.add(l)}
 const tailMat=new THREE.MeshStandardMaterial({color:0xff725f,emissive:0xff3c2e,emissiveIntensity:2});for(const x of[-.58,.58]){const l=new THREE.Mesh(new RoundedBoxGeometry(.38,.06,.035,2,.02),tailMat);l.position.set(x,.65,1.69);g.add(l)}
 g.add(shadowBlob(3.0,1.5,.28));return g}
const car=makeCar();scene.add(car);

function shapePetal(){const s=new THREE.Shape();s.moveTo(-.42,0);s.bezierCurveTo(-.7,1.0,-.55,2.3,0,3.35);s.bezierCurveTo(.55,2.3,.7,1.0,.42,0);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSize:.045,bevelThickness:.035,bevelSegments:2,steps:1})}
function makeTextLabel(text,accent=C.coral){const c=document.createElement('canvas');c.width=640;c.height=150;const q=c.getContext('2d');q.fillStyle='#f7f1e6';q.beginPath();q.roundRect(8,8,624,134,24);q.fill();q.fillStyle='#24343a';q.font='700 42px -apple-system,system-ui';q.textAlign='center';q.textBaseline='middle';q.fillText(text,320,76);q.fillStyle=`#${accent.toString(16).padStart(6,'0')}`;q.fillRect(282,118,76,5);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.5,.82),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,toneMapped:false}));return m}
function popEase(x){x=clamp(x,0,1);const c1=1.45,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}
const popups=[];
function createPopup(t,offset,label,builder){const {p,tangent,side}=basis(t),anchor=new THREE.Group();anchor.position.copy(p).addScaledVector(side,offset);anchor.quaternion.setFromUnitVectors(FORWARD,tangent);
 const base=paperPlane(7.2,4.9,0xeee4d2);base.position.y=.02;anchor.add(base);const fold=new THREE.Mesh(new THREE.BoxGeometry(6.1,.025,.035),new THREE.MeshBasicMaterial({color:0xc9bba5,transparent:true,opacity:.72}));fold.position.set(0,.08,.82);anchor.add(fold);
 const backdrop=new THREE.Group();backdrop.position.set(0,.08,.84);backdrop.rotation.x=-Math.PI/2;anchor.add(backdrop);
 const hero=new THREE.Group();hero.position.set(0,.08,.15);hero.rotation.x=-Math.PI/2;anchor.add(hero);
 const labelObj=makeTextLabel(label);labelObj.position.set(0,3.4,.05);labelObj.scale.set(.86,.86,.86);hero.add(labelObj);
 builder(hero,backdrop);anchor.add(shadowBlob(6.5,2.8,.15));scene.add(anchor);popups.push({t,hero,backdrop});return anchor}
function addBackdrop(backdrop,color,w=6.4,h=4.2){const p=new THREE.Mesh(new RoundedBoxGeometry(w,h,.06,3,.16),paperMat(color));p.position.y=h/2;backdrop.add(p);return p}

function buildTram(hero,back){addBackdrop(back,0xe8d9c6,6.2,4.5);for(let i=0;i<4;i++){const palm=rounded(.16,1.65,.16,C.wood,.05);palm.position.set(-2.45+i*1.65,.82,.15);hero.add(palm);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.4,1),mat(C.leaf,.9,0,true));crown.position.set(-2.45+i*1.65,1.85,.15);crown.scale.set(1.25,.55,1.25);hero.add(crown)}
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.48,.38,16),paperMat(0xe5d6c5));base.position.y=.2;hero.add(base);const core=new THREE.Mesh(new THREE.CylinderGeometry(.56,.74,3.45,12),paperMat(0xe7d7cf));core.position.y=1.9;hero.add(core);for(let i=0;i<6;i++){const petal=new THREE.Mesh(shapePetal(),paperMat(i%2?0xf2e9df:0xe4b8aa));petal.position.set(Math.cos(i*Math.PI/3)*.72,.38,Math.sin(i*Math.PI/3)*.72);petal.rotation.y=-i*Math.PI/3;petal.rotation.z=(i%2?-.04:.04);hero.add(petal)}const crown=new THREE.Mesh(new THREE.ConeGeometry(.4,1.15,8),paperMat(0xf2e8dc));crown.position.y=4.6;hero.add(crown)}

function buildBuddha(hero,back){addBackdrop(back,0xa8bd98,6.6,4.7);const hill=new THREE.Mesh(new THREE.SphereGeometry(3.5,16,8,0,Math.PI*2,0,Math.PI/2),paperMat(C.hill));hill.scale.set(1,.36,.7);hill.position.set(0,.18,.2);hero.add(hill);for(let i=0;i<7;i++){const step=rounded(3.9-i*.32,.12,.45,C.paper2,.03);step.position.set(0,.12+i*.11,1.35-i*.1);hero.add(step)}
 const lotus=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.45,.52,16),paperMat(0xe9e5dc));lotus.position.y=1.1;hero.add(lotus);const legs=new THREE.Mesh(new THREE.SphereGeometry(1.25,20,12),paperMat(C.white));legs.scale.set(1.22,.44,.78);legs.position.y=1.58;hero.add(legs);const torso=new THREE.Mesh(new THREE.SphereGeometry(.86,18,12),paperMat(C.white));torso.scale.set(.88,1.18,.7);torso.position.y=2.35;hero.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.46,18,12),paperMat(C.white));head.position.y=3.35;hero.add(head);const bun=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),paperMat(C.white));bun.position.y=3.82;hero.add(bun);const halo=new THREE.Mesh(new THREE.TorusGeometry(.73,.035,8,32),new THREE.MeshBasicMaterial({color:0xf4d59a}));halo.position.set(0,3.35,.35);hero.add(halo)}

function towerSilhouette(brick,scale=1){const g=new THREE.Group();const base=rounded(1.55*scale,2.45*scale,1.45*scale,brick,.04);base.position.y=1.22*scale;g.add(base);const mid=new THREE.Mesh(new THREE.ConeGeometry(1.0*scale,.95*scale,4),paperMat(brick));mid.rotation.y=Math.PI/4;mid.position.y=2.9*scale;g.add(mid);const top=new THREE.Mesh(new THREE.ConeGeometry(.66*scale,.82*scale,4),paperMat(C.brickDark));top.rotation.y=Math.PI/4;top.position.y=3.74*scale;g.add(top);const fin=new THREE.Mesh(new THREE.ConeGeometry(.18*scale,.5*scale,4),paperMat(C.brickDark));fin.rotation.y=Math.PI/4;fin.position.y=4.36*scale;g.add(fin);const door=rounded(.43*scale,.88*scale,.04*scale,C.brickDark,.05);door.position.set(0,.63*scale,-.75*scale);g.add(door);return g}
function buildPoNagar(hero,back){addBackdrop(back,0xc4c9a4,7,4.6);const terrace=paperPlane(6.2,3.6,0xd8c8aa);terrace.position.y=.04;hero.add(terrace);const main=towerSilhouette(C.brick,1.18);main.position.set(.25,.05,.1);hero.add(main);const left=towerSilhouette(0xb5623f,.82);left.position.set(-2.0,.05,.22);hero.add(left);const right=towerSilhouette(0x9b4b34,.74);right.position.set(2.15,.05,.35);hero.add(right);for(let i=0;i<5;i++){const col=rounded(.14,1.4,.14,0x8d4a34,.02);col.position.set(-2.7+i*.5,.7,-.8);hero.add(col)}}

function buildHonChong(hero,back){addBackdrop(back,0x86c8d4,6.9,4.45);const seaStrip=new THREE.Mesh(new THREE.PlaneGeometry(6.2,2.0),paperMat(0x58b8d2));seaStrip.rotation.x=-Math.PI/2;seaStrip.position.set(0,.03,-.35);hero.add(seaStrip);const sand=paperPlane(6.5,2.2,C.sand);sand.position.set(0,.04,1.25);hero.add(sand);const rockMat=mat(C.rock,.92,0,true),rockDark=mat(C.rockDark,.92,0,true);const placements=[[-1.8,.55,.3,.95],[-.7,.5,.5,.82],[.65,.62,.4,.95],[1.65,.52,.15,.78],[-.15,1.15,.0,1.12]];for(const [x,y,z,s] of placements){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),x<0?rockMat:rockDark);r.scale.set(1.25,.8,1);r.position.set(x,y,z);r.rotation.set(.12*x,.24*x,.14*x);hero.add(r)}const balance=new THREE.Mesh(new THREE.DodecahedronGeometry(1.22,1),rockMat);balance.scale.set(1.55,.72,1.05);balance.position.set(.25,1.9,.12);balance.rotation.z=.18;hero.add(balance);for(let i=0;i<3;i++){const islet=new THREE.Mesh(new THREE.IcosahedronGeometry(.55+.15*i,1),mat(0x6d8d78,.9,0,true));islet.scale.y=.55;islet.position.set(-2.4+i*2.3,.34,-1.05);hero.add(islet)}}

createPopup(.205,-9.0,'Tháp Trầm Hương',buildTram);
createPopup(.46,9.2,'Chùa Long Sơn',buildBuddha);
createPopup(.68,9.4,'Tháp Bà Po Nagar',buildPoNagar);
createPopup(.875,-9.4,'Hòn Chồng',buildHonChong);

for(let i=0;i<14;i++){const t=.02+i*.068,{p,side}=basis(clamp(t,0,1));const m=new THREE.Mesh(new THREE.ConeGeometry(2.8+(i%4)*1.1,4.2+(i%3)*1.4,7),paperMat(i%2?0x7d9b82:0x8ba68e));m.position.copy(p).addScaledVector(side,(i%2?-1:1)*(23+(i%3)*5));m.position.y+=1.5;m.rotation.y=i*.8;scene.add(m)}

let target=.004,progress=.004,velocity=0,lastY=scrollY,camPos=new THREE.Vector3(),first=true;const carQ=new THREE.Quaternion(),camQ=new THREE.Quaternion(),lookM=new THREE.Matrix4(),clock=new THREE.Clock();
function onScroll(){const total=Math.max(document.documentElement.scrollHeight-innerHeight,1);target=.004+(scrollY/total)*.992;velocity=Math.min(1,velocity+Math.abs(scrollY-lastY)/650);lastY=scrollY}addEventListener('scroll',onScroll,{passive:true});onScroll();
function smooth01(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)}
function updatePopup(pp){const d=progress-pp.t;let r;if(d<-.105)r=0;else if(d<-.02)r=popEase(smooth01(-.105,-.02,d));else if(d<.075)r=1;else if(d<.135)r=1-smooth01(.075,.135,d);else r=0;const br=clamp((r-.08)/.92,0,1);pp.backdrop.rotation.x=-Math.PI/2+(Math.PI/2)*br;pp.hero.rotation.x=-Math.PI/2+(Math.PI/2)*r;pp.hero.position.y=.08+Math.sin(r*Math.PI)*.05;pp.backdrop.scale.y=.985+.015*br}
function syncHud(){const total=Math.max(document.documentElement.scrollHeight-innerHeight,1),p=scrollY/total,idx=clamp(Math.floor(p*sections.length),0,sections.length-1),s=sections[idx];step.textContent=String(idx+1).padStart(2,'0');place.textContent=s.dataset.place;meta.textContent=s.dataset.meta;rail.forEach((d,i)=>d.classList.toggle('active',i===idx));document.documentElement.style.setProperty('--progress',(p*100)+'%')}
function render(){requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.04),time=clock.elapsedTime;progress=damp(progress,target,reduceMotion?12:3.25,dt);velocity=damp(velocity,0,3.2,dt);syncHud();const {p,tangent,side,normal}=basis(progress);car.position.copy(p).addScaledVector(normal,.035);carQ.setFromUnitVectors(FORWARD,tangent);car.quaternion.slerp(carQ,1-Math.exp(-dt*9));car.position.y+=Math.sin(time*9)*.006*(.2+velocity);const spin=dt*(1.2+velocity*4.5)*8;car.userData.wheels?.forEach(w=>w.rotation.x-=spin);popups.forEach(updatePopup);
 const isPortrait=portrait(),back=isPortrait?12.7:9.7,height=isPortrait?6.4:4.6,sideOffset=isPortrait?.42:1.0,fov=isPortrait?60:48;const desired=p.clone().addScaledVector(tangent,-back).addScaledVector(normal,height).addScaledVector(side,sideOffset);if(first)camPos.copy(desired);else camPos.lerp(desired,1-Math.exp(-dt*3.5));camera.position.copy(camPos);const focus=curve.getPointAt(clamp(progress+(isPortrait?.07:.078),0,1)).addScaledVector(UP,.62);lookM.lookAt(camera.position,focus,UP);camQ.setFromRotationMatrix(lookM);camera.quaternion.slerp(camQ,first?1:1-Math.exp(-dt*4.3));first=false;camera.fov=damp(camera.fov,fov+velocity*1.1,3,dt);camera.updateProjectionMatrix();composer.render()}
render();setTimeout(()=>loader.classList.add('done'),550);
function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.35:1.65));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=portrait()?60:48;camera.updateProjectionMatrix();composer.setSize(innerWidth,innerHeight)}addEventListener('resize',resize);
