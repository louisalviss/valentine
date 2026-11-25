
import bpy, math, random
from pathlib import Path
from mathutils import Vector
from math import pi,cos,sin
w=Path(__import__('os').environ.get('ATELIER_BUILD_DIR', __import__('os').getcwd()))
sc=bpy.context.scene;sc.cycles.use_denoising=False;sc.cycles.samples=20
# Surface finishing: thinner, directional machining marks rather than coarse bump.
for m in bpy.data.materials:
 if not m.use_nodes:continue
 for n in m.node_tree.nodes:
  if n.type=='BUMP':
   n.inputs['Strength'].default_value=.12
   n.inputs['Distance'].default_value=.0025
  if n.type=='TEX_NOISE':n.inputs['Scale'].default_value=230
# Geneva bands on the two bridge faces: a subtle periodic polished stripe + fine directional grooves.
for name in ['Train bridge / satin face','Barrel bridge / satin face']:
 o=bpy.data.objects[name];m=o.data.materials[0].copy();m.name=name+' Geneva';o.data.materials[0]=m
 nt=m.node_tree;n=nt.nodes;L=nt.links;bs=n.get('Principled BSDF')
 tex=n.new('ShaderNodeTexWave');tex.wave_type='BANDS';tex.bands_direction='X';tex.wave_profile='SIN';tex.inputs['Scale'].default_value=4.7;tex.inputs['Distortion'].default_value=.12
 coord=n.new('ShaderNodeTexCoord');L.new(coord.outputs['Generated'],tex.inputs['Vector'])
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.17,.17,.17,1);ramp.color_ramp.elements[1].color=(.39,.39,.39,1)
 L.new(tex.outputs['Fac'],ramp.inputs[0]);L.new(ramp.outputs['Color'],bs.inputs['Roughness'])
 bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.003;L.new(tex.outputs['Fac'],bump.inputs['Height'])
 if bs.inputs['Normal'].is_linked:L.new(bs.inputs['Normal'].links[0].from_socket,bump.inputs['Normal'])
 L.new(bump.outputs['Normal'],bs.inputs['Normal'])
# Open-work gears. Cut four real holes through each wheel, maintaining outer teeth and hub.
centers=[(-.82,.92,.74,52),(.39,.82,.51,36),(.96,-.09,.60,42),(.13,-.80,.48,34),(-.71,-.69,.40,28)]
for x,y,r,teeth in centers:
 o=bpy.data.objects.get('Wheel %02d'%teeth);assert o
 # Remove cosmetic rivets from solid-wheel design; replace with open spokes.
 for v in list(bpy.data.objects):
  if v.name.startswith('Wheel %02d spoke rivet'%teeth):bpy.data.objects.remove(v,do_unlink=True)
 bpy.context.view_layer.objects.active=o
 for j in range(5):
  a=2*pi*j/5+.31
  bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=r*.19,depth=1.5,location=(x+cos(a)*r*.54,y+sin(a)*r*.54,.26))
  cutter=bpy.context.object
  mod=o.modifiers.new('Wheel aperture','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
  # Boolean before finish modifiers.
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_move_to_index(modifier=mod.name,index=0)
  bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 print('OPENWORK',teeth,flush=True)
# UV and bake normals, roughness for the Geneva surfaces, and occlusion for stationary metal.
names=['Train bridge / satin face','Barrel bridge / satin face','Mainplate','Wheel 52','Wheel 36','Wheel 42','Wheel 34','Wheel 28','Balance rim','Mainspring barrel cap']
for name in names:
 o=bpy.data.objects.get(name);assert o
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
 m=o.data.materials[0].copy();m.name=name+' / finished';o.data.materials[0]=m
 nt=m.node_tree;n=nt.nodes;L=nt.links;bs=n.get('Principled BSDF')
 def bake(kind,size=512):
  im=bpy.data.images.new(name+' '+kind,width=size,height=size,alpha=False);im.colorspace_settings.name='Non-Color'
  t=n.new('ShaderNodeTexImage');t.image=im;n.active=t
  bpy.ops.object.bake(type=kind,margin=8);im.pack();return t
 if bs.inputs['Normal'].is_linked:
  t=bake('NORMAL')
  for link in list(bs.inputs['Normal'].links):L.remove(link)
  nm=n.new('ShaderNodeNormalMap');L.new(t.outputs['Color'],nm.inputs['Color']);L.new(nm.outputs['Normal'],bs.inputs['Normal'])
 if name.endswith('satin face'):
  t=bake('ROUGHNESS')
  for link in list(bs.inputs['Roughness'].links):L.remove(link)
  L.new(t.outputs['Color'],bs.inputs['Roughness'])
 if name=='Mainplate':
  t=bake('AO',512)
  # glTF occlusion exporter recognizes this named group/socket.
  ng=bpy.data.node_groups.get('glTF Material Output') or bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
  if not any(i.name=='Occlusion' for i in ng.interface.items_tree):ng.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
  g=n.new('ShaderNodeGroup');g.node_tree=ng;L.new(t.outputs['Color'],g.inputs['Occlusion'])
 print('FINISH',name,flush=True)
# Existing semantic classes plus rotating subassembly IDs and exact centers.
for o in list(sc.objects):
 if o.type not in ('MESH','CURVE','FONT') or o.name.startswith('Plane'):continue
 n=o.name.lower();x,y,z=o.location
 if 'bridge' in n or 'atelier' in n or 'mechanical study' in n:g='BRIDGES'
 elif 'balance' in n:g='BALANCE'
 elif 'wheel' in n or 'barrel' in n:g='TRAIN'
 elif 'ruby' in n or 'jewel' in n or 'pivot' in n or 'screw' in n or n.startswith('cube'):g='FASTENERS'
 elif 'ring' in n or 'chamfer' in n:g='CASE'
 else:g='MAINPLATE'
 o['assembly_group']=g
 for i,(cx,cy,r,teeth) in enumerate(centers):
  if n.startswith('wheel %02d'%teeth):
   o['rotor_id']='W'+str(teeth);o['rotor_center']=[cx,cy];break
 if n.startswith('balance rim') or n.startswith('balance spoke') or n.startswith('balance timing screw') or n.startswith('balance hairspring'):
  o['rotor_id']='BAL';o['rotor_center']=[-1.28,.02]
bpy.ops.object.select_all(action='DESELECT')
for o in sc.objects:
 if o.type in ('MESH','CURVE','FONT') and not o.name.startswith('Plane'):o.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects.get('Mainplate')
bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(w/'movement-v3.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(w/'baked-v3.blend'))
