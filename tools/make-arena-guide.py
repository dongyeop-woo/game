"""제미나이에 같이 넣을 '판 자리 가이드' 이미지를 만든다.

    python3 tools/make-arena-guide.py

비율을 글로 설명하면 잘 안 맞는다. 그림으로 주면 맞는다 - 색 덩어리만 있는
가이드를 첨부하고 "이 구도를 그대로 지켜라"라고 시키면 판이 늘 같은 자리에
같은 크기로 온다.

여기서 쓰는 숫자는 게임 코드와 같은 값이다(`src/game/defense.ts`,
`src/ui/DefenseScreen.tsx`). 코드가 바뀌면 이 파일 위쪽 상수도 같이 고친다.
"""

from PIL import Image, ImageDraw

# --- 게임 코드와 맞춘 값 ---------------------------------------------------
COLS = 3          # 마당의 칸 수
TRACK_MARGIN = 0.5
ROAD = 1.0
SPAN = COLS + TRACK_MARGIN * 2 + ROAD   # 판 한 변 = 5칸

# --- 그림 규격 -------------------------------------------------------------
W, H = 1206, 2613                 # 9:19.5 세로
BOARD_SIZE = round(W * 0.95)      # 판은 화면 폭을 거의 다 채운다
BOARD_CX, BOARD_CY = 0.5, 0.48    # 판 가운데 (그림 폭/높이 기준)

SKY = (27, 36, 80)
GROUND = (58, 53, 96)
RING = (74, 68, 112)              # 적이 걷는 길
YARD = (106, 100, 148)            # 유닛이 서는 마당
FORE = (20, 16, 44)               # 앞쪽 그늘
EDGE = (16, 12, 34)


def main(out: str = 'tools/arena-guide.png'):
    cx, cy = W * BOARD_CX, H * BOARD_CY
    half = BOARD_SIZE / 2
    x0, y0, x1, y1 = cx - half, cy - half, cx + half, cy + half
    road = BOARD_SIZE * (ROAD / SPAN)      # 길 띠 폭 = 판의 20%
    r = BOARD_SIZE * 0.09                  # 모서리 둥글기

    im = Image.new('RGB', (W, H), GROUND)
    d = ImageDraw.Draw(im)

    d.rectangle([0, 0, W, y0], fill=SKY)             # 위 - 장면
    d.rectangle([0, y1, W, H], fill=FORE)            # 아래 - 그늘

    # 판: 바깥 고리(길) + 안쪽 마당
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=RING, outline=EDGE, width=5)
    d.rounded_rectangle(
        [x0 + road, y0 + road, x1 - road, y1 - road],
        radius=max(2, r - road),
        fill=YARD,
        outline=EDGE,
        width=5,
    )

    im.save(out)
    print(f'{out}  {W}x{H}')
    print(f'  판       한 변 {BOARD_SIZE}px   x {x0:.0f}~{x1:.0f}   y {y0:.0f}~{y1:.0f}')
    print(f'  길 띠    {road:.0f}px  (판의 {ROAD / SPAN:.0%})')
    print(f'  마당     {BOARD_SIZE - road * 2:.0f}px  (판의 {COLS / SPAN:.0%})')
    print()
    print('  뽑은 뒤 arena.tsx 의 ARENA_BG 에 넣을 값 (출발점):')
    print('    s1: {')
    print("      art: require('../../../assets/arena/s1.jpg'),")
    print(f'      board: {{ cx: {BOARD_CX}, cy: {BOARD_CY}, size: {BOARD_SIZE / W:.4f} }},')
    print('    },')
    print()
    print('  * 가이드를 지켜서 나오면 값도 거의 그대로다 (s1 은 cy 0.48 -> 0.52).')
    print('    앱에 띄워 보고 판이 그림보다 위에 있으면 cy 를 키우면 된다.')


if __name__ == '__main__':
    main()
