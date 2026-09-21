# 유닛 3D 만들기

```
제미나이로 원본 그림  →  meshy 에서 3D + 리깅 + 공격 모션  →  앱에 넣기
```

이 흐름 맞다. 다만 **meshy 는 PNG 를 안 준다 - GLB/FBX 가 나온다.** 마지막
칸이 거기서 끊기니 둘 중 하나를 골라야 한다.

| | 하는 일 | 장점 | 걸리는 것 |
| --- | --- | --- | --- |
| **A. GLB 를 그대로 앱에** | three 로 실시간 재생 | meshy 결과를 그대로 씀. **공격 모션이 공짜로 따라온다** | 판 위 20~30 마리가 Expo Go 에서 도는지 확인 필요 |
| **B. 프레임으로 굽기** | GLB → PNG 여러 장 | 지금 SVG 자리에 그대로 꽂힘. 가볍고 확실 | 블렌더가 필요하다 (이 맥에 아직 없다) |

한 마리로 A 를 먼저 재 보고 정하는 걸 권한다. 실시간 3D 는 이미 뚫어 놨고
(`src/ui/Board3D.tsx`, 60 FPS), A 가 되면 B 의 굽는 수고가 통째로 없어진다.

---

## 1단계 — 제미나이: meshy 에 넣을 원본

**이건 게임에 들어갈 그림이 아니다.** 3D 로 되돌릴 설계도라서 규격이 정반대다.

| | meshy 입력용 (지금 뽑을 것) | 왜 |
| --- | --- | --- |
| 시점 | **정면**. 옆모습·3/4 각 금지 | 실루엣이 제일 잘 보여야 형태를 복원한다 |
| 자세 | **A 포즈** (팔을 45도로 내림) 또는 T 포즈 | 다른 자세면 뼈가 엉뚱한 데 박힌다 |
| 조명 | **평평한 확산광.** 그림자 거의 없이 | 강한 그림자는 텍스처에 그대로 구워져 박힌다 |
| 배경 | 투명 또는 단색 | 배경이 지저분하면 같이 3D 로 만들어 버린다 |
| 크기 | 짧은 변 1024px 이상 | 이하는 뭉갠다 |
| 팔다리 | 몸에 붙이지 말고 띄울 것 | 붙으면 한 덩어리로 복원된다 |

프롬프트에 이걸 넣는다:

```
Full body, front view, standing straight in a relaxed A-pose with arms
lowered about 45 degrees away from the body, legs slightly apart, palms
facing inward. Flat even diffuse studio lighting, no cast shadows, no rim
light. Transparent background. Single character, centred, whole body inside
the frame, nothing cropped. No ground, no pedestal, no props held in front
of the body, no text, no watermark.
```

**한 마리에 4장 뽑아라** - 정면·뒤·좌·우. meshy 의 멀티뷰가 한 장보다 훨씬
정확하다. 네 장 다 같은 자세·같은 조명이어야 한다.

## 2단계 — meshy

1. **Image to 3D** (멀티뷰면 4장 전부 올린다)
2. **Auto Rigging** — 휴머노이드·4족 둘 다 되지만 **휴머노이드 쪽 애니메이션이
   압도적으로 많다**
3. **Animation** 에서 공격/대기 동작을 고른다
4. **GLB** 로 내려받는다 (FBX·USDZ 도 됨)

여기서 우리 쪽 결정이 하나 생긴다. **전부 두 발로 선 의인화로 그린다.**
생쥐 견습생·펭귄·부엉이·여우·늑대 기사·곰은 원래 그렇고, 두꺼비·코뿔소·거북도
세워서 그리면 된다. 우리 화풍이 이미 의인화라 어색하지 않고, 리깅과 동작
고르기가 훨씬 잘 붙는다.

두 발로 못 세우는 애들 - **뱀 술사·용의 후예·그리핀** - 은 자동 리깅이
어긋날 각오를 해야 한다. 이 셋은 공격 모션 없이 대기 자세 하나로 가거나
맨 뒤로 미룬다.

## 3단계 — 앱에 넣기

### A 로 간다 — GLB 실시간 (이 길로 갔다)

생쥐로 끝까지 뚫었다. 판 위에서 돌아간다.

**meshy 에서 받을 것**

모션 파일(`..._withSkin.glb`)에는 **본체·뼈대·텍스처가 전부 들어 있다.**
그래서 리깅 전 원본(Image-to-3D 의 Character)은 **안 받아도 된다** - 그건
197만 삼각형에 63MB 짜리라 쓸 데가 없다. 리깅을 돌리면 meshy 가 알아서
5천 삼각형으로 줄여 준다. Remesh 를 따로 할 필요도 없었다.

모션마다 한 파일이니 필요한 것만 받는다. 이름은 짧게 바꾼다.

```
assets/units/<id>/idle.glb      대기
assets/units/<id>/attack.glb    공격
assets/units/<id>/walk.glb      걷기
```

**누가 어떤 모션을 쓰는지 먼저 확인할 것.** 이름이 비슷해서 헷갈린다.

| 누구 | id 는 어디에 | 필요한 모션 | 왜 |
| --- | --- | --- | --- |
| 아바타 14종 | `src/game/avatars.ts` (`mochi`, `soot`, ...) | `idle` + `walk` | 로비에 서 있고, 판에서는 주인공이 되어 걸어 다닌다. **공격은 안 한다** |
| 유닛 15종 | `src/game/roster.ts` (`mouse`, `penguin`, ...) | `idle` + `attack` | 판에 배치돼 적을 친다. 제자리에 서 있으니 걷기는 필요 없다 |
| 적 5종 | `src/game/defense.ts` | `walk` | 달려와 들이받기만 한다 |

아바타 `mochi`(흰쥐 견습생)와 유닛 `mouse`(생쥐 견습생)는 **다른 캐릭터다.**
한쪽 모델을 다른 쪽에 물리면 안 된다.

- 폴더 이름은 **id 그대로**. 코드가 이 이름으로 찾는다
- 전부 **소문자**, 띄어쓰기·괄호·한글 없이
- **GLB 로 받는다.** FBX 는 텍스처가 딴 파일로 떨어져서 앱에서 못 찾는다

**넣기 전에 한 번 돌린다**

```
python3 tools/shrink-glb.py assets/units/mouse/walk.glb --strip
```

12.6MB → 0.8MB 가 된다. 안 돌리면 못 쓴다 - 크기 때문만이 아니라, RN 에는
GLB 안의 JPEG 을 풀 방법이 아예 없다. 이 도구가 미리 픽셀로 풀어서 버퍼
뒤에 붙여 둔다.

**RN 에서 걸렸던 것들** (`src/ui/Board3D.tsx` 에 다 적어 뒀다)

| 증상 | 원인 |
| --- | --- |
| `Cannot read property 'match' of undefined` | GLTFParser 가 `navigator.userAgent` 를 읽는데 RN 엔 없다 |
| 텍스처가 새까맣다 | GLTFLoader 도 expo-three 도 결국 `<img>` 를 찾는데 없다. 픽셀로 미리 풀어 둬야 한다 |
| `.rgba` 파일을 못 읽는다 | 낯선 확장자는 expo-asset 이 다루다 죽는다. GLB 안에 넣는다 |
| 유닛이 판 밖으로 걸어 나간다 | 걷기 모션에 루트 모션이 들어 있다. `Hips.position` 트랙을 뺀다 |
| 화면이 첫 프레임에서 얼어붙는다 | expo-gl 이 `endFrameEXP()` 만으로는 명령을 안 넘긴다. 매 프레임 `gl.getError()` 를 한 번 끼워야 한다 |
| 왼쪽으로 걷는데 오른쪽을 본다 | 좌우 뒤집기(`scaleX: -1`)는 평면 그림 방식이다. 정면을 보는 3D 모델은 몸이 그대로인 채 소품만 반대로 간다 - **Y축으로 돌려야** 한다 |

**GLView 는 판에 하나만 깐다.** 유닛마다 하나씩 만들면 GL 컨텍스트가 열여섯
개가 되어 못 버틴다. 유닛 둘에 주인공까지 올려도 60 FPS 가 나온다.

## 비율 보정

제미나이가 `PROPORTIONS` 없이 뽑으면 몸통이 길쭉한 '작은 사람'이 나온다.
이미 뽑아 버린 모델은 `src/ui/art/models.ts` 에서 뼈로 손볼 수 있다.

```ts
torso: 0.6,   // 척추 마디 간격 - 몸통을 6할로
head: 1.2,    // 머리 1.2배
```

**굵기는 안 된다.** 척추를 굵히면 자식인 머리까지 옆으로 늘어나 얼굴이
납작해지고, 아래 한 마디만 굵히면 실루엣이 거의 안 바뀐다 - 폭을 정하는 건
배가 아니라 모자와 귀다. (숫자로는 가로/세로가 0.866 대 0.865 로 딱 맞았는데
실제로는 짜부라진 모양이 나왔다. 숫자만 맞추면 안 되는 경우였다.)

몸이 홀쭉한 건 메시 자체의 형태라 **원본 그림부터 다시 뽑아야** 고쳐진다.
`PROPORTIONS` 를 넣고 뽑으면 이 손질이 아예 필요 없다.

### B 로 갈 때 (구운 PNG)
프레임을 뽑아 `assets/units/` 에 두고 `src/ui/art/renders.ts` 표에 한 줄
더한 뒤 **번들러를 껐다 켠다** (새 에셋은 재시작해야 잡힌다). 그러면
`artFor()` 가 SVG 대신 그걸 쓴다 - 코드는 더 안 건드려도 된다.

```
assets/units/<유닛 id>.png        평소 모습
assets/units/<유닛 id>-atk.png    때리는 순간
```

구울 때 지킬 규격 (**1단계와 다르다**):

| | |
| --- | --- |
| 형식 | PNG, 배경 투명 |
| 크기 | 정사각 512×512 |
| 각도 | 눈높이보다 살짝 위에서 본 3/4 각, **오른쪽을 보게**. 적은 코드가 뒤집는다 |
| 발 위치 | 발바닥이 아래에서 6% 쯤 띄운 자리. 그림자는 코드가 그린다 |
| 여백 | 좌우로 각 8% |

다섯 마리를 나란히 놓았을 때 키가 들쭉날쭉하면 안 된다. 같은 카메라, 같은
거리로 굽고 몸집 차이만 실제 크기로 둔다.

> 공격 그림은 `renders.ts` 에 자리는 있지만 **아직 전투에서 안 바꿔 낀다.**
> 유닛이 지금 안 움직이는 덕에 다시 그리지 않고 있어서 (60 FPS 를 거기서
> 벌었다) 손을 봐야 한다. 파일이 들어오면 그때 한다.

## 프롬프트 — 그대로 복붙한다

제미나이에 **`assets/avatar/mochi.png` 를 첨부**하고 아래를 붙인다. 첨부가
화풍의 기준이다 - 말로만 시키면 매번 다른 그림이 나와서 20마리가 한 세트로
안 보인다.

`CHARACTER` 줄만 갈아 끼우면 20마리가 전부 같은 규격으로 나온다. 나머지는
글자 하나 건드리지 않는다.

```
Reference image attached: match its art style exactly - same rendering, same
surface finish, same colour temperature, same level of stylisation.

CHARACTER - a small mouse apprentice wizard: bare white-lavender fur, no
clothing of any kind, a soft pointed violet wizard hat with a gold band, a
short wooden wand held in one hand, a long curling tail.

POSE - full body, front view, facing the camera straight on. Standing upright
in a wide A-pose. THE ARMS ARE THE MOST IMPORTANT PART: both arms are held
clearly OUT and AWAY from the body at about 45 degrees from vertical, elbows
straight, so that there is a large, obvious, empty triangle of transparent
background between each arm and the torso, from the armpit all the way down
to the hand. The hands are well clear of the body and of any clothing - they
must not touch, overlap, or rest against the robe, the hips, or the legs.
Palms face inward, fingers relaxed and separated.
Legs straight, feet apart by about one foot-width, with visible transparent
space between the legs. The knees, calves and feet must be fully visible and
unobstructed.
Head level, looking at the camera. Completely still and neutral - no action,
no motion, no dynamic angle, no twist in the torso. Any held prop hangs
straight down at the side, clear of the body, and never crosses in front.

FRAMING - single character, centred, the whole body inside the frame from the
top of the hat to the soles of the feet, nothing cropped, nothing cut off at
any edge. Leave a margin of empty space on all four sides. Square image,
1024x1024 or larger.

LIGHTING - flat even diffuse studio light from the front, like a softbox
directly behind the camera. No cast shadows, no shadow on the ground, no rim
light, no coloured light, no strong highlights. The whole body must be evenly
lit and clearly readable, including the underside of the arms and chin.

BACKGROUND - fully transparent. No ground, no floor, no pedestal, no base, no
scenery, no props other than what the character wears or holds.

PROPORTIONS - chibi, exactly like the attached reference. The head including
the ears is about 45% of the total height. The body is short, round and wide -
roughly as wide as it is tall - and the legs are very short stubs, no more
than a sixth of the total height. Do NOT lengthen the torso or the legs into
a more human figure. The silhouette should read as a ball with a big head on
top, not as a small person.

CLOTHING - none. The character is a bare animal: fur, feathers, scales or
skin, with nothing worn on the torso, arms or legs. No robe, no shirt, no
trousers, no coat, no cape, no cloth of any kind. Only the one or two items
named in CHARACTER above (a hat, a helm, a piece of armour, a held prop) are
present, and they never cover the arms or the legs.

STYLE - soft rounded stylised creature, physically based 3D render. Chunky
simplified forms, large head, small hands and feet. Matte painted surfaces -
cloth, worn leather, brushed metal. Rich but slightly muted colour: violet
grey, warm gold, deep blue shadow. No outline, no cel shading, no flat vector
look, no painterly brush strokes.

NOT ALLOWED - no text, no logo, no watermark, no signature, no border, no
frame, no colour swatches, no turnaround sheet, no multiple views, no second
character, no weapon raised, no clothing, no cape, no hair or cloth blowing.
```

### 왜 이렇게 까다로운가

| 줄 | 없으면 생기는 일 |
| --- | --- |
| A 포즈 · 팔을 몸에서 뗀다 | 팔이 몸통에 붙은 한 덩어리로 복원된다. 리깅이 안 붙는다. **겨드랑이 밑으로 배경이 뚫려 보여야 한다** - 안 뚫렸으면 다시 뽑는다 |
| 비율을 못 박는다 | 안 적으면 몸통이 길쭉한 '작은 사람'이 나온다. 게임 안에 넣으면 로비의 아바타와 딴 캐릭터로 보인다 |
| 옷을 안 입힌다 | 두 가지 이유다. 우리 캐릭터는 원래 맨몸이고(아래), 천이 팔다리를 덮으면 무릎·팔꿈치 뼈가 엉뚱한 데 박힌다 |
| 그림자 금지 | 그림자가 **텍스처에 그대로 구워져** 박힌다. 게임 안에서 지울 수 없다 |
| 정면 | 옆이나 3/4 각이면 안 보이는 쪽을 지어낸다 |
| 바닥·받침대 금지 | 받침대까지 3D 로 만들어 버린다 |
| 망토 펼침 금지 | 얇은 천은 복원이 제일 잘 깨지는 부분이다 |

### CHARACTER 줄 20개

`CHARACTER - ` 뒤에 이어 붙인다.

**아군**

| id | 이름 | 넣을 문장 |
| --- | --- | --- |
| `mouse` | 생쥐 견습생 · 일반 | bare white-lavender fur, no clothing, a soft pointed violet wizard hat with a gold band, a short wooden wand in one hand, a long curling tail |
| `penguin` | 펭귄 궁수 · 일반 | a penguin standing upright, natural blue-grey and cream plumage only, no clothing, a short recurve bow in one hand, a small quiver of arrows strapped across the back |
| `owl` | 부엉이 주술사 · 일반 | a tawny owl standing upright, bare feathers, no clothing, a tall pointed violet hat, a long wooden staff in one hand with a glowing teal crystal at the top |
| `toad` | 두꺼비 연금술사 · 일반 | a green toad standing upright on two legs, bare mottled skin, no clothing, round brass goggles pushed up onto the forehead, a corked glass flask of violet liquid in one hand |
| `rhino` | 코뿔소 수호병 · 일반 | a grey rhino standing upright on two legs, bare hide, no clothing, a plain steel helm, a large round steel shield with a gold boss held in one hand |
| `wolf` | 늑대 기사 · 희귀 | a dark grey wolf standing upright, bare fur, no clothing, wearing only a steel chest plate and a steel helm with the visor up - the arms and legs are completely bare - a straight longsword held in one hand |
| `fox` | 여우 마법사 · 희귀 | a red-orange fox standing upright with three bushy tails, bare fur, no clothing, a long wooden staff in one hand with a small flame burning at its tip |
| `crow` | 까마귀 정찰병 · 희귀 | a black crow with a blue sheen standing upright, bare feathers, no clothing, a single brown leather bracer on one forearm, a long bow held in one hand |
| `turtle` | 거북 결계사 · 희귀 | a green turtle standing upright on two legs, bare skin, no clothing, a thick domed shell on the back carved with glowing teal runes, a flat round stone disc held in one open palm |
| `bear` | 곰 대장군 · 영웅 | a brown bear standing upright, bare fur, no clothing, wearing only heavy steel shoulder pauldrons - the chest, arms and legs are bare - a two-handed war hammer held in one hand |
| `ghost` | 유령 사서 · 영웅 | a translucent pale blue ghost creature standing upright, a simple rounded body with two arms and two legs, hollow glowing eyes, no clothing, small round spectacles, an open book floating beside one shoulder |
| `serpent` | 뱀 술사 · 영웅 | a green and gold snake standing upright on two legs, bare scales, no clothing, a cobra hood behind the head, heavy gold rings around the neck, a short bone rod held in one hand |
| `griffin` | 그리핀 기사단장 · 전설 | a griffin standing upright on two legs, eagle head and forelimbs, lion hindquarters, bare feathers and fur, no clothing, wearing only a gold breastplate, wings folded flat and close against the back, a lance held upright in one hand |
| `wyrm` | 용의 후예 · 전설 | a small dragon standing upright on two hind legs, bare deep red scales, no clothing, short wings folded close against the back, small curved horns, a faint warm glow between the scales of the throat |
| `sage` | 별의 현자 · 신화 | a small pale creature standing upright, bare fur that glimmers with points of starlight, no clothing, a ring of small glowing stars orbiting above the head, both hands empty and lowered |

**적** — 이쪽은 공격 모션이 필요 없다 (달려와 들이받기만 한다).

| id | 이름 | 넣을 문장 |
| --- | --- | --- |
| `skeleton` | 해골 | a bare skeleton warrior standing upright, yellowed bone, no clothing, a notched short sword held in one hand |
| `ghost` | 유령 | a translucent pale blue wraith standing upright, a simple rounded body with two arms and two legs, hollow eyes, no clothing, the lower body fading out but the legs and feet still visible |
| `zombie` | 좀비 | an undead creature standing upright, bare grey-green skin, no clothing, one shoulder lower than the other, both arms hanging loose |
| `orc` | 오크 | an orc brute standing upright, bare green-grey skin, no clothing, heavy jaw with tusks, two crude leather straps crossing the chest, a large axe held in one hand |
| `lich` | 리치 | a bare skeleton standing upright, no clothing, a tall gold crown on the skull, cold blue flames in the eye sockets, skeletal hands empty |

**주인공** — 얘는 늘 화면 가운데 있으니 제일 공들여 뽑는다.

| id | 이름 | 넣을 문장 |
| --- | --- | --- |
| `hero` | 팔라독 (주인공) | a dog knight standing upright, bare cream and tan fur, no clothing, wearing only a steel helm with the visor up showing the face - the chest, arms and legs are bare - a mace held in one hand |

### 왜 옷을 안 입히나

`assets/avatar/mochi.png` 를 보면 모찌는 **맨몸에 모자와 지팡이뿐**이다.
`src/ui/art/characters.tsx` 의 유닛들도 전부 그렇다 - 생쥐는 검, 펭귄은 활,
부엉이는 지팡이, 코뿔소는 방패, 그것뿐이고 옷은 하나도 없다. 이게 우리
캐릭터 언어다. 옷을 입히면 혼자 다른 게임에서 온 것처럼 보인다.

리깅에도 이게 낫다. 천이 팔다리를 덮으면 뼈를 어디에 박을지 못 찾는다.
갑옷이 꼭 필요한 애(늑대 기사·곰 대장군·그리핀·주인공)도 **투구와 가슴판
까지만** 입히고 팔다리는 맨몸으로 둔다.

### 자세만 틀렸을 때

그림은 마음에 드는데 팔이 안 벌어졌다면 처음부터 다시 뽑지 말고, **그 그림을
첨부한 채로** 이어서 시킨다.

```
Same character, same outfit, same colours, same lighting, same transparent
background, same framing and scale as the attached image. Change ONLY the
pose, the proportions, and remove any clothing: raise both arms outward, away from the body, to about 45 degrees from
vertical, elbows straight, so there is a clear empty gap of transparent
background between each arm and the torso all the way from the armpit to the
hand. The hands must not touch the robe or the body. Remove all clothing -
bare fur only. Make the body much shorter and rounder, roughly as wide as it
is tall, with the head about 45% of the total height and very short stubby
legs. Feet apart with visible space between the legs.
```

### 여러 각도가 필요하면

meshy 는 정면 한 장으로도 되지만 **앞·뒤·좌·우 네 장**을 넣으면 훨씬
정확하다. 정면을 먼저 뽑고, **그 그림을 첨부한 채로** 이어서 시킨다.

```
Same character, same outfit, same colours, same A-pose, same flat lighting,
same transparent background, same framing and scale as the attached image.
Now show the character from directly behind.
```

`from directly behind` 자리에 `from the left side` / `from the right side`
를 넣어 세 장을 더 받는다. **한 장이라도 자세나 크기가 다르면 그 장은
빼는 게 낫다** - 어긋난 뷰를 넣으면 결과가 오히려 나빠진다.

## 확인할 것

제미나이 원본:
- 정면인가, A 포즈인가
- 그림자가 거의 없는가
- 배경이 정말 투명한가 (흰 배경으로 저장되는 실수가 잦다)
- 몸이 잘리지 않았나, 팔이 몸에 붙지 않았나

앱에 넣기 전:
- **34px 로 줄여도 뭔지 알아볼 수 있나.** 판 위에서는 이 크기로 보인다.
  자잘한 무늬는 다 뭉개지니 실루엣과 큰 색 덩어리로 승부한다 - 이게 제일 중요하다
