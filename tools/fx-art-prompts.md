# 공격 이펙트 그림

코드로 그린 도형(원·막대·고리)으로는 예쁘기 어렵다. 그림을 깔면 단번에
좋아진다. 다만 **어떻게 뽑느냐**가 중요하다.

## 연속 동작(스프라이트 시트)은 뽑지 않는다

"터지는 8프레임"을 한 장에 그려 달라고 하면 프레임마다 모양이 미묘하게
달라져서, 이어 붙이면 덜컹거린다. 이미지 생성기가 제일 못하는 일이다.

**정지 그림 한 장씩 뽑고 움직임은 코드가 준다.** 지금도 코드가 크기·투명도·
회전을 매 프레임 밀고 있으니(`src/ui/art/attacks.tsx`), 도형 자리에 그림을
끼우기만 하면 된다. 2D 게임에서 흔히 쓰는 방식이고 결과도 더 깨끗하다.

## 흰색으로 뽑는다 — 색은 코드가 입힌다

**이게 제일 중요하다.** 그림을 색깔로 뽑으면 유닛 수만큼 그림이 필요하다
(불티만 15장). 흰색·회색으로 뽑아 두면 `tintColor` 한 줄로 유닛마다 다른
색을 입힌다 - **그림 한 장이 열다섯 벌이 된다.**

```
색이 필요 없다. 밝기만 있으면 된다.
  가운데가 제일 밝고(순백) 가장자리로 갈수록 투명해지게.
```

## 규격

| | |
| --- | --- |
| 형식 | PNG, 배경 **완전 투명** |
| 크기 | 정사각 512×512 |
| 색 | **흰색~회색만.** 색조가 섞이면 tint 가 탁해진다 |
| 자리 | 한가운데. 코드가 중심을 기준으로 키우고 돌린다 |
| 여백 | 가장자리에 닿지 않게 5% 정도 |

## 두 갈래다 - 날아가는 것과 맞는 순간

섞어서 적었다가 고친다. 둘은 규격이 다르다.

| | 날아가는 스킬 | 맞는 순간 |
| --- | --- | --- |
| 무엇 | 불덩이, 화살, 광선, 숨결 | 터짐, 고리, 불티 |
| 방향 | **있다.** 오른쪽(→)을 향해 그린다 | 없다. 사방으로 퍼진다 |
| 그림 비율 | 가로로 길다 | 정사각 |
| 코드가 하는 일 | 쏜 쪽에서 맞는 쪽으로 **돌리고 늘인다** | 제자리에서 키우고 지운다 |

**방향이 있는 것은 반드시 오른쪽을 향하게 그린다.** 코드는 각도만 돌리지
그림을 뒤집지 않는다. 위나 왼쪽을 향한 그림이 들어오면 전부 엉뚱한 데를 본다.

---

## 1. 날아가는 스킬 (5장) — 이게 먼저다

판에서 제일 오래 보이는 건 날아가는 동안이다. 여기가 예뻐야 한다.

```
A single game VFX sprite on a fully transparent background, drawn in a wide
horizontal frame and travelling to the RIGHT.

SHAPE - <아래 표의 문장>

DIRECTION - the effect points to the right. Its leading edge (the head, the
tip, the brightest end) is at the RIGHT side of the frame and the tail or
origin is at the LEFT. It must read clearly as moving rightward.

STYLE - clean stylised game effect art, soft glowing edges, energetic but
readable at small size. Pure white and light grey only, no colour tint at
all - the brightness carries the shape. Brightest at the core, fading to
fully transparent at the edges. No outline, no background, no ground, no
character, no text, no watermark, no frame.
```

| 파일 | 크기 | 쓰는 곳 | SHAPE 문장 |
| --- | --- | --- | --- |
| `fireball.png` | 512×256 | 두꺼비·여우의 구슬 | a comet-like energy ball: a dense round head at the right with a turbulent tapering tail streaming behind it to the left |
| `arrow.png` | 512×128 | 펭귄·까마귀의 화살 | a sleek arrow with a sharp head at the right, a thin shaft, and a soft motion streak trailing to the left |
| `beam.png` | 1024×192 | 유령·그리핀의 광선 | a straight beam of light running left to right, a hot thin core with a soft wide halo around it, **even along its whole length** so it can be stretched without looking wrong, ending in a brighter flare at the right |
| `breath.png` | 768×512 | 뱀의 독, 용의 숨결 | a cone of spray blowing to the right: narrow at the left where it leaves the mouth, widening and breaking into turbulent wisps at the right |
| `comet.png` | 512×512 | 별의 현자가 내리꽂는 별 | a star plunging diagonally down-right, a bright four-pointed star head with a long tapering trail behind it up-left |

**광선은 늘어난다.** 유닛과 적 사이 거리에 맞춰 가로로 늘이니, 가운데가
고르지 않으면(마디가 있거나 점점 굵어지면) 늘렸을 때 티가 난다. 양 끝만
다르고 가운데는 한결같아야 한다.

---

## 2. 맞는 순간 (4장)

```
A single game VFX sprite on a fully transparent background, centred in a
square frame.

SHAPE - <아래 표의 문장>

STYLE - (위와 같다)
```

| 파일 | 크기 | 쓰는 곳 | SHAPE 문장 |
| --- | --- | --- | --- |
| `burst.png` | 512×512 | 모든 공격이 닿는 순간 | a radial burst of light - a bright core with sharp uneven rays shooting outward, like a spark of impact |
| `ring.png` | 512×512 | 퍼지는 고리, 조이는 결계 | a thin glowing ring, brightest on the ring line itself, hollow and fully transparent in the middle |
| `slash.png` | 512×512 | 근접 베기 | a crescent slash arc, thick at the middle and tapering to sharp points at both ends |
| `spark.png` | 256×256 | 흩어지는 불티 | a small four-pointed sparkle, long vertical and horizontal rays crossing at a bright centre |

## 넣는 법

`assets/fx/` 에 두고 알려 달라. `attacks.tsx` 의 도형을 그림으로 갈아 끼운다 -
유닛별 색은 지금 쓰는 `ATTACK` 표의 색을 그대로 `tintColor` 로 넘긴다.

파일을 새로 넣었으면 **번들러를 껐다 켜야** 보인다.
