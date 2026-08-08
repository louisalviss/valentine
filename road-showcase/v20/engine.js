'use strict';
const canvas=document.getElementById('gl'),err=document.getElementById('err');
const place=document.getElementById('place'),meta=document.getElementById('meta'),count=document.getElementById('count'),bar=document.getElementById('bar'),dotsEl=document.getElementById('dots');
const chapters=[
 ['Trần Phú · Trầm Hương','Biển bên phải · Quảng trường 2/4'],
 ['Hòn Chồng','Ghềnh đá vàng · biển mở'],
 ['Phố Bắc Nha Trang','Quẹo trái · phố hai bên'],
 ['Tháp Bà Po Nagar','Tháp Chăm trên đồi · bên phải'],
 ['Sông Cái · Cầu Xóm Bóng','Ngay sau Tháp Bà · mở ra sông'],
 ['Long Sơn · Phật Trắng','Quẹo phải · Phật Trắng trên đồi']
];
chapters.forEach((_,i)=>{const d=document.createElement('i');if(i===0)d.className='active';dotsEl.appendChild(d)});const dots=[...dotsEl.children];
const gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl');
if(!gl){err.style.display='block';err.textContent='WebGL is unavailable on this device.';throw new Error('NO_WEBGL')}

const VS=`attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vN;varying vec3 vW;void main(){vec4 w=uModel*vec4(aPos,1.0);vW=w.xyz;vN=normalize(mat3(uModel)*aNor);gl_Position=uMVP*vec4(aPos,1.0);}`;
const FS=`precision mediump float;uniform vec3 uColor;uniform vec3 uLight;uniform vec3 uSky;uniform float uAlpha;uniform float uFogNear;uniform float uFogFar;uniform vec3 uCam;varying vec3 vN;varying vec3 vW;void main(){float nd=max(dot(normalize(vN),normalize(uLight)),0.0);float light=.62+nd*.38;vec3 col=uColor*light;float d=distance(vW,uCam);float fog=smoothstep(uFogNear,uFogFar,d);col=mix(col,uSky,fog*.78);gl_FragColor=vec4(col,uAlpha);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const loc={pos:gl.getAttribLocation(prog,'aPos'),nor:gl.getAttribLocation(prog,'aNor'),mvp:gl.getUniformLocation(prog,'uMVP'),model:gl.getUniformLocation(prog,'uModel'),color:gl.getUniformLocation(prog,'uColor'),light:gl.getUniformLocation(prog,'uLight'),sky:gl.getUniformLocation(prog,'uSky'),alpha:gl.getUniformLocation(prog,'uAlpha'),fogN:gl.getUniformLocation(prog,'uFogNear'),fogF:gl.getUniformLocation(prog,'uFogFar'),cam:gl.getUniformLocation(prog,'uCam')};

gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

// matrix + vector helpers, column-major
const V=(x=0,y=0,z=0)=>[x,y,z];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s], mix3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]};
function m4(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
function mm(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];return o}
function mt(x,y,z){const m=m4();m[12]=x;m[13]=y;m[14]=z;return m}
function ms(x,y,z){const m=m4();m[0]=x;m[5]=y;m[10]=z;return m}
function rx(a){const c=Math.cos(a),s=Math.sin(a),m=m4();m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
function ry(a){const c=Math.cos(a),s=Math.sin(a),m=m4();m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
function rz(a){const c=Math.cos(a),s=Math.sin(a),m=m4();m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
function persp(fov,asp,n,f){const q=1/Math.tan(fov/2),nf=1/(n-f);return[q/asp,0,0,0,0,q,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0]}
function lookAt(eye,target,up=[0,1,0]){const z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]}
function compose(p,r,s){return mm(mt(p[0],p[1],p[2]),mm(ry(r[1]),mm(rx(r[0]),mm(rz(r[2]),ms(s[0],s[1],s[2])))))}
function rgb(hex){hex=hex.replace('#','');return[parseInt(hex.slice(0,2),16)/255,parseInt(hex.slice(2,4),16)/255,parseInt(hex.slice(4,6),16)/255]}

function geom(pos,nor){const g={count:pos.length/3};g.pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,g.pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.STATIC_DRAW);g.nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,g.nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(nor),gl.STATIC_DRAW);return g}
function tri(outP,outN,a,b,c){const n=norm(cross(sub(b,a),sub(c,a)));outP.push(...a,...b,...c);outN.push(...n,...n,...n)}
function boxGeom(){let p=[],n=[];const v=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5],[-.5,1,-.5],[.5,1,-.5],[.5,1,.5],[-.5,1,.5]],f=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]];for(const q of f){tri(p,n,v[q[0]],v[q[1]],v[q[2]]);tri(p,n,v[q[0]],v[q[2]],v[q[3]])}return geom(p,n)}
function frustumGeom(top=.72){let p=[],n=[];const a=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]],b=[[-.5*top,1,-.5*top],[.5*top,1,-.5*top],[.5*top,1,.5*top],[-.5*top,1,.5*top]];for(let i=0;i<4;i++){const j=(i+1)%4;tri(p,n,a[i],a[j],b[j]);tri(p,n,a[i],b[j],b[i])}tri(p,n,b[0],b[1],b[2]);tri(p,n,b[0],b[2],b[3]);tri(p,n,a[3],a[2],a[1]);tri(p,n,a[3],a[1],a[0]);return geom(p,n)}
function pyramidGeom(){let p=[],n=[],b=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5]],t=[0,1,0];for(let i=0;i<4;i++)tri(p,n,b[i],b[(i+1)%4],t);tri(p,n,b[3],b[2],b[1]);tri(p,n,b[3],b[1],b[0]);return geom(p,n)}
function cylGeom(seg=8){let p=[],n=[];for(let i=0;i<seg;i++){const a=i*Math.PI*2/seg,b=(i+1)*Math.PI*2/seg,A=[Math.cos(a)*.5,0,Math.sin(a)*.5],B=[Math.cos(b)*.5,0,Math.sin(b)*.5],C=[B[0],1,B[2]],D=[A[0],1,A[2]];tri(p,n,A,B,C);tri(p,n,A,C,D);tri(p,n,[0,1,0],D,C);tri(p,n,[0,0,0],B,A)}return geom(p,n)}
function lowSphereGeom(){let p=[],n=[];const v=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(norm),f=[[2,0,4],[2,4,1],[2,1,5],[2,5,0],[3,4,0],[3,1,4],[3,5,1],[3,0,5]];for(const q of f)tri(p,n,v[q[0]],v[q[1]],v[q[2]]);return geom(p,n)}
function petalGeom(){let p=[],n=[];const z=.07,F=[[-.52,0,-z],[.52,0,-z],[.38,.50,-z],[0,1,-z],[-.38,.50,-z]],B=F.map(q=>[q[0],q[1],z]);tri(p,n,F[0],F[1],F[2]);tri(p,n,F[0],F[2],F[4]);tri(p,n,F[4],F[2],F[3]);tri(p,n,B[2],B[1],B[0]);tri(p,n,B[4],B[2],B[0]);tri(p,n,B[3],B[2],B[4]);for(let i=0;i<5;i++){const j=(i+1)%5;tri(p,n,F[i],B[i],B[j]);tri(p,n,F[i],B[j],F[j])}return geom(p,n)}
function icoGeom(){let p=[],n=[];const g=(1+Math.sqrt(5))/2,raw=[[-1,g,0],[1,g,0],[-1,-g,0],[1,-g,0],[0,-1,g],[0,1,g],[0,-1,-g],[0,1,-g],[g,0,-1],[g,0,1],[-g,0,-1],[-g,0,1]],v=raw.map(q=>mul(norm(q),.72)),f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];for(const q of f)tri(p,n,v[q[0]],v[q[1]],v[q[2]]);return geom(p,n)}
const G={box:boxGeom(),fr:frustumGeom(.70),fr2:frustumGeom(.46),pyr:pyramidGeom(),cyl:cylGeom(8),sphere:lowSphereGeom(),petal:petalGeom(),boulder:icoGeom()};
function roadGeom(points,width){let p=[],n=[];for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],ta=norm(sub(points[Math.min(points.length-1,i+1)],points[Math.max(0,i-1)])),tb=norm(sub(points[Math.min(points.length-1,i+2)],points[i])),ra=norm(cross(ta,[0,1,0])),rb=norm(cross(tb,[0,1,0])),aL=add(a,mul(ra,-width/2)),aR=add(a,mul(ra,width/2)),bL=add(b,mul(rb,-width/2)),bR=add(b,mul(rb,width/2));tri(p,n,aL,bR,bL);tri(p,n,aL,aR,bR)}return geom(p,n)}

class Node{constructor(){this.p=V();this.r=V();this.s=V(1,1,1);this.children=[];this.parent=null;this.visible=true;this.dynamic=null}add(c){c.parent=this;this.children.push(c);return c}}
class Mesh extends Node{constructor(g,color,alpha=1){super();this.g=g;this.color=rgb(color);this.alpha=alpha}}
const root=new Node();
function mesh(g,color,p=V(),s=V(1,1,1),r=V(),parent=root,alpha=1){const m=new Mesh(g,color,alpha);m.p=p;m.s=s;m.r=r;parent.add(m);return m}
function group(p=V(),parent=root){const g=new Node();g.p=p;parent.add(g);return g}
