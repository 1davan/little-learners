"""Small post-processing helpers for a built .glb (pure Python, no Blender needed).

They change only the REST POSE of the skeleton (node transforms) and which joint a layer is bound to; the bind pose
(inverse bind matrices) and the raw layer geometry stay exactly as built. So code that reads the raw layer geometry
(scenery.js scMesh / scProp, piphat.js staticProp, garmentProp) sees the model as before, while makeCreature (the
skinned model: viewer, word cards, any direct use of the kind) shows the adjusted rest pose.

    g = Glb(path)
    g.bind_layer('stem', 'root')            # every vertex of mesh 'stem' follows joint 'root' only
    g.move('body', lift=(0, 2.2, 0))        # rest pose of 'body': moved (and turned with turn_x=degrees)
    g.unparent('body')                      # make 'body' a sibling of 'root' (so root can be hidden on its own)
    g.hide('root')                          # collapse joint 'root' (everything bound only to it disappears)
    g.save()
"""
import json, struct, math


class Glb:
    def __init__(self, path):
        self.path = path
        b = open(path, 'rb').read()
        n = struct.unpack('<I', b[12:16])[0]
        self.j = json.loads(b[20:20 + n])
        self.bin = bytearray(b[20 + n + 8:])
        self.names = [nd.get('name') for nd in self.j['nodes']]

    def node(self, name):
        return self.j['nodes'][self.names.index(name)]

    def bind_layer(self, mesh, joint):
        joints = self.j['skins'][0]['joints']
        ji = joints.index(self.names.index(joint))
        for m in self.j['meshes']:
            if m['name'] != mesh:
                continue
            for pr in m['primitives']:
                a = self.j['accessors'][pr['attributes']['JOINTS_0']]
                bv = self.j['bufferViews'][a['bufferView']]
                off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
                assert a['componentType'] == 5121
                self.bin[off:off + 4 * a['count']] = bytes([ji, 0, 0, 0]) * a['count']
                a = self.j['accessors'][pr['attributes']['WEIGHTS_0']]
                bv = self.j['bufferViews'][a['bufferView']]
                off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
                assert a['componentType'] == 5126
                self.bin[off:off + 16 * a['count']] = struct.pack('<4f', 1, 0, 0, 0) * a['count']
        return self

    def move(self, name, lift=(0, 0, 0), turn_x=0.0):
        nd = self.node(name)
        h = math.radians(turn_x) / 2
        ax, ay, az, aw = math.sin(h), 0.0, 0.0, math.cos(h)
        bx, by, bz, bw = nd.get('rotation', [0, 0, 0, 1])
        if turn_x:
            nd['rotation'] = [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
                              aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]
        t = nd.get('translation', [0, 0, 0])
        c, s = math.cos(2 * h), math.sin(2 * h)
        nd['translation'] = [t[0] + lift[0], t[1] * c - t[2] * s + lift[1], t[1] * s + t[2] * c + lift[2]]
        return self

    def unparent(self, name):
        i = self.names.index(name)
        for nd in self.j['nodes']:
            if i in nd.get('children', []):
                nd['children'].remove(i)
                if not nd['children']:
                    del nd['children']
        rig = [nd for nd in self.j['nodes'] if nd.get('extras', {}).get('kind')][0]
        rig.setdefault('children', []).append(i)
        return self

    def hide(self, name):
        self.node(name)['scale'] = [1e-5, 1e-5, 1e-5]
        return self

    def save(self):
        js = json.dumps(self.j, separators=(',', ':')).encode()
        js += b' ' * ((4 - len(js) % 4) % 4)
        out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(self.bin))
        out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(self.bin), 0x004E4942) + bytes(self.bin)
        open(self.path, 'wb').write(out)
        print('post-processed', self.path)
