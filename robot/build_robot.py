import numpy as np
import trimesh
from skimage.measure import marching_cubes
from pathlib import Path
from trimesh.transformations import rotation_matrix

OUT=Path(__file__).with_name('robot.glb')
WHITE=np.array([246,247,248,255],np.uint8)
WHITE2=np.array([229,232,235,255],np.uint8)
BLACK=np.array([18,21,25,255],np.uint8)
DARK=np.array([30,34,39,255],np.uint8)
GRAY=np.array([92,99,108,255],np.uint8)
RED=np.array([255,55,45,255],np.uint8)
meshes=[]

def color(mesh,c):
    mesh.visual.face_colors=np.tile(c,(len(mesh.faces),1)); return mesh

def add(mesh,c): meshes.append(color(mesh,c)); return mesh

def translate(mesh,xyz): mesh.apply_translation(xyz); return mesh

def rotate(mesh,deg,axis): mesh.apply_transform(rotation_matrix(np.deg2rad(deg),axis)); return mesh

def scale(mesh,xyz):
    sx,sy,sz=xyz; mesh.apply_transform(np.diag([sx,sy,sz,1.])); return mesh

def superellipsoid(a,b,c,e1=.75,e2=.75,nu=72,nv=42):
    u=np.linspace(-np.pi,np.pi,nu,endpoint=False); v=np.linspace(-np.pi/2,np.pi/2,nv)
    def sp(x,e): return np.sign(np.sin(x))*np.abs(np.sin(x))**e
    def cp(x,e): return np.sign(np.cos(x))*np.abs(np.cos(x))**e
    U,V=np.meshgrid(u,v,indexing='xy')
    x=a*cp(V,e1)*cp(U,e2); y=b*sp(V,e1); z=c*cp(V,e1)*sp(U,e2)
    verts=np.c_[x.ravel(),y.ravel(),z.ravel()]; faces=[]
    for j in range(nv-1):
        for i in range(nu):
            i2=(i+1)%nu; a0=j*nu+i; b0=j*nu+i2; c0=(j+1)*nu+i; d0=(j+1)*nu+i2
            faces.append([a0,c0,b0]); faces.append([b0,c0,d0])
    return trimesh.Trimesh(verts,np.array(faces),process=True)

def sdf_mesh(func,bounds,res=48):
    mins=np.array([b[0] for b in bounds],float); maxs=np.array([b[1] for b in bounds],float)
    xs=np.linspace(mins[0],maxs[0],res); ys=np.linspace(mins[1],maxs[1],res); zs=np.linspace(mins[2],maxs[2],res)
    X,Y,Z=np.meshgrid(xs,ys,zs,indexing='ij'); F=func(X,Y,Z)
    verts,faces,norms,_=marching_cubes(F,level=0,spacing=((maxs[0]-mins[0])/(res-1),(maxs[1]-mins[1])/(res-1),(maxs[2]-mins[2])/(res-1)))
    verts+=mins
    return trimesh.Trimesh(verts,faces,vertex_normals=norms,process=True)

def sd_round_box(X,Y,Z,center,size,r):
    cx,cy,cz=center; sx,sy,sz=np.array(size)/2-r
    qx=np.abs(X-cx)-sx; qy=np.abs(Y-cy)-sy; qz=np.abs(Z-cz)-sz
    ox=np.maximum(qx,0); oy=np.maximum(qy,0); oz=np.maximum(qz,0)
    return np.sqrt(ox*ox+oy*oy+oz*oz)+np.minimum(np.maximum(qx,np.maximum(qy,qz)),0)-r

def rounded_box(center,size,r=.08,res=38,c=WHITE):
    pad=.18; bounds=[(center[i]-size[i]/2-pad,center[i]+size[i]/2+pad) for i in range(3)]
    return add(sdf_mesh(lambda X,Y,Z:sd_round_box(X,Y,Z,center,size,r),bounds,res),c)

def torus_sdf(X,Y,Z,cx,cy,cz,Rx,Rz,r):
    q=np.sqrt(((X-cx)/Rx)**2+((Z-cz)/Rz)**2); radial=(q-1)*((Rx+Rz)/2)
    return np.sqrt(radial*radial+(Y-cy)**2)-r

def smooth_min(a,b,k=.18):
    h=np.clip(.5+.5*(b-a)/k,0,1); return b*(1-h)+a*h-k*h*(1-h)

# mechanical underbody and chest armor
inner=superellipsoid(1.78,1.55,.72,.62,.65); translate(inner,(0,-1.30,-.10)); add(inner,BLACK)
chest=superellipsoid(1.82,1.18,.78,.54,.55); translate(chest,(0,-1.00,.02)); add(chest,WHITE)
lower=superellipsoid(1.15,.60,.68,.54,.58); translate(lower,(0,-2.00,.05)); add(lower,WHITE)
rounded_box((0,-2.20,.72),(.68,1.05,.22),.11,c=WHITE2)
for s in (-1,1):
    sh=superellipsoid(.70,.82,.62,.70,.70); translate(sh,(2.05*s,-.82,-.02)); rotate(sh,-8*s,[0,0,1]); add(sh,WHITE)
    seam=trimesh.creation.torus(major_radius=.48,minor_radius=.025,major_sections=36,minor_sections=12); rotate(seam,90,[0,1,0]); translate(seam,(2.10*s,-.80,.14)); add(seam,GRAY)
    arm=superellipsoid(.46,.92,.50,.58,.62); translate(arm,(2.12*s,-1.85,-.04)); rotate(arm,6*s,[0,0,1]); add(arm,WHITE2)
    j=trimesh.creation.icosphere(subdivisions=2,radius=.30); translate(j,(2.14*s,-2.55,-.08)); add(j,BLACK)

# sculpted cowl: smooth union of layered elliptical folds plus diagonal drape
def cowl_sdf(X,Y,Z):
    f=torus_sdf(X,Y,Z,0,-.02,.00,1.52,1.14,.28)
    f=smooth_min(f,torus_sdf(X,Y,Z,0,-.32,.10,1.65,1.24,.25),.16)
    f=smooth_min(f,torus_sdf(X,Y,Z,.05,-.63,.18,1.72,1.30,.22),.15)
    def rbox_rot(cx,cy,cz,sx,sy,sz,r,ang):
        ca=np.cos(ang); sa=np.sin(ang); dx=X-cx; dy=Y-cy
        xr=ca*dx+sa*dy; yr=-sa*dx+ca*dy
        return sd_round_box(xr,yr,Z-cz,(0,0,0),(sx,sy,sz),r)
    f=smooth_min(f,rbox_rot(.25,-.88,.47,3.15,.58,.28,.14,-.28),.17)
    f=smooth_min(f,rbox_rot(.85,-.66,.32,1.50,.45,.25,.13,-.76),.15)
    f=smooth_min(f,rbox_rot(-.70,-.50,.28,1.18,.38,.22,.12,.55),.14)
    return f
cowl=sdf_mesh(cowl_sdf,[(-2.1,2.1),(-1.55,.58),(-1.65,1.55)],res=78); add(cowl,DARK)
for y,Rx,Rz,r in [(-.06,1.58,1.18,.055),(-.38,1.72,1.28,.045),(-.69,1.79,1.34,.038)]:
    ridge=sdf_mesh(lambda X,Y,Z,yy=y,rx=Rx,rz=Rz,rr=r:torus_sdf(X,Y,Z,0,yy,.12,rx,rz,rr),[(-2.0,2.0),(y-.12,y+.12),(-1.55,1.55)],res=52); add(ridge,GRAY)

neck=trimesh.creation.cylinder(radius=.34,height=.50,sections=36); rotate(neck,90,[1,0,0]); translate(neck,(0,.52,-.02)); add(neck,BLACK)

# helmet and face: elongated skull, recessed black substrate, layered mask
head=superellipsoid(.82,1.02,.74,.72,.72,nu=84,nv=52); translate(head,(0,1.78,.02)); add(head,WHITE)
rear=superellipsoid(.77,.90,.78,.82,.82); translate(rear,(0,1.78,-.17)); add(rear,WHITE2)
rounded_box((0,2.52,.04),(1.05,.32,.88),.16,c=WHITE)
rounded_box((0,2.58,.72),(.27,.09,.14),.04,c=BLACK)
face=superellipsoid(.63,.70,.40,.62,.68); translate(face,(0,1.55,.56)); add(face,BLACK)
rounded_box((0,2.06,.80),(.67,.52,.18),.09,c=WHITE)
rounded_box((0,1.60,.87),(.42,.62,.20),.08,c=WHITE2)
rounded_box((0,1.17,.88),(.67,.32,.22),.09,c=WHITE)
rounded_box((0,.93,.84),(.49,.19,.18),.07,c=WHITE2)
for s in (-1,1): rounded_box((.16*s,2.11,.91),(.10,.18,.06),.025,c=GRAY)
for s in (-1,1):
    sock=superellipsoid(.28,.18,.15,.72,.72); translate(sock,(.32*s,1.91,.88)); rotate(sock,-10*s,[0,0,1]); add(sock,BLACK)
    eye=trimesh.creation.icosphere(subdivisions=3,radius=.095); scale(eye,(1.25,.82,.58)); translate(eye,(.32*s,1.91,1.00)); add(eye,RED)
    brow=rounded_box((.34*s,2.06,.88),(.42,.13,.10),.05,c=WHITE); rotate(brow,-12*s,[0,0,1])
    cheek=superellipsoid(.24,.48,.19,.62,.62); translate(cheek,(.52*s,1.47,.72)); rotate(cheek,-18*s,[0,0,1]); add(cheek,WHITE2)
    mech=superellipsoid(.20,.40,.16,.58,.62); translate(mech,(.38*s,1.40,.80)); rotate(mech,-20*s,[0,0,1]); add(mech,DARK)
    temple=superellipsoid(.20,.38,.24,.68,.68); translate(temple,(.69*s,1.74,.28)); add(temple,WHITE)
    ear=trimesh.creation.torus(major_radius=.16,minor_radius=.055,major_sections=32,minor_sections=14); rotate(ear,90,[0,1,0]); translate(ear,(.82*s,1.72,.04)); add(ear,GRAY)
    hub=trimesh.creation.cylinder(radius=.09,height=.10,sections=24); rotate(hub,90,[0,0,1]); translate(hub,(.82*s,1.72,.04)); add(hub,BLACK)
rounded_box((0,.72,.65),(.39,.20,.17),.07,c=BLACK)
for s in (-1,1): rounded_box((.66*s,2.27,.18),(.12,.38,.14),.04,c=WHITE2)

# chest panel seams
for x,y,ang,L in [(-.68,-.93,18,1.00),(.68,-.93,-18,1.00),(-.46,-1.67,-12,.76),(.46,-1.67,12,.76)]:
    piece=rounded_box((x,y,.74),(L,.055,.055),.025,c=GRAY); rotate(piece,ang,[0,0,1])

scene=trimesh.Scene()
for i,m in enumerate(meshes): scene.add_geometry(m,node_name=f'part_{i:02d}')
OUT.write_bytes(scene.export(file_type='glb'))
print('GLB',OUT,OUT.stat().st_size,'meshes',len(meshes))
