import React from 'react';

import { SpriteStill } from './sprite';
import { avatarSpriteFor } from './sprites';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import type { AvatarDef, Crown, Ear, Eye } from '../../game/avatars';

/**
 * 아바타(전설이) 아트.
 *
 * 14종을 파일 14개로 그리지 않는다. 뼈대는 하나로 고정하고 색 + 귀 + 머리 장식 +
 * 눈만 갈아 끼운다. 새 아바타는 avatars.ts 에 줄 하나를 더하면 바로 그려진다.
 *
 * 처음엔 머리와 몸을 통짜 달걀 하나로 그렸는데 실루엣이 밋밋하고 눈이 몸 위에
 * 떠 있어 못생겨 보였다. 지금 뼈대는 이렇게 나눈다:
 *
 *   머리(큰 원)가 몸(작은 타원) 위에 얹힌다  -> 2등신, 아기 비율
 *   머리 안에 밝은 얼굴 바탕                 -> 눈이 얹힐 자리
 *   부리와 발은 따뜻한 강조색                -> 차가운 몸 색과 대비되는 포인트
 *
 * 세로 예산 (viewBox 0 0 64 64):
 *   머리 장식 0~14 / 귀 5~24 / 머리 9~45 / 몸 33~60 / 발 55~61
 * 장식이 y<0 으로 나가면 잘리므로 이 범위를 지킬 것.
 */

const OL = '#181324';
const line = { stroke: OL, strokeWidth: 2.3, strokeLinejoin: 'round' as const };
const thin = { stroke: OL, strokeWidth: 1.7, strokeLinejoin: 'round' as const };

/** hex 두 색을 섞는다 (0 = a, 1 = b) */
function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a);
  const [r2, g2, b2] = p(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** 머리 중심과 반지름 - 귀·장식이 전부 여기에 붙는다 */
const HEAD = { x: 32, y: 27, r: 17 };

/**
 * 아바타 그림.
 *
 * 구운 시트의 첫 장을 쓴다 (`sprites.ts` 의 `AVATAR_SPRITES`). SVG 는 14종을
 * 뼈대 하나로 조합하는 방식이라 자산이 0 이지만 그만큼 다 비슷하게 생겼다 -
 * 그림이 있는 종은 그림을 쓰고, 없는 종만 지금까지처럼 그린다.
 */
export function AvatarArt({ def, size = 120 }: { def: AvatarDef; size?: number }) {
  const sprite = avatarSpriteFor(def.id);
  if (sprite) {
    return <SpriteStill set={sprite} size={size} />;
  }

  const [light, dark] = def.body;
  // 그라데이션 id 는 문서 전체에서 고유해야 한다. 여러 개를 동시에 그리는
  // 화면(보유 목록)에서 겹치면 엉뚱한 색이 나온다.
  const uid = def.id;
  const headId = `h-${uid}`;
  const bodyId = `b-${uid}`;
  const faceId = `f-${uid}`;
  const earId = `e-${uid}`;

  const hi = mix(light, '#ffffff', 0.4);
  const faceLight = mix(def.belly, '#ffffff', 0.35);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={headId} cx="34%" cy="24%" r="82%">
          <Stop offset="0" stopColor={hi} />
          <Stop offset="0.52" stopColor={light} />
          <Stop offset="1" stopColor={dark} />
        </RadialGradient>
        <RadialGradient id={bodyId} cx="36%" cy="20%" r="86%">
          <Stop offset="0" stopColor={light} />
          <Stop offset="1" stopColor={dark} />
        </RadialGradient>
        <RadialGradient id={earId} cx="40%" cy="28%" r="82%">
          <Stop offset="0" stopColor={mix(light, '#ffffff', 0.22)} />
          <Stop offset="1" stopColor={dark} />
        </RadialGradient>
        {/* 얼굴 바탕 - 가운데가 밝고 가장자리가 살짝 가라앉아야 볼록해 보인다 */}
        <RadialGradient id={faceId} cx="50%" cy="34%" r="72%">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="0.6" stopColor={faceLight} />
          <Stop offset="1" stopColor={def.belly} />
        </RadialGradient>
      </Defs>

      {/* 접지 그림자 */}
      <Ellipse cx="32" cy="59.8" rx="18" ry="3.2" fill="#0d0a1c" opacity={0.22} />

      <Tail kind={def.ear} dark={dark} />

      {/* --------------------------------------------------------------- 몸 */}
      <Ellipse cx="32" cy="47.5" rx="15" ry="12.5" fill={`url(#${bodyId})`} {...line} />
      {/* 배 - 몸보다 밝은 앞판 */}
      <Ellipse cx="32" cy="49.5" rx="9.6" ry="9" fill={def.belly} opacity={0.9} />
      {/* 발 - 강조색이라 시선이 아래로도 간다 */}
      <Ellipse cx="24" cy="58" rx="5.4" ry="3.2" fill={def.accent} {...thin} />
      <Ellipse cx="40" cy="58" rx="5.4" ry="3.2" fill={def.accent} {...thin} />
      {/* 팔 */}
      <Ellipse cx="20.2" cy="47.5" rx="4.3" ry="5.4" fill={light} {...thin} transform="rotate(-14 20.2 47.5)" />
      <Ellipse cx="43.8" cy="47.5" rx="4.3" ry="5.4" fill={light} {...thin} transform="rotate(14 43.8 47.5)" />

      <Ears kind={def.ear} fill={`url(#${earId})`} inner={mix(def.belly, light, 0.35)} />

      {/* ------------------------------------------------------------- 머리 */}
      <Circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={`url(#${headId})`} {...line} />
      {/* 위쪽 림라이트 */}
      <Path
        d="M17.5 25 C19 16 25 11.5 32 11.5 C39 11.5 45 16 46.5 25"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.3}
        strokeOpacity={0.36}
        strokeLinecap="round"
      />
      {/* 얼굴 바탕 - 눈이 여기 얹혀야 몸에 떠 있지 않다 */}
      <Ellipse
        cx="32"
        cy="30"
        rx="12.4"
        ry="10.6"
        fill={`url(#${faceId})`}
        stroke={dark}
        strokeWidth={1.1}
        strokeOpacity={0.35}
      />

      <Eyes kind={def.eye} />

      {/* 부리 - 얼굴 한가운데 따뜻한 강조색. 이게 없으면 밋밋하다 */}
      <Path
        d="M26.2 34.4 L37.8 34.4 L32 41.6 Z"
        fill={def.accent}
        stroke={OL}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />

      {/* 볼터치 */}
      <Ellipse cx="20.6" cy="34.8" rx="3.5" ry="2.2" fill="#ff8fa8" opacity={0.34} />
      <Ellipse cx="43.4" cy="34.8" rx="3.5" ry="2.2" fill="#ff8fa8" opacity={0.34} />

      <CrownArt kind={def.crown} />
    </Svg>
  );
}

// ------------------------------------------------------------------- 귀

/** 머리(중심 32,27 반지름 17) 위쪽에 붙는다 */
function Ears({ kind, fill, inner }: { kind: Ear; fill: string; inner: string }) {
  switch (kind) {
    case 'mouse':
      return (
        <G>
          <Circle cx="18.5" cy="15.5" r="8.2" fill={fill} {...line} />
          <Circle cx="45.5" cy="15.5" r="8.2" fill={fill} {...line} />
          <Circle cx="19.2" cy="16.2" r="4.4" fill={inner} opacity={0.9} />
          <Circle cx="44.8" cy="16.2" r="4.4" fill={inner} opacity={0.9} />
        </G>
      );
    case 'cat':
      return (
        <G>
          <Path d="M18 21 L15.5 6 L31 14 Z" fill={fill} {...line} />
          <Path d="M46 21 L48.5 6 L33 14 Z" fill={fill} {...line} />
          <Path d="M19.4 17.6 L18.2 9.8 L26 14 Z" fill={inner} opacity={0.85} />
          <Path d="M44.6 17.6 L45.8 9.8 L38 14 Z" fill={inner} opacity={0.85} />
        </G>
      );
    case 'fox':
      return (
        <G>
          <Path d="M17.5 22 L13.5 6 L31 15 Z" fill={fill} {...line} />
          <Path d="M46.5 22 L50.5 6 L33 15 Z" fill={fill} {...line} />
          <Path d="M18.6 18 L16 9 L25 14 Z" fill={inner} opacity={0.7} />
          <Path d="M45.4 18 L48 9 L39 14 Z" fill={inner} opacity={0.7} />
        </G>
      );
    case 'rabbit':
      return (
        <G>
          <Ellipse cx="24" cy="11" rx="4.4" ry="10.4" fill={fill} {...line} transform="rotate(-12 24 11)" />
          <Ellipse cx="40" cy="11" rx="4.4" ry="10.4" fill={fill} {...line} transform="rotate(12 40 11)" />
          <Ellipse cx="24.4" cy="11.8" rx="2.1" ry="6.8" fill={inner} opacity={0.9} transform="rotate(-12 24.4 11.8)" />
          <Ellipse cx="39.6" cy="11.8" rx="2.1" ry="6.8" fill={inner} opacity={0.9} transform="rotate(12 39.6 11.8)" />
        </G>
      );
    case 'owl':
      return (
        <G>
          <Path d="M20 19 L15 7.5 L22.5 10 L26.5 15 Z" fill={fill} {...line} />
          <Path d="M44 19 L49 7.5 L41.5 10 L37.5 15 Z" fill={fill} {...line} />
        </G>
      );
    case 'dragon':
      return (
        <G>
          <Path d="M19 19 C11 17.5 7 12 7 6.5 C12 9.5 17 10.5 22 12.5 Z" fill={fill} {...line} />
          <Path d="M45 19 C53 17.5 57 12 57 6.5 C52 9.5 47 10.5 42 12.5 Z" fill={fill} {...line} />
        </G>
      );
    default:
      return null;
  }
}

// ----------------------------------------------------------------- 꼬리

function Tail({ kind, dark }: { kind: Ear; dark: string }) {
  switch (kind) {
    case 'cat':
      return (
        <Path
          d="M46 52 C56 51 58 41 53 36"
          fill="none"
          stroke={OL}
          strokeWidth={5.4}
          strokeLinecap="round"
        />
      );
    case 'mouse':
      return (
        <Path
          d="M45 53 C54 53 56.5 45 52.5 40"
          fill="none"
          stroke={dark}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      );
    case 'fox':
      return <Ellipse cx="50" cy="49" rx="6.6" ry="9.4" fill={dark} {...line} transform="rotate(26 50 49)" />;
    case 'rabbit':
      return <Circle cx="48.5" cy="54" r="4.8" fill={dark} {...line} />;
    case 'dragon':
      return (
        <Path d="M45 55 C53 55 57 49 56 42 L51 47 C50 51 47 52 44 52 Z" fill={dark} {...line} />
      );
    default:
      return null;
  }
}

// ------------------------------------------------------------------- 눈

/**
 * 눈이 귀여움의 절반이다.
 *
 * 홍채를 화려하게 굴리는 것보다 **크고 새까맣고 하이라이트 하나**가 훨씬 귀엽다
 * (전설이·캐주얼 마스코트가 전부 이 방식이다). 얼굴 바탕 위에 얹혀야 하므로
 * 위치는 머리 중심(32, 27)을 기준으로 잡는다.
 */
function Eyes({ kind }: { kind: Eye }) {
  const L = 24.3;
  const R = 39.7;
  const Y = 28.2;

  if (kind === 'sleepy') {
    return (
      <G fill="none" stroke={OL} strokeWidth={2.4} strokeLinecap="round">
        <Path d={`M${L - 4.2} ${Y - 0.6} Q${L} ${Y + 4} ${L + 4.2} ${Y - 0.6}`} />
        <Path d={`M${R - 4.2} ${Y - 0.6} Q${R} ${Y + 4} ${R + 4.2} ${Y - 0.6}`} />
      </G>
    );
  }

  const fierce = kind === 'fierce';
  const sparkle = kind === 'sparkle';

  return (
    <G>
      {[L, R].map((cx, i) => (
        <G key={i}>
          <Ellipse cx={cx} cy={Y} rx={4.5} ry={5.3} fill="#1a1530" />
          <Circle cx={cx - 1.4} cy={Y - 1.8} r={2} fill="#ffffff" />
          {sparkle ? (
            <Polygon
              points={`${cx + 2},${Y - 3.6} ${cx + 2.6},${Y - 2.3} ${cx + 3.9},${Y - 1.7} ${cx + 2.6},${Y - 1.1} ${cx + 2},${Y + 0.2} ${cx + 1.4},${Y - 1.1} ${cx + 0.1},${Y - 1.7} ${cx + 1.4},${Y - 2.3}`}
              fill="#ffffff"
            />
          ) : null}
        </G>
      ))}
      {fierce ? (
        <G stroke={OL} strokeWidth={2.2} strokeLinecap="round">
          <Path d={`M${L - 4.8} ${Y - 8.6} L${L + 3.8} ${Y - 7}`} />
          <Path d={`M${R + 4.8} ${Y - 8.6} L${R - 3.8} ${Y - 7}`} />
        </G>
      ) : null}
    </G>
  );
}

// -------------------------------------------------------------- 머리 장식

function CrownArt({ kind }: { kind: Crown }) {
  switch (kind) {
    case 'hat':
      return (
        <G>
          <Path d="M32 0 C33.8 4 36.6 7.8 40 10 L24 10 C27.4 7.8 30.2 4 32 0 Z" fill="#7a5fd0" {...line} />
          <Path d="M30.6 2.2 C31.6 5.2 32.8 7.4 34.6 9.2" stroke="#a98af0" strokeWidth={1.7} strokeLinecap="round" fill="none" />
          <Path d="M18.5 10 L45.5 10 L45.5 13.2 L18.5 13.2 Z" fill="#5540a8" {...line} />
          <Path d="M27 7 L37 7" stroke="#f4d97a" strokeWidth={2} />
        </G>
      );
    case 'horn':
      return (
        <G>
          <Path d="M32 13.5 L28.2 3 L32 0 L35.8 3 Z" fill="#fff3cf" {...line} />
          <Path d="M30.8 2.6 L32 0.8 L33.2 2.6 Z" fill="#ffffff" opacity={0.9} />
          <Path d="M29.4 9.8 L34.6 8.8" stroke={OL} strokeWidth={1.4} />
          <Path d="M30.2 6.4 L33.8 5.6" stroke={OL} strokeWidth={1.4} />
        </G>
      );
    case 'antler':
      return (
        <G fill="none" stroke="#f4e4b8" strokeWidth={2.7} strokeLinecap="round">
          <Path d="M26 15 L23 5.5" />
          <Path d="M24.6 9.8 L19.8 7" />
          <Path d="M23.4 6.2 L25.4 2.4" />
          <Path d="M38 15 L41 5.5" />
          <Path d="M39.4 9.8 L44.2 7" />
          <Path d="M40.6 6.2 L38.6 2.4" />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Path d="M21.5 12.6 L21.5 3.8 L26.5 8 L32 1.2 L37.5 8 L42.5 3.8 L42.5 12.6 Z" fill="#f7dd8c" {...line} />
          <Path d="M23 5.6 L25.4 7.8 M32 3 L32 6.2" stroke="#fff6d0" strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M21.5 10 L42.5 10" stroke="#c9a227" strokeWidth={1.9} />
          <Circle cx="32" cy="6.4" r="1.8" fill="#e05252" stroke={OL} strokeWidth={1.1} />
        </G>
      );
    case 'halo':
      return (
        <G>
          <Ellipse cx="32" cy="6.5" rx="11.5" ry="3.4" fill="none" stroke="#ffe9a8" strokeWidth={2.6} />
          <Ellipse cx="32" cy="6.5" rx="11.5" ry="3.4" fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.7} />
        </G>
      );
    case 'star':
      return (
        <G>
          <Polygon
            points="32,0.6 34.1,6.6 40.6,6.6 35.4,10.3 37.4,16.3 32,12.6 26.6,16.3 28.6,10.3 23.4,6.6 29.9,6.6"
            fill="#f4d97a"
            {...thin}
          />
          <Polygon points="32,3.2 33.2,6.8 30.8,6.8" fill="#fff6d0" />
        </G>
      );
    default:
      return null;
  }
}
