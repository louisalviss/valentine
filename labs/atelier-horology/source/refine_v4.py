
import bpy,math
from math import pi,sin,cos
from pathlib import Path
from mathutils import Vector
w=Path(__import__('os').environ.get('ATELIER_BUILD_DIR', __import__('os').getcwd()))
sc=bpy.context.scene;sc.cycles.use_denoising=False;sc.cycles.samples=16
def mat(name,col,rough=.3,metal=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*col,1)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
steel=mat('Mirror polished indices',(.73,.77,.79),.14)
dialmat=mat('Midnight dial',(.025,.045,.065),.32,.78)
gold=mat('Warm champagne accent',(.69,.44,.17),.20)
white=mat('Ivory print',(.78,.79,.73),.55,.1)
dark=mat('Dark crown inlay',(.028,.03,.035),.4,.6)
def finish(o,name,m,group,bev=.005):
 o.name=name;o.data.materials.append(m);o['assembly_group']=group
 if bev:
  b=o.modifiers.new('Machined edge','BEVEL');b.width=bev;b.segments=3
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for f in o.data.polygons:f.use_smooth=True
 return o
def disc(name,x,y,z,r,h,m,g,bev=.009,N=128):
 bpy.ops.mesh.primitive_cylinder_add(vertices=N,radius=r,depth=h,location=(x,y,z));return finish(bpy.context.object,name,m,g,bev)
def ring(name,x,y,z,ro,ri,h,m,g,bev=.006,N=128):
 vs=[(x+r*cos(2*pi*i/N),y+r*sin(2*pi*i/N),z+zz) for zz in (-h/2,h/2) for r in (ro,ri) for i in range(N)]
 fs=[]
 for i in range(N):
  j=(i+1)%N;fs.extend([(i,j,2*N+j,2*N+i),(N+j,N+i,3*N+i,3*N+j),(2*N+i,2*N+j,3*N+j,3*N+i),(j,i,N+i,N+j)])
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);sc.collection.objects.link(o);return finish(o,name,m,g,bev)
def prism(name,pts,z,h,m,g,bev=.006):
 N=len(pts);vs=[(x,y,z+dz) for dz in (-h/2,h/2) for x,y in pts];fs=[tuple(range(N-1,-1,-1)),tuple(range(N,2*N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);sc.collection.objects.link(o);return finish(o,name,m,g,bev)
def radial(name,a,r,l,b,z,h,m,g):
 x,y=cos(a),sin(a);u,v=-y,x
 pts=[(x*(r+t*l/2)+u*s*b/2,y*(r+t*l/2)+v*s*b/2) for t,s in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 return prism(name,pts,z,h,m,g,.004)
def txt(s,x,y,z,size,m,g):
 cu=bpy.data.curves.new(s,'FONT');cu.body=s;cu.size=size;cu.align_x='CENTER';cu.align_y='CENTER';cu.extrude=.0004;cu.space_character=1.12
 o=bpy.data.objects.new(s,cu);sc.collection.objects.link(o);o.location=(x,y,z);o.data.materials.append(m);o['assembly_group']=g;return o
# A separate dial assembly gives the study a recognisable product face before exposing the calibre.
dial=disc('Sunray dial plate',0,0,.92,2.15,.09,dialmat,'DIAL',.018,192)
ring('Dial silver chapter ring',0,0,.99,2.17,2.135,.037,steel,'DIAL',.005,192)
ring('Fine champagne inner track',0,0,.977,1.91,1.895,.008,gold,'DIAL',.001,192)
ring('Dial outer minute track',0,0,.978,2.08,2.074,.008,steel,'DIAL',.001,192)
for i in range(60):
 a=pi/2-i*2*pi/60
 if i%5==0:
  radial('Applied hour index %02d'%i,a,1.86,.27,.075,1.012,.045,steel,'DIAL')
  radial('Hour index highlight',a,1.86,.17,.025,1.037,.006,white,'DIAL')
 else:radial('Minute graduation',a,2.025,.065,.012,.98,.007,white,'DIAL')
for s,a in [('12',pi/2),('3',0),('6',-pi/2),('9',pi)]:
 txt(s,1.55*cos(a),1.55*sin(a),.973,.16,white,'DIAL')
txt('A T E L I E R',0,.73,.973,.195,white,'DIAL')
txt('CALIBRE  /  02',0,.47,.973,.088,gold,'DIAL')
txt('MECHANICAL STUDY',0,-.67,.973,.095,white,'DIAL')
txt('ORIGINAL CONCEPT',0,-.84,.973,.072,white,'DIAL')
# Tapered faceted hands. Each hand is a distinct rotor on the dial axis.
for name,a,l,width,z,m in [('Hour hand',pi*.82,1.13,.13,1.06,steel),('Minute hand',pi*.18,1.65,.092,1.105,steel),('Seconds hand',-pi*.43,1.85,.025,1.15,gold)]:
 x,y=cos(a),sin(a);u,v=-y,x
 coords=[(-.17,-width*.32),(.12,-width/2),(l*.82,-width*.34),(l,0),(l*.82,width*.34),(.12,width/2),(-.17,width*.32)]
 ob=prism(name,[(t*x+b*u,t*y+b*v) for t,b in coords],z,.024,m,'HANDS',.004)
 if name=='Seconds hand':ob['rotor_id']='SEC';ob['rotor_center']=[0.,0.]
disc('Hand pinion cap',0,0,1.17,.095,.047,gold,'HANDS',.009)
# Crown with radial knurling and a fine polished flange.
c=disc('Crown stem',2.36,0,.36,.11,.28,steel,'CASE');c.rotation_euler.y=pi/2
c=disc('Crown body',2.56,0,.36,.26,.27,steel,'CASE',.015,64);c.rotation_euler.y=pi/2
for i in range(36):
 a=i*2*pi/36
 bpy.ops.mesh.primitive_cube_add(size=1,location=(2.56,.258*cos(a),.36+.258*sin(a)))
 o=bpy.context.object;o.dimensions=(.21,.024,.045);o.rotation_euler.x=a; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,'Crown knurl',dark,'CASE',.003)
# Dial microfinish via directional rays baked to a unique normal texture.
nt=dialmat.node_tree;n=nt.nodes;L=nt.links;bs=n.get('Principled BSDF')
coord=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');L.new(coord.outputs['Generated'],sep.inputs[0])
def mathnode(op,a,b):
 m=n.new('ShaderNodeMath');m.operation=op
 for idx,k in enumerate([a,b]):
  if isinstance(k,(float,int)):m.inputs[idx].default_value=k
  else:L.new(k,m.inputs[idx])
 return m.outputs[0]
xx=mathnode('SUBTRACT',sep.outputs['X'],.5);yy=mathnode('SUBTRACT',sep.outputs['Y'],.5)
ang=mathnode('ARCTAN2',yy,xx);wave=mathnode('SINE',mathnode('MULTIPLY',ang,480),0)
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.11;bump.inputs['Distance'].default_value=.0012;L.new(wave,bump.inputs['Height']);L.new(bump.outputs['Normal'],bs.inputs['Normal'])
bpy.ops.object.select_all(action='DESELECT');dial.select_set(True);bpy.context.view_layer.objects.active=dial
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
im=bpy.data.images.new('Sunray microfinish',1024,1024,alpha=False);im.colorspace_settings.name='Non-Color';t=n.new('ShaderNodeTexImage');t.image=im;n.active=t
bpy.ops.object.bake(type='NORMAL',margin=8);im.pack()
for link in list(bs.inputs['Normal'].links):L.remove(link)
nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.4;L.new(t.outputs['Color'],nm.inputs['Color']);L.new(nm.outputs['Normal'],bs.inputs['Normal'])
# Retain all earlier baked components. Convert text to mesh before GLB export.
bpy.ops.object.select_all(action='DESELECT')
for o in sc.objects:
 if o.type in ('MESH','FONT','CURVE') and not o.name.startswith('Plane'):o.select_set(True)
bpy.context.view_layer.objects.active=dial;bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(w/'movement-v4.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(w/'baked-v4.blend'))
print('V4_EXPORT_OK')
