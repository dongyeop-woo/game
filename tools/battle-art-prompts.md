# 전투 화면 그림 프롬프트

지금 전투 화면은 유닛도 적도 **이모지**다. 배치와 HUD 는 어느 정도 짜였는데
이 한 가지가 화면 인상을 결정한다.

**3D 렌더 느낌**으로 간다 - 아바타 프롬프트와 같은 방향이라 한 화면에 놓아도
따로 놀지 않는다. 외곽선을 쓰지 않고 빛과 그림자로 형태를 만든다.

**각 항목이 그대로 복붙하면 되는 완성 프롬프트다.** 스타일 지시를 지우지 말 것.

| 묶음 | 수 | 우선순위 |
| --- | --- | --- |
| 유닛 | 15 | 1 - 판 위에 늘 보인다 |
| 적 | 5 | 2 - 늘 보이는데 지금 전부 해골 하나다 |
| 바닥 | 1~5 | 3 - 코드로도 어느 정도 되니 나중 |

**등급 색은 칠하지 않는다.** 배경 타일이 이미 깔아 준다(`RARITY_G`).

**사거리가 실루엣에 드러나야 한다.** 근접은 발톱·주먹, 중거리는 지팡이·활,
원거리는 큰 지팡이나 날개다. 판을 보고 "저건 멀리 때리겠군"이 읽혀야 배치가
재미있어진다.

파일 이름: `assets/unit/<id>.png` · `assets/enemy/<id>.png`

---

# 유닛 15종

## 일반

### 생쥐 견습생 (`mouse`) — 근접 · 특성 없음

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A tiny grey mouse apprentice in an oversized wizard robe, holding a stubby
wooden wand out in front like a sword, eager and a little clumsy. Mouse cues:
thin oval ears, pointed pink snout, long thin tail. Warm grey fur, cream
belly, deep purple robe with a rope belt.
```

### 펭귄 궁수 (`penguin`) — 중거리 · 특성 없음

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A small penguin archer, one wing drawing back the string of a short curved
bow, eyes narrowed in focus. Penguin cues: stubby wings, orange webbed feet,
white chest oval. Black and white body, orange beak and feet, a worn leather
quiver strap across the chest.
```

### 부엉이 주술사 (`owl`) — 중거리 · 둔화

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A small owl shaman gripping a crooked staff topped with a pale blue crystal,
a breath of frost curling from the crystal. Owl cues: round face disc, ear
tufts, hooked beak. Tan and cream feathers, cold blue crystal light on the
feathers nearest the staff.
```

### 두꺼비 연금술사 (`toad`) — 근접 · 광역

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A round toad alchemist hugging a bubbling green flask, one drop about to spill
over the rim, eyes going wide. Toad cues: wide flat mouth, bulging eyes,
webbed feet. Soft green skin, pale belly, brown leather satchel, acid-green
glow from the flask on the chin and hands.
```

### 코뿔소 수호병 (`rhino`) — 근접 · 특성 없음

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A stocky rhino guard with a heavy stone club resting on one shoulder, planted
and immovable, bored expression. Rhino cues: blunt nose horn, thick folded
hide, heavy legs. Grey hide, riveted iron shoulder plates, worn leather
straps.
```

## 희귀

### 늑대 기사 (`wolf`) — 근접 · 특성 없음

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A wolf knight crouched low mid-lunge, claws out and teeth bared. Wolf cues:
pointed ears, long snout, neck ruff, bushy tail. Grey-blue fur, polished
steel pauldrons and bracers, a torn red cloth at the shoulder.
```

### 여우 마법사 (`fox`) — 중거리 · 광역

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A fox mage with a slim staff raised, small embers drifting off the tip and
catching in its fur, wearing a sly grin. Fox cues: sharp ears, narrow snout,
thick light-tipped tail. Orange fur, cream chest, ember-orange light on the
muzzle and paws.
```

### 까마귀 정찰병 (`crow`) — 원거리 · 특성 없음

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A crow scout just landed, wings still half-spread, holding a long slender bow,
head cocked and alert. Crow cues: layered glossy feathers, straight pointed
beak. Deep indigo feathers, amber beak, a small brass spyglass hanging at the
belt.
```

### 거북 결계사 (`turtle`) — 중거리 · 둔화

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A turtle warder sitting upright and serene, a ring of pale blue runes glowing
in the carved plates of its own shell, a short staff across its lap. Turtle
cues: segmented shell, stubby limbs, wrinkled neck. Mint-green shell, warm
yellow underbelly.
```

## 영웅

### 곰 대장군 (`bear`) — 근접 · 특성 없음

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A huge bear general in heavy plate armor, both fists raised and roaring, feet
planted wide. Bear cues: round ears, broad muzzle, massive shoulders. Dark
brown fur, gold-trimmed dark steel armor, a tattered red war banner rising
behind the shoulders.
```

### 유령 사서 (`ghost`) — 원거리 · 둔화

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A ghost librarian whose lower body dissolves into mist, a heavy book floating
open before it, pale chains of glowing text spiraling out of the pages and
wrapping outward. Translucent pale blue and white, faint gold on the book's
edges. Tired, scholarly expression.
```

### 뱀 술사 (`serpent`) — 중거리 · 광역

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A serpent sorcerer coiled upright with its hood flared wide, fangs bared and
venom beading at the tips. Snake cues: no limbs, long coiled body, slit pupils.
Deep green scales with a toxic yellow-green underside, gold arm rings clasped
around the coils.
```

## 전설

### 그리핀 기사단장 (`griffin`) — 원거리 · 집중

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A griffin knight-commander with wings spread wide, gripping a golden lance,
chin raised and eyes locked on a distant target. Griffin cues: eagle head and
fore-talons, lion hindquarters and tufted tail. White and gold feathers, tawny
flank, gilded lance.
```

### 용의 후예 (`wyrm`) — 중거리 · 광역

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A young dragon rearing on its hind legs, jaws open with fire building deep in
the throat and light spilling out between the teeth, wings half open. Dragon
cues: curved horns, membranous wings, spined tail. Crimson and dark red
scales, pale bone horns and belly plates.
```

## 신화

### 별의 현자 (`sage`) — 원거리 · 집중

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall. Large rounded head on a
smaller rounded body, short soft limbs, everything sculpted with real volume
and weight, like a stuffed toy that could sit on a desk.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A small expressive mouth. The face must carry a
clear emotion, not a blank stare.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A star sage: a small hooded figure whose robe is made of the night sky itself,
face hidden in shadow except for two points of light, holding a staff with a
single brilliant star at the tip. Constellations drift slowly inside the fabric
of the robe. Deep indigo and gold, the star the brightest point in the image.
```

---

# 적 5종

적은 왼쪽에서 걸어온다. 유닛과 구별되어야 하니 실루엣이 더 거칠고 색이 탁하다.
단단할수록 크고 무겁게 그린다.

### 해골 (`skeleton`) — 단단함 0.7 · 보통 속도

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, but with a more angular,
jagged, hunched silhouette than a friendly creature. Grimier, darker, worn
materials - cracked bone, rusted iron, damp rag.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A snarling or hollow expression - this is an ENEMY,
menacing rather than cute.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A small skeleton foot soldier lurching forward with a chipped short sword and
a cracked round shield, jaw hanging loose. Bone white with grey-green grime in
the crevices, rusted iron, frayed leather straps.
```

### 유령 (`ghost`) — 단단함 0.5 · 가장 빠름

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, but with a more angular,
jagged, hunched silhouette than a friendly creature. Grimier, darker, worn
materials - cracked bone, rusted iron, damp rag.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A snarling or hollow expression - this is an ENEMY,
menacing rather than cute.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A wispy ghost with no legs, its lower half trailing away into smoke, both arms
stretched forward as it rushes. Pale sickly green, hollow black eye sockets, a
torn shroud whipping behind.
```

### 좀비 (`zombie`) — 단단함 1.3 · 느림

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, but with a more angular,
jagged, hunched silhouette than a friendly creature. Grimier, darker, worn
materials - cracked bone, rusted iron, damp rag.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A snarling or hollow expression - this is an ENEMY,
menacing rather than cute.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A shambling zombie in torn peasant clothes, one arm hanging useless, head
lolling to the side, dragging one foot. Mottled grey-green skin, muddy brown
rags, exposed grey bone at one elbow.
```

### 오크 (`orc`) — 단단함 2.4 · 보통

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, but with a more angular,
jagged, hunched silhouette than a friendly creature. Grimier, darker, worn
materials - cracked bone, rusted iron, damp rag.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A snarling or hollow expression - this is an ENEMY,
menacing rather than cute.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A thick-set orc brute hunched forward, gripping a crude notched iron cleaver
in both hands, tusks jutting up past its snarling lip. Dark olive skin,
blackened iron, blood-red war paint smeared across the face and chest.
```

### 리치 (`lich`) — 단단함 6 · 가장 느림 · 보스급

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Shallow, believable
materials: brushed felt or short plush fur with visible fiber softness, smooth
satin vinyl on hard parts, gentle subsurface scattering in ears and thin areas
so light glows through them. Slightly glossy eyes with a real specular
highlight and a soft reflection.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration, no comic style. Form is described by
light and shadow only.

PALETTE - soft and sophisticated, slightly desaturated and muted. Rich deep
shadows rather than bright candy colors. The listed colors are the base tones;
let the lighting push them.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, but with a more angular,
jagged, hunched silhouette than a friendly creature. Grimier, darker, worn
materials - cracked bone, rusted iron, damp rag.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. A snarling or hollow expression - this is an ENEMY,
menacing rather than cute.

VIEW - three-quarter front view from a slightly high angle, standing or sitting
so it reads as a game piece on a board.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

Creature:
A towering lich in a tattered crown and long trailing robe, skeletal hands
raised with a dark orb suspended between them. Slow, deliberate, dreadful.
Bone white skull with two violet pinpoints for eyes, deep violet robe with
gold trim, sickly purple magic bleeding off the orb.
```

---

# 바닥 (나중)

지금 판은 정면에서 본 둥근 사각형이라 납작하다. 비스듬히 내려다보는 지형이
되려면 바닥 그림이 필요하다. 한 장으로 시작해도 된다 - 색은 코드에서 덧씌운다.

```
Painted 2D game asset, cut out on a fully transparent background.

A square battle platform for a mobile tower-defense board, seen from a
three-quarter high angle so the far edge is narrower than the near edge.
Worn stone tiles with chipped edges and moss in the seams, a faintly glowing
magic rune ring inlaid at the center.

Soft painted shading with a warm key light from the upper left and cool bounce
in the shadows. Rich color, clean edges, no thick black cartoon outline.

ABSOLUTELY NO: sky, scenery, characters, units, props, text, watermark,
anything outside the platform. The platform alone on transparent pixels.
```

스테이지별 분위기 (색은 코드에서 덧씌운다):

| 스테이지 | 하늘색 | 분위기 |
| --- | --- | --- |
| 무너진 성문 | `#3d63a0` → `#22406b` | 소나무, 파란 밤 |
| 안개 늪지 | `#3a5a7a` → `#1f3450` | 죽은 나무, 안개 |
| 검은 언덕 | `#5a3f6e` → `#2a1c40` | 돌기둥, 보랏빛 |
| 리치의 제단 | `#2f4a5c` → `#16283a` | 얼음 가시, 시린 청록 |
| 왕좌의 문 | `#5c2f3a` → `#2a1420` | 폐허, 핏빛 |

---

# 뽑을 때 지킬 것

**크기** — 정사각 1024px 투명 PNG 로 받아 **192px** 로 줄여 넣는다.
판 위 유닛은 64pt 안쪽이라 3x 기준 192px 이면 충분하다. 바닥만 1024 를 쓴다.

**작게 줄였을 때를 반드시 확인한다.** 채색 방향은 디테일이 많아 축소하면
뭉개지기 쉽다. 1024 에서 예뻐도 192 에서 안 읽히면 못 쓴다.

**용량** — 유닛 15 + 적 5 = 20장. 배경 하나가 1MB 라 로딩이 느렸던 문제가
20배로 돌아온다. `pngquant` 나 WebP 로 **장당 40KB 아래**를 목표로 한다.

**일관성** — `mouse` 한 장을 마음에 들 때까지 다듬고 **그 결과를 레퍼런스
이미지로 첨부해서** 나머지를 뽑는다. 유닛을 다 뽑은 뒤 적으로 넘어간다.
