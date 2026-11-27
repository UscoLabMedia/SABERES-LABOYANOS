# Bloque 3D de La Orquídera (version A) - Blender por codigo.
# Proporciones de la hoja aprobada: 5 cabezas, torso corto, falda a media pantorrilla.
import bpy, bmesh, math, sys, json
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else 'orquidera_bloque.glb'
H = 0.30                      # alto de cabeza (m) -> 5 cabezas = 1.50 m
z = lambda u: (5 - u) * H     # u = unidades de cabeza desde la coronilla

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

def mat(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*[c ** 2.2 for c in rgb], 1)
    b.inputs['Roughness'].default_value = rough
    return m
hexrgb = lambda h: tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
M = {k: mat(k, hexrgb(v)) for k, v in dict(
    piel='#d79b72', pelo='#3a2418', blusa='#f3e6c6', falda='#6f8fa0', delantal='#efe4cc',
    paja='#deb066', teja='#b8332a', cesta='#a8793a', cereza='#c0291e', ojo='#2a160d',
    blanco='#fbf7ee', fique='#c8a867', orquidea='#c25aa6', centro='#f4cf55').items()}

def obj_from_bm(name, bm, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); scn.collection.objects.link(o)
    o.data.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    return o

def loft(name, rings, m, seg=32, cap_top=True, cap_bot=True, center=(0, 0, 0), smooth=True):
    """rings: lista de (z, rx, ry[, dy]) de arriba hacia abajo; seccion eliptica."""
    bm = bmesh.new(); loops = []
    for r in rings:
        zz, rx, ry = r[:3]; dy = r[3] if len(r) > 3 else 0
        loops.append([bm.verts.new((center[0] + rx * math.cos(a), center[1] + dy + ry * math.sin(a), zz))
                      for a in [2 * math.pi * i / seg for i in range(seg)]])
    for a, b in zip(loops, loops[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    if cap_top: bm.faces.new(list(reversed(loops[0])))
    if cap_bot: bm.faces.new(loops[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm(name, bm, m, smooth)

def elip(name, c, r, m, seg=32, rings=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    for v in bm.verts: v.co = Vector((c[0] + v.co.x * r[0], c[1] + v.co.y * r[1], c[2] + v.co.z * r[2]))
    return obj_from_bm(name, bm, m)

# --- cabeza ---
HC = Vector((0, 0, z(0.52)))                                   # centro de la cabeza
elip('cabeza', HC, (0.138, 0.13, 0.156), M['piel'])
# cabello: casco redondeado (se borra la cara y lo de abajo)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=1)
for v in bm.verts: v.co = Vector((HC.x + v.co.x * .152, HC.y + .008 + v.co.y * .148, HC.z + .012 + v.co.z * .168))
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < HC.z - .095 or (v.co.y < HC.y - .045 and v.co.z < HC.z + .045)], context='VERTS')
pelo = obj_from_bm('cabello', bm, M['pelo'])
pelo.modifiers.new('grosor', 'SOLIDIFY').thickness = .008
# ojos normales: blanco + iris
for s in (-1, 1):
    elip('ojo_blanco_' + ('i' if s < 0 else 'd'), (s * .047, -.118, z(.58)), (.022, .01, .016), M['blanco'])
    elip('ojo_iris_' + ('i' if s < 0 else 'd'), (s * .047, -.124, z(.58)), (.013, .007, .014), M['ojo'])
# cuello
loft('cuello', [(z(.95), .045, .042), (z(1.16), .05, .045)], M['piel'], seg=20)
# --- torso (blusa): hombros -> cintura alta ---
loft('blusa', [(z(1.14), .06, .05), (z(1.18), .125, .085), (z(1.45), .118, .09), (z(1.75), .1, .078), (z(2.1), .098, .075)], M['blusa'])
# --- brazos con manga larga y manos ---
for s, n in ((-1, 'i'), (1, 'd')):
    a = loft('manga_' + n, [(0, .048, .046), (-.22, .043, .041), (-.43, .04, .038), (-.46, .045, .043)], M['blusa'], seg=20)
    a.location = (s * .15, 0.0, z(1.2)); a.rotation_euler = (0, s * math.radians(-7), 0)
    elip('mano_' + n, (s * (.15 + .5 * math.sin(math.radians(7))), -.005, z(1.2) - .5), (.03, .022, .045), M['piel'])
# --- falda, delantal, cinturilla ---
loft('falda', [(z(2.03), .102, .08), (z(2.3), .14, .12), (z(2.95), .19, .17), (z(3.6), .235, .215), (z(4.2), .27, .245)], M['falda'], seg=48, cap_bot=False)
bm = bmesh.new()
filas = [(z(2.08), -.094, .07), (z(2.95), -.19, .085), (z(3.7), -.25, .1)]   # sigue la curva de la falda
vs = [(bm.verts.new((-w, y, zz)), bm.verts.new((w, y, zz))) for zz, y, w in filas]
for (a, b), (c, d) in zip(vs, vs[1:]): bm.faces.new((a, b, d, c))
delantal = obj_from_bm('delantal', bm, M['delantal'], smooth=False)
delantal.modifiers.new('grosor', 'SOLIDIFY').thickness = .006
# --- piernas y alpargatas ---
for s, n in ((-1, 'i'), (1, 'd')):
    loft('pierna_' + n, [(z(4.15), .047, .047), (z(4.45), .05, .05), (z(4.75), .036, .036), (.075, .028, .028)], M['piel'], seg=20, center=(s * .058, 0, 0))
    elip('alpargata_' + n, (s * .058, -.035, .03), (.042, .1, .032), M['fique'])
    loft('cinta_' + n, [(.098, .034, .034), (.07, .034, .034)], M['teja'], seg=20, center=(s * .058, 0, 0))
# --- sombrero de iraca ---
loft('ala', [(z(.17), .27, .27), (z(.17) - .012, .27, .27)], M['paja'], seg=48)
loft('copa', [(z(-.27), .05, .05), (z(-.24), .1, .1), (z(-.12), .122, .12), (z(.17), .128, .126)], M['paja'], seg=40, cap_bot=False)
loft('cinta_sombrero', [(z(.06), .131, .129), (z(.15), .131, .129)], M['teja'], seg=40, cap_top=False, cap_bot=False)
for k in range(5):
    a = 2 * math.pi * k / 5
    elip('orquidea_%d' % k, (-.13 + .022 * math.cos(a), -.04, z(.1) + .022 * math.sin(a)), (.018, .008, .012), M['orquidea'])
elip('orquidea_centro', (-.13, -.046, z(.1)), (.009, .006, .009), M['centro'])
# --- trenza a media espalda ---
n = 9
for i in range(n):
    t = i / (n - 1)
    elip('trenza_%d' % i, (math.sin(i * 1.3) * .004, .1 + .02 * (1 - t), z(1.02) - t * (z(1.02) - z(1.62))), (.028 - .008 * t, .024, .03), M['pelo'])
elip('lazo', (0, .1, z(1.66)), (.03, .016, .016), M['teja'])
# --- canasto con cerezas, en la cadera ---
cb = Vector((.06, -.17, z(2.45)))
loft('canasto', [(cb.z + .05, .085, .07), (cb.z - .05, .065, .055)], M['cesta'], seg=28, center=(cb.x, cb.y, 0))
loft('canasto_borde', [(cb.z + .056, .089, .074), (cb.z + .046, .089, .074)], M['fique'], seg=28, center=(cb.x, cb.y, 0))
import random; random.seed(3)
for i in range(14):
    a, r = random.random() * 6.283, math.sqrt(random.random()) * .06
    elip('cereza_%d' % i, (cb.x + r * math.cos(a), cb.y + r * .8 * math.sin(a), cb.z + .064), (.012, .012, .012), M['cereza'], seg=10, rings=6)

# --- medidas para verificar la hoja ---
def bbox(names):
    pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if any(o.name.startswith(n) for n in names) for c in o.bound_box]
    return min(p.z for p in pts), max(p.z for p in pts)
alto = bbox(['cabeza', 'cabello'])[1] - 0
med = {
    'alto_sin_sombrero_m': round(bbox(['cabello'])[1], 3),
    'cabeza_m': round(bbox(['cabeza'])[1] - bbox(['cabeza'])[0], 3),
    'torso_hombro_a_cintura_m': round(z(1.18) - z(2.1), 3),
    'cintura_al_suelo_m': round(z(2.1), 3),
    'trenza_termina_z_m': round(z(1.66), 3),
    'objetos': len(bpy.data.objects),
    'triangulos': sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'),
}
med['cabezas_de_alto'] = round(med['alto_sin_sombrero_m'] / med['cabeza_m'], 2)
print('MEDIDAS', json.dumps(med))

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
print('EXPORTADO', OUT)
