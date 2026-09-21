# 아바타 이미지 프롬프트

로비에 서는 아바타 14종. **3D 렌더 느낌**으로 간다 - 봉제/비닐 피규어를
스튜디오 조명으로 찍은 듯한 그림이다. **외곽선을 쓰지 않는다.** 형태는 빛과
그림자로만 만든다.

> **프롬프트에 다른 게임 이름을 쓰지 않는다.** 이 프로젝트는 처음부터 특정
> 작품의 이름·문장·색을 안 쓰기로 했다(`src/ui/theme.ts` 주석). 그런데 한때
> 프롬프트에 특정 게임 이름을 박아 뒀었다 - 결과물이 그쪽 자산을 닮는 쪽으로
> 끌려갈뿐더러, 나중에 "보고 베꼈다"는 기록으로 남는다. 화풍은 이름 대신
> **만드는 방법**으로 적는다: 어떤 재질, 어떤 조명, 어떤 렌더링인지.
>
> 이름을 지워도 결과는 같다. 아래 프롬프트가 이미 재질(플러시·비닐), 조명
> (3점 스튜디오), 렌더링(PBR)을 다 적고 있어서 이름은 없어도 되는 말이었다.

앞서 화풍 레퍼런스를 여럿 섞었다가 서로 다른 쪽으로 끌려가 외곽선 있는
카툰이 나왔다. 레퍼런스는 하나로 좁힌다.

**각 항목이 그대로 복붙하면 되는 완성 프롬프트다.** 스타일 지시를 지우지 말 것.

각 캐릭터에 **소품과 성격**을 넣어 뒀다. 이게 없으면 어디서나 본 마스코트가
된다 - 실제로 그렇게 나왔다.

파일 이름은 `assets/avatar/<id>.png`. id 는 각 항목의 괄호 안 값이다.

---

## 일반

### 흰쥐 견습생 (`mochi`)

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
A tiny white mouse apprentice wizard, clutching a plain wooden wand in both
paws for the very first time, beaming with excitement. Mouse cues: thin oval
ears, a small pointed pink snout, a long thin tail curling behind. Palette:
pale lavender-white fur (#e8e2f2 to #b9b0cf), near-white muzzle and belly
(#fbf7ff), warm orange nose and feet (#f0a86a). Wears a slightly-too-big
purple pointed wizard hat pulled down over the ears.
```

### 검은 고양이 (`soot`)

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
A small black cat sitting upright as if it owns the windowsill, chest out,
smug and confident. Cat cues: sharp triangular ears, whiskers, a long tail
curled around the paws. Palette: deep muted purple fur (#5b5480 to #332d52),
lighter purple muzzle and chest (#8a80b5), golden yellow eyes, nose and paw
pads (#f0c44d). No hat. Half-lidded superior eyes.
```

### 늪 두꺼비 (`pebble`)

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
A round swamp toad hugging a fat potion bottle, cheeks puffed out, looking
guilty as if it just swallowed an ingredient it shouldn't have. Toad cues:
wide flat mouth, bulging eyes on top of the head, webbed feet. Palette: soft
green skin (#7fc07a to #3f7a44), pale green belly (#d8f0c6), warm orange mouth
line and feet (#f0a03c). Sleepy droopy eyelids.
```

### 부엉이 새끼 (`hoot`)

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
A fluffy baby owl with a letter held in its beak and one more slipping from
under a wing, flustered. Owl cues: round face disc, small ear tufts, a short
hooked beak, feathered talons. Palette: warm tan feathers (#c99a63 to
#8a6234), cream face disc and chest (#f0dcb8), amber beak and talons
(#f5b942). Wide startled eyes.
```

## 희귀

### 잿불 여우 (`ember_fox`)

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
A mischievous ember fox mid-turn, glancing back over its shoulder with a sly
grin as tiny embers scatter from the tip of its bushy tail. Fox cues: sharp
upright ears, narrow snout, thick tail with a light tip. Palette: warm orange
fur (#f0954a to #b8541c), cream muzzle and chest (#ffe3c0), pale gold nose
and paws (#ffe08a), ember-orange highlights.
```

### 눈토끼 (`snowbun`)

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
A gentle snow rabbit sitting with frost crystals forming on the fur of its
paws, calm and quiet. Rabbit cues: two long upright ears with pink inner
lining, a round cotton tail, a small cleft nose. Palette: icy white-blue fur
(#e6f2ff to #a8c4e0), pure white muzzle and belly (#ffffff), soft pink nose
and inner ears (#ffb3c7). Soft closed-mouth smile.
```

### 먹빛 까마귀 (`inkwing`)

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
A crow clutching a shiny gold coin to its chest with both wings, eyeing the
viewer with sharp suspicion, as if daring anyone to take it. Crow cues:
glossy layered feathers, a straight pointed beak, small feathered ear tufts.
Palette: dark indigo feathers (#4a4470 to #252045), muted violet face and
chest (#6f68a0), amber beak and talons (#f0b03c).
```

### 이끼 도마뱀 (`mossling`)

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
A moss lizard lounging on its side, utterly relaxed, patches of moss growing
along its back and tail. Lizard cues: two small backswept horns, a blunt
snout, clawed feet, a thick tapering tail. Palette: mint green scales
(#6fc4a8 to #2f7a68), pale mint belly (#d4f5e6), warm yellow claws and snout
(#ffd166). Sleepy half-closed eyes, content.
```

## 영웅

### 불꽃 늑대 (`flamewolf`)

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
A flame wolf standing braced and fierce, faint ash and ember drifting from its
muzzle as it exhales. Wolf cues: pointed ears, a long snout, a thick ruff of
fur at the neck, a bushy tail. A single curved horn on the forehead. Palette:
hot coral-red fur (#ff7a5c to #a8281c), peach muzzle and chest (#ffd0a8), pale
gold nose and claws (#ffe08a). Determined narrowed eyes.
```

### 별빛 사슴 (`starfawn`)

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
A starlight fawn holding its head high, and between its slender branching
antlers the night sky is visible - a small patch of deep space with stars,
contained inside the antler span. Deer cues: slim muzzle, small hooves, a
short flicking tail. Palette: periwinkle blue coat (#a8b4f0 to #4a54a8),
pale lavender face and chest (#e0e6ff), warm gold hooves and nose (#ffd166).
Serene, wide starry eyes.
```

### 물결 정령 (`tidecall`)

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
A tide spirit laughing, with a ribbon of clear water curling around its body
and a thin floating ring hovering above its head like a halo. Its lower body
softens into flowing water. Palette: bright aqua (#6fd0f0 to #1c6f9e), pale
cyan face and belly (#d0f4ff), soft gold halo and mouth (#ffd98a). Bright,
open, joyful eyes.
```

## 전설

### 황금 그리핀 (`goldgriff`)

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
A golden griffin planted in a guarding stance, wings half-spread, one taloned
foot resting protectively on a small treasure chest. Griffin cues: eagle head
and front talons, lion hindquarters and tail, feathered wings. Wears a small
ornate crown. Palette: rich gold feathers (#ffd76a to #c08a12), pale cream
face disc (#fff2c4), warm orange beak and talons (#f2894a). Proud, fierce,
watchful eyes.
```

### 그림자 용 (`umbra`)

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
A shadow dragon half-emerging from its own shadow, wisps of darkness peeling
off its body, a single snuffed candle floating beside it with a thin trail of
smoke. Dragon cues: two curved backswept horns plus one larger forehead horn,
membranous wings, a spined tail. Palette: vivid violet scales (#8a5cf0 to
#3d1c7a), light lilac snout and belly (#c9a8ff), golden yellow eyes and claws
(#f0c44d). Calm, dangerous, narrowed eyes.
```

## 신화

### 별의 유니콘 (`astra`)

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
A star unicorn caught mid-step as if it just arrived, its spiral horn catching
light and a scatter of falling stars streaking down behind its mane - the
stars part of the character silhouette, not a background effect. Unicorn cues:
long upright ears, flowing mane, small hooves. Palette: soft pink coat
(#ffc9ec to #c93da8), near-white pink muzzle and chest (#fff0fa), warm gold
horn and hooves (#ffd166). Otherworldly, gentle, luminous eyes.
```

---

## 뽑을 때 지킬 것

**크기** — 정사각 1024px 투명 PNG 로 받아 528px(176pt @3x)로 줄여 넣는다.
도감(50pt)·프로필(30pt)은 지금 SVG 를 그대로 쓸 참이라 큰 것 하나면 된다.

**용량** — 배경 하나가 1MB 라 로딩이 눈에 띄게 느렸던 걸 고친 적이 있다.
14장이면 같은 문제가 14배로 돌아온다. `pngquant` 나 WebP 로 줄이고
종당 120KB 아래를 목표로 한다.

**일관성** — 채색 방향은 플랫보다 화풍이 더 잘 흔들린다. `mochi` 한 장을
마음에 들 때까지 다듬고, **그 결과를 레퍼런스 이미지로 첨부해서** 나머지를
뽑는다. 이건 선택이 아니라 필수에 가깝다.

**결과가 이상하면**
- 사실적으로 나오거나 배경이 붙는다 → 스타일 블록을 통째로 복사했는지 확인
- 종이 안 읽힌다(쥐가 곰처럼) → `Mouse cues:` 같은 종 단서 줄을 더 강조
- 밋밋하다 → 소품과 표정 문장이 빠지지 않았는지 확인
