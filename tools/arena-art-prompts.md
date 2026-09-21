# 경기장 그림 프롬프트

전투 화면의 경기장이다. 모든 모드가 같은 경기장을 쓴다 (모드는 스테이지를
고를 뿐이고, 그림은 스테이지를 따라간다).

## 한 장에 전부 그린다 — 배경 · 길 · 바닥

전에는 셋을 따로 만들었다. 배경은 그림, 적이 걷는 길은 코드가 그린 반투명
띠, 유닛이 서는 바닥은 또 다른 그림. **세 개가 서로 안 맞아서** 판이 배경
위에 얹힌 사각형으로 보였다.

이제 한 장에 다 그린다. 코드는 판을 **아예 안 그린다** - 그림에 그려진 판이
계산된 판 자리에 정확히 앉도록 그림을 앉히기만 한다. 그러면 적은 그려진 길
위를 걷고 유닛은 그려진 마당 안에 선다.

### 비율은 글로 설명하지 말고 가이드 그림을 넣는다

비율을 문장으로 적으면 잘 안 맞는다. 그림으로 주면 맞는다.

```
python3 tools/make-arena-guide.py
```

`tools/arena-guide.png` 가 나온다 - 색 덩어리만 있는 구도 가이드다.
**이 그림을 제미나이에 같이 첨부하고** 프롬프트의 `LAYOUT` 문단이 그걸
가리키게 한다. 그러면 판이 늘 같은 자리에 같은 크기로 온다.

가이드가 말하는 것:

| 색 | 뜻 | 그려야 할 것 |
| --- | --- | --- |
| 위쪽 남색 | 먼 곳 | 성문·나무·달·하늘. 이야기를 여기서 한다 |
| 가운데 큰 사각형의 **바깥 띠** | 적이 걷는 길 | 네 변을 두르는 **닫힌 고리** 포장길 |
| 그 **안쪽 사각형** | 유닛이 서는 마당 | 평평한 바닥. **아무것도 세우지 마라** |
| 아래쪽 검정 | 앞쪽 그늘 | 어둡게. UI 가 여기 얹힌다 |

지킬 것 세 가지:

1. **길은 고리다.** 한 변만 있거나 끊기면 다시 뽑아야 한다.
2. **마당은 완전히 비운다.** 기둥·조각상·불꽃 전부 안 된다. 유닛이 그 위에 선다.
   바닥 무늬(포석)는 괜찮다.
3. **마당에 격자나 발판을 그리지 마라.** 유닛 위치는 코드가 계산한다 - 그려진
   칸과 계산된 위치가 어긋나 두 겹으로 보인다.

가이드를 지켜서 나오면 값도 거의 그대로다. s1 은 가이드가 `cy: 0.48` 이었고
실제로는 0.52 였다 - 이 정도 차이는 눈금(`/tmp/ruler` 같은 격자)을 그려
읽으면 바로 나온다.

판이 그림보다 위/아래로 밀려 보이면 `cy` 만 만지면 된다. 크게 밀려 있다면
그림 탓이 아니라 코드 탓일 수 있으니 `ArenaBackdrop` 의 `inset` 부터 의심할
것 - 앱 루트가 노치만큼 아래에서 시작하는 걸 안 빼면 딱 그만큼 밀린다.

파일 이름
```
assets/arena/<스테이지 id>.jpg   (s1 ~ s5)
```

## 제미나이에 넣는 것

| | 무엇 | 왜 |
| --- | --- | --- |
| 첨부 1 | `tools/arena-guide.png` | 판이 어디에 얼마만 하게 올지 |
| 첨부 2 | `assets/background.jpg` | 우리 학교의 돌·아치·색 |
| 본문 | 아래 프롬프트 | 무엇을 그릴지 |

## 두 가지 규칙

**1. 프롬프트에 다른 게임 이름을 쓰지 않는다.**
이 프로젝트는 처음부터 특정 작품의 이름·문장·색을 안 쓰기로 했다
(`src/ui/theme.ts` 주석). 화풍은 이름 대신 **만드는 방법**으로 적는다 -
어떤 재질, 어떤 조명, 어떤 렌더링인지. 이름을 지워도 결과는 같다.

**2. 우리 배경을 레퍼런스 이미지로 같이 넣는다.**
`assets/background.jpg` (로비의 마법 학교 홀)를 첨부하고 "match the
architecture, stone, and color of this image" 를 덧붙인다. 말로만 시키면
어디서 본 듯한 회색 성이 나온다 - 경기장은 **이 학교의 마당**이어야지 아무
판타지 성이 아니다. 우리 자산을 기준 삼는 게 가장 확실하고, 남의 것을
참조하지 않으니 뒤탈도 없다.

---

## 공통 구도

다섯 장 모두 같다. **세로 9:19.5** (요즘 폰 비율).

```
 0% ┌──────────────┐
    │   먼 곳·하늘  │  ← 이야기를 여기서 한다
28% ├──────────────┤
    │  ▓▓▓▓▓▓▓▓▓▓  │
    │  ▓ 경기장 ▓  │  ← 정사각형. 화면 폭을 거의 다 채운다.
    │  ▓▓▓▓▓▓▓▓▓▓  │     위 그림의 20/60/20 비율을 지킨다.
72% ├──────────────┤
    │  앞쪽 그늘    │  ← 아래 UI 가 여기 얹힌다. 어두워야 글씨가 읽힌다.
100%└──────────────┘
```

- **아래 28% 는 어둡게.** 성문 게이지·유닛 트레이·조합 버튼이 그 위에 얹힌다.
- 위아래 가장자리에 **단색 띠가 생기면 다시 뽑는다.**

---

# s1 무너진 성문 — `s1.jpg`

```
Painted 3D-rendered game BACKGROUND, 9:19.5 tall portrait, full-bleed scene.
The broken outer gate of a wizarding school at night, seen from above and
slightly in front, looking down onto the duelling ground in the courtyard.

LAYOUT - I am attaching a flat colour layout guide. Follow its geometry
exactly. Every shape must stay at the same position and the same size:
  - The dark blue area at the top is far distance: the broken gate and its
    towers rising into the night, tall narrow arches, gold lantern light
    spilling through the breach, a low moon, cold stars, distant pine woods.
  - The big rounded square in the middle is a duelling ground seen from above.
    Its OUTER BAND (the ring between the two outlines in the guide) is a paved
    walkway that runs as a CLOSED LOOP around all four sides, like a running
    track - worn flagstones, slightly darker and lower.
    Its INNER SQUARE is a raised platform of plain flagstone, one low stone
    kerb higher than the walkway. This platform is COMPLETELY EMPTY - no
    pillars, no statues, no braziers, no rubble, no creatures, no painted
    circle, no grid, no squares marked out, no inlay of any kind. Just worn
    stone, evenly lit. It is the calmest area of the whole image.
  - The black area at the bottom is the near edge of the courtyard in deep
    shadow - a few fallen blocks and weeds, much darker than the rest so pale
    text can sit on top of it.
Keep the square reading as a true square seen from above, not in strong
perspective.

WORLD - this is a wizarding school, not a generic fortress. Same stone and
same palette as the reference image: violet-cast stonework, tall narrow
arches, warm gold lantern light, a deep blue-violet night sky. Attach
`assets/background.jpg` as a style reference and match its architecture,
stone and color.

STYLE - soft, rounded shapes rendered in 3D with physically based lighting.
Soft studio lighting, gentle rim light, soft ambient occlusion. Rich but
slightly muted color, deep shadows. No cartoon outline, no cel shading, no
flat vector look.

COLOR - deep blue-violet night, violet-grey stone, warm gold lantern light,
dark green pines.

No characters, no creatures, no people. No text, no logos, no UI, no
letterboxing, no solid bars at the top or bottom edge, no watermark, no border.
```

---

# s2 ~ s5

s1 프롬프트에서 **장소와 색만** 바꾼다. `THE ARENA` 와 `STYLE` 블록은 글자
하나 건드리지 않는다 - 다섯 장의 판이 같은 비율이어야 코드가 같은 방식으로
앉힐 수 있다.

## s2 안개 늪지
```
... A misty swamp at night ...
 - TOP 30%: dead bare trees standing in low fog, faint will-o-wisps, a pale
   moon smeared by the mist.
 - MIDDLE 40%: a wide flat EMPTY boardwalk-stone platform, same rules as above.
 - BOTTOM 30%: black still water and reeds in the near shadow.
COLOR - desaturated blue-grey, sickly teal fog, faint green wisp light.
```

## s3 검은 언덕
```
... A dark hillside of standing stones at night ...
 - TOP 30%: broken stone pillars along the ridge against a violet sky.
 - BOTTOM 30%: dark grass and scattered rubble in the near shadow.
COLOR - deep violet and plum, cold grey stone.
```

## s4 리치의 제단
```
... A frozen altar hall, roofless, open to the night sky ...
 - TOP 30%: ice spikes and a cracked altar arch, cold blue glow behind them.
 - BOTTOM 30%: frost-covered flagstones in the near shadow.
COLOR - steel blue and pale cyan, almost no warm color.
```

## s5 왕좌의 문
```
... A great throne gate, the last door, at night ...
 - TOP 30%: an enormous ornate door half open, hot red light leaking out,
   ruined columns either side.
 - BOTTOM 30%: cracked red-lit flagstones in the near shadow.
COLOR - deep maroon and black, burning orange light from the doorway.
```

---

## 넣는 법

```
python3 tools/measure-arena.py assets/arena/s1.jpg
```
그려진 판을 찾아 `ARENA_BG` 에 넣을 줄을 찍어 준다. 그대로 복붙하면 된다.

자동으로 못 찾으면 (경고가 뜬다) 그림을 열어 판의 네 귀퉁이 픽셀을 읽고
직접 넣는다:
```
python3 tools/measure-arena.py assets/arena/s1.jpg --box 60 1100 1146 2186
```
