"""경기장 그림에서 '그려진 판'을 찾아, arena.tsx 에 넣을 값을 찍는다.

    python3 tools/measure-arena.py assets/arena/s1.jpg

그림을 화면에 맞추는 게 아니라, **그려진 판을 계산된 판 자리에 맞춰** 그림을
앉힌다. 그래야 적이 그려진 길 위를 걷고 유닛이 그려진 마당 안에 선다.
그러려면 그림 안에서 판이 어디에 얼마만 하게 있는지를 숫자로 알아야 한다.

찾는 방법: 판은 주변보다 밝고 평평하다. 세로/가로로 훑어 '평평한 구간'의
경계를 판의 테두리로 본다. 자동으로 못 찾으면 --box 로 직접 넣는다.
"""

import argparse

import numpy as np
from PIL import Image


def flat_span(rough: np.ndarray, pct: float = 45.0) -> tuple[int, int]:
    """가장 긴 '평평한' 연속 구간을 돌려준다."""
    flat = rough < np.percentile(rough, pct)
    best_len = best_start = cur_len = cur_start = 0
    for i, ok in enumerate(flat):
        if ok:
            if cur_len == 0:
                cur_start = i
            cur_len += 1
            if cur_len > best_len:
                best_len, best_start = cur_len, cur_start
        else:
            cur_len = 0
    return best_start, best_start + best_len


def measure(path: str, box: tuple[int, int, int, int] | None):
    im = Image.open(path).convert('RGB')
    W, H = im.size
    a = np.asarray(im).astype(np.float32)

    if box:
        x0, y0, x1, y1 = box
    else:
        y0, y1 = flat_span(a.std(axis=1).mean(axis=1))
        band = a[y0:y1]
        x0, x1 = flat_span(band.std(axis=0).mean(axis=1))

    # 판은 정사각형이다. 가로세로가 다르면 짧은 쪽에 맞춘다.
    size = min(x1 - x0, y1 - y0)
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2

    print(f'{path}  {W}x{H}')
    print(f'  찾은 판  x {x0}~{x1}   y {y0}~{y1}   (한 변 {size}px)')
    if abs((x1 - x0) - (y1 - y0)) > size * 0.12:
        print('  ! 가로세로 차이가 큽니다. 눈으로 보고 --box x0 y0 x1 y1 로 넣으세요.')
    print()
    name = path.split('/')[-1].split('.')[0]
    print('  arena.tsx 의 ARENA_BG 에 이렇게 넣는다:')
    print(f'    {name}: {{')
    print(f"      art: require('../../../{path}'),")
    print(f'      board: {{ cx: {cx / W:.4f}, cy: {cy / H:.4f}, size: {size / W:.4f} }},')
    print('    },')
    print()
    print('  그림이 맞춰야 할 비율 (판 한 변 기준):')
    print('    바깥 20% = 적이 걷는 길   ·   안쪽 60% = 유닛이 서는 마당')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('files', nargs='+')
    ap.add_argument('--box', nargs=4, type=int, metavar=('X0', 'Y0', 'X1', 'Y1'),
                    help='판 사각형을 직접 지정 (자동 검출이 틀릴 때)')
    args = ap.parse_args()
    for f in args.files:
        measure(f, tuple(args.box) if args.box else None)
