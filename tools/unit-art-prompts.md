# 유닛 그림 프롬프트 — 유닛마다 통째로 복붙

`tools/unit-render-prompts.md` 와 **다른 용도다.** 저건 meshy 에 넣어 3D 로
되돌릴 설계도(정면·A 포즈)고, 이건 **게임에 그대로 들어갈 그림**이다.

## 쓰는 법

1. 그림 한 장을 **첨부**한다. 첨부가 화풍의 기준이다 - 말로만 시키면 열다섯
   마리가 한 세트로 안 보인다. 첫 마리는 아바타(`assets/avatar/mochi.png`)를,
   그다음부터는 **직전에 나온 결과물**을 첨부한다.
2. 아래에서 뽑을 유닛의 칸을 통째로 복사해 붙인다. 손댈 곳이 없다.
3. 받은 PNG 는 투명 배경 1024px 이상. `assets/units/<아이디>.png` 로 저장한다
   (`mouse.png`, `wolf.png` …).

첨부한 그림의 **모자·소품까지 따라 그리는 일이 잦다.** 그래서 모든 프롬프트
맨 위에 `REFERENCE USE` 줄이, 맨 아래에 `CLOTHING AND PROPS` 줄이 있다.
지우지 말 것.

---


## 일반

### mouse — 생쥐 견습생

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A small grey-blue mouse apprentice, gripping a slim wand tipped with a pale
blade in one paw, mouth set in a determined line, brows pushed together.
Mouse cues: thin round ears, a small pink snout, a long thin tail curling
behind. Palette: cool grey-blue fur (#cdd4e5 to #8f99b4), near-white muzzle
and belly (#f6f8fc), soft pink inner ears (#f2b9c6), warm orange feet
(#f2a46a). The wand shaft is warm wood (#c08a4e), its blade pale blue-white
(#b9cdf2 to #ffffff). No hat. It wears no clothing.
```

### penguin — 펭귄 궁수

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A round little penguin archer holding a short wooden bow at its side, looking
ahead with calm focus, beak slightly open. Penguin cues: stubby flipper arms,
a white oval belly, wide orange webbed feet. Palette: deep navy-slate back and
head (#2b3856 to #1a2340), bright white belly (#f3f6fc), warm orange beak and
feet (#ffa93d). The bow is worn wood (#8a6134) with a pale string. It wears no hat and no clothing.
```

### owl — 부엉이 주술사

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A plump owl shaman clutching a crooked wooden staff topped with a glowing teal
stone, eyes wide and unblinking, feathers puffed. Owl cues: two feathered ear
tufts, a heart-shaped facial disc, a small hooked beak. Palette: warm brown
feathers (#a5763f to #6b4826), cream facial disc (#fdf4e0), amber iris
(#d1892a), teal gem (#5fe3d8) with a soft inner glow but no aura around it. It wears no hat and no clothing.
```

### toad — 두꺼비 연금술사

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A squat toad alchemist crouching low, holding up a round glass flask of purple
brew in one webbed hand, grinning with mischief, cheeks puffed. Toad cues:
bulging eyes set high on the head, a wide mouth, short splayed fingers.
Palette: mossy green skin (#6aa94f to #3f7a3a), pale yellow-green belly
(#cfe0a2), purple potion (#a86ee0) inside pale blue glass (#b8e0f0) with a
small cork. It wears no hat and no clothing.
```

### rhino — 코뿔소 수호병

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A stout rhino guard planting a round steel shield in front of itself, jaw set,
eyes narrowed with quiet stubbornness. Rhino cues: a thick curved horn on the
snout, small ears, heavy stubby legs, thick plated skin folds. Palette: blue-
grey hide (#8b95ac to #5d667c), cream horn (#f2ead6), brushed steel shield
(#c3cee4) with a warm gold boss (#ffc94a). It wears no hat and no clothing - the shield is the only gear.
```


## 희귀

### wolf — 늑대 기사

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A lean wolf knight standing upright, a straight longsword lowered at its side,
teeth just showing in a confident half-snarl. Wolf cues: tall pointed ears, a
long muzzle, a thick brush tail. Wears only a steel chest plate - arms and legs
are bare fur. Palette: dark grey-blue fur (#78849e to #4e586e), pale muzzle and
chest (#d3dbea), brushed steel plate (#c3cbdd), amber eyes (#e0a548), a
pale steel blade (#e9eef8). No hat.
```

### fox — 여우 마법사

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A three-tailed fox mage holding a long wooden staff with a small flame burning
at its tip, one brow raised, smiling as if it already knows the answer. Fox
cues: sharp triangular ears, a slim snout, three bushy tails fanned behind with
cream tips. Palette: red-orange fur (#ef8f3f to #c96a22), cream muzzle, chest
and tail tips (#fdf2e2), dark paws (#8a5a2e), warm flame (#ff8a3d to #ffd66a)
kept small and contained at the staff tip. It wears no hat and no clothing.
```

### crow — 까마귀 정찰병

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A sleek crow scout with a longbow held upright in one wing-hand, head turned
slightly, eyes sharp and watchful. Crow cues: a long straight beak, glossy
layered feathers with a faint blue sheen, thin scaled feet. Wears a single
brown leather bracer on one forearm. Palette: blue-black plumage (#2f3550 to
#1b2036) with cool blue highlights, warm gold beak and feet (#e0a548), worn
leather (#8a6134). No hat, no other clothing.
```

### turtle — 거북 결계사

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A calm turtle warder standing on two short legs, holding a flat round stone
disc in one open palm, eyes half-closed in concentration. Turtle cues: a thick
domed shell with carved plates, a wrinkled neck, blunt clawed feet. Palette:
olive-green skin (#5f9e52 to #35632f), deep green shell (#4f8a45) with faint
teal runes cut into the plates (#6fd0ff, carved not glowing), pale cream
plastron (#cfe0a2). It wears no hat and no clothing.
```


## 영웅

### bear — 곰 대장군

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A massive bear general resting a two-handed war hammer head-down on the ground
beside it, chest out, brows lowered in a steady commanding look. Bear cues: a
broad muzzle, small round ears, heavy shoulders, thick paws. Wears only heavy
steel shoulder pauldrons - chest, arms and legs are bare fur. Palette: deep
brown fur (#8a5f3c to #5c3f26), cream muzzle (#e4c79a), dark steel pauldrons
and hammer head (#b9c4da), warm wood haft (#7d5a33). No hat.
```

### ghost — 유령 사서

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A small round ghost librarian, translucent and softly glowing from within, an
open book floating just in front of it, expression gentle and a little sleepy.
Ghost cues: a smooth domed head, a wavy scalloped lower edge instead of legs,
faint stubby arms. Palette: pale blue-white body (#dce6f8) with cool shadow
inside the folds, dark calm eyes (#181324), a book with warm cream pages and a
gold-edged deep blue cover (#3b4a86, #e0c46a). The body is semi-transparent -
the book edge shows faintly through it. It wears no hat and no clothing.
```

### serpent — 뱀 술사

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A coiled green serpent sorcerer rising upright from its own coils, a flared
cobra hood behind the head, a short bone rod held in one small clawed hand,
eyes half-lidded and superior. Serpent cues: smooth overlapping scales, a
forked tongue just showing, a thick body coiled into a stack. Wears heavy gold
rings around the neck. Palette: deep green scales (#6ab04c to #35632f), pale
yellow-green belly plates (#cfe0a2), warm gold rings (#e0c46a), bone-white rod
(#f2ead6). No hat, no other clothing.
```


## 전설

### griffin — 그리핀 기사단장

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A proud griffin commander standing upright, a short lance held upright at its
side, wings folded flat and close against the back, chin lifted. Griffin cues:
an eagle head and front claws, a lion's hindquarters and tufted tail, layered
feathers blending into short fur at the shoulders. Wears a gold breastplate.
Palette: cream-white head feathers (#f4ecd8), tawny lion body (#d2a24f to
#a97c1e), warm gold beak, talons and breastplate (#e8a53a), deep blue eye. No hat.
```

### wyrm — 용의 후예

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A young red dragon standing on two legs, wings folded tight, a thin curl of
flame escaping one nostril, eyes bright with barely held-back energy. Dragon
cues: two swept-back horns, a short snout, a row of small ridges down the back,
a thick tail. Palette: deep red scales (#d8503a to #9e3324), warm cream belly
plates and horns (#f2b48a, #f2ead6), a small contained flame (#ffb03c) at the
nostril only - no aura, no fire around the body. It wears no hat and no clothing.
```


## 신화

### sage — 별의 현자

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

REFERENCE USE - the attached image defines ONLY the rendering style: the
material feel, the lighting, the surface finish and the body proportions. It is
a DIFFERENT character. Do not copy its species, its hat, its clothing, its held
prop, its pose or its colour scheme. Take nothing from it but the look and feel.

LOOK - a small collectible figure: a soft, rounded, plush-and-vinyl creature
rendered in 3D. Think a high-end designer toy photographed in a studio, not a
drawing.

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

VIEW - three-quarter front view: the body turned about 30 degrees away from the
camera so one shoulder reads as nearer, seen from slightly above as if looking
down at a game board. Not a flat straight-on front view.

BACKGROUND - true alpha transparency, a PNG with a real alpha channel. NOT a
white background, NOT a light grey card, NOT a checkerboard pattern painted into
the image. The pixels around the creature must be empty.

ABSOLUTELY NO: background, scene, room, floor, ground, base plate, cast shadow
on the ground, glow, aura, magic circle, sparkles, particles, text, watermark,
border, frame. The creature alone on transparent pixels.

CLOTHING AND PROPS - only what the Creature block below names. If it does not
name a hat, the character wears no hat.

Creature:
A tiny hooded sage floating a hand's width above nothing, holding a slender
staff crowned with a single carved star, face mostly hidden by the hood with
two calm points of warm light where the eyes are. Sage cues: a deep hood, wide
sleeves that hide the hands, a small round body under the robe. Palette: deep
indigo robe (#3b4a86 to #24305c), a dull gold hem (#c9a24a), warm pale light in
the eyes (#ffe9a8), a carved star of warm gold (#ffe066) that is solid material,
not a light source. No aura, no sparkles. It wears a deep hooded robe and nothing else. No wizard hat.
```
