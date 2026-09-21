# 충전 묶음 그림 프롬프트

골드 충전 창에 뜨는 상품 그림 여섯 장.

지금은 같은 동전 아이콘 하나를 2~6개 복사해 겹쳐 두었다. 그래서 1,200원짜리와
49,000원짜리가 **개수만 다른 같은 것**으로 보인다. 묶음마다 모양 자체가 달라야
숫자를 읽기 전에 크기 차이가 먼저 보인다.

파일 이름 — `src/game/shop.ts` 의 `GOLD_PACKS` id 와 맞춘다.
```
assets/topup/p1.png ~ p6.png
```

## 지킬 것

**게임 그림처럼 보여야 한다.** 사진 같으면 안 된다 - 아래 `STYLE` 과 `MATCH`
블록이 그걸 막는다. 뽑은 그림을 흰쥐 아바타 옆에 놓아 보고, 둘이 같은 세계의
물건으로 보이는지부터 본다.

**여섯 장이 한 세트로 보여야 한다.** 이게 제일 중요하다. 따로 뽑으면 카메라
각도와 빛 방향이 제각각이 되어, 나란히 놓았을 때 여섯 개의 다른 게임에서
가져온 것처럼 보인다. 아래 `CAMERA` 와 `LIGHT` 블록은 여섯 장 모두에 **글자
하나 건드리지 말고** 넣는다.

**배경 없는 정사각 PNG.** 카드 안에 얹으니 배경이 있으면 못 쓴다.

**그림자를 그리지 마라.** 바닥 그림자가 들어오면 카드 안에서 떠 있는 것처럼
보인다. 필요하면 코드에서 깐다.

**다른 게임 이름을 쓰지 않는다.** 화풍은 이름 대신 재질·조명·렌더링으로 적는다
(`src/ui/theme.ts` 주석의 방침).

**우리 아바타를 레퍼런스 이미지로 같이 넣는다.**
`assets/avatar/mochi.png` (흰쥐)를 첨부하고 "match the material, lighting and
color of this reference" 를 덧붙인다.

처음에 이걸 안 넣고 `physically based lighting`, `polished gold with warm
reflections`, `no engraving` 만 적었더니 **핀테크 사이트에 쓸 스톡 3D 에셋**이
나왔다 - 누런 황동, 회색 그늘, 거울 같은 반사. 게임 그림 옆에 놓으니 혼자
다른 데서 온 것 같았다. 우리 자산을 기준 삼는 게 가장 확실하다.

## 공통 블록

여섯 프롬프트에 이미 들어 있다. 지우지 말 것.

```
CAMERA - straight-on three-quarter view from slightly above, as if the object
sits on a table just below eye level. The same angle for every image.

LIGHT - soft key light from the upper left, cool fill from the lower right,
gentle rim light along the top edge. The same lighting for every image.

STYLE - a chunky stylized game prop, not a product photograph. Thick, rounded,
slightly exaggerated proportions, like a well-made vinyl toy. Soft satin gold
that scatters light rather than mirroring it - no sharp specular highlights,
no environment reflections, no chrome. Shadows carry a violet tint, never grey.
Saturated warm gold, closer to honey than to brass. No cartoon outline, no cel
shading, no flat vector look.

MATCH - I am attaching a reference image from the same game. Match its
material, lighting and color exactly: soft plush-and-vinyl surfaces, warm key
light, cool violet shadow, gentle falloff.

FORMAT - 1:1 square, object centered, fully transparent background, nothing
cropped, generous empty margin around the object. No drop shadow, no ground
plane, no text, no numbers, no logos, no watermark.
```

---

# p1 — 6,000 골드 (1,200원)

```
3D rendered game item on a fully transparent background: a small handful of
gold coins, four or five of them, loosely stacked and leaning against each
other. Thick chunky coins with a fat rounded rim and a simple raised
six-pointed star on the face, like a token from a fantasy game.

CAMERA - straight-on three-quarter view from slightly above, as if the object
sits on a table just below eye level. The same angle for every image.

LIGHT - soft key light from the upper left, cool fill from the lower right,
gentle rim light along the top edge. The same lighting for every image.

STYLE - a chunky stylized game prop, not a product photograph. Thick, rounded,
slightly exaggerated proportions, like a well-made vinyl toy. Soft satin gold
that scatters light rather than mirroring it - no sharp specular highlights,
no environment reflections, no chrome. Shadows carry a violet tint, never grey.
Saturated warm gold, closer to honey than to brass. No cartoon outline, no cel
shading, no flat vector look.

MATCH - I am attaching a reference image from the same game. Match its
material, lighting and color exactly: soft plush-and-vinyl surfaces, warm key
light, cool violet shadow, gentle falloff.

FORMAT - 1:1 square, object centered, fully transparent background, nothing
cropped, generous empty margin around the object. No drop shadow, no ground
plane, no text, no numbers, no logos, no watermark.
```

# p2 — 13,000 골드 (2,500원)

p1 과 같되 첫 문단만 바꾼다.
```
... a small mound of gold coins, about fifteen of them, piled into a low heap
with a few coins slipping off the front.
```

# p3 — 27,000 골드 (5,000원)

```
... a small cloth pouch tied with a cord, tipped over with gold coins spilling
out of its mouth into a little pile. The pouch is deep violet cloth with a
gold drawstring.
```

# p4 — 58,000 골드 (10,000원)

```
... a large bulging sack of gold, its mouth open and overflowing, with coins
scattered around its base. The sack is deep violet cloth with gold stitching.
```

# p5 — 130,000 골드 (22,000원)

```
... an open wooden treasure chest with gold banding, filled to the brim with
gold coins that spill over the front edge. The chest lid is open and leaning
back.
```

# p6 — 300,000 골드 (49,000원)

```
... a large open treasure chest overflowing with gold coins, gold bars, and a
few violet gemstones, with more coins heaped around it. Bigger and richer than
the previous chest - this is the largest item in the set.
```

---

## 넣는 법

배경을 지우고(제미나이가 투명하게 안 주면 모서리 flood fill) 넣은 뒤,
`src/ui/TopUpScreen.tsx` 의 `PACK_ART` 에 한 줄씩 추가한다.

넣고 나면 **카드를 키워야 한다.** 지금 그림 자리는 세로 40pt 뿐이라 3D 렌더를
넣어도 디테일이 다 죽는다 - 그림이 들어오면 70pt 정도로 늘리고 카드 높이도
128 → 160 쯤으로 맞춘다.

---

# HUD 동전 — `assets/topup/coin.png`

재화 알약(`CoinPill`)과 충전 창 제목 옆에 쓰는 **동전 한 닢**.

지금은 `src/ui/art/icons.tsx` 의 `CoinIcon` (SVG 원판)을 쓴다. 충전 묶음
그림을 넣고 나니 같은 재화인데 둘이 다른 물건으로 보여서, 한 닢짜리를 따로
뽑아 맞춘다.

**19px 에서 버텨야 한다.** 3D 렌더는 작게 줄이면 뭉개지기 쉽다. 그래서
p1~p6 과 달리 **정면에 가깝게, 무늬는 별 하나만** 남긴다 - 비스듬히 눕히거나
디테일을 넣으면 작은 크기에서 죽는다. 넣어 보고 안 읽히면 SVG 로 되돌린다.

```
3D rendered game item on a fully transparent background: a single thick gold
coin seen almost face-on, tilted only very slightly. A fat rounded rim and one
simple raised six-pointed star filling the face. Nothing else on the coin - no
border pattern, no text, no numbers.

LIGHT - soft key light from the upper left, cool fill from the lower right,
gentle rim light along the top edge. The same lighting as the other coin
images in this set.

STYLE - a chunky stylized game prop, not a product photograph. Thick, rounded,
slightly exaggerated proportions, like a well-made vinyl toy. Soft satin gold
that scatters light rather than mirroring it - no sharp specular highlights,
no environment reflections, no chrome. Shadows carry a violet tint, never grey.
Saturated warm gold, closer to honey than to brass. No cartoon outline, no cel
shading, no flat vector look.

MATCH - I am attaching a reference image from the same game. Match its
material, lighting and color exactly.

READABILITY - this will be shown very small, about 20 pixels wide. Keep the
silhouette a clean circle and the star large and bold, so it still reads at
that size.

FORMAT - 1:1 square, object centered, fully transparent background, nothing
cropped, generous empty margin around the object. No drop shadow, no ground
plane, no text, no numbers, no logos, no watermark.
```

> 레퍼런스로는 **흰쥐 대신 `assets/topup/p1.png`** 을 첨부한다 - 이미 만든
> 동전과 같은 재질·같은 별이어야 하기 때문이다.
