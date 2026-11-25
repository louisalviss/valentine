
import bpy, math
from mathutils import Vector
from pathlib import Path
from math import pi, sin, cos
w=Path(__import__('os').environ.get('ATELIER_BUILD_DIR', __import__('os').getcwd()))
sc=bpy.context.scene
def mat(name,col,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*col,1)
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Metallic'].default_value=1;bs.inputs['Roughness'].default_value=rough
 return m
satin=mat('Bracelet satin steel',(.48,.52,.57),.28)
mirror=mat('Bracelet polished chamfer',(.73,.77,.81),.13)
pinmat=mat('Bracelet pin',(.33,.37,.4),.24)
def block(name,loc,dim,m,g,angle=0,bevel=.065):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.name=name;o.rotation_euler.x=angle;o.data.materials.append(m);o['assembly_group']=g
 b=o.modifiers.new('Rounded machined edge','BEVEL');b.width=bevel;b.segments=4
 o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for f in o.data.polygons:f.use_smooth=True
 return o
# Curved, tapering three-piece link bracelet; real individual mesh sections.
# Lower surface falls away from the dial like a bracelet over a wrist.
for side in (-1,1):
 g='BRACELET_TOP' if side==1 else 'BRACELET_BOTTOM'
 for x in (-.91,.91):
  block('Sculpted case lug',(x,side*2.24,.24),(.40,.91,.41),mirror,'CASE',side*(-.12),.12)
 # End link joins the lugs rather than floating free.
 block('Solid end link',(0,side*2.48,.20),(1.53,.63,.36),satin,g,side*(-.18),.09)
 for i in range(6):
  angle=.20+i*.15; y=2.78+i*.48-.014*i*i;z=.16-.072*i-.055*i*i
  width=1.85-i*.07;outer=width*.29;mid=width-2*outer-.05
  # Fine stepped shoulder, polished middle link, satin outer links.
  for sign in (-1,1):
   block('Satin outer link %02d'%i,(sign*(mid/2+outer/2+.018),side*y,z),(outer,.49,.32),satin,g,-side*angle,.055)
  block('Polished centre link %02d'%i,(0,side*(y+.045),z+.027),(mid,.48,.30),mirror,g,-side*angle,.05)
  # Exposed link-end pin heads.
  for sign in (-1,1):
   bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.055,depth=.026,location=(sign*width/2,side*y,z));o=bpy.context.object;o.rotation_euler.y=pi/2;o.name='Link pin';o['assembly_group']=g;o.data.materials.append(pinmat)
   for f in o.data.polygons:f.use_smooth=True
# Refine the dial markers with slightly brighter applied indices; existing textures preserved.
# No global scale or model recenter change.
bpy.ops.object.select_all(action='DESELECT')
for o in sc.objects:
 if o.type=='MESH' and not o.name.startswith('Plane'):o.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects.get('Mainplate')
bpy.ops.export_scene.gltf(filepath=str(w/'movement-v5.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(w/'baked-v5.blend'))
