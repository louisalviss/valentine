
import bpy, math, random, os
from mathutils import Vector
from math import sin,cos,pi
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(8)
out=__import__('os').environ.get('ATELIER_BUILD_DIR', __import__('os').getcwd())
def mat(name,color,metal=1,rough=.3,brush=False):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if brush:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=170;tex.inputs['Detail'].default_value=2
  coords=n.new('ShaderNodeTexCoord');v=n.new('ShaderNodeVectorMath');v.operation='MULTIPLY';v.inputs[1].default_value=(.25,5,3)
  m.node_tree.links.new(coords.outputs['Generated'],v.inputs[0]);m.node_tree.links.new(v.outputs['Vector'],tex.inputs['Vector'])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.19;bump.inputs['Distance'].default_value=.012;m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
  if p.inputs.get('Anisotropic IOR Level'):p.inputs['Anisotropic IOR Level'].default_value=.35
 return m
steel=mat('Brushed rhodium',(.62,.65,.68),1,.29,True)
polished=mat('Polished steel',(.78,.8,.83),1,.13)
dark=mat('Blackened steel',(.12,.15,.18),1,.36,True)
gold=mat('Brass gears',(.67,.38,.10),1,.24,True)
copper=mat('Rose brass',(.56,.25,.13),1,.28,True)
ruby=mat('Synthetic ruby',(.30,.007,.036),.5,.17)
black=mat('Black lacquer',(.019,.025,.029),.5,.33)
ink=mat('Engraved dark',(.08,.085,.09),.5,.45)
floor=mat('Charcoal backdrop',(.012,.016,.022),0,.68)
def finish(o,name,m,bev=.012):
 o.name=name;o.data.materials.append(m)
 if bev:
  b=o.modifiers.new('Machined edge','BEVEL');b.width=bev;b.segments=3
  b=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for p in o.data.polygons:p.use_smooth=True
 return o
def disc(name,x,y,z,r,h,m,bev=.012,verts=96):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=h,location=(x,y,z));return finish(bpy.context.object,name,m,bev)
def ring(name,x,y,z,ro,ri,h,m,bev=.008,N=128):
 vs=[(x+r*cos(2*pi*i/N),y+r*sin(2*pi*i/N),z+zz) for zz in (-h/2,h/2) for r in (ro,ri) for i in range(N)]
 fs=[]
 for i in range(N):
  j=(i+1)%N
  fs.extend([(i,j,2*N+j,2*N+i),(N+j,N+i,3*N+i,3*N+j),(2*N+i,2*N+j,3*N+j,3*N+i),(j,i,N+i,N+j)])
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return finish(o,name,m,bev)
def prism(name,pts,z,h,m,bev=.015):
 N=len(pts);vs=[(x,y,z+dz) for dz in (-h/2,h/2) for x,y in pts];fs=[tuple(range(N-1,-1,-1)),tuple(range(N,2*N))]
 fs += [(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return finish(o,name,m,bev)
def gear(name,x,y,z,r,n,phase=0,m=gold):
 # Machined gear profile with root clearance and tapered teeth; visual study, not tolerance-rated CAD.
 pts=[]
 for i in range(n):
  for f,k in [(0,.87),(.12,.87),(.28,1),(.65,1),(.82,.87)]:
   a=2*pi*(i+f)/n+phase;pts.append((x+r*k*cos(a),y+r*k*sin(a)))
 o=prism(name,pts,z,.10,m,.006)
 ring(name+' polished hub',x,y,z+.066,r*.27,r*.13,.06,polished,.006)
 for j in range(5):
  a=j*2*pi/5+phase;disc(name+' spoke rivet',x+cos(a)*r*.54,y+sin(a)*r*.54,z+.062,r*.055,.025,steel,.002,32)
 disc(name+' arbor',x,y,z+.113,r*.10,.11,polished,.008)
 return o
def screw(x,y,z,r=.095):
 disc('Screw / slot head',x,y,z,r,.07,polished,.008,48)
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+.036));o=bpy.context.object;o.scale=(r*1.6,r*.19,.009);o.rotation_euler.z=random.uniform(0,pi);o.data.materials.append(ink)
def jewel(x,y,z,r=.11):
 ring('Polished jewel setting',x,y,z,r*1.45,r*.98,.045,polished)
 ring('Ruby bearing',x,y,z+.027,r,r*.31,.052,ruby,.005,64)
 disc('Pivot',x,y,z+.051,r*.22,.035,polished,.004,32)
# Base and the machined perimeter
disc('Mainplate',0,0,0,2.32,.27,steel,.045,160)
ring('Outer polished case ring',0,0,.21,2.42,2.28,.43,polished,.022,160)
ring('Recessed retaining ring',0,0,.41,2.26,2.16,.12,dark,.012,160)
ring('Fine chamfer',0,0,.48,2.21,2.17,.026,polished,.004,160)
for i in range(12):
 a=i*2*pi/12; screw(2.08*cos(a),2.08*sin(a),.20,.073)
# The barrel and gear train, distinct parts.
for row in [(-.82,.92,.28,.74,52),(.39,.82,.26,.51,36),(.96,-.09,.25,.60,42),(.13,-.80,.24,.48,34),(-.71,-.69,.24,.40,28)]:
 x,y,z,r,n=row;gear('Wheel %02d'%n,x,y,z,r,n,random.random()*.1)
ring('Mainspring barrel cap',-.82,.92,.395,.66,.23,.058,steel,.01)
for j in range(24):
 a=j*2*pi/24;disc('Barrel cap machined dot',-.82+.49*cos(a),.92+.49*sin(a),.432,.019,.012,dark,.002,24)
jewel(-.82,.92,.46,.105)
# Rounded curved bridges, made from unique profiles instead of repeated blocks.
def catmull(points,steps=8):
 res=[]
 for i,p1 in enumerate(points):
  p0=points[(i-1)%len(points)];p2=points[(i+1)%len(points)];p3=points[(i+2)%len(points)]
  for j in range(steps):
   t=j/steps;t2=t*t;t3=t2*t
   res.append(tuple(.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3) for k in (0,1)))
 return res
# keep the gear train visible between two sculpted bridges
bridge1=[(-1.90,-.48),(-1.64,-1.32),(-1.02,-1.75),(-.22,-1.93),(.32,-1.69),(.25,-1.35),(-.47,-1.25),(-.88,-.93),(-1.17,-.37),(-1.42,-.18)]
bridge2=[(.18,1.84),(.88,1.73),(1.62,1.30),(1.91,.69),(1.95,-.08),(1.60,-.28),(1.36,.10),(1.17,.56),(.77,.91),(.23,1.09),(-.04,1.46)]
prism('Train bridge / polished bevel',catmull(bridge1),.48,.17,polished,.024)
prism('Train bridge / satin face',catmull([(x*.986,y*.986) for x,y in bridge1]),.576,.045,steel,.009)
prism('Barrel bridge / polished bevel',catmull(bridge2),.49,.17,polished,.024)
prism('Barrel bridge / satin face',catmull([(x*.986,y*.986) for x,y in bridge2]),.586,.045,steel,.009)
for x,y in [(-1.50,-.69),(-.93,-1.46),(.01,-1.63),(.51,1.47),(1.48,.99),(1.68,.02)]:
 screw(x,y,.65,.093)
for x,y in [(-1.23,-1.11),(1.32,.50),(.29,1.48)]:jewel(x,y,.64,.10)
# Balance wheel / hairspring assembly, separate rim, spokes and spiral.
cx,cy=-1.28,.02
ring('Balance rim',cx,cy,.60,.65,.54,.105,copper,.018,128)
for i in range(3):
 a=i*2*pi/3;pts=[(cx+.10*cos(a-.55),cy+.10*sin(a-.55)),(cx+.57*cos(a-.09),cy+.57*sin(a-.09)),(cx+.57*cos(a+.09),cy+.57*sin(a+.09)),(cx+.10*cos(a+.55),cy+.10*sin(a+.55))];prism('Balance spoke',pts,.60,.085,copper,.012)
for i in range(18):
 a=i*2*pi/18;disc('Balance timing screw',cx+.61*cos(a),cy+.61*sin(a),.674,.034,.025,polished,.004,24)
def curve(name,coords,m,r=.014):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=2;cu.bevel_depth=r;cu.bevel_resolution=3;sp=cu.splines.new('POLY');sp.points.add(len(coords)-1)
 for p,co in zip(sp.points,coords):p.co=(*co,1)
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
curve('Balance hairspring',[(cx+(.10+.37*i/480)*cos(i/480*2*pi*7),cy+(.10+.37*i/480)*sin(i/480*2*pi*7),.72) for i in range(481)],polished,.012)
jewel(cx,cy,.74,.10)
# Small lettering on bridges: original studio concept, no copied marks.
def txt(s,x,y,z,size,angle=0):
 cu=bpy.data.curves.new(s,'FONT');cu.body=s;cu.size=size;cu.align_x='CENTER';cu.align_y='CENTER';cu.extrude=.0007;cu.space_character=1.25
 o=bpy.data.objects.new(s,cu);bpy.context.collection.objects.link(o);o.location=(x,y,z);o.rotation_euler.z=angle;o.data.materials.append(ink)
txt('ATELIER  /  01',.85,1.31,.614,.105,-.45)
txt('MECHANICAL STUDY',-.68,-1.53,.605,.092,.15)
# Scene and photographic studio setup.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.18));bpy.context.object.data.materials.append(floor)
def area(name,loc,power,color,size,sy=None):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color
 o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=sy or size;o.rotation_euler=(Vector((0,0,.2))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-3,-2,6),700,(1,.93,.81),4.0,5.0)
area('Strip reflection',(4,1,4),850,(.79,.88,1),1.1,5)
area('Top diffuse',(0,4,6),550,(1,.98,.93),4,2)
area('Warm edge',(-4,3,2),250,(1,.67,.36),2,3)
bpy.ops.object.camera_add(location=(3.9,-5.0,10.3));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.18))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.5;bpy.context.scene.camera=cam
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=20;sc.cycles.use_denoising=True;sc.cycles.max_bounces=5;sc.render.threads_mode='FIXED';sc.render.threads=4
sc.world.color=(.13,.13,.13);sc.view_settings.view_transform='AgX';sc.render.resolution_x=760;sc.render.resolution_y=760;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='JPEG';sc.render.image_settings.quality=93;sc.render.filepath=out+'/asset-render.jpg'
# Save source + render, no public site promotion.
bpy.ops.wm.save_as_mainfile(filepath=out+'/source.blend')
bpy.ops.render.render(write_still=True)
print('RENDER_DONE',len([o for o in bpy.data.objects if o.type=='MESH']))
