# 모드 카드 그림 프롬프트

로비에서 플레이를 누르면 뜨는 카드 세 장(PVP · 일반 · 튜토리얼)을 채울 그림이다.

## 모드마다 두 장이 필요하다

레퍼런스 카드가 입체적으로 보이는 이유는 **캐릭터가 카드 테두리를
넘어 앞으로 튀어나오기** 때문이다. 그러려면 배경과 캐릭터가 나뉘어 있어야 한다 -
한 장으로 두면 카드가 통째로 잘라내서 그림이 액자 안에 갇힌다.

| | 내용 | 형식 | 앱에서 |
| --- | --- | --- | --- |
| **배경** | 장면만, **캐릭터 없이** | JPEG | 카드 안에서 잘림 |
| **캐릭터** | 배경 없이 캐릭터만 | 투명 PNG | 카드 위로 넘침 |

**각 항목이 그대로 복붙하면 되는 완성 프롬프트다.** 스타일 지시를 지우지 말 것.

파일 이름
```
assets/mode/<id>.jpg        배경
assets/mode/<id>-hero.png   캐릭터
```
id 는 `pvp`, `normal`, `tutorial`.

---

# PVP (`pvp`)

## 배경 — `pvp.jpg`

```
Painted 3D-rendered game card BACKGROUND, 3:4 portrait, full-bleed scene.
Empty stage - no characters, no creatures, no people anywhere in the image.

STYLE - soft, rounded, plush-and-vinyl shapes rendered in 3D with physically
based lighting. Soft
studio lighting, gentle rim light, soft ambient occlusion. Rich but slightly
muted color, deep shadows. No cartoon outline, no cel shading, no flat vector
look.

COMPOSITION - shallow depth. The interesting detail sits in the middle band of
the image. The TOP fifth stays simple and open - a character will be placed
there and must not fight with the background. The BOTTOM third fades into a
darker, simpler area with nothing important in it - a caption goes there.

ABSOLUTELY NO: characters, creatures, animals, people, text, letters, numbers,
watermark, UI, buttons, lock icon, border, frame, health bars.

Scene:
A small stone duelling arena seen from the front. Cracked flagstones in a
rough circle, two lit wall torches at the far left and right edges throwing
warm light, dark arched walls behind. Deep purple and magenta, arena torchlight,
competitive tension.
```

## 캐릭터 — `pvp-hero.png`

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Short plush fur and satin
vinyl materials, gentle subsurface scattering in ears and thin areas. Slightly
glossy eyes with a real specular highlight.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration. Form is described by light and shadow.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, sculpted with real volume and
weight like a stuffed toy.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. The face must carry a clear emotion.

VIEW - three-quarter front view from a slightly high angle, standing, feet
planted so it reads as standing on a surface.

ABSOLUTELY NO: background, scene, floor, ground, base plate, cast shadow, glow,
aura, sparkles, particles, text, watermark, border, frame. The creature alone
on transparent pixels.

Creature:
Two small chibi animal wizards facing each other and leaning in, fists raised,
mid-standoff. The one on the left wears a cool blue-violet robe and pointed
hat, the one on the right a warm magenta robe and hat. Both grinning, tense but
playful. A small crackle of magic sparks between their raised fists.
```

---

# 일반 (`normal`)

## 배경 — `normal.jpg`

```
Painted 3D-rendered game card BACKGROUND, 3:4 portrait, full-bleed scene.
Empty stage - no characters, no creatures, no people anywhere in the image.

STYLE - soft, rounded, plush-and-vinyl shapes rendered in 3D with physically
based lighting. Soft
studio lighting, gentle rim light, soft ambient occlusion. Rich but slightly
muted color, deep shadows. No cartoon outline, no cel shading, no flat vector
look.

COMPOSITION - shallow depth. The interesting detail sits in the middle band of
the image. The TOP fifth stays simple and open - a character will be placed
there and must not fight with the background. The BOTTOM third fades into a
darker, simpler area with nothing important in it - a caption goes there.

ABSOLUTELY NO: characters, creatures, animals, people, text, letters, numbers,
watermark, UI, buttons, lock icon, border, frame, health bars.

Scene:
A glowing rune circle carved into a dark stone floor, seen from the front.
Faint blue runes light the ground. Behind it, gloom and a few blurred
silhouettes of ruined pillars fading into darkness. Cool blue and steel, night,
a lone position being held.
```

## 캐릭터 — `normal-hero.png`

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Short plush fur and satin
vinyl materials, gentle subsurface scattering in ears and thin areas. Slightly
glossy eyes with a real specular highlight.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration. Form is described by light and shadow.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, sculpted with real volume and
weight like a stuffed toy.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. The face must carry a clear emotion.

VIEW - three-quarter front view from a slightly high angle, standing, feet
planted so it reads as standing on a surface.

ABSOLUTELY NO: background, scene, floor, ground, base plate, cast shadow, glow,
aura, sparkles, particles, text, watermark, border, frame. The creature alone
on transparent pixels.

Creature:
A single chibi animal wizard standing firm with a staff planted and raised,
a translucent blue barrier flaring in front of it. Braced, determined, jaw set.
Cool blue robe with steel trim.
```

---

# 튜토리얼 (`tutorial`)

## 배경 — `tutorial.jpg`

```
Painted 3D-rendered game card BACKGROUND, 3:4 portrait, full-bleed scene.
Empty stage - no characters, no creatures, no people anywhere in the image.

STYLE - soft, rounded, plush-and-vinyl shapes rendered in 3D with physically
based lighting. Soft
studio lighting, gentle rim light, soft ambient occlusion. Rich but slightly
muted color, deep shadows. No cartoon outline, no cel shading, no flat vector
look.

COMPOSITION - shallow depth. The interesting detail sits in the middle band of
the image. The TOP fifth stays simple and open - a character will be placed
there and must not fight with the background. The BOTTOM third fades into a
darker, simpler area with nothing important in it - a caption goes there.

ABSOLUTELY NO: characters, creatures, animals, people, text, letters, numbers,
watermark, UI, buttons, lock icon, border, frame, health bars.

Scene:
A cozy study corner in a wizard school, seen from the front. A worn wooden
floor, a low shelf of books at the back, a single candle throwing warm light,
soft green and gold. Welcoming and calm, a place for a first lesson.
```

## 캐릭터 — `tutorial-hero.png`

```
3D rendered collectible creature, cut out on a fully transparent background.
Square 1:1 canvas, centered, full body, nothing cropped.

LOOK - a small collectible creature figurine: soft, rounded, plush-and-vinyl,
rendered in 3D. Think a high-end designer vinyl toy photographed in a studio,
not a drawing.

RENDERING - physically based 3D render. Soft three-point studio lighting with a
warm key from the upper left, a cool fill, and a gentle rim light separating the
silhouette. Soft ambient occlusion in every crease. Short plush fur and satin
vinyl materials, gentle subsurface scattering in ears and thin areas. Slightly
glossy eyes with a real specular highlight.

ABSOLUTELY NO OUTLINE. No ink line, no cartoon contour, no cel shading, no
flat vector look, no 2D illustration. Form is described by light and shadow.

PROPORTIONS - chibi, roughly 2 to 2.5 heads tall, sculpted with real volume and
weight like a stuffed toy.

FACE - large glossy eyes placed low on the head, set fairly far apart, with a
bright specular catchlight. The face must carry a clear emotion.

VIEW - three-quarter front view from a slightly high angle, standing, feet
planted so it reads as standing on a surface.

ABSOLUTELY NO: background, scene, floor, ground, base plate, cast shadow, glow,
aura, sparkles, particles, text, watermark, border, frame. The creature alone
on transparent pixels.

Creature:
A tiny white mouse apprentice in a purple pointed wizard hat, holding a plain
wooden wand in both paws and looking up with delight, as if a spell just worked
for the first time. Mouse cues: thin oval ears, pointed pink snout, long thin
tail curling behind.
```

---

# 뽑을 때 지킬 것

**배경** — 3:4 세로로 받아 **384 x 520** 으로 줄이고 **JPEG** 로 저장한다.
투명이 필요 없으니 PNG 보다 훨씬 가볍다. 장당 30KB 아래를 목표로 한다.

**캐릭터** — 정사각 투명 PNG 로 받아 **높이 570px** 로 줄인다. 카드 높이의
1.2배로 그려지기 때문에 배경보다 커야 한다. 장당 80KB 아래.

**배경에 캐릭터가 섞이지 않았는지 확인한다.** 이게 제일 자주 어긋난다.
한 마리라도 들어가 있으면 캐릭터 컷아웃과 겹쳐 인물이 두 번 나온다.

**배경 위쪽 5분의 1을 확인한다.** 거기에 밝거나 복잡한 것이 있으면 그 위에
얹히는 캐릭터와 싸운다.

**배경 아래 3분의 1을 확인한다.** 앱이 어두운 그늘막을 깔고 모드 이름을
올리므로, 거기 중요한 것이 있으면 가린다.

**일관성** — 아바타 `mochi` 그림을 레퍼런스 이미지로 첨부해서 뽑는다.
카드 그림만 화풍이 다르면 한 화면에서 바로 티가 난다.

**종족을 맞춘다** — 우리 아바타는 전부 동물이다. 카드에 수염 난 노인 마법사가
나오면 세계관이 흔들린다. 프롬프트에 `animal wizards` 로 못 박아 뒀다.
