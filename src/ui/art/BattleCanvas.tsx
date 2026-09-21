import {
  BlurStyle,
  FilterMode,
  MipmapMode,
  Skia,
  SkiaPictureView,
  useImage,
  useTypeface,
  type SkFont,
  type SkPaint,
  type SkPicture,
  type SkTypeface,
} from '@shopify/react-native-skia';
import React, { useEffect, useMemo, useState } from 'react';

import { ENEMY_DEFS, HIT_FLASH, pathPoint, type DefEnemy, type DefWorld } from '../../game/defense';
import { fmt } from '../../game/format';
import { unitDef } from '../../game/roster';
import { IMPACT, attackOf, drawAttack } from './attacks';
import { blob, box, createBrush, ink, ring, spriteOf, type Brush, type Sprite } from './brush';
import { BULLET, ENEMY_WALK, FX, MUZZLE } from './fx';

/**
 * 전투 판에서 움직이는 것 - 적, 공격 연출, 피해 숫자 - 을 그리는 캔버스 한 장.
 *
 * 예전엔 전부 View 였다. 적 한 마리가 체력바·그림·그림자·기절 고리로 View
 * 대여섯 개, 공격 한 번이 막대·고리 대여섯 개, 숫자 하나가 둘. 이걸 React 가
 * 매 프레임 새로 맞춰 봤다. 연습판에서 적이 쌓이면 190 마리에 30 프레임,
 * 730 마리에 10 프레임까지 떨어지고 폰이 달아올랐다. 적 그림을 네모로 바꿔도
 * 그대로였다 - 느린 건 SVG 가 아니라 **View 개수**였다.
 *
 * 그래서 한 장에 직접 그린다. 게임 루프가 프레임마다 그리기 함수를 부르면
 * 그리기 명령을 녹화해(SkPicture) 넘기고, React 는 이 컴포넌트 하나만 다시 맞춘다.
 *
 * 모양과 수치는 View 로 그리던 때 그대로 옮겼다. 겹치는 순서도 같다 - 적이
 * 공격 연출과 숫자를 덮고, 보스는 졸개를 덮는다 (예전 zIndex 1, 2).
 *
 * 주의: 여기선 reanimated 를 안 쓰지만 **package.json 에서 지우면 안 된다.**
 * Skia 2.6.2 는 불러오는 순간 reanimated 를 찾아서(영상 기능 초기화), 없으면
 * 앱이 첫 화면도 못 띄우고 죽는다.
 */

/**
 * 판 밖으로 넘치는 여백(칸 단위).
 *
 * 캔버스는 제 크기 밖을 못 그린다. View 는 넘쳐도 보였다 - 가장자리 적의 숫자는
 * 판 위로 떠오르고, 신화의 별은 한 칸 넘게 위에서 떨어진다. 그만큼 넓혀 둔다.
 */
const BLEED = 1.3;

const HP_BACK = 'rgba(0,0,0,0.5)';
const HP_FILL = '#e05252';
const HP_FILL_BOSS = '#ffb03c';
const HP_EDGE_BOSS = 'rgba(255,176,60,0.7)';
const FOOT_SHADOW = 'rgba(0,0,0,0.4)';
const STUN = 'rgba(255,214,90,0.95)';
/** 숫자 밑에 까는 짙은 그림자 - 글자가 배경에 묻히지 않게 */
const DIGIT_SHADE = '#2a1408';

/** 걷는 띠가 가로로 몇 칸인가. `tools/bake-kit.py --motions Walk:12` 와 맞춘다 */
const WALK_FRAMES = 12;
/** 트랙 한 바퀴에 걷기를 몇 번 도는가. 발이 미끄러지지 않게 맞춘 값 */
const WALK_CYCLES = 26;


interface DigitFont {
  font: SkFont;
  /** 글줄 윗선에서 기준선까지 */
  ascent: number;
  /** 글줄 높이 - 튀어 오를 때 이 가운데를 잡고 키운다 */
  height: number;
  color: string;
}

interface Digits {
  hit: DigitFont;
  slow: DigitFont;
  text: SkPaint;
  shade: SkPaint;
}

export const BattleCanvas = React.memo(function BattleCanvas({
  size,
  cell,
  origin,
  register,
}: {
  /** 판 한 변(픽셀) */
  size: number;
  /** 칸 한 변(픽셀) */
  cell: number;
  /** 칸 좌표 0 이 판 왼쪽 위에서 몇 칸 안쪽인가 */
  origin: number;
  /** 게임 루프가 부를 그리기 함수를 건다. 돌려받은 함수로 뗀다 */
  register: (draw: (w: DefWorld) => void) => () => void;
}) {
  const [picture, setPicture] = useState<SkPicture>();
  const fire = useImage(FX.fireball?.src);
  const arrow = useImage(FX.arrow?.src);
  const muzzle = useImage(MUZZLE.src);
  const bullet = useImage(BULLET.src);
  const face = useTypeface(require('../../../assets/BMJUA_otf.otf'));

  const pad = Math.ceil(cell * BLEED);
  const full = size + pad * 2;
  const brush = useMemo(
    () => createBrush(fire, arrow, muzzle, bullet),
    [fire, arrow, muzzle, bullet],
  );
  /*
    적 걷는 그림.

    한 종류가 가로로 이어 붙은 띠 한 장이다 (`tools/bake-kit.py`). 예전에는
    SVG 를 구워 한 장씩 찍었는데, 그건 가만히 선 그림이라 트랙을 미끄러지듯
    지나갔다. 띠에서 칸을 골라 찍으면 다리가 움직인다.
  */
  const walk: Record<string, ReturnType<typeof useImage>> = {
    skeleton: useImage(ENEMY_WALK.skeleton),
    ghost: useImage(ENEMY_WALK.ghost),
    zombie: useImage(ENEMY_WALK.zombie),
    orc: useImage(ENEMY_WALK.orc),
    lich: useImage(ENEMY_WALK.lich),
  };
  const sprites = useMemo(
    () => {
      const out: Record<string, Sprite | null> = {};
      for (const def of ENEMY_DEFS) out[def.id] = spriteOf(walk[def.id] ?? null);
      return out;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walk.skeleton, walk.ghost, walk.zombie, walk.orc, walk.lich],
  );
  const digits = useMemo(() => (face ? makeDigits(face, cell) : null), [face, cell]);
  // 녹화기는 하나를 계속 쓴다 - 한 장을 끝내면 다음 녹화를 받는다
  const recorder = useMemo(() => Skia.PictureRecorder(), []);

  useEffect(
    () =>
      register((w) => {
        const canvas = recorder.beginRecording({ x: 0, y: 0, width: full, height: full });
        canvas.translate(pad, pad);
        brush.canvas = canvas;
        drawShots(brush, w, cell, origin);
        if (digits) drawDigits(brush, digits, w, cell, origin);
        for (const e of w.enemies) {
          if (!e.boss) drawEnemy(brush, sprites, e, cell, origin);
        }
        for (const e of w.enemies) {
          if (e.boss) drawEnemy(brush, sprites, e, cell, origin);
        }
        drawDeaths(brush, sprites, w, cell, origin);
        setPicture(recorder.finishRecordingAsPicture());
      }),
    [register, recorder, brush, sprites, digits, cell, origin, pad, full],
  );

  return (
    <SkiaPictureView
      picture={picture}
      pointerEvents="none"
      style={{ position: 'absolute', left: -pad, top: -pad, width: full, height: full }}
    />
  );
});


function makeDigits(face: SkTypeface, cell: number): Digits {
  const digit = (px: number, color: string): DigitFont => {
    const font = Skia.Font(face, px);
    const m = font.getMetrics();
    return { font, ascent: -m.ascent, height: m.descent - m.ascent + m.leading, color };
  };
  const text = Skia.Paint();
  text.setAntiAlias(true);
  const shade = Skia.Paint();
  shade.setAntiAlias(true);
  // 글자 그림자 반경 4 와 같은 번짐 - 흐림의 표준편차는 반경의 절반이다
  shade.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 2, true));
  return {
    hit: digit(cell * 0.28, '#ffffff'),
    slow: digit(cell * 0.24, '#8cd8f5'),
    text,
    shade,
  };
}

/** 공격 연출 (`attacks.tsx`) */
function drawShots(b: Brush, w: DefWorld, cell: number, origin: number) {
  for (const fx of w.effects) {
    if (fx.kind !== 'shot' || !fx.from || !fx.by) continue;
    const to = pathPoint(fx.t);
    drawAttack(
      b,
      attackOf(fx.by),
      (fx.from.x + origin) * cell,
      (fx.from.y + origin) * cell,
      (to.x + origin) * cell,
      (to.y + origin) * cell,
      1 - fx.life / fx.maxLife,
      cell,
      IMPACT[unitDef(fx.by).tier],
      /*
        쏜 유닛이 어느 쪽을 보고 있었는가 (`value` 에 실어 보낸다).

        총은 **몸에 붙어 있다.** 총구를 표적 쪽으로 잡으면 적이 위에 있을 때
        불꽃이 머리 위에서 터진다. 몸이 보는 쪽으로 총구 자리를 잡고, 불꽃과
        총알만 표적 쪽으로 돌린다.
      */
      fx.value < 0 ? -1 : 1,
    );
  }
}

/**
 * 맞은 자리에 떠오르는 숫자.
 *
 * 한때 숫자 뒤에 노란 별을 터뜨렸다. 뺐다 - 참고한 원랜디에는 피해
 * 숫자 자체가 없고(체력바와 이펙트뿐이다), 별까지 붙이니 판이 노란
 * 딱지로 뒤덮여 정작 이펙트가 안 보였다.
 *
 * 남긴 둘:
 *   흩기 - 여러 대가 동시에 맞으면 숫자가 겹쳐 한 덩어리로 보인다.
 *        맞은 자리마다 조금씩 다른 곳에 띄운다 (id 로 정하니 흔들리지 않는다)
 *   튀기 - 처음 20% 동안 커졌다가 제 크기로 돌아온다
 */
function drawDigits(b: Brush, d: Digits, w: DefWorld, cell: number, origin: number) {
  const { canvas } = b;
  for (const fx of w.effects) {
    if (fx.kind !== 'hit' && fx.kind !== 'slow') continue;
    const f = fx.kind === 'slow' ? d.slow : d.hit;
    const p = pathPoint(fx.t);
    const k = 1 - fx.life / fx.maxLife;
    // id 로 흩는다 - 매 프레임 새로 뽑으면 숫자가 떨린다
    const jitterX = ((fx.id * 37) % 100) / 100 - 0.5;
    const jitterY = ((fx.id * 17) % 100) / 100 - 0.5;
    const pop = k < 0.2 ? 1.45 - k * 2.25 : 1;
    const x = (p.x + origin) * cell + jitterX * cell * 0.5;
    const y = (p.y + origin) * cell - cell * 0.5 + jitterY * cell * 0.3 - k * 26;
    const label = fmt(fx.value);
    const left = -f.font.getTextWidth(label) / 2;
    const base = f.ascent - f.height / 2;
    const alpha = 1 - k * k;

    // 글줄 가운데를 잡고 키운다 - y 는 글줄 윗선이다
    canvas.save();
    canvas.translate(x, y + f.height / 2);
    if (pop !== 1) canvas.scale(pop, pop);
    ink(b, d.shade, DIGIT_SHADE, alpha);
    canvas.drawText(label, left, base + 2, d.shade, f.font);
    ink(b, d.text, f.color, alpha);
    canvas.drawText(label, left, base, d.text, f.font);
    canvas.restore();
  }
}

/**
 * 적 한 마리. 위에서부터 체력바 → 그림 → 발밑 그림자 한 덩이다.
 *
 * 그림은 `characters.tsx` 의 SVG 를 구운 것이다. 💀 같은 이모지는 OS 가 그린
 * 3D 스티커라 손으로 그린 판 위에서 혼자 다른 게임에서 온 것처럼 보였다.
 */
function drawEnemy(
  b: Brush,
  sprites: Record<string, Sprite | null>,
  e: DefEnemy,
  cell: number,
  origin: number,
) {
  const { canvas } = b;
  const p = pathPoint(e.t);
  const boss = e.boss;
  const size = cell * (boss ? 0.9 : 0.62);
  const hpH = boss ? 5 : 3.5;
  /** 맞은 세기. 맞는 순간 1 이고 0.12초에 걸쳐 0 으로 떨어진다 */
  const hit = Math.max(0, Math.min(1, e.flash / HIT_FLASH));

  let x = (p.x + origin) * cell;
  let top = (p.y + origin) * cell - cell * (boss ? 0.45 : 0.3);
  /*
    맞으면 가던 쪽 반대로 밀린다.

    트랙이 곡선이라 '뒤'가 고정된 방향이 아니다 - 조금 앞의 점을 찍어 가는
    방향을 구하고 그 반대로 민다. 아주 조금만 민다. 크게 밀면 줄이 흐트러진다.
  */
  if (hit > 0) {
    const ahead = pathPoint(e.t + 0.004);
    const dx = ahead.x - p.x;
    const dy = ahead.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const back = hit * cell * 0.1;
    x -= (dx / len) * back;
    top -= (dy / len) * back;
  }

  /*
    맞으면 옆으로 퍼지고 납작해진다.

    커지기만 하면 '커졌다'로 읽힌다. 눌렸다 돌아와야 맞은 것으로 보인다.
    발밑을 잡고 눌러야 바닥에 붙어 있는 것처럼 보인다 - 가운데를 잡으면 뜬다.
  */
  const squash = hit > 0;
  if (squash) {
    const foot = top + hpH + size;
    canvas.save();
    canvas.translate(x, foot);
    canvas.scale(1 + hit * 0.22, 1 - hit * 0.16);
    canvas.translate(-x, -foot);
  }

  // 체력바 - 몸 폭(졸개 0.6칸, 보스 0.9칸)의 78%, 보스는 88% 에 금테
  const barW = cell * (boss ? 0.9 * 0.88 : 0.6 * 0.78);
  const barX = x - barW / 2;
  box(b, barX, top, barW, hpH, 2, HP_BACK, 1);
  const edge = boss ? 1 : 0;
  const inner = barW - edge * 2;
  const fillW = inner * Math.max(0, Math.min(1, e.hp / e.maxHp));
  if (fillW > 0) {
    // 둥근 바 안에서 잘린 네모 - 왼쪽만 둥글고, 끝까지 차야 오른쪽도 둥글다
    const r = 2 - edge;
    const end = fillW > inner - r ? r : 0;
    ink(b, b.fill, boss ? HP_FILL_BOSS : HP_FILL, 1);
    canvas.drawRRect(
      {
        rect: { x: barX + edge, y: top + edge, width: fillW, height: hpH - edge * 2 },
        topLeft: { x: r, y: r },
        topRight: { x: end, y: end },
        bottomRight: { x: end, y: end },
        bottomLeft: { x: r, y: r },
      },
      b.fill,
    );
  }
  if (boss) {
    ink(b, b.stroke, HP_EDGE_BOSS, 1);
    b.stroke.setStrokeWidth(1);
    canvas.drawRRect(
      { rect: { x: barX + 0.5, y: top + 0.5, width: barW - 1, height: hpH - 1 }, rx: 1.5, ry: 1.5 },
      b.stroke,
    );
  }

  // 감속 중이면 그림과 그림자가 흐려진다
  const dim = e.slow > 0 ? 0.62 : 1;
  const sprite = sprites[e.defId];
  if (sprite) {
    /*
      걷는 칸을 **트랙 위치로** 고른다.

      시계로 고르면 다들 같은 박자로 걸어서 한 몸처럼 보인다. 제가 간 거리로
      고르면 느린 놈은 느리게 빠른 놈은 빠르게 걷고, 줄도 안 맞는다.
    */
    const fw = sprite.src.width / WALK_FRAMES;
    const f = Math.floor(e.t * WALK_FRAMES * WALK_CYCLES) % WALK_FRAMES;
    const src = { x: f * fw, y: 0, width: fw, height: sprite.src.height };
    /*
      가는 쪽을 본다.

      그림은 왼쪽을 보고 걷는다. 트랙 오른쪽 변에서는 오른쪽으로 가니 그대로
      두면 뒷걸음질친다. 조금 앞의 점을 찍어 가로 방향을 보고 뒤집는다.
    */
    const next = pathPoint(e.t + 0.004);
    const turn = next.x > p.x;
    if (turn) {
      canvas.save();
      canvas.translate(x * 2, 0);
      canvas.scale(-1, 1);
    }
    const dest = { x: x - size / 2, y: top + hpH, width: size, height: size };
    b.image.setAlphaf(dim);
    canvas.drawImageRectOptions(sprite.image, src, dest, FilterMode.Linear, MipmapMode.None, b.image);
    /*
      맞는 순간 흰색으로 번쩍인다.

      예전에는 반투명해졌는데, 옅어지는 건 '사라지는 중'으로 읽힌다. 같은 그림을
      흰색으로 한 겹 덧씌우면 짧게 하얗게 튀었다가 제 색으로 돌아온다.
    */
    if (hit > 0) {
      b.tinted.setColorFilter(b.tint('#ffffff'));
      b.tinted.setAlphaf(hit * 0.85);
      canvas.drawImageRectOptions(sprite.image, src, dest, FilterMode.Linear, MipmapMode.None, b.tinted);
    }
    if (turn) canvas.restore();
  }
  // 발밑 그림자 - 발끝에 살짝 걸친다
  box(b, x - size * 0.25, top + hpH + size * 0.9, size * 0.5, size * 0.14, size * 0.25, FOOT_SHADOW, dim);

  /*
    기절 표시.

    멈춰 있는 것만으로는 '왜 안 오지'가 안 보인다. 머리 위에 노란 고리를
    띄우면 붙잡혀 있다는 게 읽힌다 - 감속(파란 숫자)과 색으로 갈라 둔다.
  */
  if (e.stun > 0) ring(b, x, top - 0.5, 13, 2.5, STUN, 1);

  if (squash) canvas.restore();
}

/**
 * 죽은 자리.
 *
 * 적이 목록에서 빠지는 걸로 끝나면 '사라졌다'로만 보인다. 잡는 맛이 제일 크게
 * 죽는 자리였다. 몸이 한 번 부풀며 흰빛으로 흩어지고, 먼지 고리가 퍼지고, 조각이
 * 사방으로 튄다. 0.3초면 끝나서 판은 안 어지럽다.
 */
function drawDeaths(
  b: Brush,
  sprites: Record<string, Sprite | null>,
  w: DefWorld,
  cell: number,
  origin: number,
) {
  const { canvas } = b;
  for (const fx of w.effects) {
    if (fx.kind !== 'die') continue;
    const k = 1 - fx.life / fx.maxLife;
    const fade = 1 - k;
    const p = pathPoint(fx.t);
    const x = (p.x + origin) * cell;
    const y = (p.y + origin) * cell;
    const boss = fx.value === 1;
    const size = cell * (boss ? 0.9 : 0.62) * (1 + k * 0.55);

    const sprite = sprites[fx.by ?? ''];
    if (sprite) {
      b.tinted.setColorFilter(b.tint('#ffffff'));
      b.tinted.setAlphaf(fade * 0.85);
      // 걷는 띠의 **첫 칸**만 쓴다. 띠 전체를 찍으면 열두 마리가 겹쳐 나온다
      const fw = sprite.src.width / WALK_FRAMES;
      canvas.drawImageRectOptions(
        sprite.image,
        { x: 0, y: 0, width: fw, height: sprite.src.height },
        { x: x - size / 2, y: y - size / 2, width: size, height: size },
        FilterMode.Linear,
        MipmapMode.None,
        b.tinted,
      );
    }
    ring(b, x, y, cell * (0.45 + k * 1.2), cell * 0.07 * fade, '#ffffff', 0.5 * fade);
    // 사방으로 튀는 조각. id 로 각도를 흩어 두면 여럿이 같이 죽어도 안 겹친다
    const reach = cell * (0.25 + k * 0.6);
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + fx.id;
      blob(b, x + Math.cos(a) * reach, y + Math.sin(a) * reach, cell * 0.1 * fade, '#ffe9c0', 0.85 * fade);
    }
  }
}
