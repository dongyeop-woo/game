#!/usr/bin/env python3
"""낱장으로 온 동작 그림을 스프라이트 시트 한 장으로 굽는다.

CraftPix 고양이 디펜스 키트는 동작마다 PNG 를 낱장으로 준다 (대기 20장,
사격 10장, 한 장이 150×150). 그대로 쓰면 파일이 3천 개고 판에서 넘길 수도 없다.
`src/ui/art/sprite.tsx` 가 읽는 격자 시트로 바꿔 둔다.

굽는 규칙이 셋이다.

  1. **한 유닛의 모든 장을 같은 자리로 잘라낸다.** 장마다 여백이 달라서
     따로 자르면 넘길 때 캐릭터가 덜덜 떤다.
  2. **키를 기준으로 맞춘다.** 총이 옆으로 길게 나온 고양이는 가로가 더
     넓은데, 가로에 맞추면 그 유닛만 작아 보인다.
  3. **장수를 동작마다 같게 만든다.** 읽는 쪽이 한 동작당 장수를 하나로
     본다. 20장과 10장을 똑같이 12장으로 솎거나 늘린다.

  python3 tools/bake-kit.py --src <키트>/Png/Characters --out assets/units/kit \
      --motions Idle:12,Shoot:12 --cell 96 --cols 6
"""

import argparse
import os
import re
import sys

from PIL import Image


def frames(folder):
    """폴더 안 PNG 를 이름 차례로"""
    return [os.path.join(folder, f) for f in sorted(os.listdir(folder)) if f.lower().endswith('.png')]


def pick(paths, n):
    """장수를 n 개로 맞춘다. 많으면 솎고 모자라면 늘린다"""
    if not paths:
        return []
    return [paths[min(len(paths) - 1, round(i * len(paths) / n))] for i in range(n)]


def union(boxes):
    xs = [b for b in boxes if b]
    if not xs:
        return None
    return (min(b[0] for b in xs), min(b[1] for b in xs),
            max(b[2] for b in xs), max(b[3] for b in xs))


def bake(unit_dir, motions, cell, cols, out):
    picked = {}
    for name, n in motions:
        d = os.path.join(unit_dir, name)
        if not os.path.isdir(d):
            print(f'  없는 동작: {name}')
            return False
        picked[name] = pick(frames(d), n)

    # 모든 장을 한 자리로 잘라야 넘길 때 안 떤다
    box = union([Image.open(p).convert('RGBA').getbbox()
                 for ps in picked.values() for p in ps])
    if not box:
        return False
    w, h = box[2] - box[0], box[3] - box[1]
    # 키로 맞춘다. 가로가 넘치면 그때만 가로에 맞춘다
    k = min(cell * 0.86 / h, (cell - 4) / w)
    tw, th = max(1, round(w * k)), max(1, round(h * k))

    rows_per = -(-max(n for _, n in motions) // cols)
    sheet = Image.new('RGBA', (cell * cols, cell * rows_per * len(motions)), (0, 0, 0, 0))
    for row, (name, n) in enumerate(motions):
        for i, p in enumerate(picked[name]):
            im = Image.open(p).convert('RGBA').crop(box).resize((tw, th), Image.LANCZOS)
            gx = (i % cols) * cell + (cell - tw) // 2
            gy = (row * rows_per + i // cols) * cell + (cell - th) - 2  # 발밑을 칸 아래에
            sheet.alpha_composite(im, (gx, gy))
    sheet.save(out)
    return True


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--src', required=True, help='유닛 폴더들이 든 곳')
    p.add_argument('--out', required=True, help='시트를 넣을 곳')
    p.add_argument('--motions', default='Idle:12,Shoot:12', help='동작:장수 를 쉼표로')
    p.add_argument('--cell', type=int, default=96)
    p.add_argument('--cols', type=int, default=6)
    p.add_argument('--only', help='이 이름이 든 폴더만')
    a = p.parse_args()

    motions = [(m.split(':')[0], int(m.split(':')[1])) for m in a.motions.split(',')]
    os.makedirs(a.out, exist_ok=True)
    units = sorted(d for d in os.listdir(a.src) if os.path.isdir(os.path.join(a.src, d)))
    if a.only:
        units = [d for d in units if a.only in d]
    # C2 가 C10 보다 먼저 오게 - 이름의 숫자로 센다
    units.sort(key=lambda s: [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', s)])

    done = 0
    for u in units:
        out = os.path.join(a.out, u.replace(' ', '') + '.png')
        if bake(os.path.join(a.src, u), motions, a.cell, a.cols, out):
            kb = os.path.getsize(out) // 1024
            print(f'{u:16s} -> {os.path.basename(out):20s} {kb}KB')
            done += 1
    print(f'{done}/{len(units)} 마리')
    return 0 if done else 1


if __name__ == '__main__':
    sys.exit(main())
