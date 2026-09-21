#!/usr/bin/env python3
"""유닛 그림의 빈 여백을 잘라낸다.

제미나이가 주는 그림은 캐릭터 둘레에 투명한 여백이 제각각 남는다. 그대로 쓰면
판에서 어떤 유닛은 크고 어떤 유닛은 작아 보인다 - 그림 속 캐릭터 크기가 달라서다.
알파가 있는 데까지 바짝 잘라 두면 코드가 한 가지 크기로 그려도 다 같아 보인다.

  python3 tools/trim-units.py              # assets/units/*.png 전부
  python3 tools/trim-units.py penguin      # 하나만

원본은 `assets/units/raw/` 로 옮겨 둔다 - 잘못 잘랐을 때 되돌릴 데가 있어야 한다.
"""

import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS = os.path.join(ROOT, 'assets/units')
RAW = os.path.join(UNITS, 'raw')


def trim(path: str) -> str:
    img = Image.open(path).convert('RGBA')
    box = img.getbbox()
    if not box:
        return f'{os.path.basename(path)}: 비어 있다'
    w, h = img.size
    cut = img.crop(box)
    os.makedirs(RAW, exist_ok=True)
    keep = os.path.join(RAW, os.path.basename(path))
    if not os.path.exists(keep):
        img.save(keep)
    cut.save(path)
    return (
        f'{os.path.basename(path)}: {w}x{h} -> {cut.width}x{cut.height} '
        f'(여백 위 {box[1]} 아래 {h - box[3]} 좌 {box[0]} 우 {w - box[2]})'
    )


def main() -> int:
    names = sys.argv[1:]
    files = (
        [os.path.join(UNITS, f'{n}.png') for n in names]
        if names
        else [os.path.join(UNITS, f) for f in sorted(os.listdir(UNITS)) if f.endswith('.png')]
    )
    for f in files:
        if not os.path.exists(f):
            print(f'{f}: 없다')
            continue
        print(trim(f))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
