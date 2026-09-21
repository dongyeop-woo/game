#!/usr/bin/env python3
"""
GLB 안에 박힌 텍스처를 줄인다.

meshy 는 2048x2048 을 세 장(색·거칠기·노멀) 넣어 준다. 판 위에서 유닛은
34px 로 보이는데 2048 은 터무니없다. 폴리곤은 meshy 의 Remesh 로 줄이고
(공짜다), 텍스처는 이걸로 줄인다.

    python3 tools/shrink-glb.py assets/units/mouse/walk.glb --strip

--strip 이 실제로 쓰는 길이다. 텍스처를 날픽셀로 바꿔 GLB 버퍼 뒤에 붙이고
그림 참조를 걷어낸다 - RN 에는 JPEG 을 풀 방법이 없어서 이렇게 해야 한다.
meshy 의 12.6MB 짜리가 0.8MB 가 된다.

지오메트리는 안 건드린다. 건드릴 일도 없었다 - meshy 리깅이 알아서 197만
삼각형을 5천으로 줄여 준다.
"""

import argparse
import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image


def read_glb(path):
    d = path.read_bytes()
    magic, _, _ = struct.unpack_from('<4sII', d, 0)
    if magic != b'glTF':
        sys.exit(f'{path}: GLB 가 아니다')
    off, js, bin_ = 12, None, b''
    while off < len(d):
        clen, ctype = struct.unpack_from('<I4s', d, off)
        off += 8
        if ctype == b'JSON':
            js = json.loads(d[off:off + clen])
        elif ctype.startswith(b'BIN'):
            bin_ = d[off:off + clen]
        off += clen
    return js, bytearray(bin_)


def write_glb(path, js, bin_):
    jb = json.dumps(js, separators=(',', ':')).encode()
    jb += b' ' * (-len(jb) % 4)                 # 청크는 4바이트 경계에 맞춘다
    bb = bytes(bin_) + b'\0' * (-len(bin_) % 4)
    body = struct.pack('<I4s', len(jb), b'JSON') + jb + struct.pack('<I4s', len(bb), b'BIN\0') + bb
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + len(body)) + body)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('glb')
    ap.add_argument('--size', type=int, default=512, help='텍스처 한 변의 최대 길이')
    ap.add_argument('--out', help='안 주면 원본을 덮어쓴다')
    ap.add_argument('--strip', action='store_true',
                    help='텍스처를 GLB 에서 빼내 옆에 .rgba 로 따로 저장한다')
    ap.add_argument('--skin', type=int, default=256, help='빼낸 텍스처 한 변의 길이')
    a = ap.parse_args()

    src = Path(a.glb)
    dst = Path(a.out) if a.out else src
    js, bin_ = read_glb(src)
    bvs = js.get('bufferViews', [])
    images = js.get('images', [])
    if not images:
        sys.exit('텍스처가 없다')

    # 버퍼뷰를 통째로 다시 쌓는다. 이미지 크기가 바뀌면 뒤쪽 오프셋이 전부
    # 밀리니 부분 수정으로는 못 고친다.
    new_bin = bytearray()
    shrunk = {im['bufferView']: None for im in images if 'bufferView' in im}

    for i, im in enumerate(images):
        v = bvs[im['bufferView']]
        raw = bytes(bin_[v['byteOffset']:v['byteOffset'] + v['byteLength']])
        img = Image.open(io.BytesIO(raw))
        w, h = img.size
        if max(w, h) <= a.size:
            shrunk[im['bufferView']] = raw
            print(f'  이미지{i} {w}x{h} 그대로')
            continue
        s = a.size / max(w, h)
        small = img.convert('RGB').resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
        buf = io.BytesIO()
        small.save(buf, 'JPEG', quality=88, progressive=False)
        shrunk[im['bufferView']] = buf.getvalue()
        print(f'  이미지{i} {w}x{h} → {small.size[0]}x{small.size[1]}'
              f'  {len(raw) / 1e6:.1f}MB → {len(buf.getvalue()) / 1e6:.2f}MB')

    for k, v in enumerate(bvs):
        data = shrunk.get(k)
        if data is None:
            data = bytes(bin_[v['byteOffset']:v['byteOffset'] + v['byteLength']])
        v['byteOffset'] = len(new_bin)
        v['byteLength'] = len(data)
        new_bin += data
        new_bin += b'\0' * (-len(new_bin) % 4)   # 정점 데이터는 정렬이 어긋나면 깨진다

    js['buffers'] = [{'byteLength': len(new_bin)}]

    if a.strip:
        """
        RN 에서는 GLTFLoader 가 GLB 안의 그림을 못 읽는다. Blob 과 <img> 를
        쓰는데 둘 다 없다 (expo-three 의 폴리필은 8.0.0 기준 빈 함수다).
        그래서 베이스컬러만 옆에 파일로 빼 두고, 앱에서 따로 불러 붙인다.
        """
        base = 0
        for m in js.get('materials', []):
            t = m.get('pbrMetallicRoughness', {}).get('baseColorTexture')
            if t:
                base = js['textures'][t['index']]['source']
        v = bvs[js['images'][base]['bufferView']]
        img = Image.open(io.BytesIO(bytes(new_bin[v['byteOffset']:v['byteOffset'] + v['byteLength']])))
        img = img.convert('RGBA').resize((a.skin, a.skin), Image.LANCZOS)
        pixels = img.tobytes()
        print(f'  베이스컬러 → 날픽셀 {a.skin}x{a.skin} ({len(pixels) / 1e3:.0f}KB)')

        # 그림을 참조하는 것들을 전부 걷어낸다. 남겨 두면 로더가 찾다가 죽는다.
        # 대신 푼 픽셀을 버퍼 맨 뒤에 붙이고 어디 있는지 extras 에 적어 둔다.
        keep = {k for k, _ in enumerate(bvs)} - {im['bufferView'] for im in js['images']}
        remap = {}
        packed = bytearray()
        new_bvs = []
        for k in sorted(keep):
            v = bvs[k]
            data = bytes(new_bin[v['byteOffset']:v['byteOffset'] + v['byteLength']])
            remap[k] = len(new_bvs)
            v = dict(v, byteOffset=len(packed), byteLength=len(data))
            new_bvs.append(v)
            packed += data + b'\0' * (-len(data) % 4)
        for acc_ in js['accessors']:
            acc_['bufferView'] = remap[acc_['bufferView']]
        skin_bv = len(new_bvs)
        new_bvs.append({'buffer': 0, 'byteOffset': len(packed), 'byteLength': len(pixels)})
        packed += pixels + b'\0' * (-len(pixels) % 4)
        js['bufferViews'] = new_bvs
        js.setdefault('extras', {})['skin'] = {
            'bufferView': skin_bv, 'width': img.size[0], 'height': img.size[1],
        }
        js['buffers'] = [{'byteLength': len(packed)}]
        new_bin = packed
        js.pop('images', None)
        js.pop('textures', None)
        js.pop('samplers', None)
        for m in js.get('materials', []):
            m.pop('normalTexture', None)
            m.pop('occlusionTexture', None)
            m.pop('emissiveTexture', None)
            pbr = m.get('pbrMetallicRoughness', {})
            pbr.pop('baseColorTexture', None)
            pbr.pop('metallicRoughnessTexture', None)

    write_glb(dst, js, new_bin)
    print(f'{src.stat().st_size / 1e6:.1f}MB → {dst.stat().st_size / 1e6:.1f}MB  ({dst})')


if __name__ == '__main__':
    main()
