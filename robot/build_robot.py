from pathlib import Path
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix

OUT = Path(__file__).with_name('robot.glb')
WHITE=[244,246,247,255]; DARK=[23,28,34,255]; GRAY=[88,96,106,255]; RED=[255,90,80,255]; BLACK=[8,10,12,255]
meshes=[]

def add(mesh,color):
    mesh.visual.face_colors=np.tile(np.array(color,dtype=np.uint8),(len(mesh.faces),1)); meshes.append(mesh)

def tr(mesh, translate=(0,0,0), rotate=None, scale=None):
    if scale is not None:
        sx,sy,sz=(scale,scale,scale) if np.isscalar(scale) else scale
        mesh.apply_transform(np.diag([sx,sy,sz,1.0]))
    if rotate:
        for angle,axis in rotate: mesh.apply_transform(rotation_matrix(np.deg2rad(angle),axis))
    mesh.apply_translation(translate); return mesh

# Chest / torso
m=trimesh.creation.box((2.9,2.2,1.55)); tr(m,(0,-1.15,0),scale=(1,1,.92)); add(m,WHITE)
m=trimesh.creation.torus(major_radius=.68,minor_radius=.18,major_sections=48,minor_sections=18); tr(m,(0,-1.88,.60),[(90,[0,1,0])],(1.55,1,.36)); add(m,GRAY)
m=trimesh.creation.box((.95,.24,.34)); tr(m,(0,-1.88,.60)); add(m,BLACK)
for s in (-1,1):
    m=trimesh.creation.icosphere(subdivisions=3,radius=.62); tr(m,(1.95*s,-.72,0),scale=(1.12,1.22,1.08)); add(m,WHITE)
    m=trimesh.creation.capsule(radius=.36,height=.92,count=[18,22]); tr(m,(2.22*s,-1.70,0),[(8*s,[0,0,1])]); add(m,DARK)
    m=trimesh.creation.box((.68,1.12,.72)); tr(m,(2.18*s,-1.72,.02),[(8*s,[0,0,1])],(1,1,.88)); add(m,WHITE)
# Neck
m=trimesh.creation.cylinder(radius=.36,height=.48,sections=30); tr(m,(0,.08,-.04),[(90,[1,0,0])]); add(m,BLACK)
m=trimesh.creation.torus(major_radius=.42,minor_radius=.06,major_sections=42,minor_sections=16); tr(m,(0,.25,.04),[(90,[1,0,0])]); add(m,GRAY)
# Cowl folds
for R,r,y,z,sx,sy,sz in [(1.55,.30,-.10,.08,1.26,.98,1.02),(1.38,.26,-.42,.13,1.32,1.02,1.08),(1.22,.22,-.78,.18,1.38,1.05,1.14)]:
    m=trimesh.creation.torus(major_radius=R,minor_radius=r,major_sections=56,minor_sections=20); tr(m,(0,y,z),[(90,[1,0,0]),(-8,[0,1,0])],(sx,sy,sz)); add(m,DARK)
for x,y,z,rx,ry,rz,sx,sy,sz in [( .22,-1.00,.56,0,-8,-18,2.20,.72,.22),(-.15,-.86,.48,0,5,18,1.30,.52,.18),(.92,-.74,.26,0,0,-55,1.15,.58,.18),(-.95,-.62,.22,0,0,35,.86,.42,.14)]:
    m=trimesh.creation.box((sx,sy,sz)); tr(m,(x,y,z),[(rx,[1,0,0]),(ry,[0,1,0]),(rz,[0,0,1])]); add(m,DARK)
# Head
m=trimesh.creation.icosphere(subdivisions=3,radius=.86); tr(m,(0,1.45,.02),scale=(.90,1.14,1)); add(m,WHITE)
m=trimesh.creation.box((1.02,.34,1.04)); tr(m,(0,2.04,-.02),scale=(1,1,.94)); add(m,WHITE)
m=trimesh.creation.box((.28,.10,.20)); tr(m,(0,2.08,.78)); add(m,BLACK)
m=trimesh.creation.box((.78,.18,.22)); tr(m,(0,1.60,.72)); add(m,WHITE)
m=trimesh.creation.box((.44,.92,.34)); tr(m,(0,1.02,.76),scale=(1,1,.9)); add(m,WHITE)
m=trimesh.creation.box((.72,.30,.28)); tr(m,(0,.58,.84)); add(m,WHITE)
m=trimesh.creation.box((.54,.22,.24)); tr(m,(0,.36,.88)); add(m,WHITE)
for s in (-1,1):
    m=trimesh.creation.box((.42,1.02,.34)); tr(m,(.56*s,.95,.54),[(-16*s,[0,0,1])]); add(m,DARK)
    m=trimesh.creation.box((.18,.72,.26)); tr(m,(.46*s,.55,.44),[(-10*s,[0,0,1])]); add(m,DARK)
    m=trimesh.creation.torus(major_radius=.18,minor_radius=.07,major_sections=28,minor_sections=16); tr(m,(.90*s,1.18,.10),[(90,[0,1,0])],(1,1,.8)); add(m,GRAY)
    m=trimesh.creation.box((.42,.22,.16)); tr(m,(.34*s,1.44,.78),[(-14*s,[0,0,1])]); add(m,BLACK)
    m=trimesh.creation.icosphere(subdivisions=2,radius=.11); tr(m,(.34*s,1.43,.90),scale=(1.2,1,.55)); add(m,RED)
    m=trimesh.creation.box((.16,.30,.12)); tr(m,(.74*s,1.92,.18),[(-35*s,[0,0,1])]); add(m,GRAY)
m=trimesh.creation.box((.34,.18,.16)); tr(m,(0,.70,.84)); add(m,BLACK)
# Mechanical gaps
for x,y,z,sx,sy,sz in [(0,-1.08,.80,.24,.40,.18),(0,-2.18,.42,1.10,.34,.36),(-1.18,-1.66,.36,.30,1.08,.28),(1.18,-1.66,.36,.30,1.08,.28)]:
    m=trimesh.creation.box((sx,sy,sz)); tr(m,(x,y,z)); add(m,BLACK)
scene=trimesh.Scene()
for i,m in enumerate(meshes): scene.add_geometry(m,node_name=f'm{i}')
OUT.write_bytes(scene.export(file_type='glb'))
print(f'wrote {OUT} ({OUT.stat().st_size} bytes, {len(meshes)} meshes)')
