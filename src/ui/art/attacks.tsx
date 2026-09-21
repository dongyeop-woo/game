import { FilterMode, MipmapMode } from '@shopify/react-native-skia';

import type { Tier } from '../../game/progress';
import { bar, blob, ring, tri, type Brush } from './brush';
import { BULLET, FX, MUZZLE } from './fx';

/**
 * 유닛마다 다른 공격 연출.
 *
 * 판에 선 유닛은 움직이지 않는다 - 열여섯 개를 매 프레임 다시 그리면 프레임이
 * 무너진다(그렇게 해서 60 을 벌었다). 대신 **효과 층**에만 그린다. 이 층은
 * 어차피 매 프레임 다시 그리니 공짜다. 나가는 빛, 날아가는 것, 맞는 자리 -
 * 이 셋이면 누가 무엇으로 때렸는지 다 읽힌다.
 *
 * 효과 층은 Skia 캔버스 한 장이다 (`BattleCanvas.tsx`). 막대·고리 하나가 View
 * 하나이던 때는 후반에 공격이 몰리면 View 가 수백 개씩 생겼다 사라지며 프레임이
 * 무너졌다. 모양과 수치는 그때 그대로다.
 *
 * 모양은 역할을 따른다. 활은 화살이 날고, 주술은 고리가 조이고, 근접은
 * 베는 선이 그어진다. 등급이 높을수록 크고 두껍고 오래 남는다.
 */

export type AttackKind =
  | 'slash' //  베기 - 표적에 그어지는 선
  | 'arrow' //  화살 - 짧은 선이 날아간다
  | 'orb' //    구슬 - 빛나는 덩이가 날아간다
  | 'beam' //   광선 - 한 줄로 이어진다
  | 'ring' //   고리 - 표적을 조인다
  | 'shock' //  충격파 - 두꺼운 고리가 퍼진다
  | 'cone' //   뿜기 - 부챗살로 퍼진다
  | 'bullet' // 총 - 총구 화염 + 날아가는 총알
  | 'star'; //  별 - 꽂히면서 터진다

export interface AttackStyle {
  kind: AttackKind;
  color: string;
  /** 두 번째 색 - 있으면 겹쳐 그린다 */
  glow?: string;
}

/** 등급이 오를수록 같은 동작이 크고 두꺼워진다 */
export const IMPACT: Record<Tier, number> = {
  common: 1,
  rare: 1.25,
  epic: 1.55,
  legend: 1.9,
  mythic: 2.3,
};

/*
  유닛이 전부 총 든 고양이가 되었으니 연출도 총이다 (`sprites.ts`).

  종류를 하나로 두는 대신 **색과 크기로 등급을 가른다.** 일반은 옅은 노랑,
  신화는 흰빛에 가깝다. 큰 연출은 `IMPACT` 가 등급별로 키워 준다.
*/
export const ATTACK: Record<string, AttackStyle> = {
  mouse: { kind: 'bullet', color: '#ffd98a' }, // 일반
  penguin: { kind: 'bullet', color: '#ffd98a' }, // 일반
  owl: { kind: 'bullet', color: '#ffd98a' }, // 일반
  toad: { kind: 'bullet', color: '#ffd98a' }, // 일반
  rhino: { kind: 'bullet', color: '#ffd98a' }, // 일반
  wolf: { kind: 'bullet', color: '#ffc35e', glow: '#fff0c0' }, // 희귀
  fox: { kind: 'bullet', color: '#ffc35e', glow: '#fff0c0' }, // 희귀
  crow: { kind: 'bullet', color: '#ffc35e', glow: '#fff0c0' }, // 희귀
  turtle: { kind: 'bullet', color: '#ffc35e', glow: '#fff0c0' }, // 희귀
  bear: { kind: 'bullet', color: '#9fe4ff', glow: '#e0f6ff' }, // 영웅
  ghost: { kind: 'bullet', color: '#9fe4ff', glow: '#e0f6ff' }, // 영웅
  serpent: { kind: 'bullet', color: '#9fe4ff', glow: '#e0f6ff' }, // 영웅
  griffin: { kind: 'bullet', color: '#c8a8ff', glow: '#f0e4ff' }, // 전설
  wyrm: { kind: 'bullet', color: '#c8a8ff', glow: '#f0e4ff' }, // 전설
  sage: { kind: 'bullet', color: '#ffffff', glow: '#bfe0ff' }, // 신화
};


export function attackOf(defId: string): AttackStyle {
  return ATTACK[defId] ?? { kind: 'slash', color: '#ffffff' };
}

/** 부챗살 세 갈래의 각도 */
const CONE = [-0.26, 0, 0.26];
/** 충격파에 갈라지는 금의 각도 */
const CRACKS = [0.4, 1.9, 3.5, 5.0];
/** 별이 터지는 네 갈래 - 앞의 둘이 굵다 */
const STAR = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];

/**
 * 맞는 자리에서 터지는 불티.
 *
 * 사방으로 흩어지는 점 몇 개. 하나하나는 보잘것없는데, 짧게 뻗었다 사라지면
 * '부딪혔다'가 된다. 개수는 등급을 따라 늘린다 - 큰 공격일수록 많이 튄다.
 */
function sparks(
  b: Brush,
  x: number,
  y: number,
  k: number,
  unit: number,
  color: string,
  count: number,
  seed = 0,
) {
  const reach = unit * 3 * k;
  for (let i = 0; i < count; i += 1) {
    // 고르게 퍼지되 조금씩 어긋나게 - 정확히 등분하면 바퀴살처럼 보인다
    const a = ((i + seed * 0.37) / count) * Math.PI * 2 + i * 0.7;
    const r = reach * (0.7 + ((i * 13) % 7) / 10);
    blob(b, x + Math.cos(a) * r, y + Math.sin(a) * r, unit * 0.7 * (1 - k), color, 0.85 * (1 - k));
  }
}

/**
 * 닿는 순간의 충격.
 *
 * 흰 점이 터지고 고리가 퍼진다. 모든 공격이 이걸 같이 쓰기 때문에, 무엇으로
 * 때리든 '닿았다'는 순간만은 같은 말로 읽힌다.
 *
 * @param at 0~1 중 언제 닿는가 (날아가는 공격은 늦게, 근접은 바로)
 */
function impactAt(
  b: Brush,
  x: number,
  y: number,
  k: number,
  unit: number,
  color: string,
  power: number,
  at = 0,
) {
  if (k < at) return;
  const t = Math.min(1, (k - at) / (1 - at));
  const fade = 1 - t;
  blob(b, x, y, unit * 2.2 * (1.2 - t), '#ffffff', 0.9 * fade * fade);
  ring(b, x, y, unit * 5 * t * power, unit * 0.5 * fade, color, 0.8 * fade);
  sparks(b, x, y, t, unit, color, Math.round(3 * power));
}

/**
 * 공격 한 번.
 *
 * @param k 0 에서 1 로 가는 진행도
 * @param cell 칸 한 변의 픽셀 - 모든 크기를 여기에 맞춰야 기기마다 같아 보인다
 */
/**
 * 조준하느라 몸이 기우는 각(라디안).
 *
 * 그림은 옆모습 한 장뿐이라 방향이 좌우 둘밖에 없다. 대각선으로 쏠 때도 몸이
 * 수평을 보고 있으면 총알만 따로 논다. 위아래로 **기울여서** 각을 흉내 낸다.
 *
 * 각을 그대로 주면 표적이 바로 위에 있을 때 90도로 누워 버린다. 0.62 로 눌러
 * 놓고 25도에서 자른다 - 이 정도면 조준으로 읽히고 넘어진 걸로는 안 보인다.
 *
 * 쓰는 쪽은 여기에 보는 방향(`facing`)을 곱한다. 왼쪽을 보는 유닛은 화면을
 * 뒤집어 놓은 것이라 같은 각도가 반대로 먹는다.
 */
export function leanOf(aim: number) {
  return Math.max(-0.44, Math.min(0.44, aim * 0.62));
}

/** 두 점 사이의 기울기. 겨눈 각을 이미 들고 있으면 `leanOf` 를 쓴다 */
export function aimLean(dx: number, dy: number) {
  return leanOf(Math.atan2(dy, Math.abs(dx)));
}

export function drawAttack(
  b: Brush,
  style: AttackStyle,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  k: number,
  cell: number,
  impact: number,
  /** 쏜 유닛이 보는 쪽 (-1 이면 왼쪽). 총구 자리를 잡는 데 쓴다 */
  facing: 1 | -1 = 1,
) {
  /*
    꽉 찬 채로 버티다가 훅 꺼진다.

    처음부터 옅어지게 두었더니 '스르륵 사라지는 것'이 됐다. 원랜디를 프레임
    단위로 재 보니 밝기를 0.17초쯤 그대로 물고 있다가 0.07초 만에 꺼진다 -
    버티는 구간이 있어야 한 방으로 읽힌다.
  */
  const fade = k < 0.45 ? 1 : (1 - (k - 0.45) / 0.55) ** 1.2;
  const c = style.color;
  const g = style.glow;
  /*
    굵기 단위.

    0.065 까지 내렸다가 다시 올렸다. 그때는 전설·신화의 빛줄기가 판을
    가로지르는 페인트 자국이어서 눌렀는데, 그 탓에 **일반 등급이 5픽셀**이
    되어 아예 안 보였다. 기준을 올리고 등급 승수를 더 눌러서, 일반도 보이고
    신화도 판을 안 덮게 한다.
  */
  const u = cell * 0.11 * impact ** 0.5;

  /*
    맞는 자리 연출은 **유닛보다 크게**.

    원랜디에서 재 보니 참격 한 장이 유닛 폭의 두세 배였다. 우리 건 유닛과
    비슷한 크기라 '작은 표시'로 보였다. 날아가는 줄기는 그대로 두고(굵으면
    판을 가로지르는 페인트 자국이 된다) **터지는 것만** 키운다 - 짧게
    지나가니 커도 판을 안 덮는다.
  */
  const big = u * 1.8;

  /*
    쏜 자리의 불빛.

    고리나 충격파는 표적 쪽에만 그려져서 **누가 때렸는지**가 안 보였다.
    처음 한 순간만 작게 켜 주면 눈이 그쪽을 먼저 짚는다.
  */
  if (k < 0.45) blob(b, ax, ay, u * 3.2 * (1 - k / 0.45), g ?? c, 0.55);

  switch (style.kind) {
    case 'bullet': {
      /*
        총 - 총구 화염과 총알을 따로 그린다.

        고양이 키트의 사격 동작은 총이 반동으로 튀는 게 전부다. 판 크기에서
        그것만으로는 쏘는 게 안 보여서, **총구 화염이 타격감의 대부분**을
        맡는다. 화염은 앞의 40% 동안만 띠를 훑고 사라지고, 총알은 끝까지 난다.

        화염은 총구에 붙어 있어야 한다 - 유닛 한가운데에서 시작하면 배에서
        불이 난다.
      */
      /*
        총구는 **몸에 붙어 있다.**

        표적 쪽으로 잡으면 적이 위에 있을 때 머리 위에서 불이 난다. 유닛이
        서 있는 방향으로 총구 자리를 잡고, 불꽃과 총알만 표적 쪽으로 돌린다.
        0.26 은 구운 그림에서 총열 끝이 가운데에서 떨어진 거리다.
      */
      // 총구 자리도 기운 만큼 같이 돈다. 몸이 위를 겨누면 총도 위로 간다
      const lean = facing * aimLean(bx - ax, by - ay);
      const ox = facing * cell * 0.24;
      const oy = cell * 0.05;
      const muzzleX = ax + ox * Math.cos(lean) - oy * Math.sin(lean);
      const muzzleY = ay + ox * Math.sin(lean) + oy * Math.cos(lean);
      const far = Math.hypot(bx - muzzleX, by - muzzleY) || 1;
      const ux = (bx - muzzleX) / far;
      const uy = (by - muzzleY) / far;
      const a = Math.atan2(by - muzzleY, bx - muzzleX);

      // 총알 - 총구에서 표적까지
      const blen = cell * 0.2 * impact ** 0.18;
      const hx = muzzleX + (bx - muzzleX) * k;
      const hy = muzzleY + (by - muzzleY) * k;
      if (b.bullet) {
        const h = blen * BULLET.ratio;
        b.tinted.setAlphaf(fade);
        b.tinted.setColorFilter(b.tint(c));
        b.canvas.save();
        b.canvas.translate(hx, hy);
        b.canvas.rotate((a * 180) / Math.PI, 0, 0);
        b.canvas.drawImageRectOptions(
          b.bullet.image,
          b.bullet.src,
          { x: -blen / 2, y: -h / 2, width: blen, height: h },
          FilterMode.Linear,
          MipmapMode.Linear,
          b.tinted,
        );
        b.canvas.restore();
      } else {
        bar(b, hx - ux * blen * 0.5, hy - uy * blen * 0.5, hx, hy, u * 0.45, c, fade);
      }

      // 총구 화염 - 앞의 40% 동안 여덟 칸을 훑는다
      if (b.muzzle && k < 0.4) {
        const f = Math.min(MUZZLE.frames - 1, Math.floor((k / 0.4) * MUZZLE.frames));
        const fw = b.muzzle.src.width / MUZZLE.frames;
        const w = cell * 0.62 * impact ** 0.2;
        const h = w * MUZZLE.ratio;
        b.image.setAlphaf(1);
        b.canvas.save();
        b.canvas.translate(muzzleX, muzzleY);
        b.canvas.rotate((a * 180) / Math.PI, 0, 0);
        b.canvas.drawImageRectOptions(
          b.muzzle.image,
          { x: f * fw, y: 0, width: fw, height: b.muzzle.src.height },
          { x: -w * 0.12, y: -h / 2, width: w, height: h },
          FilterMode.Linear,
          MipmapMode.Linear,
          b.image,
        );
        b.canvas.restore();
      }
      impactAt(b, bx, by, k, big, c, impact, 0.7);
      return;
    }

    case 'arrow': {
      /*
        화살 그림을 날아가는 방향으로 돌려 그린다.

        예전엔 대·촉·깃을 도형으로 그렸는데, 3D 로 구운 유닛 옆에서 납작해
        보였다. 그림은 색이 들어간 것을 그대로 쓴다 - 나무와 쇠에 유닛 색을
        덧씌우면 탁해진다.

        **손에서 나가야 한다.** 쏘는 자리는 유닛 한가운데로 들어오는데, 거기에
        촉을 두면 화살 한 자루가 통째로 몸 뒤로 뻗는다. 그래서 두 번 민다 -
        먼저 표적 쪽으로 손 길이만큼, 다음에 화살 반 자루만큼. 그러면 처음
        그림에서 꼬리가 손에 걸리고 촉이 앞을 본다.
      */
      const far = Math.hypot(bx - ax, by - ay) || 1;
      const ux = (bx - ax) / far;
      const uy = (by - ay) / far;
      const sprite = FX.arrow;
      // 유닛 폭이 칸의 0.56 배다. 화살이 그보다 길면 눈이 화살만 따라간다
      const len = cell * 0.5 * impact ** 0.15;
      const hand = cell * 0.22;
      const sx = ax + ux * (hand + len * 0.5);
      const sy = ay + uy * (hand + len * 0.5);
      const hx = sx + (bx - sx) * k;
      const hy = sy + (by - sy) * k;
      const a = Math.atan2(by - ay, bx - ax);

      if (sprite && b.arrow) {
        const h = len * sprite.ratio;
        b.image.setAlphaf(1);
        b.canvas.save();
        b.canvas.translate(hx - (ux * len) / 2, hy - (uy * len) / 2);
        b.canvas.rotate((a * 180) / Math.PI, 0, 0);
        b.canvas.drawImageRectOptions(
          b.arrow.image,
          b.arrow.src,
          { x: -len / 2, y: -h / 2, width: len, height: h },
          FilterMode.Linear,
          MipmapMode.Linear,
          b.image,
        );
        b.canvas.restore();
        impactAt(b, bx, by, k, big, c, impact, 0.72);
        return;
      }

      // 그림을 아직 못 읽었을 때 - 도형으로 대신 그린다
      bar(b, hx - ux * len, hy - uy * len, hx - ux * u * 1.6, hy - uy * u * 1.6, u * 0.5, '#d9c9a8', 0.95);
      tri(
        b,
        hx,
        hy,
        hx - ux * u * 2 - uy * u * 0.9,
        hy - uy * u * 2 + ux * u * 0.9,
        hx - ux * u * 2 + uy * u * 0.9,
        hy - uy * u * 2 - ux * u * 0.9,
        c,
        0.98,
      );
      impactAt(b, bx, by, k, big, c, impact, 0.72);
      return;
    }
    case 'orb': {
      // 구슬도 손에서 나간다 - 한가운데서 나오면 배에서 튀어나오는 것처럼 보인다
      const reach = Math.hypot(bx - ax, by - ay) || 1;
      const sx = ax + ((bx - ax) / reach) * cell * 0.22;
      const sy = ay + ((by - ay) / reach) * cell * 0.22;
      const hx = sx + (bx - sx) * k;
      const hy = sy + (by - sy) * k;

      /*
        그림이 있으면 그림으로 날린다.

        코드로 그린 동그라미는 아무리 겹을 쌓아도 '점'이다. 불꽃은 모양이
        불규칙해야 불꽃으로 보이는데 그건 그려야만 나온다. 그림은 흰색이라
        색 필터(`brush.tint`)로 유닛 색을 입힌다 - 여우는 주황, 두꺼비는 보라.

        머리가 그림의 오른쪽 끝에 있으니, 가운데를 머리보다 반 칸 뒤에 둔다.
      */
      const sprite = FX.fireball;
      if (sprite && b.fire) {
        const len = cell * 1.05 * impact ** 0.4;
        const h = len * sprite.ratio;
        const a = Math.atan2(by - ay, bx - ax);
        b.tinted.setColorFilter(b.tint(c));
        b.tinted.setAlphaf(0.95);
        b.canvas.save();
        b.canvas.translate(hx - (Math.cos(a) * len) / 2, hy - (Math.sin(a) * len) / 2);
        b.canvas.rotate((a * 180) / Math.PI, 0, 0);
        b.canvas.drawImageRectOptions(
          b.fire.image,
          b.fire.src,
          { x: -len / 2, y: -h / 2, width: len, height: h },
          FilterMode.Linear,
          MipmapMode.Linear,
          b.tinted,
        );
        b.canvas.restore();
        impactAt(b, bx, by, k, big, c, impact, 0.7);
        return;
      }

      if (g) blob(b, hx, hy, u * 4, g, 0.28);
      blob(b, hx, hy, u * 2, c, 0.95);
      // 꼬리 - 지나온 자리에 옅게 남는다
      for (let i = 0; i < 2; i += 1) {
        const back = Math.max(0, k - 0.12 * (i + 1));
        blob(b, ax + (bx - ax) * back, ay + (by - ay) * back, u * (1.4 - i * 0.4), c, 0.35 - i * 0.12);
      }
      impactAt(b, bx, by, k, big, c, impact, 0.7);
      return;
    }
    case 'beam': {
      // 한 줄로 이어졌다가 얇아지며 사라진다
      if (g) bar(b, ax, ay, bx, by, u * 2.4 * fade, g, 0.26 * fade);
      bar(b, ax, ay, bx, by, u * fade, c, 0.9 * fade);
      // 줄기를 타고 흐르는 밝은 점 - 빛이 지나가는 것처럼 보인다
      blob(b, ax + (bx - ax) * k, ay + (by - ay) * k, u * 1.8, '#ffffff', 0.8 * fade);
      impactAt(b, bx, by, k, big, c, impact, 0.15);
      return;
    }
    case 'cone': {
      // 부챗살 - 표적 쪽으로 세 갈래
      const a = Math.atan2(by - ay, bx - ax);
      const len = Math.hypot(bx - ax, by - ay) * (0.5 + k * 0.6);
      for (let i = 0; i < CONE.length; i += 1) {
        const ex = ax + Math.cos(a + CONE[i]) * len;
        const ey = ay + Math.sin(a + CONE[i]) * len;
        bar(b, ax, ay, ex, ey, u * (i === 1 ? 1.5 : 1), i === 1 ? c : (g ?? c), 0.75 * fade);
      }
      sparks(b, ax + Math.cos(a) * len, ay + Math.sin(a) * len, k, big, g ?? c, Math.round(4 * impact), 1);
      return;
    }
    case 'ring': {
      // 표적을 조여 온다 - 밖에서 안으로
      const size = big * 5 * (1.15 - k * 0.7);
      ring(b, bx, by, size, u * 0.55, c, 0.9 * fade);
      if (g) ring(b, bx, by, size * 1.35, u * 0.35, g, 0.5 * fade);
      impactAt(b, bx, by, k, big, c, impact, 0.5);
      return;
    }
    case 'shock': {
      // 안에서 밖으로 퍼지는 두꺼운 고리
      const size = big * 6 * (0.25 + k);
      ring(b, bx, by, size, u * 0.9 * fade, c, 0.85 * fade);
      if (g) ring(b, bx, by, size * 0.6, u * 0.8 * fade, g, 0.7 * fade);
      // 갈라진 금 - 충격파는 땅이 갈라져야 무게가 산다
      for (const a2 of CRACKS) {
        bar(
          b,
          bx + Math.cos(a2) * size * 0.3,
          by + Math.sin(a2) * size * 0.3,
          bx + Math.cos(a2) * size * 0.62,
          by + Math.sin(a2) * size * 0.62,
          u * 0.45 * fade,
          c,
          0.7 * fade,
        );
      }
      impactAt(b, bx, by, k, big, c, impact, 0.1);
      return;
    }
    case 'star': {
      // 위에서 꽂히고 네 갈래로 터진다
      const drop = cell * 1.2 * (1 - k);
      const r = big * 4 * k;
      bar(b, bx, by - drop - cell * 0.5, bx, by - drop, u * 0.9, c, 0.9 * (1 - k));
      for (let i = 0; i < STAR.length; i += 1) {
        const a = STAR[i];
        bar(
          b,
          bx - Math.cos(a) * r,
          by - Math.sin(a) * r,
          bx + Math.cos(a) * r,
          by + Math.sin(a) * r,
          u * (i < 2 ? 0.8 : 0.5),
          i < 2 ? c : (g ?? c),
          0.9 * fade,
        );
      }
      ring(b, bx, by, r * 1.6, u * 0.5, g ?? c, 0.6 * fade);
      impactAt(b, bx, by, k, big, c, impact * 1.3, 0.35);
      return;
    }
    case 'slash':
    default: {
      // 표적 위에 그어지는 선 - 두 번째 색이 있으면 엇갈려 두 번
      const r = big * 2.5 * (0.7 + k * 0.5);
      const a = Math.atan2(by - ay, bx - ax) + 0.6;
      bar(
        b,
        bx - Math.cos(a) * r,
        by - Math.sin(a) * r,
        bx + Math.cos(a) * r,
        by + Math.sin(a) * r,
        u * 0.75,
        c,
        0.95 * fade,
      );
      if (g) {
        bar(
          b,
          bx - Math.cos(a - 1.2) * r,
          by - Math.sin(a - 1.2) * r,
          bx + Math.cos(a - 1.2) * r,
          by + Math.sin(a - 1.2) * r,
          u * 0.6,
          g,
          0.8 * fade,
        );
      }
      impactAt(b, bx, by, k, big, c, impact, 0.05);
    }
  }
}
