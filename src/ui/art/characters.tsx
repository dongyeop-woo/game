/**
 * 캐릭터 아트.
 *
 * 이모지 대신 SVG 로 직접 그린다. 에셋 파일이 없어도 되고, 확대해도 안 깨지고,
 * 색만 바꿔 변형을 만들 수 있다.
 *
 * 규칙:
 *  - viewBox 는 전부 "0 0 64 64", 발밑이 y=60 에 오도록 그린다
 *  - 전부 '오른쪽을 보는' 자세로 그린다 (아군은 배치한 쪽을 보도록 렌더에서 뒤집는다)
 *  - 외곽선은 OL / SW 로 통일해 한 세트처럼 보이게 한다
 */

import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { RigSpec } from './rig';

const OL = '#181324';
const SW = 2.3;

export interface ArtProps {
  size?: number;
}

const line = { stroke: OL, strokeWidth: SW, strokeLinejoin: 'round' as const };

/*
  화풍.

  굵은 검정 테두리에 납작한 색이다. 규칙이 넷이다.

    1. 테두리 - 덩어리는 `edge`(2.7), 안쪽 세부는 `edge2`(1.9)
    2. 색     - 그라데이션을 안 쓴다. 한 부위에 기본·그늘·빛 세 톤
    3. 그늘   - 흐리지 않는다. 덩어리 경계를 그대로 따라가는 각진 면 하나
    4. 실루엣 - 뾰족한 데를 만든다. 귀 끝, 꼬리 끝 톱니, 볼털, 발톱

  전에는 그라데이션으로 3D 렌더를 흉내 냈는데 벡터가 제일 못하는 일이라 물렁하게만
  나왔다. 이쪽은 벡터가 제일 잘하는 일이다 - 털 질감이 필요 없으니 지지 않는다.

  얼굴은 **눈썹이 다 한다.** 각진 검정 삼각을 눈 위에 얹되 안쪽(주둥이 쪽)을
  내려야 사납다. 올리면 슬퍼 보인다.

  팔다리와 자루는 같은 길을 두 번 긋는다 - 굵은 검정으로 한 번, 그 위에 얇은
  색으로 한 번. 테두리 두른 굵은 선이 그렇게 나온다.
*/
const INK = '#2f2745';
/** 덩어리 테두리 */
const edge = { stroke: INK, strokeWidth: 1.95, strokeLinejoin: 'round' as const };
/** 안쪽 세부 테두리 */
const edge2 = { stroke: INK, strokeWidth: 1.35, strokeLinejoin: 'round' as const };
const cap = { ...line, strokeLinecap: 'round' as const };

function Frame({ size = 34, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {children}
    </Svg>
  );
}

// ------------------------------------------------------------------ 주인공

/** 팔라독 — 투구 쓴 개 기사, 메이스를 든다 */
export function HeroArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      {/* 망토 */}
      <Path d="M20 30 C10 36 10 52 16 58 L28 54 Z" fill="#3d6fd4" {...line} />
      {/* 꼬리 */}
      <Path d="M17 46 C8 44 8 34 15 32" fill="none" {...cap} strokeWidth={5} stroke="#d9a463" />
      {/* 몸통 */}
      <Ellipse cx="28" cy="44" rx="13" ry="14" fill="#e0b072" {...line} />
      {/* 갑옷 */}
      <Path d="M18 42 Q28 36 38 42 L38 52 Q28 58 18 52 Z" fill="#c9d3e6" {...line} />
      <Circle cx="28" cy="46" r="3" fill="#ffc94a" {...line} strokeWidth={1.6} />
      {/* 귀 */}
      <Path d="M20 20 C14 20 12 30 18 32 Z" fill="#c08c4e" {...line} />
      {/* 머리 */}
      <Circle cx="30" cy="24" r="12" fill="#e8bd82" {...line} />
      {/* 주둥이 */}
      <Ellipse cx="40" cy="28" rx="7" ry="5.5" fill="#f6dcb4" {...line} />
      <Circle cx="45" cy="27" r="2.2" fill={OL} />
      {/* 투구 */}
      <Path d="M18 22 Q30 8 42 20 L42 15 Q30 4 18 16 Z" fill="#cfd8ea" {...line} />
      <Path d="M30 6 L30 0" {...cap} stroke="#ff5566" strokeWidth={4} />
      <Circle cx="30" cy="4" r="3.5" fill="#ff5566" {...line} strokeWidth={1.6} />
      {/* 눈 */}
      <Circle cx="34" cy="22" r="2.1" fill={OL} />
      {/* 메이스 */}
      <Path d="M40 46 L52 32" {...cap} stroke="#8a6134" strokeWidth={4} />
      <Circle cx="54" cy="28" r="7" fill="#b9c4da" {...line} />
      <Circle cx="54" cy="28" r="2.4" fill="#8d99b5" />
    </Frame>
  );
}

// ------------------------------------------------------------- 아군 유닛

/**
 * 생쥐 견습생.
 *
 * 가장 작고 약한 유닛이라 사납기보다 야무지게. 둥근 귀 두 장이 이 캐릭터의
 * 표시고, 흰 털에 칼날 지팡이로 색을 준다.
 */
const MOUSE_RIG: RigSpec = (() => {
  const B = '#dfe6f4', D = '#a2afcc', L = '#ffffff', EAR = '#e88da8', PAW = '#f0a068';
  return {
  /*
    자세 열 개를 거치는 칼질.

    간격이 고르지 않은 게 핵심이다. 앞의 넷으로 느긋하게 칼을 세우고,
    0.34~0.54 세 칸을 바짝 붙여 확 내려친 뒤 천천히 돌아온다.
  */
    times: [0, 0.1, 0.2, 0.27, 0.34, 0.42, 0.54, 0.68, 0.84, 1],
    swingMs: 250,
    idleMs: 2100,
    parts: [
      {
        // 꼬리 - 몸보다 반 박자 늦게 따라온다
        parent: 1,
        pivot: [16.5, 47],
        sway: 7,
        phase: 0.35,
        swing: [0, -4, -10, -13, -5, 10, 18, 13, 5, 0],
        art: (
          <>
          <Path d="M22 48.6 C11.6 50.6 6.6 44.6 10.6 39.4 C13.4 35.8 17.6 37.6 16.6 40.6" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <Path d="M22 48.6 C11.6 50.6 6.6 44.6 10.6 39.4 C13.4 35.8 17.6 37.6 16.6 40.6" fill="none" stroke={D} strokeWidth="3" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 몸 - 발밑에서 돈다. 칼을 든 쪽으로 체중을 싣는다
        pivot: [29, 58],
        sway: 1.5,
        bob: 0.011,
        swing: [0, -2, -4, -5, -1, 5, 9, 6, 2, 0],
        shift: [0, -0.008, -0.016, -0.02, -0.004, 0.035, 0.06, 0.045, 0.016, 0],
        art: (
          <>
          {/*
            몸 - 아주 작게.

            머리가 몸의 한 배 반이다. 견습생이라는 설명을 비례로 한다 -
            큰 머리에 작은 몸은 '어리다'로 읽힌다. 다른 유닛과 몸 크기를
            맞추면 또 같은 눈사람이 된다.
          */}
          <Path d="M25.4 47.6 L24.6 54 M33.4 47.6 L34.2 54" stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
          <Path d="M25.4 47.6 L24.6 54 M33.4 47.6 L34.2 54" stroke={D} strokeWidth="3.6" strokeLinecap="round" />
          <Path d="M20.6 59.2 C20.4 56.2 22.2 54.8 24.6 54.8 C27 54.8 28.6 56.2 28.4 59.2 Z" fill={PAW} {...edge2} />
          <Path d="M30.6 59.2 C30.4 56.2 32.2 54.8 34.6 54.8 C37 54.8 38.6 56.2 38.4 59.2 Z" fill={PAW} {...edge2} />
          <Path d="M22.4 57 L22 59 M24.6 56.4 L24.6 59 M26.8 57 L27.2 59 M32.4 57 L32 59 M34.6 56.4 L34.6 59 M36.8 57 L37.2 59" stroke={INK} strokeWidth="0.9" strokeLinecap="round" />
          <Path d="M22 46.6 C22 41.6 25.2 38.6 29.4 38.6 C33.6 38.6 36.8 41.6 36.8 46.6 C36.8 51 34 53.8 29.4 53.8 C24.8 53.8 22 51 22 46.6 Z" fill={B} {...edge} />
          <Path d="M36.8 46.6 C36.8 51 34 53.8 29.4 53.8 C32.4 52.4 34.6 49.4 34.8 44.6 C36.2 45.2 36.8 45.8 36.8 46.6 Z" fill={D} />
          <Path d="M23.4 47.6 C23.2 43.6 25.6 41 28.8 40.6 L28.4 42.8 C26 43.2 24.6 45 24.8 47.9 Z" fill={L} />
          {/* 어깨끈 - 실루엣을 깨 준다 */}
          <Path d="M24.6 41.4 C27.6 39.6 31.4 39.6 34.4 41.4 L33.4 44 C31 42.6 28 42.6 25.6 44 Z" fill="#8a5f32" {...edge2} />
          </>
        ),
      },
      {
        // 반대쪽 팔 - 칼 든 쪽과 반대로 움직인다
        parent: 1,
        pivot: [23.5, 42.5],
        sway: 4,
        phase: 0.55,
        swing: [0, 4, 8, 10, 2, -8, -13, -9, -3, 0],
        art: (
          <>
          <Path d="M23.4 42.6 C20.6 44.6 20.4 49 22.6 51.6" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
          <Path d="M23.4 42.6 C20.6 44.6 20.4 49 22.6 51.6" fill="none" stroke={D} strokeWidth="2.8" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 머리 - 몸보다 조금 늦게, 조금 더 크게 숙인다
        parent: 1,
        pivot: [29.4, 40],
        sway: 2.2,
        phase: 0.18,
        swing: [0, -4, -9, -12, -3, 7, 11, 7, 3, 0],
        art: (
          <>
          <Circle cx="17.82" cy="13.4" r="8.95" fill={B} {...edge} />
          <Circle cx="18.45" cy="14.03" r="4.91" fill={EAR} />
          <Circle cx="40.63" cy="11.26" r="8.95" fill={B} {...edge} />
          <Circle cx="41.28" cy="11.9" r="4.91" fill={EAR} />
          <Path d="M 16.75 24.06 C 16.75 16.16 22.93 10.83 29.97 10.83 C 36.79 10.83 42.35 15.53 43.41 21.7 C 47.03 22.99 50.23 25.34 51.72 27.89 C 52.79 29.81 51.51 31.74 48.74 32.16 C 44.26 32.9 39.78 33.44 35.95 33.01 C 33.38 34.5 30.39 35.15 27.42 34.72 C 21.02 33.87 16.75 29.6 16.75 24.06 Z" fill={B} {...edge} />
          <Path d="M 43.41 21.7 C 47.03 22.99 50.23 25.34 51.72 27.89 C 52.79 29.81 51.51 31.74 48.74 32.16 C 44.26 32.9 39.78 33.44 35.95 33.01 C 34.88 29.17 35.72 23.84 38.08 21.28 Z" fill={D} />
          <Path d="M 19.95 25.34 C 19.73 18.73 24.22 14.46 29.76 14.03 L 29.11 17.66 C 25.06 18.08 22.29 21.07 22.51 25.97 Z" fill={L} />
          <Path d="M 34.29 26.78 C 38.97 27.21 43.88 29.12 46.44 31.69 C 47.29 32.85 46.44 34.24 44.09 34.68 C 40.25 35.31 36.42 35.74 33.22 35.52 C 31.72 32.32 32.36 28.49 34.29 26.78 Z" fill={L} {...edge2} />
          <Path d="M 42.82 30.19 C 45.79 30.62 47.71 31.9 47.71 33.39 C 47.71 34.68 46.02 35.31 43.66 34.99 C 41.53 34.68 40.25 33.39 40.46 32.11 C 40.68 30.83 41.75 30.19 42.82 30.19 Z" fill="#e0748f" {...edge2} />
          <Path d="M 35.77 34.45 C 38.33 35.95 41.11 35.74 43.24 34.03" fill="none" stroke={INK} strokeWidth="1.28" strokeLinecap="round" />
          <Path d="M 22.08 18.94 L 29.33 21.7 L 29.11 18.94 Z" fill={INK} />
          <Path d="M 31.89 18.08 L 38.5 20.43 L 38.29 17.87 Z" fill={INK} />
          <Ellipse cx="25.28" cy="24.48" rx="3.84" ry="4.38" fill="#ffffff" {...edge2} />
          <Ellipse cx="35.09" cy="23.63" rx="3.62" ry="4.15" fill="#ffffff" {...edge2} />
          <Ellipse cx="26.03" cy="25.02" rx="2.13" ry="2.99" fill="#221c36" />
          <Ellipse cx="35.84" cy="24.16" rx="2.02" ry="2.88" fill="#221c36" />
          <Circle cx="24.96" cy="22.99" r="1.18" fill="#ffffff" />
          <Circle cx="34.77" cy="22.14" r="1.07" fill="#ffffff" />
          <Path d="M 19.73 28.75 L 12.26 27.26 M 19.73 31.95 L 13.12 32.37" stroke={INK} strokeWidth="0.95" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 칼 든 손 - 이 유닛의 공격 그 자체다
        parent: 1,
        pivot: [35.4, 44.4],
        sway: 3,
        phase: 0.7,
        swing: [0, -16, -36, -44, -8, 42, 56, 38, 16, 0],
        art: (
          <>
          <Path d="M 35.4 44.31 L 42.52 35.64" stroke={INK} strokeWidth="5.51" strokeLinecap="round" />
          <Path d="M 35.4 44.31 L 42.52 35.64" stroke="#8a5f32" strokeWidth="3.27" strokeLinecap="round" />
          <Path d="M 39.63 33.72 L 46.19 39.11" stroke={INK} strokeWidth="4.75" strokeLinecap="round" />
          <Path d="M 39.63 33.72 L 46.19 39.11" stroke="#f5bf42" strokeWidth="2.51" strokeLinecap="round" />
          <Path d="M 42.92 35.26 L 53.32 20.23" stroke={INK} strokeWidth="5.9" strokeLinecap="round" />
          <Path d="M 42.92 35.26 L 53.32 20.23" stroke="#eef3fc" strokeWidth="3.66" strokeLinecap="round" />
          <Path d="M 44.84 34.3 L 53.32 22.54" stroke="#a8b6d4" strokeWidth="1.44" strokeLinecap="round" />
          </>
        ),
      },
    ],
  };
})();

export function MouseArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      {MOUSE_RIG.parts.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>{p.art}</React.Fragment>
      ))}
    </Frame>
  );
}

/**
 * 펭귄 궁수.
 *
 * 남색 등에 흰 배, 주황 부리와 발. 활은 몸 앞에 크게 들어야 궁수로 읽힌다.
 */
export function PenguinArt({ size }: ArtProps) {
  const B = '#33436e', D = '#1d2848', L = '#53669a', W = '#eef3fc', WD = '#bfcde6', O = '#f7a53a', OD = '#c2701a';
  return (
    <Frame size={size}>
      <Path d="M44 15.6 C54 24.6 54 39.4 44 48.4" fill="none" stroke={INK} strokeWidth="5.2" strokeLinecap="round" />
      <Path d="M44 15.6 C54 24.6 54 39.4 44 48.4" fill="none" stroke="#8a5f32" strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M44 15.6 L44 48.4" stroke={INK} strokeWidth="1.2" />
      <Path d="M21.4 59.2 C21 55.4 23.4 53.8 26.6 53.8 C29.8 53.8 31.6 55.4 31.4 59.2 Z" fill={O} {...edge2} />
      <Path d="M32.8 59.2 C32.4 55.4 34.8 53.8 38 53.8 C41.2 53.8 43 55.4 42.8 59.2 Z" fill={O} {...edge2} />
      <Path d="M23.6 56.2 L23 59 M26.6 55.6 L26.6 59 M29.6 56.2 L30 59 M35 56.2 L34.4 59 M38 55.6 L38 59 M41 56.2 L41.4 59" stroke={INK} strokeWidth="0.98" strokeLinecap="round" />
      <Path d="M15.6 41 C15.6 32.6 21.6 27.6 30 27.6 C38.4 27.6 44.4 32.6 44.4 41 C44.4 50.4 38.6 56 30 56 C21.4 56 15.6 50.4 15.6 41 Z" fill={B} {...edge} />
      <Path d="M44.4 41 C44.4 50.4 38.6 56 30 56 C35.2 53 39.4 47 39.6 38.2 C42.4 39 44.4 39.4 44.4 41 Z" fill={D} />
      <Path d="M18.2 43.6 C17.8 36.4 22.4 31.6 28.6 30.8 L28 34.4 C23.6 35 20.2 38.4 20.6 44.2 Z" fill={L} />
      <Path d="M31.6 30.6 C37.2 31.6 40.6 36.6 40.6 43 C40.6 50 36.6 54.4 30.4 54.4 C24.4 54.4 20.6 50 20.6 43.2 C20.6 36.8 24.6 31.8 29.4 30.6 Z" fill={W} {...edge2} />
      <Path d="M40.6 43 C40.6 50 36.6 54.4 30.4 54.4 C34.4 51.8 37.4 47 37.6 40 C39.4 40.8 40.6 41.6 40.6 43 Z" fill={WD} />
      <Path d="M17 37 C12.4 42 12.6 50.4 17.4 54.4" fill="none" stroke={INK} strokeWidth="7.0" strokeLinecap="round" />
      <Path d="M17 37 C12.4 42 12.6 50.4 17.4 54.4" fill="none" stroke={B} strokeWidth="5" strokeLinecap="round" />
      <Path d="M43 37 C47.4 41.4 47.2 48.6 43 52.4" fill="none" stroke={INK} strokeWidth="6.6" strokeLinecap="round" />
      <Path d="M43 37 C47.4 41.4 47.2 48.6 43 52.4" fill="none" stroke={B} strokeWidth="4.6" strokeLinecap="round" />
      <Path d="M 17.59 25.41 C 17.59 18.05 23.11 13.08 30.29 13.08 C 37.46 13.08 42.8 18.05 42.8 25.41 C 42.8 32.4 37.83 37.37 30.29 37.37 C 22.74 37.37 17.59 32.4 17.59 25.41 Z" fill={B} {...edge} />
      <Path d="M 42.8 25.41 C 42.8 32.4 37.83 37.37 30.29 37.37 C 34.89 35.16 38.2 30.93 38.38 23.57 C 40.96 24.49 42.8 23.94 42.8 25.41 Z" fill={D} />
      <Path d="M 20.17 27.25 C 19.8 20.81 24.22 16.39 29.92 15.84 L 29.37 19.15 C 25.5 19.7 22.38 22.46 22.56 27.8 Z" fill={L} />
      <Path d="M 31.21 16.39 C 36.73 17.31 39.67 21.73 39.67 26.88 C 39.67 32.4 35.81 36.08 30.47 36.08 C 25.32 36.08 21.82 32.58 21.82 27.25 C 21.82 22.1 25.14 17.68 29.92 16.39 Z" fill={W} {...edge2} />
      <Path d="M37.6 27.4 L53.4 31.4 L37.6 35.6 Z" fill={O} {...edge} />
      <Path d="M37.6 31.4 L52.8 31.4" stroke={OD} strokeWidth="1.8" />
      <Path d="M44 29.2 L52.8 31.4 L44 33.6 Z" fill={OD} opacity="0.5" />
      <Path d="M 23.11 21.73 L 29.18 24.49 L 29.0 21.91 Z" fill={INK} />
      <Path d="M 31.39 21.36 L 37.46 23.57 L 37.28 21.18 Z" fill={INK} />
      <Ellipse cx="26.06" cy="27.06" rx="3.31" ry="3.77" fill="#ffffff" {...edge2} />
      <Ellipse cx="34.52" cy="26.33" rx="3.13" ry="3.59" fill="#ffffff" {...edge2} />
      <Ellipse cx="26.7" cy="27.52" rx="1.84" ry="2.58" fill="#221c36" />
      <Ellipse cx="35.16" cy="26.79" rx="1.75" ry="2.48" fill="#221c36" />
      <Circle cx="25.78" cy="25.78" r="1.01" fill="#ffffff" />
      <Circle cx="34.24" cy="25.04" r="0.92" fill="#ffffff" />
    </Frame>
  );
}

/**
 * 부엉이 주술사.
 *
 * 얼굴판 두 장과 호박색 눈이 부엉이를 만든다. 깃뿔을 뾰족하게 세워 실루엣을 낸다.
 */
const OWL_RIG: RigSpec = (() => {
  const B = '#b5813f', D = '#77511f', L = '#d9a960', F = '#f7e6c2', FD = '#d3bb8c', O = '#f2a838';
  return {
  /*
    지팡이를 뒤로 세웠다가 앞으로 내지른다.

    지팡이는 앞날개에 매달아 뒀다 - 손이 움직이면 같이 간다.
  */
    times: [0, 0.12, 0.24, 0.32, 0.44, 0.6, 0.78, 1],
    swingMs: 330,
    idleMs: 2400,
    parts: [
      {
        // 몸 - 발밑에서 돈다
        pivot: [29.8, 58],
        sway: 1.4,
        bob: 0.01,
        swing: [0, -1, -3, -4, 2, 4, 2, 0],
        shift: [0, -0.006, -0.014, -0.018, 0.02, 0.03, 0.014, 0],
        art: (
          <>
          <Path d="M21.6 59.2 C21.2 55.4 23.6 53.8 26.8 53.8 C30 53.8 31.8 55.4 31.6 59.2 Z" fill={O} {...edge2} />
          <Path d="M32.6 59.2 C32.2 55.4 34.6 53.8 37.8 53.8 C41 53.8 42.8 55.4 42.6 59.2 Z" fill={O} {...edge2} />
          <Path d="M23.8 56.2 L23.2 59 M26.8 55.6 L26.8 59 M29.8 56.2 L30.2 59 M34.8 56.2 L34.2 59 M37.8 55.6 L37.8 59 M40.8 56.2 L41.2 59" stroke={INK} strokeWidth="0.98" strokeLinecap="round" />
          <Path d="M15.4 40.4 C15.4 32 21.4 27 29.8 27 C38.2 27 44.2 32 44.2 40.4 C44.2 50 38.4 55.6 29.8 55.6 C21.2 55.6 15.4 50 15.4 40.4 Z" fill={B} {...edge} />
          <Path d="M44.2 40.4 C44.2 50 38.4 55.6 29.8 55.6 C35 52.6 39.2 46.6 39.4 37.6 C42.2 38.4 44.2 38.8 44.2 40.4 Z" fill={D} />
          <Path d="M18 43 C17.6 35.8 22.2 31 28.4 30.2 L27.8 33.8 C23.4 34.4 20 37.8 20.4 43.6 Z" fill={L} />
          <Path d="M30.6 31.4 C36 32.4 39 37 39 43 C39 49.6 35.2 53.8 29.6 53.8 C24 53.8 20.4 49.6 20.4 43.2 C20.4 37.2 23.8 32.6 28.6 31.4 Z" fill="#f2e2bc" {...edge2} />
          <Path d="M23 38.6 C25 40.6 27 40.6 29 38.6 M29.4 38.6 C31.4 40.6 33.4 40.6 35.4 38.6 M25.4 44.6 C27.4 46.6 29.4 46.6 31.4 44.6 M31.8 44.6 C33.8 46.6 35.8 46.6 37.8 44.6" fill="none" stroke={FD} strokeWidth="1.5" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 뒷날개
        parent: 0,
        pivot: [17, 37],
        sway: 4,
        phase: 0.55,
        swing: [0, 3, 7, 9, -4, -8, -4, 0],
        art: (
          <>
          <Path d="M16.8 36.6 C11.8 41.6 12 50.4 17 54.6" fill="none" stroke={INK} strokeWidth="7.2" strokeLinecap="round" />
          <Path d="M16.8 36.6 C11.8 41.6 12 50.4 17 54.6" fill="none" stroke={B} strokeWidth="5.2" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 지팡이 - 앞날개에 매달린다
        parent: 3,
        pivot: [45, 55],
        sway: 0,
        swing: [0, 0, 0, 0, 0, 0, 0, 0],
        art: (
          <>
          <Path d="M44.6 56 L49.6 13" stroke={INK} strokeWidth="5.2" strokeLinecap="round" />
          <Path d="M44.6 56 L49.6 13" stroke="#7a5326" strokeWidth="3.2" strokeLinecap="round" />
          <Circle cx="50.2" cy="10.6" r="7.4" fill="#4fd8cc" {...edge} />
          <Path d="M56.2 14.4 C52.4 16.4 47.8 15.4 45.4 11.6 C50 13.4 53.8 12.6 56.2 14.4 Z" fill="#1d8f8a" />
          <Circle cx="47.8" cy="8.4" r="2.2" fill="#e6fffb" />
          </>
        ),
      },
      {
        // 앞날개 - 지팡이를 든 손
        parent: 0,
        pivot: [43.5, 37],
        sway: 3.4,
        phase: 0.7,
        swing: [0, -8, -18, -22, 6, 12, 6, 0],
        art: (
          <>
          <Path d="M43 36.6 C47.6 41.4 47.4 48.6 43 52.6" fill="none" stroke={INK} strokeWidth="6.8" strokeLinecap="round" />
          <Path d="M43 36.6 C47.6 41.4 47.4 48.6 43 52.6" fill="none" stroke={B} strokeWidth="4.8" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 머리
        parent: 0,
        pivot: [29.8, 38],
        sway: 2.2,
        phase: 0.18,
        swing: [0, -2, -5, -7, 4, 7, 3, 0],
        art: (
          <>
          <Path d="M17 14.6 L21.6 24.6 L27.6 17 Z" fill={B} {...edge} />
          <Path d="M42.6 13 L37.6 23.6 L31.6 16 Z" fill={B} {...edge} />
          <Circle cx="29.8" cy="24.6" r="14.2" fill={B} {...edge} />
          <Path d="M44 24.6 C44 32.4 37.6 38.8 29.8 38.8 C36 35.2 39.6 29.4 39.6 20.2 C42.2 21.2 44 22.6 44 24.6 Z" fill={D} />
          <Path d="M18.4 26 C18 19 23 13.6 29.2 13 L28.6 16.6 C24.4 17.2 20.8 20.4 21 26.6 Z" fill={L} />
          <Circle cx="23.6" cy="24.4" r="7.6" fill={F} {...edge2} />
          <Circle cx="36" cy="23.8" r="7.6" fill={F} {...edge2} />
          <Circle cx="23.8" cy="24.4" r="4.4" fill="#f5b53a" {...edge2} />
          <Circle cx="36.2" cy="23.8" r="4.4" fill="#f5b53a" {...edge2} />
          <Circle cx="24" cy="24.4" r="2.2" fill={INK} />
          <Circle cx="36.4" cy="23.8" r="2.2" fill={INK} />
          <Circle cx="22.4" cy="22.6" r="1.3" fill="#ffffff" />
          <Circle cx="34.8" cy="22" r="1.3" fill="#ffffff" />
          <Path d="M16.6 19 L25.4 17 L24.6 20.6 Z" fill={INK} />
          <Path d="M43 18 L34.4 16.4 L35.2 19.8 Z" fill={INK} />
          <Path d="M29.8 27.4 L35.6 32.2 L29.8 36.4 Z" fill={O} {...edge2} />
          </>
        ),
      },
    ],
  };
})();

export function OwlArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      {OWL_RIG.parts.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>{p.art}</React.Fragment>
      ))}
    </Frame>
  );
}

/**
 * 두꺼비 연금술사.
 *
 * 웅크린 자세에 튀어나온 눈. 약병은 유리와 약을 나눠 칠해야 병으로 읽힌다.
 */
const TOAD_RIG: RigSpec = (() => {
  const B = '#6dac4e', D = '#3d7333', L = '#9cd472', W = '#e2f2be', WD = '#bcd894';
  return {
  /*
    약병을 뒤로 당겼다 던진다. 공속이 제일 느린 유닛이라 동작을 길게 써도 된다.
  */
    times: [0, 0.12, 0.26, 0.34, 0.46, 0.62, 0.8, 1],
    swingMs: 460,
    idleMs: 2600,
    parts: [
      {
        // 뒷다리
        parent: 1,
        pivot: [15, 47],
        sway: 3,
        phase: 0.5,
        swing: [0, 2, 4, 5, -3, -5, -2, 0],
        art: (
          <>
          <Path d="M14 46.6 C8.6 48.6 7.6 54.2 11.4 57.4" fill="none" stroke={INK} strokeWidth="7.2" strokeLinecap="round" />
          <Path d="M14 46.6 C8.6 48.6 7.6 54.2 11.4 57.4" fill="none" stroke={D} strokeWidth="5.2" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 몸 - 발밑에서 돈다
        pivot: [30, 58],
        sway: 1.4,
        bob: 0.01,
        swing: [0, -2, -5, -6, 3, 6, 3, 0],
        shift: [0, -0.01, -0.02, -0.025, 0.03, 0.05, 0.02, 0],
        art: (
          <>
          <Path d="M17.6 58.6 C17.4 55 19.8 53.4 23 53.4 C26.2 53.4 28 55 27.8 58.6 Z" fill={D} {...edge2} />
          <Path d="M34.6 58.6 C34.4 55 36.8 53.4 40 53.4 C43.2 53.4 45 55 44.8 58.6 Z" fill={D} {...edge2} />
          <Path d="M19.8 55.8 L19 58.4 M23 55.2 L23 58.4 M26.2 55.8 L27 58.4 M36.8 55.8 L36 58.4 M40 55.2 L40 58.4 M43.2 55.8 L44 58.4" stroke={INK} strokeWidth="0.98" strokeLinecap="round" />
          <Path d="M11.6 43 C11.6 34.6 19.6 29.6 30 29.6 C40.4 29.6 48.4 34.6 48.4 43 C48.4 51 41.2 56 30 56 C18.8 56 11.6 51 11.6 43 Z" fill={B} {...edge} />
          <Path d="M48.4 43 C48.4 51 41.2 56 30 56 C37.4 53.4 43 47.6 43.4 39.4 C46.4 40.4 48.4 41.4 48.4 43 Z" fill={D} />
          <Path d="M14.6 45.4 C14.2 38.6 20 34 27.6 33.2 L27 36.8 C21 37.6 16.6 40.6 16.8 46 Z" fill={L} />
          <Path d="M31.4 34 C38.4 35.2 42.6 39.4 42.6 45 C42.6 51 37.4 54.6 30 54.6 C22.6 54.6 17.6 51 17.6 45.2 C17.6 39.6 21.8 35.2 28.6 34 Z" fill={W} {...edge2} />
          <Path d="M42.6 45 C42.6 51 37.4 54.6 30 54.6 C35.4 52.6 39.4 48.6 39.6 42.4 C41.6 43.2 42.6 43.8 42.6 45 Z" fill={WD} />
          </>
        ),
      },
      {
        // 머리 - 두꺼비는 목이 없으니 몸 바로 위에서 돈다
        parent: 1,
        pivot: [30, 42],
        sway: 2,
        phase: 0.2,
        swing: [0, -3, -7, -9, 5, 9, 4, 0],
        art: (
          <>
          <Path d="M13.4 34.6 C13.4 27 19.8 22 30 22 C40.2 22 46.6 27 46.6 34.6 C46.6 39.4 41.6 42 30 42 C18.4 42 13.4 39.4 13.4 34.6 Z" fill={B} {...edge} />
          <Path d="M46.6 34.6 C46.6 39.4 41.6 42 30 42 C38.4 40 42.6 36.2 42.6 29.6 C45 30.8 46.6 32.6 46.6 34.6 Z" fill={D} />
          <Path d="M16.4 34 C16.2 28.6 21.4 25 28.6 24.6 L28 28 C23 28.4 19.2 30.4 19 35 Z" fill={L} />
          <Circle cx="20.6" cy="17.6" r="8.6" fill={B} {...edge} />
          <Circle cx="39.6" cy="16.6" r="8.6" fill={B} {...edge} />
          <Circle cx="21.4" cy="18" r="5" fill="#f4fbe4" {...edge2} />
          <Circle cx="40.4" cy="17" r="5" fill="#f4fbe4" {...edge2} />
          <Ellipse cx="22.2" cy="18.4" rx="2.4" ry="3.2" fill={INK} />
          <Ellipse cx="41.2" cy="17.4" rx="2.4" ry="3.2" fill={INK} />
          <Circle cx="20.6" cy="16.6" r="1.3" fill="#ffffff" />
          <Circle cx="39.6" cy="15.6" r="1.3" fill="#ffffff" />
          <Path d="M13.6 14.6 L23.4 13.6 L21.8 17.4 Z" fill={INK} />
          <Path d="M46.6 13.6 L37 13 L38.6 16.8 Z" fill={INK} />
          <Path d="M19.6 33.6 C23.6 38.6 36.6 38.6 40.6 33.2" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M24.6 28.6 C25.6 29.6 26.6 29.6 27.6 28.6 M33.6 28 C34.6 29 35.6 29 36.6 28" fill="none" stroke={D} strokeWidth="1.3" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 약병 든 팔
        parent: 1,
        pivot: [47, 43],
        sway: 3.4,
        phase: 0.7,
        swing: [0, -14, -32, -40, 20, 46, 24, 0],
        art: (
          <>
          <Path d="M47 42.6 L51.6 33.6" stroke={INK} strokeWidth="6.0" strokeLinecap="round" />
          <Path d="M47 42.6 L51.6 33.6" stroke={B} strokeWidth="4" strokeLinecap="round" />
          <Path d="M48.4 20.6 L55.4 20.6 L55.4 24.4 L53.4 24.4 L53.4 27.6 L57.6 35.4 C57.6 40.4 46.2 40.4 46.2 35.4 L50.4 27.6 L50.4 24.4 L48.4 24.4 Z" fill="#cfe9f7" {...edge2} />
          <Path d="M46.6 33.4 C50.4 36.6 53.4 36.6 57.2 33.4 L57.6 35.4 C57.6 40.4 46.2 40.4 46.2 35.4 Z" fill="#a86ee0" {...edge2} />
          <Path d="M51.4 26.4 C50.6 29 49.4 31.4 48.4 33" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
          </>
        ),
      },
    ],
  };
})();

export function ToadArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      {TOAD_RIG.parts.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>{p.art}</React.Fragment>
      ))}
    </Frame>
  );
}

/**
 * 코뿔소 수호병.
 *
 * 덩치가 표시라 몸을 제일 크게 잡는다. 뿔은 주둥이에 붙여야 뿔로 보이고,
 * 방패는 둥근 쪽이 작게 줄여도 잘 읽힌다.
 */
const RHINO_RIG: RigSpec = (() => {
  const B = '#93a0bb', D = '#5d6884', L = '#c0cade', H = '#f7ecca', HD = '#c9b98c';
  return {
  /*
    들이받는다. 뒤로 크게 물러났다가 몸통째 앞으로 나간다 - 다른 유닛보다
    `shift` 를 두 배로 잡아 무게를 준다.
  */
    times: [0, 0.14, 0.3, 0.4, 0.52, 0.68, 0.85, 1],
    swingMs: 560,
    idleMs: 2800,
    parts: [
      {
        // 몸 - 발밑에서 돈다
        pivot: [27.6, 58],
        sway: 1.3,
        bob: 0.009,
        swing: [0, -3, -6, -8, 4, 7, 3, 0],
        shift: [0, -0.015, -0.03, -0.04, 0.05, 0.085, 0.035, 0],
        art: (
          <>
          {/* 뒷다리 - 뒤로 버텨 선다 */}
          <Path d="M20.6 45.6 L15.6 55.4" stroke={INK} strokeWidth="10.4" strokeLinecap="round" />
          <Path d="M20.6 45.6 L15.6 55.4" stroke={D} strokeWidth="8.4" strokeLinecap="round" />
          {/* 앞다리 - 앞으로 내딛는다. 둘이 다른 자리에 있어야 '버틴' 자세가 된다 */}
          <Path d="M35.6 46.6 L39.6 55.4" stroke={INK} strokeWidth="11" strokeLinecap="round" />
          <Path d="M35.6 46.6 L39.6 55.4" stroke={D} strokeWidth="9" strokeLinecap="round" />
          <Path d="M10.4 59.4 C10.2 55.4 12.6 53.6 16 53.6 C19.4 53.6 21.4 55.4 21.2 59.4 Z" fill={D} {...edge2} />
          <Path d="M34.4 59.4 C34.2 55.4 36.6 53.6 40 53.6 C43.4 53.6 45.4 55.4 45.2 59.4 Z" fill={D} {...edge2} />
          <Path d="M12.6 56.6 L12 59.2 M16 55.8 L16 59.2 M19.4 56.6 L20 59.2 M36.6 56.6 L36 59.2 M40 55.8 L40 59.2 M43.4 56.6 L44 59.2" stroke={INK} strokeWidth="1.05" strokeLinecap="round" />
          {/*
            몸통 - 쐐기다.

            어깨가 등 위로 솟았다가 오른쪽 목으로 미끄러져 내려간다. 달걀
            하나로 두면 다른 유닛과 똑같아진다 - 덩치가 표시인 유닛은
            **실루엣이 무거워야** 한다.
          */}
          <Path
            d="M12.2 47.6 C11 38.4 15.6 30.6 23.6 28.4 C31.4 26.2 40 29.4 45 35.4
               C49.4 40.6 47.6 47.8 41.4 51.6 C34.4 55.8 21.6 55.8 16.4 52.6
               C13.6 51 12.4 49.6 12.2 47.6 Z"
            fill={B} {...edge}
          />
          <Path d="M45 35.4 C49.4 40.6 47.6 47.8 41.4 51.6 C36.6 54.4 29.6 55.6 23.4 55.2 C33.6 53.2 40.6 47.4 41.6 33.4 Z" fill={D} />
          <Path d="M15.4 46.6 C14.4 38.6 18.4 32.6 25.4 31 L25.8 34.6 C20.6 36 17.4 40.4 18.2 46.8 Z" fill={L} />
          {/* 어깨 갑옷 - 실루엣을 깨는 것이 하나는 있어야 한다 */}
          <Path d="M18.6 31.4 C23.6 27.6 30.6 27.4 35.6 30.6 L38.6 27.4 L39.4 33 C36.6 36.6 30.6 38 24.6 36.4 C21 35.4 19 33.6 18.6 31.4 Z" fill="#8592ae" {...edge2} />
          <Path d="M35.6 30.6 L38.6 27.4 L39.4 33 C37.8 35 35.4 36.4 32.6 37.2 C35.4 35 36.4 32.8 35.6 30.6 Z" fill="#65728f" />
          <Path d="M21.6 32.4 C24.6 30 28.6 29.4 32.4 30.6" fill="none" stroke="#dbe3f2" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 반대쪽 팔
        parent: 0,
        pivot: [15, 37],
        sway: 3.4,
        phase: 0.55,
        swing: [0, 5, 10, 13, -6, -11, -5, 0],
        art: (
          <>
          <Path d="M14.6 36.6 C9.6 41.4 9.8 50 14.8 54.4" fill="none" stroke={INK} strokeWidth="7.4" strokeLinecap="round" />
          <Path d="M14.6 36.6 C9.6 41.4 9.8 50 14.8 54.4" fill="none" stroke={D} strokeWidth="5.4" strokeLinecap="round" />
          </>
        ),
      },
      {
        // 방패 - 몸 앞을 가로질러 든다. 머리 위에 두면 뿔을 가린다
        parent: 0,
        pivot: [24.4, 48.9],
        sway: 3,
        phase: 0.7,
        swing: [0, -8, -16, -20, 10, 22, 10, 0],
        art: (
          <>
          <Circle cx="24.34" cy="48.86" r="8.32" fill={L} {...edge} />
          <Path d="M 32.66 48.86 C 32.66 53.4 28.88 57.18 24.34 57.18 C 28.42 54.91 30.69 51.88 30.99 46.59 C 32.05 47.2 32.66 47.95 32.66 48.86 Z" fill={D} />
          <Circle cx="24.34" cy="48.86" r="4.99" fill="none" stroke="#ffffff" strokeWidth="1.21" opacity="0.5" />
          <Circle cx="24.34" cy="48.86" r="2.72" fill="#f5bf42" {...edge2} />
          </>
        ),
      },
      {
        // 머리 - 뿔이 먼저 나간다. 낮게 내민 자세라 도는 중심도 앞으로 온다
        parent: 0,
        pivot: [36, 40],
        sway: 2,
        phase: 0.18,
        swing: [0, -4, -8, -11, 6, 10, 4, 0],
        art: (
          <>
          {/* 귀 - 작게. 이 유닛은 뿔이 주인공이다 */}
          <Path d="M39.6 27 C37 27.6 36 30 36.8 32.4 C38.6 31.2 40.4 30.6 42.2 30.6 Z" fill={B} {...edge2} />
          {/*
            머리 - 낮게 앞으로 내민다.

            서 있는 게 아니라 **들이받으려고 숙인** 자세다. 머리를 몸 위에
            얹으면 다른 유닛과 같아진다.
          */}
          <Path
            d="M33.4 40.6 C32.2 34.4 36.6 29.4 43.4 29.4 C48.6 29.4 52.6 32 54.2 36
               C56.6 37.2 58.6 39 59.4 40.8 C60 42.6 58.8 44.2 56.4 44.6
               C52.6 45.2 48.4 45.6 45.4 45.2 C43 46.2 40 46.4 37.4 45.8
               C34.6 45 33.6 43.2 33.4 40.6 Z"
            fill={B} {...edge}
          />
          <Path d="M54.2 36 C56.6 37.2 58.6 39 59.4 40.8 C60 42.6 58.8 44.2 56.4 44.6 C52.6 45.2 48.4 45.6 45.4 45.2 C44.6 42 45.4 38 47 36 Z" fill={D} />
          <Path d="M35.4 41.4 C34.6 35.6 38.6 31.6 43.6 31.4 L43.2 34.6 C40 35 37.6 37.6 38 41.8 Z" fill={L} />
          <Path d="M46.4 36.6 C50.6 37 54.6 38.6 56.6 40.6 C57.4 41.6 56.8 42.8 54.6 43.2 C51.4 43.8 48 44.2 45.4 44 C44.2 41.4 44.8 38 46.4 36.6 Z" fill={L} {...edge2} />
          <Ellipse cx="54.4" cy="40.6" rx="1.8" ry="1.3" fill={INK} />
          <Ellipse cx="49.4" cy="42.2" rx="1.8" ry="1.3" fill={INK} />
          {/* 뿔 - 주둥이에서 위로 솟는다. 이게 실루엣의 꼭짓점이다 */}
          <Path d="M47.4 37 C48.6 29.6 51.6 24 56.6 19.6 C56.6 27.4 55.4 33.4 53.4 39 Z" fill={H} {...edge} />
          <Path d="M56.6 19.6 C56.6 27.4 55.4 33.4 53.4 39 C53.4 33.6 54 26.6 56.6 19.6 Z" fill={HD} />
          {/* 눈 - 작고 사납게. 크고 동그라면 덩치가 안 산다 */}
          <Path d="M36.6 34.6 L43.6 36.6 L43.4 33.8 Z" fill={INK} />
          <Path d="M50 34.6 L45.4 34.2 L45.6 36.8 Z" fill={INK} />
          <Ellipse cx="39.6" cy="38.6" rx="2.6" ry="2.9" fill="#ffffff" {...edge2} />
          <Ellipse cx="46.6" cy="38.4" rx="2.4" ry="2.7" fill="#ffffff" {...edge2} />
          <Ellipse cx="40.2" cy="39" rx="1.4" ry="2" fill="#221c36" />
          <Ellipse cx="47.2" cy="38.8" rx="1.3" ry="1.9" fill="#221c36" />
          <Circle cx="39.2" cy="37.4" r="0.8" fill="#ffffff" />
          <Circle cx="46.2" cy="37.2" r="0.76" fill="#ffffff" />
          </>
        ),
      },
    ],
  };
})();

export function RhinoArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      {RHINO_RIG.parts.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>{p.art}</React.Fragment>
      ))}
    </Frame>
  );
}

/*
  늑대 기사 - 조각낸 그림.

  같은 그림을 두 벌 두면 한쪽만 고치고 다른 쪽을 잊는다. 조각을 여기 한 번만
  적어 두고, 가만히 선 그림(`WolfArt`)은 그 조각을 순서대로 겹쳐 그린다.
  움직이는 쪽은 `RigArt` 가 조각마다 각도를 준다.

  도는 중심은 **붙어 있는 자리**다 - 꼬리는 엉덩이, 팔은 어깨, 머리는 목,
  몸은 발밑. 한가운데서 돌리면 조각이 몸에서 떨어져 나간다.

  화풍은 굵은 검정 테두리에 납작한 색이다. 규칙이 넷이다.

    1. 테두리 - 덩어리는 INK 로 2.6~3, 안쪽 세부는 1.8~2.2
    2. 색     - 그라데이션을 안 쓴다. 한 부위에 기본·그늘·빛 세 톤
    3. 그늘   - 흐리지 않는다. 덩어리 경계를 따라가는 각진 면 하나
    4. 실루엣 - 뾰족한 데를 만든다. 귀 끝, 어깨 가시, 꼬리 끝, 발톱

  앞서 그라데이션으로 3D 렌더를 흉내 내 봤는데, 벡터가 제일 못하는 일이라
  물렁하게만 나왔다. 이쪽은 벡터가 제일 잘하는 일이다.
*/
const FUR = '#8092b3', FUR_D = '#4f5d84', FUR_L = '#aebcd8', STEEL = '#d4deef', STEEL_D = '#8e9cbb';

export const WOLF_RIG: RigSpec = {
  /*
    자세 열 개를 거친다.

    간격이 고르지 않은 게 중요하다. 앞의 넷은 느긋하게 칼을 세우고(예비),
    0.34~0.54 세 칸을 바짝 붙여 확 내려친 뒤(타격), 나머지로 천천히 돌아온다.
    이 들쭉날쭉함이 시트에서 '몇 프레임을 무느냐'에 해당한다.
  */
  times: [0, 0.1, 0.2, 0.27, 0.34, 0.42, 0.54, 0.68, 0.84, 1],
  // 늑대는 초당 3.6 번 문다. 한 번 휘두르는 게 그 간격(0.28초) 안에 끝나야 한다
  swingMs: 260,
  idleMs: 2200,
  parts: [
    {
      /*
        꼬리 - 몸보다 늦게 출발해 늦게 멈춘다. 이 한 박자가 '살아 있음'을 만든다.

        끝을 톱니로 꺾는다. 매끈한 초승달은 목도리로 보인다.
      */
      parent: 1,
      pivot: [16.5, 48],
      sway: 9,
      phase: 0.35,
      swing: [0, -5, -12, -16, -6, 12, 22, 16, 6, 0],
      art: (
        <>
          <Path
            d="M 21 52.8 C 10.4 54.4 3 48.6 2.6 39.4 C 2.3 32.8 5.6 27 11 23.6 L 11.6 29 L 15.6 26.2 L 15.4 31.8 L 18.8 29.6 L 17.6 35.2 C 14 37.4 12.4 40 12.8 43 C 13.4 47 16.4 49.2 20.6 48.8 Z"
            fill={FUR} {...edge}
          />
          <Path d="M11 23.6 L11.6 29 L15.6 26.2 L15.4 31.8 L18.8 29.6 L17.6 35.2 C15.2 36.6 13.6 38 12.8 39.6 C10.8 32.6 10.4 27.4 11 23.6 Z" fill={FUR_L} />
          <Path d="M21 52.8 C13 53.8 7.2 50 4.4 43.8 C8.4 49.4 13.6 52 21.4 51 Z" fill={FUR_D} />
        </>
      ),
    },
    {
      /*
        몸 - 발밑에서 돈다. 칼을 든 쪽으로 체중을 싣는다.

        그늘은 덩어리 오른쪽 경계를 **그대로 따라가는** 면이다. 흐리면 물렁해진다.
      */
      pivot: [28.5, 58],
      sway: 1.6,
      bob: 0.012,
      swing: [0, -2, -4, -5, -1, 5, 9, 6, 2, 0],
      shift: [0, -0.008, -0.018, -0.022, -0.004, 0.04, 0.07, 0.05, 0.018, 0],
      art: (
        <>
          <Path d="M22.8 48 L22.8 56 M36 48 L36 56" stroke={INK} strokeWidth="8.2" strokeLinecap="round" />
          <Path d="M22.8 48 L22.8 56 M36 48 L36 56" stroke={FUR_D} strokeWidth="6.2" strokeLinecap="round" />
          <Path d="M17.2 59.6 C17 55.6 19.4 53.6 22.8 53.6 C26.2 53.6 28.2 55.6 28.2 59.6 Z" fill={FUR_D} {...edge2} />
          <Path d="M30.4 59.6 C30.2 55.6 32.6 53.6 36 53.6 C39.4 53.6 41.4 55.6 41.4 59.6 Z" fill={FUR_D} {...edge2} />
          <Path d="M19.2 56.6 L18.2 59.4 M22.8 55.8 L22.8 59.4 M26.4 56.6 L27.4 59.4 M32.4 56.6 L31.4 59.4 M36 55.8 L36 59.4 M39.6 56.6 L40.6 59.4" stroke={INK} strokeWidth="1.12" strokeLinecap="round" />
          <Path
            d="M13.2 41.6 C13.2 32.6 19.6 27.4 28.6 27.4 C37.6 27.4 44 32.6 44 41.6
               C44 50.2 38 55.6 28.6 55.6 C19.2 55.6 13.2 50.2 13.2 41.6 Z"
            fill={FUR} {...edge}
          />
          <Path d="M44 41.6 C44 50.2 38 55.6 28.6 55.6 C33.8 52.8 38.6 46.6 39 37.4 C41.8 38.4 44 39.8 44 41.6 Z" fill={FUR_D} />
          <Path d="M15.6 44.6 C15.2 36 20.6 30.6 27.6 30 L27 33.6 C21.6 34.4 18 38.6 18.4 45 Z" fill={FUR_L} />
          {/* 가슴 갑옷 */}
          <Path
            d="M15 41 C16.8 35.6 21.4 32.2 26 31.4 L28.6 37.2 L31.2 31.4 C35.8 32.2 40.4 35.6 42.2 41
               L42.2 49 C37.8 52.8 33.2 54.4 28.6 54.4 C24 54.4 19.4 52.8 15 49 Z"
            fill={STEEL} {...edge}
          />
          <Path d="M42.2 41 L42.2 49 C38.6 51.9 35 53.7 31 54.2 C36 50 38.6 44 38.6 34.6 C40.2 36.2 41.4 38.4 42.2 41 Z" fill={STEEL_D} />
          <Path d="M19.4 41.4 C20.8 38 23.2 35.6 26 34.6 L26.8 36.8 C24.2 38 22.2 40 21 42.8 Z" fill="#ffffff" />
          <Path d="M26 31.4 L28.6 37.2 L31.2 31.4" fill="none" {...edge2} />
          <Path d="M17.6 46 L39.6 46" stroke={STEEL_D} strokeWidth="1.6" strokeLinecap="round" />
          <Circle cx="28.6" cy="42.6" r="3.9" fill="#f5bf42" {...edge2} />
          <Path d="M26.2 41 C26.9 39.8 28 39.2 29.2 39.4 L28.2 41.6 Z" fill="#ffe8a8" />
        </>
      ),
    },
    {
      // 반대쪽 팔 - 칼 든 팔과 **반대로** 움직인다. 같이 가면 헤엄치는 꼴이 된다
      parent: 1,
      pivot: [17, 41],
      sway: 4,
      phase: 0.55,
      swing: [0, 4, 9, 11, 2, -9, -15, -10, -4, 0],
      art: (
        <>
          <Path d="M17.8 40.4 C12 44.4 11.6 52 16.8 56.4" fill="none" stroke={INK} strokeWidth="7.2" strokeLinecap="round" />
          <Path d="M17.8 40.4 C12 44.4 11.6 52 16.8 56.4" fill="none" stroke={FUR_D} strokeWidth="5.2" strokeLinecap="round" />
        </>
      ),
    },
    {
      /*
        머리 - 몸보다 조금 늦게, 조금 더 크게 숙인다.

        두개골에서 주둥이가 **한 획으로** 뻗어 나와야 개과로 읽힌다. 따로
        붙이면 코가 뜬다. 눈썹은 각진 검정 삼각으로 - 이게 표정을 만든다.
      */
      parent: 1,
      pivot: [29, 37],
      sway: 2.4,
      phase: 0.18,
      swing: [0, -4, -9, -13, -3, 8, 12, 8, 3, 0],
      art: (
        <>
          <Path d="M 21.61 24.15 C 18.09 18.17 17.74 12.36 19.85 9.19 C 23.72 12.71 27.24 17.46 29.0 21.69 Z" fill={FUR} {...edge} />
          <Path d="M 22.14 19.93 C 20.9 16.94 20.9 14.47 21.61 12.89 C 23.72 15.0 25.48 17.46 26.54 19.93 Z" fill="#55425f" />
          <Path d="M 35.51 16.41 C 37.27 9.9 40.26 6.2 43.08 6.73 C 43.78 11.3 42.55 17.11 40.26 20.98 Z" fill={FUR} {...edge} />
          <Path d="M 37.45 16.58 C 38.5 12.89 39.74 10.42 41.32 9.9 C 41.67 13.06 40.79 16.23 39.74 18.7 Z" fill="#55425f" />
          <Path
            d="M 18.79 27.14 C 18.26 20.28 23.19 14.82 29.53 14.47 C 35.34 14.12 39.74 17.64 40.79 22.92 C 44.14 24.33 47.3 26.79 49.06 29.61 C 50.12 31.54 49.06 33.48 46.6 34.01 C 43.08 34.89 39.56 35.77 36.39 36.82 C 33.05 38.06 29.53 38.76 26.01 38.58 C 23.72 38.5 21.78 38.23 20.02 37.53 C 17.91 34.54 17.56 30.66 18.79 27.14 Z"
            fill={FUR} {...edge}
          />
          <Path d="M 40.79 22.92 C 44.14 24.33 47.3 26.79 49.06 29.61 C 50.12 31.54 49.06 33.48 46.6 34.01 C 43.08 34.89 39.56 35.77 36.39 36.82 C 34.46 33.3 34.63 26.26 36.92 23.1 Z" fill={FUR_D} />
          <Path d="M 21.08 28.73 C 20.73 22.92 24.07 18.7 29.0 17.82 L 28.47 21.16 C 24.95 22.04 22.66 25.03 22.84 29.43 Z" fill={FUR_L} />
          {/* 주둥이 윗면 - 밝아야 코가 앞으로 나온다 */}
          <Path d="M 34.63 23.8 C 39.56 23.98 44.66 26.44 47.48 29.78 C 48.36 31.19 47.66 32.6 45.37 33.13 C 41.85 34.01 38.15 34.89 35.16 35.94 C 33.05 32.42 32.87 27.14 34.63 23.8 Z" fill="#c8d4e8" {...edge2} />
          <Path d="M 35.51 24.68 C 38.5 24.86 41.67 26.09 43.96 27.85 C 41.14 27.32 38.15 27.32 35.69 28.02 Z" fill="#eef3fc" />
          <Path d="M 43.43 27.67 C 46.42 28.02 48.54 29.43 48.71 31.02 C 48.89 32.42 47.13 33.13 44.84 32.78 C 42.73 32.42 41.5 31.19 41.67 29.78 C 41.85 28.38 42.46 27.67 43.43 27.67 Z" fill={INK} />
          <Path d="M 43.61 29.08 C 45.02 29.26 46.07 29.78 46.42 30.49" fill="none" stroke="#6d7b9c" strokeWidth="1.14" strokeLinecap="round" />
          {/* 볼털 - 이 화풍은 실루엣이 뾰족해야 산다 */}
          <Path d="M 20.6 33.4 L 17.8 37.4 L 22.8 36.5 L 21.2 40 L 25.6 37.6 L 25.4 40.8 L 28.8 37.4 C 25.8 38.2 22.8 36.6 20.6 33.4 Z" fill={FUR} {...edge2} />
          <Path d="M 36.57 35.24 C 39.38 36.82 42.38 36.65 44.84 34.71" fill="none" stroke={INK} strokeWidth="1.19" strokeLinecap="round" />
          <Path d="M 38.15 35.94 L 39.03 39.11 L 40.44 36.3 Z" fill="#ffffff" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
          {/* 눈썹 - 각진 검정 삼각. 표정은 여기서 나온다 */}
          <Path d="M 21.4 21 L 29 24.2 L 28.7 21.3 Z" fill={INK} />
          <Path d="M 31.1 20.1 L 38.4 22.9 L 38.1 20.1 Z" fill={INK} />
          <Ellipse cx="24.95" cy="27.85" rx="3.08" ry="3.52" fill="#ffd34a" {...edge2} />
          <Ellipse cx="34.28" cy="26.79" rx="2.9" ry="3.34" fill="#ffd34a" {...edge2} />
          <Ellipse cx="25.3" cy="28.02" rx="1.19" ry="2.64" fill={INK} />
          <Ellipse cx="34.63" cy="26.97" rx="1.14" ry="2.46" fill={INK} />
          <Circle cx="23.9" cy="26.26" r="0.97" fill="#ffffff" />
          <Circle cx="33.22" cy="25.21" r="0.92" fill="#ffffff" />
        </>
      ),
    },
    {
      /*
        칼 든 팔 - 어깨에서 돈다.

        어깨에 가시를 단다. 실루엣이 뾰족해야 이 화풍이 산다.
        칼날은 선 자세에서 오른쪽 위 42도를 가리킨다. 뒤로 36도까지만 당긴다 -
        어깨가 주둥이 바로 아래라, 더 들면 칼날이 얼굴을 가로지른다.
      */
      parent: 1,
      pivot: [41.5, 42],
      sway: 3,
      phase: 0.7,
      swing: [0, -14, -32, -38, -6, 40, 52, 36, 15, 0],
      art: (
        <>
          <Path d="M40.4 41.4 C46 44.6 46.6 50.2 42.4 53.6" fill="none" stroke={INK} strokeWidth="7.0" strokeLinecap="round" />
          <Path d="M40.4 41.4 C46 44.6 46.6 50.2 42.4 53.6" fill="none" stroke={FUR_D} strokeWidth="5" strokeLinecap="round" />
          <Path d="M43.4 50.6 L48.2 43.8" stroke={INK} strokeWidth="5.0" strokeLinecap="round" />
          <Path d="M43.4 50.6 L48.2 43.8" stroke="#8a5f32" strokeWidth="3" strokeLinecap="round" />
          <Path d="M44.6 39.8 L52.6 46" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
          <Path d="M44.6 39.8 L52.6 46" stroke="#f5bf42" strokeWidth="2.8" strokeLinecap="round" />
          <Path d="M48.6 43.2 L59.4 26" stroke={INK} strokeWidth="6.0" strokeLinecap="round" />
          <Path d="M48.6 43.2 L59.4 26" stroke="#dfe9fb" strokeWidth="4" strokeLinecap="round" />
          <Path d="M50.6 42.2 L59.4 28.4" stroke="#9fb0d2" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ),
    },
  ],
};

/**
 * 늑대 기사.
 *
 * 앞줄을 무는 근접 유닛이라 이빨과 검이 같이 보여야 한다.
 *
 * 조각은 `WOLF_RIG` 에 있다. 여기서는 그대로 겹쳐 세워 둔다.
 */
export function WolfArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      {WOLF_RIG.parts.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>{p.art}</React.Fragment>
      ))}
    </Frame>
  );
}

/**
 * 여우 마법사.
 *
 * 불티를 흩뿌리는 유닛이라 지팡이 끝 불꽃이 제일 밝아야 눈이 거기로 간다.
 * 큰 꼬리와 뾰족한 귀가 실루엣을 만들고, 보라 망토로 마법사를 표시한다.
 */
export function FoxArt({ size }: ArtProps) {
  const B = '#e8933c', D = '#a8560f', L = '#ffc275', W = '#fdf1dd', P = '#7b3fb0', PD = '#4f2478';
  return (
    <Frame size={size}>
      <Path d="M20 53 C7.6 54.4 1.4 45.6 3.4 35.4 C5 27 10.6 20.8 18 17.4 L17.6 23.6 L22.4 20.6 L21.6 26.8 L25.4 24.4 L23.4 30.6 C18.6 33.4 16.2 36.6 16.6 40.6 C17.2 45.8 20 48.6 24 48.6 Z" fill={B} {...edge} />
      <Path d="M18 17.4 L17.6 23.6 L22.4 20.6 L21.6 26.8 L25.4 24.4 L23.4 30.6 C20.6 32.2 18.6 34 17.6 36 C17 26.4 17.2 20.6 18 17.4 Z" fill={W} />
      <Path d="M20 53 C11.6 54 5.8 49.6 3.6 42.6 C7.4 49 13 52 21 51.4 Z" fill={D} />
      <Path d="M24.4 48.6 L24.4 55 M35.4 48.6 L35.4 55" stroke={INK} strokeWidth="7.6" strokeLinecap="round" />
      <Path d="M24.4 48.6 L24.4 55 M35.4 48.6 L35.4 55" stroke={D} strokeWidth="5.6" strokeLinecap="round" />
      <Path d="M19.6 59.2 C19.4 55.6 21.6 54 24.6 54 C27.6 54 29.4 55.6 29.2 59.2 Z" fill={D} {...edge2} />
      <Path d="M30.8 59.2 C30.6 55.6 32.8 54 35.8 54 C38.8 54 40.6 55.6 40.4 59.2 Z" fill={D} {...edge2} />
      <Path d="M21.6 56.4 L21 59 M24.6 55.8 L24.6 59 M27.6 56.4 L28.2 59 M32.8 56.4 L32.2 59 M35.8 55.8 L35.8 59 M38.8 56.4 L39.4 59" stroke={INK} strokeWidth="0.98" strokeLinecap="round" />
      <Path d="M16.6 43.4 C16.6 35.6 22 31.2 29.4 31.2 C36.8 31.2 42.2 35.6 42.2 43.4 C42.2 50.8 37.2 55.6 29.4 55.6 C21.6 55.6 16.6 50.8 16.6 43.4 Z" fill={B} {...edge} />
      <Path d="M42.2 43.4 C42.2 50.8 37.2 55.6 29.4 55.6 C34 53 38 47.8 38.2 40 C40.6 40.8 42.2 41.8 42.2 43.4 Z" fill={D} />
      <Path d="M30.8 34 C36 35 39 39 39 44.6 C39 50.4 35.2 54 29.6 54 C24 54 20.4 50.4 20.4 44.8 C20.4 39.2 23.6 35 28.6 34 Z" fill={W} {...edge2} />
      <Path d="M17.6 36.4 C19.6 32.2 25.2 29.6 29.4 29.6 C33.6 29.6 39.2 32.2 41.2 36.4 L38.2 39.6 C35.2 37 32.4 36 29.4 36 C26.4 36 23.6 37 20.6 39.6 Z" fill={P} {...edge2} />
      <Path d="M41.2 36.4 L38.2 39.6 C36.4 38 34.8 37 33 36.4 C36 36 39 36 41.2 36.4 Z" fill={PD} />
      <Path d="M18.6 41.6 C14.6 45 14.6 51.4 18.4 54.6" fill="none" stroke={INK} strokeWidth="6.8" strokeLinecap="round" />
      <Path d="M18.6 41.6 C14.6 45 14.6 51.4 18.4 54.6" fill="none" stroke={B} strokeWidth="4.8" strokeLinecap="round" />
      <Path d="M17.4 11.6 L22.6 24.6 L29 17 Z" fill={B} {...edge} />
      <Path d="M20.6 16.4 L23.2 22.2 L26 18 Z" fill="#3a2540" />
      <Path d="M41.6 10.4 L36.4 23.6 L30 16 Z" fill={B} {...edge} />
      <Path d="M38.4 15.4 L36 21.4 L33 17.4 Z" fill="#3a2540" />
      <Path d="M17.4 26.6 C17.4 19.4 22.8 14.6 29.6 14.6 C36 14.6 41 18.6 42 24.4 C45.6 25.6 48.8 27.8 50.4 30.2 C51.4 32 50.4 33.8 47.8 34.2 C43.6 35 39.4 35.6 35.6 35.2 C33 36.6 30.2 37.2 27.4 36.8 C21.4 36 17.4 32 17.4 26.6 Z" fill={B} {...edge} />
      <Path d="M42 24.4 C45.6 25.6 48.8 27.8 50.4 30.2 C51.4 32 50.4 33.8 47.8 34.2 C43.6 35 39.4 35.6 35.6 35.2 C34.4 31.4 35.4 26.4 37.6 24 Z" fill={D} />
      <Path d="M20.4 28 C20 21.6 24.4 17.4 29.8 16.8 L29.2 20.4 C25.2 21 22.6 23.8 22.8 28.6 Z" fill={L} />
      <Path d="M 34.8 28.2 C 39.4 28.6 44.2 30.4 46.6 32.8 C 47.4 34.0 46.6 35.2 44.4 35.6 C 40.6 36.2 36.8 36.6 33.8 36.4 C 32.6 33.4 33.2 29.8 34.8 28.2 Z" fill={W} {...edge2} />
      <Path d="M 43.0 31.2 C 46.0 31.6 47.8 32.8 47.8 34.2 C 47.8 35.4 46.2 36.0 44.0 35.7 C 42.0 35.4 40.8 34.2 41.0 33.0 C 41.2 31.8 42.0 31.2 43.0 31.2 Z" fill={INK} />
      <Path d="M 35.8 35.2 C 38.4 36.6 41.0 36.4 43.0 34.8" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M21.6 21.6 L28.6 24.4 L28.4 21.6 Z" fill={INK} />
      <Path d="M31.4 20.8 L38 23.2 L37.8 20.6 Z" fill={INK} />
      <Ellipse cx="25" cy="27" rx="3.6" ry="4.1" fill="#ffffff" {...edge2} />
      <Ellipse cx="34.2" cy="26.2" rx="3.4" ry="3.9" fill="#ffffff" {...edge2} />
      <Ellipse cx="25.7" cy="27.5" rx="2" ry="2.8" fill="#221c36" />
      <Ellipse cx="34.9" cy="26.7" rx="1.9" ry="2.7" fill="#221c36" />
      <Circle cx="24.7" cy="25.6" r="1.1" fill="#ffffff" />
      <Circle cx="33.9" cy="24.8" r="1" fill="#ffffff" />
      <Path d="M 46.0 55.6 L 51.8 22.6" stroke={INK} strokeWidth="5.2" strokeLinecap="round" />
      <Path d="M 46.0 55.6 L 51.8 22.6" stroke="#7a5326" strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M 52.8 7.6 C 59.4 14.2 60.8 20.0 57.4 24.2 C 55.0 27.2 50.0 27.2 47.8 24.2 C 44.8 20.0 47.0 14.2 52.8 7.6 Z" fill="#f7a02a" {...edge} />
      <Path d="M 52.8 14.6 C 55.8 17.6 56.4 20.6 54.8 22.6 C 53.6 24.0 51.4 23.8 50.6 22.2 C 49.8 20.6 50.6 18.0 52.8 14.6 Z" fill="#ffeaa0" />
    </Frame>
  );
}

/**
 * 까마귀 정찰병.
 *
 * 판 전체가 사정권인 원거리 유닛이라 손에 석궁을 들렸다. 어두운 깃털만으로는
 * 덩어리로 뭉쳐서, 붉은 목도리로 허리를 끊고 머리깃을 세워 실루엣을 낸다.
 */
export function CrowArt({ size }: ArtProps) {
  const B = '#3b4673', D = '#1f2643', L = '#5d6ca6', R = '#cf3b4e', RD = '#8f2130', K = '#e8dfc2';
  return (
    <Frame size={size}>
      <Path d="M18.6 50 L4.6 57.4 L15.4 41.6 Z" fill={B} {...edge} />
      <Path d="M24.4 48.6 L24.4 55 M34.6 48.6 L34.6 55" stroke={INK} strokeWidth="7.0" strokeLinecap="round" />
      <Path d="M24.4 48.6 L24.4 55 M34.6 48.6 L34.6 55" stroke="#c98a2a" strokeWidth="5" strokeLinecap="round" />
      <Path d="M20 59.2 C19.8 55.8 21.8 54.2 24.6 54.2 C27.4 54.2 29 55.8 28.8 59.2 Z" fill="#c98a2a" {...edge2} />
      <Path d="M30.4 59.2 C30.2 55.8 32.2 54.2 35 54.2 C37.8 54.2 39.4 55.8 39.2 59.2 Z" fill="#c98a2a" {...edge2} />
      <Path d="M21.8 56.6 L21.2 59 M24.6 56 L24.6 59 M27.4 56.6 L28 59 M32.2 56.6 L31.6 59 M35 56 L35 59 M37.8 56.6 L38.4 59" stroke={INK} strokeWidth="0.98" strokeLinecap="round" />
      <Path d="M16.4 42.4 C16.4 34.4 21.8 29.6 29.4 29.6 C37 29.6 42.4 34.4 42.4 42.4 C42.4 51 37.2 56 29.4 56 C21.6 56 16.4 51 16.4 42.4 Z" fill={B} {...edge} />
      <Path d="M42.4 42.4 C42.4 51 37.2 56 29.4 56 C34.2 53.4 38.2 47.6 38.4 39.4 C40.8 40.2 42.4 40.8 42.4 42.4 Z" fill={D} />
      <Path d="M19 44.6 C18.6 37.6 23 33.4 28.6 32.6 L28 36.2 C24 36.8 21 39.8 21.4 45.2 Z" fill={L} />
      <Path d="M17.6 39.6 C13.6 44 13.6 51.6 17.6 55.4 C21 51.6 21 43.6 17.6 39.6 Z" fill={D} {...edge2} />
      <Path d="M15.6 44.6 L20 45.6 M15.2 48.6 L19.8 49 M15.8 52.4 L20 52" stroke={L} strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M17.8 36.6 C21.4 33.4 25.4 32 29.4 32 C33.4 32 37.4 33.4 41 36.6 L39 41.4 C35.4 38.8 32.4 37.8 29.4 37.8 C26.4 37.8 23.4 38.8 19.8 41.4 Z" fill={R} {...edge2} />
      <Path d="M41 36.6 L39 41.4 C37.2 40.1 35.6 39.2 34 38.6 C37 37.8 39.4 37 41 36.6 Z" fill={RD} />
      <Path d="M19.8 41.4 C16.6 45.4 16 49.6 17.4 53" fill="none" stroke={INK} strokeWidth="5.0" strokeLinecap="round" />
      <Path d="M19.8 41.4 C16.6 45.4 16 49.6 17.4 53" fill="none" stroke={R} strokeWidth="3" strokeLinecap="round" />
      <Path d="M22 13.4 L25.4 19.6 L29 12.6 L31.6 19 L35.4 12 L37.4 19.6" fill="none" stroke={B} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17.4 24.6 C17.4 17.4 22.8 12.6 29.6 12.6 C36.4 12.6 41.8 17.4 41.8 24.6 C41.8 31.4 36.6 36 29.6 36 C22.6 36 17.4 31.4 17.4 24.6 Z" fill={B} {...edge} />
      <Path d="M41.8 24.6 C41.8 31.4 36.6 36 29.6 36 C34.4 33.4 37.6 28.6 37.8 21 C40.2 22 41.8 23 41.8 24.6 Z" fill={D} />
      <Path d="M20.4 26.4 C20 20 24 16 29.4 15.4 L28.8 19 C25 19.6 22.6 22.4 22.8 26.8 Z" fill={L} />
      <Path d="M37.4 21.6 L53.6 26.4 L37.4 31.4 Z" fill={K} {...edge2} />
      <Path d="M37.4 26.6 L53 26.5" stroke="#a89878" strokeWidth="1.4" />
      <Path d="M21.4 19.4 L28.4 22.4 L28.2 19.4 Z" fill={INK} />
      <Path d="M31.6 18.6 L38.4 21 L38.2 18.2 Z" fill={INK} />
      <Ellipse cx="24.6" cy="24.6" rx="3.6" ry="4" fill="#ffd34a" {...edge2} />
      <Ellipse cx="34" cy="23.8" rx="3.4" ry="3.8" fill="#ffd34a" {...edge2} />
      <Circle cx="25.2" cy="24.8" r="1.7" fill={INK} />
      <Circle cx="34.6" cy="24" r="1.6" fill={INK} />
      <Circle cx="23.6" cy="23" r="1.1" fill="#ffffff" />
      <Circle cx="33" cy="22.2" r="1" fill="#ffffff" />
      <Path d="M38.6 52.4 L56.6 47.4" stroke={INK} strokeWidth="5.4" strokeLinecap="round" />
      <Path d="M38.6 52.4 L56.6 47.4" stroke="#8a5f32" strokeWidth="3.4" strokeLinecap="round" />
      <Path d="M47.4 39.4 C53.6 43.4 54.2 52.4 49 57" fill="none" stroke={INK} strokeWidth="4.8" strokeLinecap="round" />
      <Path d="M47.4 39.4 C53.6 43.4 54.2 52.4 49 57" fill="none" stroke="#6b4a28" strokeWidth="2.8" strokeLinecap="round" />
      <Path d="M47.4 39.4 L49 57" stroke={INK} strokeWidth="1.05" />
      <Path d="M42.4 51 L59.4 46.6" stroke={INK} strokeWidth="4.0" strokeLinecap="round" />
      <Path d="M42.4 51 L59.4 46.6" stroke="#dfe9fb" strokeWidth="2" strokeLinecap="round" />
    </Frame>
  );
}

/**
 * 거북 결계사.
 *
 * 등딱지가 이 캐릭터의 전부라 제일 크게 잡고 칸을 나눠 그린다. 목을 빼서
 * 머리를 몸에서 떼어 놓아야 작게 줄여도 거북으로 읽힌다.
 */
export function TurtleArt({ size }: ArtProps) {
  const B = '#7cb85e', D = '#41773a', L = '#a8d98a', S = '#c08b32', SD = '#7d5214', SL = '#e6b95e';
  return (
    <Frame size={size}>
      <Path d="M14 44.6 C9 47.6 8.6 54 13 57.4" fill="none" stroke={INK} strokeWidth="7.4" strokeLinecap="round" />
      <Path d="M14 44.6 C9 47.6 8.6 54 13 57.4" fill="none" stroke={D} strokeWidth="5.4" strokeLinecap="round" />
      <Path d="M43.6 43.6 C48.6 46.6 49 53.4 44.6 56.6" fill="none" stroke={INK} strokeWidth="7.0" strokeLinecap="round" />
      <Path d="M43.6 43.6 C48.6 46.6 49 53.4 44.6 56.6" fill="none" stroke={D} strokeWidth="5" strokeLinecap="round" />
      <Path d="M32.4 36.6 L37.6 26.6" stroke={INK} strokeWidth="10.0" strokeLinecap="round" />
      <Path d="M32.4 36.6 L37.6 26.6" stroke={B} strokeWidth="8" strokeLinecap="round" />
      <Path d="M12.4 45 C12.4 35.6 19.6 30 28.6 30 C37.6 30 44.8 35.6 44.8 45 C44.8 52.6 38.6 57 28.6 57 C18.6 57 12.4 52.6 12.4 45 Z" fill={S} {...edge} />
      <Path d="M44.8 45 C44.8 52.6 38.6 57 28.6 57 C35.6 54.6 40 49.6 40.2 41.4 C43 42.6 44.8 43.6 44.8 45 Z" fill={SD} />
      <Path d="M15.4 46.6 C15 39.4 21 34.6 28 34 L27.4 37.6 C22 38.2 17.6 41.4 17.8 47.2 Z" fill={SL} />
      <Path d="M28.2 34.6 C34.6 35.4 38.6 39.6 38.6 45.6 C38.6 51.6 34.4 54.6 28.4 54.6 C22.4 54.6 18.4 51.6 18.4 45.6 C18.4 39.6 22.4 35.4 28.2 34.6 Z" fill="#d7a04c" {...edge2} />
      <Path d="M28.4 34.6 L28.4 54.6 M18.8 41.4 L38 41.4 M18.6 48.6 L38.4 48.6" stroke={SD} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M22.6 57.4 C22.4 54.6 24 53.4 26.4 53.4 C28.8 53.4 30.2 54.6 30 57.4 Z" fill={D} {...edge2} />
      <Path d="M33.6 57.4 C33.4 54.6 35 53.4 37.4 53.4 C39.8 53.4 41.2 54.6 41 57.4 Z" fill={D} {...edge2} />
      <Path d="M18.4 24.4 C18.4 17 24.6 12 32.4 12 C39.4 12 44.6 16 45.6 22 C49 23.2 52 25.4 53.4 27.6 C54.4 29.4 53.4 31.2 50.8 31.6 C46.6 32.4 42.6 33 39 32.6 C36.6 34 33.8 34.6 31 34.2 C23 33.2 18.4 29.4 18.4 24.4 Z" fill={B} {...edge} />
      <Path d="M45.6 22 C49 23.2 52 25.4 53.4 27.6 C54.4 29.4 53.4 31.2 50.8 31.6 C46.6 32.4 42.6 33 39 32.6 C37.8 29 38.8 24 41 21.6 Z" fill={D} />
      <Path d="M21.4 25.6 C21 19.4 25.6 15 31.4 14.4 L30.8 18 C26.8 18.6 23.6 21.4 23.8 26.2 Z" fill={L} />
      <Path d="M39.6 22.6 C44.2 23 48.6 24.8 50.8 27 C51.6 28.2 50.8 29.4 48.6 29.8 C45 30.4 41.6 30.8 38.8 30.6 C37.6 27.6 38.2 24.2 39.6 22.6 Z" fill="#e2f2be" {...edge2} />
      <Ellipse cx="48" cy="26.6" rx="1.9" ry="1.4" fill={INK} />
      <Path d="M40.6 29.4 C43 30.8 45.6 30.6 47.6 29" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M22.4 19.4 L29.6 22.2 L29.4 19.4 Z" fill={INK} />
      <Path d="M32.6 18.6 L39.4 21 L39.2 18.4 Z" fill={INK} />
      <Ellipse cx="26" cy="24.6" rx="3.6" ry="4" fill="#ffffff" {...edge2} />
      <Ellipse cx="35.4" cy="23.8" rx="3.4" ry="3.8" fill="#ffffff" {...edge2} />
      <Ellipse cx="26.7" cy="25.1" rx="2" ry="2.7" fill="#221c36" />
      <Ellipse cx="36.1" cy="24.3" rx="1.9" ry="2.6" fill="#221c36" />
      <Circle cx="25.7" cy="23.2" r="1.1" fill="#ffffff" />
      <Circle cx="35.1" cy="22.4" r="1" fill="#ffffff" />
      <Circle cx="50" cy="45.6" r="9.6" fill="#6fd6ff" {...edge} />
      <Path d="M59.6 45.6 C59.6 50.9 55.3 55.2 50 55.2 C54.6 52.6 57 48.6 57.2 42.4 C58.6 43.2 59.6 44.4 59.6 45.6 Z" fill="#1f76c2" />
      <Circle cx="47" cy="42.4" r="2.6" fill="#e6feff" />
    </Frame>
  );
}

/**
 * 곰 대장군.
 *
 * 영웅 등급이라 금빛 갑옷과 붉은 망토로 격을 준다. 망치는 머리를 크게 잡아야
 * 내리치는 무게가 보인다 - 자루를 길게 빼면 작은 크기에서 막대기로 보인다.
 */
export function BearArt({ size }: ArtProps) {
  const B = '#8d6039', D = '#523418', L = '#b98c5c', G = '#f5bf42', GD = '#a9781a', R = '#c0364b', RD = '#7a1f2f', S = '#d4deef';
  return (
    <Frame size={size}>
      <Path d="M20 32 C8.6 38.6 7 53.4 13.6 59.4 L26.6 53.4 Z" fill={R} {...edge} />
      <Path d="M20 32 C14.6 36.6 12 44.6 12.6 51.4 C15.6 43.4 18.6 37.4 23 33.6 Z" fill={RD} />
      <Path d="M22.4 47.6 L22.4 55 M35.4 47.6 L35.4 55" stroke={INK} strokeWidth="8.8" strokeLinecap="round" />
      <Path d="M22.4 47.6 L22.4 55 M35.4 47.6 L35.4 55" stroke={D} strokeWidth="6.8" strokeLinecap="round" />
      <Path d="M16.6 59.4 C16.4 55.4 18.8 53.4 22.4 53.4 C26 53.4 28.2 55.4 28 59.4 Z" fill={D} {...edge2} />
      <Path d="M29.8 59.4 C29.6 55.4 32 53.4 35.6 53.4 C39.2 53.4 41.4 55.4 41.2 59.4 Z" fill={D} {...edge2} />
      <Path d="M18.8 56.4 L18.2 59.2 M22.4 55.6 L22.4 59.2 M26 56.4 L26.6 59.2 M32 56.4 L31.4 59.2 M35.6 55.6 L35.6 59.2 M39.2 56.4 L39.8 59.2" stroke={INK} strokeWidth="1.05" strokeLinecap="round" />
      <Path d="M12.6 42.4 C12.6 33.6 19 28.4 28.6 28.4 C38.2 28.4 44.6 33.6 44.6 42.4 C44.6 51.4 38.4 56.4 28.6 56.4 C18.8 56.4 12.6 51.4 12.6 42.4 Z" fill={B} {...edge} />
      <Path d="M44.6 42.4 C44.6 51.4 38.4 56.4 28.6 56.4 C34.6 53.6 39.4 47.6 39.6 39.4 C42.6 40.2 44.6 40.8 44.6 42.4 Z" fill={D} />
      <Path d="M15.6 45 C15.2 37.6 20.6 32.6 27.4 31.8 L26.8 35.4 C22 36 18 39.4 18.4 45.6 Z" fill={L} />
      <Path d="M14.6 41.6 C16.4 36.2 21.4 32.6 26.4 31.8 L29 37.8 L31.6 31.8 C36.6 32.6 41.6 36.2 43.4 41.6 L43.4 50 C39 53.8 34 55.6 29 55.6 C24 55.6 19 53.8 14.6 50 Z" fill={G} {...edge} />
      <Path d="M43.4 41.6 L43.4 50 C39.8 53 36 54.8 31.8 55.4 C37 51.4 39.8 45.4 39.8 35.2 C41.4 36.9 42.6 39 43.4 41.6 Z" fill={GD} />
      <Path d="M26.4 31.8 L29 37.8 L31.6 31.8" fill="none" {...edge2} />
      <Path d="M17.4 42 C18.6 38.6 21 36 24 34.8 L25 37.2 C22.2 38.4 20 40.6 18.8 43.6 Z" fill="#ffe8a8" />
      <Circle cx="29" cy="43.6" r="4" fill={R} {...edge2} />
      <Path d="M13.6 35.6 C9 39.6 9 48.6 13.6 53.4" fill="none" stroke={INK} strokeWidth="7.6" strokeLinecap="round" />
      <Path d="M13.6 35.6 C9 39.6 9 48.6 13.6 53.4" fill="none" stroke={B} strokeWidth="5.6" strokeLinecap="round" />
      <Path d="M44.4 36 C49 40 49 48.4 44.4 52.6" fill="none" stroke={INK} strokeWidth="7.2" strokeLinecap="round" />
      <Path d="M44.4 36 C49 40 49 48.4 44.4 52.6" fill="none" stroke={B} strokeWidth="5.2" strokeLinecap="round" />
      <Circle cx="18" cy="14.6" r="7" fill={B} {...edge} />
      <Circle cx="18.4" cy="15.2" r="3.6" fill="#d9a882" />
      <Circle cx="40.4" cy="13.6" r="7" fill={B} {...edge} />
      <Circle cx="40.8" cy="14.2" r="3.6" fill="#d9a882" />
      <Path d="M15.6 25.6 C15.6 17.6 22 12 30 12 C37.6 12 43.4 16.6 44.4 23.4 C48 24.6 51.4 26.8 53 29.4 C54 31.4 53 33.4 50.4 34 C46 35 41.4 35.6 37.4 35.2 C34.6 36.4 31.6 36.8 28.6 36.4 C20.6 35.4 15.6 31 15.6 25.6 Z" fill={B} {...edge} />
      <Path d="M44.4 23.4 C48 24.6 51.4 26.8 53 29.4 C54 31.4 53 33.4 50.4 34 C46 35 41.4 35.6 37.4 35.2 C36.2 31.2 37.2 25.6 39.6 23 Z" fill={D} />
      <Path d="M18.6 27 C18.2 20 23 15.4 29.4 14.8 L28.8 18.4 C24.4 19 21 22.2 21.2 27.6 Z" fill={L} />
      <Path d="M14.6 21.6 C17.6 14.6 23.4 10.6 30 10.6 C36.6 10.6 42.4 14.6 45.4 21.6 L44.4 25.4 C41.4 19.4 36.4 16 30 16 C23.6 16 18.6 19.4 15.6 25.4 Z" fill={G} {...edge} />
      <Path d="M45.4 21.6 L44.4 25.4 C42.6 21.8 40.2 19 37.2 17.2 C41 17.6 43.8 19 45.4 21.6 Z" fill={GD} />
      <Path d="M38 25.6 C42.6 26 47.2 27.8 49.6 30.2 C50.4 31.4 49.6 32.6 47.4 33 C43.6 33.6 39.8 34 36.8 33.8 C35.6 30.6 36.4 27.2 38 25.6 Z" fill="#e2c096" {...edge2} />
      <Path d="M46.4 28.6 C49.4 29 51.2 30.2 51.2 31.6 C51.2 32.8 49.6 33.4 47.4 33.1 C45.4 32.8 44.2 31.6 44.4 30.4 C44.6 29.2 45.4 28.6 46.4 28.6 Z" fill={INK} />
      <Path d="M39 32.6 C41.6 34 44.2 33.8 46.2 32.2" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M20.6 22.6 L28.4 25.4 L28.2 22.4 Z" fill={INK} />
      <Path d="M32.6 21.6 L40 24 L39.8 21.2 Z" fill={INK} />
      <Ellipse cx="24.4" cy="27.4" rx="3.6" ry="4" fill="#ffffff" {...edge2} />
      <Ellipse cx="34.6" cy="26.4" rx="3.4" ry="3.8" fill="#ffffff" {...edge2} />
      <Ellipse cx="25.1" cy="27.9" rx="2" ry="2.7" fill="#221c36" />
      <Ellipse cx="35.3" cy="26.9" rx="1.9" ry="2.6" fill="#221c36" />
      <Circle cx="24.1" cy="26" r="1.1" fill="#ffffff" />
      <Circle cx="34.3" cy="25" r="1" fill="#ffffff" />
      <Path d="M46 52.6 L52.6 22.6" stroke={INK} strokeWidth="6.4" strokeLinecap="round" />
      <Path d="M46 52.6 L52.6 22.6" stroke="#7a5326" strokeWidth="4.4" strokeLinecap="round" />
      <Path d="M45.4 12 L59.4 8 L63 21.4 L49 25.4 Z" fill={S} {...edge} />
      <Path d="M59.4 8 L63 21.4 L54.6 23.8 C58 19.6 59.2 14.4 59.4 8 Z" fill="#8e9cbb" />
      <Path d="M47.6 19 L61.4 15" stroke={G} strokeWidth="3" strokeLinecap="round" />
      <Path d="M46.6 14 L58.6 10.6" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </Frame>
  );
}

/**
 * 뱀 술사.
 *
 * 다리가 없으니 아래를 똬리로 채워야 화면이 안 빈다. 목 후드를 펼쳐 머리를
 * 키우고, 갈라진 혀와 송곳니로 독을 알린다.
 */
export function SerpentArt({ size }: ArtProps) {
  const B = '#56b46e', D = '#256640', L = '#8ede9c', H = '#35a08a', HD = '#166052', V = '#8ce03a';
  return (
    <Frame size={size}>
      <Path d="M44 49.6 C52.6 47.6 55.6 41.6 52 37.4" fill="none" stroke={INK} strokeWidth="6.2" strokeLinecap="round" />
      <Path d="M44 49.6 C52.6 47.6 55.6 41.6 52 37.4" fill="none" stroke={B} strokeWidth="4.2" strokeLinecap="round" />
      <Path d="M8.6 51.6 C8.6 46 17.6 42.6 29 42.6 C40.4 42.6 49.4 46 49.4 51.6 C49.4 57 40.4 59.6 29 59.6 C17.6 59.6 8.6 57 8.6 51.6 Z" fill={B} {...edge} />
      <Path d="M49.4 51.6 C49.4 57 40.4 59.6 29 59.6 C39.4 58 45.4 55 45.6 48.6 C48 49.6 49.4 50.6 49.4 51.6 Z" fill={D} />
      <Path d="M11.6 52.6 C11.6 48.4 19 45.6 28.4 45.4 L28 48.6 C21 48.8 15.4 50.6 15 53.6 Z" fill={L} />
      <Path d="M13.6 52.6 C16.6 55.6 20.6 55.6 23.6 52.6 M24.6 53.4 C27.6 56.4 31.6 56.4 34.6 53.4 M35.6 52.6 C38.6 55.6 42.6 55.6 45.6 52.6" fill="none" stroke={D} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M23.6 47.6 C21.6 40.6 23.6 34.6 29 30.6 L37.6 35.6 C34 39.6 32.4 43.6 32.6 47.6 Z" fill={B} {...edge} />
      <Path d="M28.6 31.6 C15.4 28.6 12.4 16 19.6 8.6 C23.6 15.6 26.6 19.4 29.6 20.6 C32.6 19.4 35.6 15.6 39.6 8.6 C46.8 16 43.8 28.6 30.6 31.6 Z" fill={H} {...edge} />
      <Path d="M39.6 8.6 C46.8 16 43.8 28.6 30.6 31.6 C38.6 27.6 42 20.6 39.4 12.6 Z" fill={HD} />
      <Path d="M19.6 8.6 C23.6 15.6 26.6 19.4 29.6 20.6 C26.6 22.6 22.6 19.6 20.4 13.6 Z" fill="#a8f0dc" />
      <Path d="M18.4 24.4 C18.4 17.6 24.4 13 31.6 13 C38.4 13 43.6 17 44.6 23 C48 24.2 51 26.4 52.4 28.6 C53.4 30.4 52.4 32.2 49.8 32.6 C45.6 33.4 41.6 34 38 33.6 C35.6 35 32.8 35.6 30 35.2 C23 34.2 18.4 30 18.4 24.4 Z" fill={B} {...edge} />
      <Path d="M44.6 23 C48 24.2 51 26.4 52.4 28.6 C53.4 30.4 52.4 32.2 49.8 32.6 C45.6 33.4 41.6 34 38 33.6 C36.8 29.8 37.8 24.6 40 22.4 Z" fill={D} />
      <Path d="M21.4 25.6 C21 19.4 25.4 15.4 30.6 14.8 L30 18.4 C26.2 19 23.6 21.6 23.8 26.4 Z" fill={L} />
      <Path d="M51.6 30.6 L60.4 33.6 M56.4 32.2 L60.4 30.4" fill="none" stroke="#e8455e" strokeWidth="2" strokeLinecap="round" />
      <Path d="M38.6 32.6 L39.6 37.4 L41.6 33.2 Z" fill="#ffffff" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
      <Path d="M22.4 19.6 L29.6 22.4 L29.4 19.4 Z" fill={INK} />
      <Path d="M32.6 18.6 L39.6 21.2 L39.4 18.4 Z" fill={INK} />
      <Ellipse cx="26" cy="24.6" rx="3.6" ry="4" fill="#ffd34a" {...edge2} />
      <Ellipse cx="35.4" cy="23.8" rx="3.4" ry="3.8" fill="#ffd34a" {...edge2} />
      <Ellipse cx="26.4" cy="24.8" rx="1.3" ry="2.8" fill={INK} />
      <Ellipse cx="35.8" cy="24" rx="1.2" ry="2.6" fill={INK} />
      <Circle cx="24.8" cy="23" r="1.1" fill="#ffffff" />
      <Circle cx="34.2" cy="22.2" r="1" fill="#ffffff" />
      <Circle cx="11.6" cy="36.6" r="7.4" fill={V} {...edge} />
      <Path d="M19 36.6 C19 40.7 15.7 44 11.6 44 C15.1 42.1 17 39.4 17.2 34.4 C18.3 35 19 35.8 19 36.6 Z" fill="#2f8a1c" />
      <Circle cx="9.4" cy="34.4" r="2" fill="#eaffd4" />
    </Frame>
  );
}

/**
 * 그리핀 기사단장.
 *
 * 전설 등급. 독수리 머리에 사자 몸, 양쪽으로 펼친 날개가 실루엣을 넓혀 준다.
 * 흰 깃털과 금 갑옷으로 격을 주고, 창끝을 위쪽 빈 곳에 둬서 눈이 위로 뜬다.
 */
export function GriffinArt({ size }: ArtProps) {
  const F = '#e8eef9', FD = '#a3b1cc', W = '#c2cee4', WD = '#8492b0', G = '#f5bf42', GD = '#a9781a';
  
  return (
    <Frame size={size}>
      <Path d="M20 33.6 C6.6 28.6 1.6 40.6 7.6 52.6 C12.6 47.6 17.6 43.6 22 43.6 Z" fill={W} {...edge} />
      <Path d="M7.6 52.6 C12.6 47.6 17.6 43.6 22 43.6 L21.4 39 C15.4 40.6 10.6 45.4 7.6 52.6 Z" fill={WD} />
      <Path d="M38.6 32.6 C51.6 26.6 57.6 38.6 51.6 50.6 C46.6 45.6 41.6 42.6 37 43.6 Z" fill={W} {...edge} />
      <Path d="M51.6 50.6 C46.6 45.6 41.6 42.6 37 43.6 L37.6 38.6 C44 39.6 48.6 43.6 51.6 50.6 Z" fill={WD} />
      <Path d="M22.4 48.6 L22.4 55 M35.4 48.6 L35.4 55" stroke={INK} strokeWidth="8.0" strokeLinecap="round" />
      <Path d="M22.4 48.6 L22.4 55 M35.4 48.6 L35.4 55" stroke="#95681f" strokeWidth="6" strokeLinecap="round" />
      <Path d="M17 59.4 C16.8 55.4 19.2 53.6 22.6 53.6 C26 53.6 28 55.4 27.8 59.4 Z" fill="#c9a04c" {...edge2} />
      <Path d="M30.2 59.4 C30 55.4 32.4 53.6 35.8 53.6 C39.2 53.6 41.2 55.4 41 59.4 Z" fill="#c9a04c" {...edge2} />
      <Path d="M19.2 56.4 L18.6 59.2 M22.6 55.6 L22.6 59.2 M26 56.4 L26.6 59.2 M32.4 56.4 L31.8 59.2 M35.8 55.6 L35.8 59.2 M39.2 56.4 L39.8 59.2" stroke={INK} strokeWidth="1.05" strokeLinecap="round" />
      <Path d="M14.6 43.4 C14.6 35 20.6 30 29 30 C37.4 30 43.4 35 43.4 43.4 C43.4 51.6 37.4 56.4 29 56.4 C20.6 56.4 14.6 51.6 14.6 43.4 Z" fill="#cfa04c" {...edge} />
      <Path d="M43.4 43.4 C43.4 51.6 37.4 56.4 29 56.4 C34.4 53.6 38.6 48 38.8 40.4 C41.6 41.2 43.4 41.8 43.4 43.4 Z" fill="#8a6019" />
      <Path d="M16.6 43.4 C17.6 38 22.6 34 27.6 33.2 L30 39 L32.4 33.2 C37.4 34 42.4 38 43.4 43.4 L43.4 50.6 C39.4 54 34.4 55.6 29.4 55.6 C24.4 55.6 20 54 16.6 50.6 Z" fill={G} {...edge} />
      <Path d="M43.4 43.4 L43.4 50.6 C40 53.4 36.4 55 32.4 55.4 C37.6 51.4 40.4 45.4 40.4 36.6 C41.8 38.4 42.8 40.6 43.4 43.4 Z" fill={GD} />
      <Path d="M27.6 33.2 L30 39 L32.4 33.2" fill="none" {...edge2} />
      <Path d="M19.4 43.4 C20.6 39.6 23 37 26 35.8 L27 38.2 C24.2 39.4 21.6 42 20.6 45 Z" fill="#ffe8a8" />
      <Circle cx="30" cy="44.4" r="4" fill={F} {...edge2} />
      <Path d="M21.4 13.6 L25.4 19.6 L29.6 12.6 L33.6 19 L37.6 12.4" fill="none" stroke={F} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.6 25.4 C16.6 17.6 22.6 12.4 30 12.4 C37.4 12.4 43.4 17.6 43.4 25.4 C43.4 32.6 37.6 37.4 30 37.4 C22.4 37.4 16.6 32.6 16.6 25.4 Z" fill={F} {...edge} />
      <Path d="M43.4 25.4 C43.4 32.6 37.6 37.4 30 37.4 C35.4 34.6 39 30 39.2 21.6 C41.8 22.6 43.4 23.6 43.4 25.4 Z" fill={FD} />
      <Path d="M18.6 21 C21.6 14.6 27.6 11 33.6 11.6 C38.4 12 42 15 43.4 19.6 L41.4 23.6 C38.6 19.6 34.6 17.4 30 17.4 C25.4 17.4 21.6 19 19.4 23 Z" fill={G} {...edge} />
      <Path d="M43.4 19.6 L41.4 23.6 C39.6 21 37.4 19 34.8 18 C38.6 17.6 41.6 18 43.4 19.6 Z" fill={GD} />
      <Path d="M37.4 26.6 L52.6 30.4 C53 34.4 50 37.6 46.4 36.6 C42.4 35.4 38.6 33.6 36.6 32.6 Z" fill={G} {...edge2} />
      <Path d="M37.4 30.4 L52.4 30.4" stroke={GD} strokeWidth="1.5" />
      <Path d="M21.6 21.6 L28.6 24.4 L28.4 21.4 Z" fill={INK} />
      <Path d="M39 21 L32.4 23.4 L32.6 20.4 Z" fill={INK} />
      <Ellipse cx="25" cy="26.6" rx="3.6" ry="4" fill="#ffd34a" {...edge2} />
      <Ellipse cx="34.6" cy="26" rx="3.4" ry="3.8" fill="#ffd34a" {...edge2} />
      <Circle cx="25.6" cy="26.8" r="1.7" fill={INK} />
      <Circle cx="35.2" cy="26.2" r="1.6" fill={INK} />
      <Circle cx="23.8" cy="25" r="1.1" fill="#ffffff" />
      <Circle cx="33.4" cy="24.4" r="1" fill="#ffffff" />
      <Path d="M40.6 55.6 L54.6 18.6" stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
      <Path d="M40.6 55.6 L54.6 18.6" stroke="#7a5326" strokeWidth="3.6" strokeLinecap="round" />
      <Path d="M55.6 17 L61.6 5.6 L49.6 10.6 Z" fill="#dfe9fb" {...edge} />
      <Path d="M61.6 5.6 L55.6 17 L53.6 13 C56.6 10.6 59 8.4 61.6 5.6 Z" fill={WD} />
    </Frame>
  );
}

/**
 * 용의 후예.
 *
 * 전설 등급. 붉은 비늘에 금빛 배, 접은 날개와 뿔. 숨결로 줄을 태우는 유닛이라
 * 주둥이 앞에 불길을 물려 둔다 - 그게 이 캐릭터의 설명이다.
 */
export function WyrmArt({ size }: ArtProps) {
  const B = '#d9412e', D = '#8a1b1b', L = '#ff8f68', Y = '#efb457', YD = '#a87028', WG = '#8a2230', WGD = '#4f1020';
  return (
    <Frame size={size}>
      <Path d="M22 32.6 C9.6 21.6 3.6 26.6 4.6 36.6 C5.6 46.6 14 48.6 21.6 44 Z" fill={WG} {...edge} />
      <Path d="M4.6 36.6 C5.6 46.6 14 48.6 21.6 44 L20.6 39.6 C14.6 42.6 9.6 41 6.6 34.6 Z" fill={WGD} />
      <Path d="M20 45.6 L20.6 40.6 M14.6 43.6 L13 38.6 M9 39.6 L8 34.6" stroke={B} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M18.6 52.6 C8.6 54.6 4.6 48.6 7.6 42.6" fill="none" stroke={INK} strokeWidth="6.2" strokeLinecap="round" />
      <Path d="M18.6 52.6 C8.6 54.6 4.6 48.6 7.6 42.6" fill="none" stroke={B} strokeWidth="4.2" strokeLinecap="round" />
      <Path d="M9.4 41 L2.6 36.6 L7.6 46.6 Z" fill={Y} {...edge2} />
      <Path d="M23.4 48.6 L23.4 55 M35.4 48.6 L35.4 55" stroke={INK} strokeWidth="7.6" strokeLinecap="round" />
      <Path d="M23.4 48.6 L23.4 55 M35.4 48.6 L35.4 55" stroke={D} strokeWidth="5.6" strokeLinecap="round" />
      <Path d="M18.4 59.4 C18.2 55.6 20.6 53.8 23.6 53.8 C26.6 53.8 28.6 55.6 28.4 59.4 Z" fill={D} {...edge2} />
      <Path d="M30.6 59.4 C30.4 55.6 32.8 53.8 35.8 53.8 C38.8 53.8 40.8 55.6 40.6 59.4 Z" fill={D} {...edge2} />
      <Path d="M20.4 56.4 L19.8 59.2 M23.6 55.8 L23.6 59.2 M26.8 56.4 L27.4 59.2 M32.6 56.4 L32 59.2 M35.8 55.8 L35.8 59.2 M39 56.4 L39.6 59.2" stroke="#f7e6c2" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 43 C16 34.6 22 29.6 29.6 29.6 C37.2 29.6 43.2 34.6 43.2 43 C43.2 51.4 37.4 56.4 29.6 56.4 C21.8 56.4 16 51.4 16 43 Z" fill={B} {...edge} />
      <Path d="M43.2 43 C43.2 51.4 37.4 56.4 29.6 56.4 C34.6 53.6 38.6 48 38.8 39.6 C41.6 40.4 43.2 41.4 43.2 43 Z" fill={D} />
      <Path d="M18.6 45 C18.2 38 22.6 33.4 28.4 32.6 L27.8 36.2 C23.6 36.8 20.6 39.6 21 45.6 Z" fill={L} />
      <Path d="M30.6 33.4 C36.4 34.4 39.6 38.6 39.6 44.4 C39.6 50.4 35.6 54.4 29.8 54.4 C24 54.4 20.4 50.4 20.4 44.6 C20.4 38.8 24 34.4 28.6 33.4 Z" fill={Y} {...edge2} />
      <Path d="M22.4 39.4 L37 39.4 M21.4 44.6 L38.4 44.6 M23.4 49.6 L36.4 49.6" stroke={YD} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M17.4 37 C12.6 41.6 12.6 49.6 17.4 53.6" fill="none" stroke={INK} strokeWidth="7.0" strokeLinecap="round" />
      <Path d="M17.4 37 C12.6 41.6 12.6 49.6 17.4 53.6" fill="none" stroke={B} strokeWidth="5" strokeLinecap="round" />
      <Path d="M42.6 37 C47.4 41.4 47.4 49 42.6 53" fill="none" stroke={INK} strokeWidth="6.6" strokeLinecap="round" />
      <Path d="M42.6 37 C47.4 41.4 47.4 49 42.6 53" fill="none" stroke={B} strokeWidth="4.6" strokeLinecap="round" />
      <Path d="M21.6 31.6 L17.6 24.6 L27.6 28.6 Z" fill={Y} {...edge2} />
      <Path d="M21.6 14.6 C16.6 7.6 18.6 2.6 24.6 1.6 C23.6 6.6 24.4 11.6 27.6 15.6 Z" fill="#f7e6c2" {...edge} />
      <Path d="M38 13.6 C43.6 6.6 41.6 2 35.6 1.2 C36.6 6.2 35.6 11 32.6 15 Z" fill="#f7e6c2" {...edge} />
      <Path d="M35.6 1.2 C36.6 6.2 35.6 11 32.6 15 L35.6 15.6 C38.6 11 39.6 6 38.6 2 Z" fill="#c9b98c" />
      <Path d="M17 24.6 C17 17 23 12 30.6 12 C37.6 12 43 16 44 22.4 C47.6 23.6 51 26 52.6 28.6 C53.6 30.6 52.6 32.6 50 33.2 C45.6 34.2 41 34.8 37 34.4 C34.4 35.6 31.4 36 28.6 35.6 C21 34.6 17 30.4 17 24.6 Z" fill={B} {...edge} />
      <Path d="M44 22.4 C47.6 23.6 51 26 52.6 28.6 C53.6 30.6 52.6 32.6 50 33.2 C45.6 34.2 41 34.8 37 34.4 C35.8 30.4 36.8 24.6 39.2 22 Z" fill={D} />
      <Path d="M20 26.4 C19.6 19.6 24.4 15 30.4 14.4 L29.8 18 C25.6 18.6 22.4 21.6 22.6 26.8 Z" fill={L} />
      <Path d="M47.6 27.6 C50.2 28 52 29.2 52 30.6 C52 31.8 50.4 32.4 48.4 32.1 C46.6 31.8 45.4 30.6 45.6 29.4 C45.8 28.2 46.6 27.6 47.6 27.6 Z" fill={INK} />
      <Path d="M39 32.4 C41.6 33.8 44.4 33.6 46.4 32" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M40.4 33 L41.4 37.4 L43.4 33.6 Z" fill="#ffffff" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
      <Path d="M21.4 21.4 L28.6 24.2 L28.4 21.2 Z" fill={INK} />
      <Path d="M31.6 20.4 L38.6 23 L38.4 20.2 Z" fill={INK} />
      <Ellipse cx="25" cy="26.4" rx="3.6" ry="4" fill="#ffd34a" {...edge2} />
      <Ellipse cx="34.6" cy="25.6" rx="3.4" ry="3.8" fill="#ffd34a" {...edge2} />
      <Ellipse cx="25.4" cy="26.6" rx="1.3" ry="2.8" fill={INK} />
      <Ellipse cx="35" cy="25.8" rx="1.2" ry="2.6" fill={INK} />
      <Circle cx="23.8" cy="24.8" r="1.1" fill="#ffffff" />
      <Circle cx="33.4" cy="24" r="1" fill="#ffffff" />
      <Path d="M52.6 26.6 C58.6 26 62.6 29.6 62.6 34.6 C60 32.6 56.6 32.6 54 34.6 C52.6 32 52 29.2 52.6 26.6 Z" fill="#ffb63a" {...edge} />
      <Path d="M54 28.6 C57 28.6 59.4 30 60.4 31.6 C58.4 31.6 56.6 32.2 55.4 33.2 C54.6 31.6 54 30 54 28.6 Z" fill="#fff6cc" />
    </Frame>
  );
}

/**
 * 별의 현자.
 *
 * 신화 등급 하나뿐이니 제일 다르게 생겨야 한다. 얼굴을 두건 그늘에 묻고 눈만
 * 빛내는 쪽이, 이목구비를 그려 넣는 것보다 작은 크기에서 훨씬 세 보인다.
 * 옷자락이 발을 덮어 발을 안 그린다 - 별이 지팡이 끝에서 제일 밝다.
 */
export function SageArt({ size }: ArtProps) {
  const R = '#4e3fb0', RD = '#241a5c', RL = '#7c6ae0', F = '#150f2e', G = '#f5bf42';
  return (
    <Frame size={size}>
      <Path d="M29 25.6 C17 29.6 11.6 45.6 12.6 59.4 L45.4 59.4 C46.4 45.6 41 29.6 29 25.6 Z" fill={R} {...edge} />
      <Path d="M45.4 59.4 L36.6 59.4 C38.6 45.6 36 33.6 30 26 C41 30.6 46.4 45.6 45.4 59.4 Z" fill={RD} />
      <Path d="M16.4 50.6 C16 41 19.6 33 26 28.6 L27.4 32 C22 36 18.8 42.6 19 51.4 Z" fill={RL} />
      <Path d="M14.6 56.6 C17.6 59.6 21 59.6 24 56.6 M24.6 57.4 C27.6 60.4 31 60.4 34 57.4 M34.6 56.6 C37.6 59.6 41 59.6 44 56.6" fill="none" stroke={RD} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M20.4 40.6 L21.6 44 L25 44.4 L22.4 46.8 L23.2 50.4 L20.4 48.4 L17.6 50.4 L18.4 46.8 L15.8 44.4 L19.2 44 Z" fill={G} />
      <Path d="M37.6 47.6 L38.6 50.4 L41.4 50.6 L39.4 52.6 L40 55.4 L37.6 53.8 L35.2 55.4 L35.8 52.6 L33.8 50.6 L36.6 50.4 Z" fill={G} />
      <Path d="M17.6 36.6 C12.6 41.6 12.6 50.6 17 55.4" fill="none" stroke={INK} strokeWidth="7.6" strokeLinecap="round" />
      <Path d="M17.6 36.6 C12.6 41.6 12.6 50.6 17 55.4" fill="none" stroke={R} strokeWidth="5.6" strokeLinecap="round" />
      <Path d="M41.6 36 C46.6 41.4 46.6 50 42 54.6" fill="none" stroke={INK} strokeWidth="7.2" strokeLinecap="round" />
      <Path d="M41.6 36 C46.6 41.4 46.6 50 42 54.6" fill="none" stroke={R} strokeWidth="5.2" strokeLinecap="round" />
      <Path d="M29 3.6 C17.6 3.6 11.6 14.6 14.4 26 C16.6 34.6 24.6 37.6 29 37.6 C33.4 37.6 41.4 34.6 43.6 26 C46.4 14.6 40.4 3.6 29 3.6 Z" fill={R} {...edge} />
      <Path d="M43.6 26 C41.4 34.6 33.4 37.6 29 37.6 C35.6 33.6 39.6 25.6 39.6 12.6 C43.4 16.6 45 21.4 43.6 26 Z" fill={RD} />
      <Path d="M17.6 24.6 C15.6 15.6 19.6 8 27.4 6.6 L26.8 10.4 C21.4 11.6 18.4 17 20.4 25.4 Z" fill={RL} />
      <Path d="M29.4 15.6 C36.6 15.6 41.4 19.6 41.4 25.6 C41.4 31.6 35.6 35.4 29.4 35.4 C23.2 35.4 17.4 31.6 17.4 25.6 C17.4 19.6 22.2 15.6 29.4 15.6 Z" fill={F} {...edge2} />
      <Path d="M22 24.4 C22 22.4 23.6 21.4 25.6 21.4 C27.6 21.4 29 22.4 29 24.4 C29 26.4 27.6 27.6 25.6 27.6 C23.6 27.6 22 26.4 22 24.4 Z" fill="#8ff0ff" />
      <Path d="M30.6 24.2 C30.6 22.2 32.2 21.2 34.2 21.2 C36.2 21.2 37.6 22.2 37.6 24.2 C37.6 26.2 36.2 27.4 34.2 27.4 C32.2 27.4 30.6 26.2 30.6 24.2 Z" fill="#8ff0ff" />
      <Path d="M22.6 32 C25.6 40.6 33.6 40.6 36.6 32 C33.6 35.4 25.6 35.4 22.6 32 Z" fill="#e8ecff" {...edge2} />
      <Path d="M44.6 57.4 L50.6 18.6" stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
      <Path d="M44.6 57.4 L50.6 18.6" stroke="#6a5aa0" strokeWidth="3.6" strokeLinecap="round" />
      <Path d="M51.6 2.6 L54.6 9.6 L62 10 L56.4 15 L58.2 22.4 L51.6 18.4 L45 22.4 L46.8 15 L41.2 10 L48.6 9.6 Z" fill={G} {...edge} />
      <Path d="M51.6 2.6 L54.6 9.6 L62 10 L56.4 15 L58.2 22.4 L51.6 18.4 C54.6 15.6 55.6 10.6 51.6 2.6 Z" fill="#c08c14" />
    </Frame>
  );
}

/** 아기 드래곤 */
export function DragonArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <Path d="M16 46 C4 48 4 34 14 34" fill="none" {...cap} stroke="#3f9a55" strokeWidth={5} />
      <Path d="M18 28 L10 12 L28 22 Z" fill="#6fd489" {...line} />
      <Ellipse cx="27" cy="44" rx="14" ry="13" fill="#4cb066" {...line} />
      <Ellipse cx="29" cy="48" rx="8" ry="7" fill="#bff0c6" />
      <Circle cx="40" cy="28" r="11" fill="#5ac177" {...line} />
      <Ellipse cx="51" cy="31" rx="7" ry="5" fill="#6fd489" {...line} />
      <Circle cx="55" cy="30" r="1.6" fill={OL} />
      <Polygon points="36,17 40,8 44,18" fill="#f2ead6" {...line} strokeWidth={1.6} />
      <Circle cx="44" cy="26" r="2.2" fill={OL} />
    </Frame>
  );
}

// -------------------------------------------------------------- 적 유닛

/** 해골 병사 */
export function SkeletonArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <Path d="M28 34 L28 52" {...cap} stroke="#e6ebf5" strokeWidth={4} />
      <Path d="M20 40 L36 40 M20 47 L36 47" {...cap} stroke="#e6ebf5" strokeWidth={3.4} />
      <Path d="M24 52 L20 61 M32 52 L36 61" {...cap} stroke="#e6ebf5" strokeWidth={3.4} />
      <Circle cx="29" cy="20" r="12" fill="#eef2f8" {...line} />
      <Ellipse cx="25" cy="19" rx="3.4" ry="4" fill={OL} />
      <Ellipse cx="35" cy="19" rx="3.4" ry="4" fill={OL} />
      <Path d="M24 28 L34 28" {...cap} stroke={OL} strokeWidth={1.8} />
      <Path d="M26 26 L26 30 M30 26 L30 30" stroke={OL} strokeWidth={1.4} />
      <Path d="M38 44 L44 38" {...cap} stroke="#7a5a34" strokeWidth={4.5} />
      <Path d="M44 38 L57 25" {...cap} stroke="#b9a68c" strokeWidth={4} />
    </Frame>
  );
}

/** 좀비 */
export function ZombieArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <Rect x="16" y="34" width="24" height="24" rx="7" fill="#5f7a45" {...line} />
      <Path d="M20 40 L28 44 L20 48" fill="none" stroke="#435730" strokeWidth={2} />
      <Path d="M40 40 L56 38" {...cap} stroke="#7ea05c" strokeWidth={6} />
      <Path d="M40 48 L54 47" {...cap} stroke="#7ea05c" strokeWidth={6} />
      <Circle cx="28" cy="22" r="12" fill="#82a75f" {...line} />
      <Circle cx="33" cy="20" r="3.2" fill="#f4f8ec" {...line} strokeWidth={1.4} />
      <Circle cx="34" cy="20" r="1.5" fill={OL} />
      <Path d="M22 18 L27 21" {...cap} stroke={OL} strokeWidth={1.8} />
      <Path d="M26 29 L36 28" {...cap} stroke={OL} strokeWidth={1.8} />
      <Path d="M29 27 L29 31" stroke={OL} strokeWidth={1.3} />
    </Frame>
  );
}

/**
 * 유령 사서.
 *
 * 다리가 없으니 아래를 물결로 끊어 떠 있는 것으로 만든다. 몸이 밝은 한 덩이라
 * 굵은 테두리와 두건 그림자만으로 형태를 낸다. 책은 붉게 해서 눈이 간다.
 */
export function GhostArt({ size }: ArtProps) {
  const B = '#e6ecfa', D = '#b4c2de', L = '#ffffff';
  return (
    <Frame size={size}>
      <Path d="M13.6 34 C13.6 20.6 20.6 11.6 30.6 11.6 C40.6 11.6 47.6 20.6 47.6 34 L47.6 52.4 L43.6 48.4 L39.6 53.4 L35.4 48.4 L31.4 53.4 L27.4 48.4 L23.4 53.4 L19.4 48.4 L15.4 53 L13.6 50 Z" fill={B} {...edge} />
      <Path d="M47.6 34 L47.6 52.4 L43.6 48.4 L39.6 53.4 L36.6 49.8 C41.4 44.4 43.6 36 43.4 24.6 C46 27.4 47.6 30.6 47.6 34 Z" fill={D} />
      <Path d="M16.6 36 C16.2 24.4 21.4 16.4 29.4 15 L28.8 19 C23 20.4 19.6 26.6 19.6 36.6 Z" fill={L} />
      <Path d="M18.6 26.6 C18.6 18.6 24.2 13 30.6 13 C37 13 42.6 18.6 42.6 26.6 C42.6 30.6 38.6 33.4 30.6 33.4 C22.6 33.4 18.6 30.6 18.6 26.6 Z" fill="#c8d4ee" {...edge2} />
      <Path d="M23.4 20.6 L30.6 23.6 L30.4 20.4 Z" fill={INK} />
      <Path d="M39 20 L32 22.4 L32.2 19.4 Z" fill={INK} />
      <Ellipse cx="25.6" cy="25.6" rx="3.4" ry="4.2" fill={INK} />
      <Ellipse cx="35.6" cy="25.4" rx="3.4" ry="4.2" fill={INK} />
      <Circle cx="26.6" cy="23.8" r="1.2" fill="#9fe8ff" />
      <Circle cx="36.6" cy="23.6" r="1.2" fill="#9fe8ff" />
      <Path d="M28 31.4 C29.6 33.4 31.6 33.4 33.2 31.4" fill="none" stroke={INK} strokeWidth="1.35" strokeLinecap="round" />
      <Path d="M44.6 34.6 L57.6 32 L59.6 42.6 L46.6 45.2 Z" fill="#c0364b" {...edge} />
      <Path d="M57.6 32 L59.6 42.6 L53.6 43.8 C56 40.4 57 36.6 57.6 32 Z" fill="#7a1f2f" />
      <Path d="M46.6 36.6 L55.6 34.8 M47.2 39.6 L56.2 37.8 M47.8 42.4 L56.8 40.6" stroke="#f0d9a8" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M43.6 40.4 C45.6 36.6 48.6 34.6 51.6 34" fill="none" stroke={INK} strokeWidth="6.0" strokeLinecap="round" />
      <Path d="M43.6 40.4 C45.6 36.6 48.6 34.6 51.6 34" fill="none" stroke={B} strokeWidth="4" strokeLinecap="round" />
    </Frame>
  );
}

/** 오크 전사 */
export function OrcArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <Path d="M44 50 L52 14" {...cap} stroke="#7d5a33" strokeWidth={4} />
      <Polygon points="46,20 62,12 60,26 48,28" fill="#c3cee4" {...line} />
      <Ellipse cx="26" cy="44" rx="18" ry="16" fill="#557f37" {...line} />
      <Rect x="16" y="55" width="9" height="7" rx="3" fill="#456a2c" {...line} strokeWidth={1.8} />
      <Rect x="30" y="55" width="9" height="7" rx="3" fill="#456a2c" {...line} strokeWidth={1.8} />
      <Circle cx="31" cy="22" r="13" fill="#69984a" {...line} />
      <Polygon points="28,30 26,38 31,31" fill="#f4f2e2" {...line} strokeWidth={1.5} />
      <Polygon points="38,30 40,38 35,31" fill="#f4f2e2" {...line} strokeWidth={1.5} />
      <Circle cx="36" cy="19" r="2.4" fill={OL} />
      <Circle cx="27" cy="20" r="2.4" fill={OL} />
      <Path d="M22 12 L31 15 M42 11 L35 15" {...cap} stroke={OL} strokeWidth={2} />
    </Frame>
  );
}

/** 리치 */
export function LichArt({ size }: ArtProps) {
  return (
    <Frame size={size}>
      <Path d="M46 58 L50 14" {...cap} stroke="#4b3a63" strokeWidth={3.4} />
      <Circle cx="51" cy="11" r="6.5" fill="#c07bff" {...line} strokeWidth={1.8} />
      <Path d="M28 22 L44 58 L12 58 Z" fill="#432c66" {...line} />
      <Path d="M28 22 L36 42 L20 42 Z" fill="#57397f" />
      <Path d="M17 24 C17 10 39 10 39 24 L36 34 L20 34 Z" fill="#573a80" {...line} />
      <Circle cx="28" cy="26" r="9" fill="#ece7f6" {...line} />
      <Circle cx="24" cy="25" r="2.6" fill="#5fe3d8" />
      <Circle cx="32" cy="25" r="2.6" fill="#5fe3d8" />
      <Path d="M24 31 L33 31" {...cap} stroke={OL} strokeWidth={1.6} />
    </Frame>
  );
}

// ---------------------------------------------------------------- 기지

/** 아군 기지 — 돌성 */
export function AllyBaseArt({ size = 90 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="18" y="42" width="64" height="50" fill="#8d97ac" {...line} />
      <Rect x="8" y="28" width="22" height="64" fill="#a3adc2" {...line} />
      <Rect x="70" y="28" width="22" height="64" fill="#a3adc2" {...line} />
      {/* 총안 */}
      <Path
        d="M8 28 L8 20 L13 20 L13 26 L18 26 L18 20 L25 20 L25 26 L30 26 L30 20 L30 28 Z"
        fill="#a3adc2"
        {...line}
      />
      <Path
        d="M70 28 L70 20 L75 20 L75 26 L80 26 L80 20 L87 20 L87 26 L92 26 L92 20 L92 28 Z"
        fill="#a3adc2"
        {...line}
      />
      <Rect x="18" y="34" width="64" height="9" fill="#b6bfd2" {...line} />
      {/* 문 */}
      <Path d="M38 92 L38 66 Q50 54 62 66 L62 92 Z" fill="#5c4630" {...line} />
      <Path d="M50 92 L50 60" stroke="#3d2e1f" strokeWidth={2} />
      {/* 창 */}
      <Rect x="14" y="44" width="9" height="13" rx="4" fill="#2b3450" {...line} strokeWidth={1.6} />
      <Rect x="77" y="44" width="9" height="13" rx="4" fill="#2b3450" {...line} strokeWidth={1.6} />
      {/* 깃발 */}
      <Path d="M50 34 L50 8" {...cap} stroke="#5c4630" strokeWidth={3} />
      <Path d="M50 10 L74 16 L50 24 Z" fill="#3d6fd4" {...line} />
    </Svg>
  );
}

/** 적 기지 — 뾰족한 암흑 요새 */
export function EnemyBaseArt({ size = 90 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M20 92 L20 46 L50 30 L80 46 L80 92 Z" fill="#3b2f4d" {...line} />
      <Polygon points="10,92 10,40 24,26 38,40 38,92" fill="#4a3a5f" {...line} />
      <Polygon points="62,92 62,40 76,26 90,40 90,92" fill="#4a3a5f" {...line} />
      <Polygon points="24,26 24,10 30,20 34,6 38,22" fill="#241c33" {...line} strokeWidth={1.8} />
      <Polygon points="76,26 76,10 82,20 86,6 90,22" fill="#241c33" {...line} strokeWidth={1.8} />
      {/* 문 */}
      <Path d="M40 92 L40 64 Q50 52 60 64 L60 92 Z" fill="#1c1528" {...line} />
      <Path d="M46 78 L46 86 M54 78 L54 86" stroke="#ff5566" strokeWidth={2.4} />
      {/* 붉게 빛나는 창 */}
      <Polygon points="17,50 27,50 22,62" fill="#ff5566" {...line} strokeWidth={1.6} />
      <Polygon points="69,50 79,50 74,62" fill="#ff5566" {...line} strokeWidth={1.6} />
      <Polygon points="45,40 55,40 50,52" fill="#ff8a3d" {...line} strokeWidth={1.6} />
      {/* 깃발 */}
      <Path d="M50 30 L50 6" {...cap} stroke="#241c33" strokeWidth={3} />
      <Path d="M50 8 L26 14 L50 22 Z" fill="#c1354a" {...line} />
    </Svg>
  );
}

// -------------------------------------------------------------- 레지스트리

const REGISTRY: Record<string, React.FC<ArtProps>> = {
  hero: HeroArt,
  mouse: MouseArt,
  penguin: PenguinArt,
  owl: OwlArt,
  toad: ToadArt,
  rhino: RhinoArt,
  wolf: WolfArt,
  fox: FoxArt,
  crow: CrowArt,
  turtle: TurtleArt,
  bear: BearArt,
  serpent: SerpentArt,
  griffin: GriffinArt,
  wyrm: WyrmArt,
  sage: SageArt,
  dragon: DragonArt,
  skeleton: SkeletonArt,
  zombie: ZombieArt,
  ghost: GhostArt,
  orc: OrcArt,
  lich: LichArt,
};

/*
  펭귄 궁수 - 제미나이 그림을 잘라 물린 조각.

  SVG 로 다시 그리지 않는다. 이미 있는 그림(`assets/units/penguin.png`)을 머리와
  몸으로 갈라 두고(`tools/cut-parts.py`), 관절 장치가 그 두 장을 돌린다. 그림의
  품질은 그대로고 움직임만 얹힌다.

  자리 값은 잘라 낸 네모 판(409×409)의 픽셀을 64 자로 옮긴 것이다 - px / 409 * 64.
*/
const PENGUIN_RIG: RigSpec = {
  /*
    활은 당겼다 놓는다. 앞의 셋으로 시위를 당기며 몸을 앞으로 싣고, 0.44 에서
    놓으면서 뒤로 밀린 뒤 천천히 돌아온다.
  */
  times: [0, 0.12, 0.24, 0.32, 0.44, 0.6, 0.78, 1],
  // 펭귄은 초당 2.45 번 쏜다. 한 번 쏘는 동작이 그 간격(0.41초) 안에 끝나야 한다
  swingMs: 340,
  idleMs: 2600,
  parts: [
    {
      /*
        몸 - 발밑에서 돈다.

        활은 당길 때 몸이 앞으로 실렸다가 놓는 순간 뒤로 밀린다. 근접과 반대다.
      */
      pivot: [36, 62.6],
      sway: 1.1,
      bob: 0.009,
      swing: [0, 1, 2, 2, -5, -6, -3, 0],
      shift: [0, 0.006, 0.012, 0.012, -0.03, -0.035, -0.016, 0],
      src: require('../../../assets/units/penguin/parts/body.png'),
    },
    {
      // 머리 - 목에서 돈다. 놓는 순간 뒤로 젖혀진다
      parent: 0,
      pivot: [35.5, 31.3],
      sway: 1.7,
      phase: 0.22,
      swing: [0, 1, 3, 3, -7, -9, -4, 0],
      src: require('../../../assets/units/penguin/parts/head.png'),
    },
  ],
};

/**
 * 조각내 움직일 수 있는 유닛.
 *
 * 여기 있으면 판 위에서 관절이 움직인다 (`rig.tsx`). 없으면 위 그림 그대로
 * 가만히 서 있는다 - 조각을 나누는 건 유닛마다 손으로 하는 일이라, 되는
 * 것부터 하나씩 옮긴다.
 */
const RIGS: Record<string, RigSpec> = {
  mouse: MOUSE_RIG,
  penguin: PENGUIN_RIG,
  owl: OWL_RIG,
  toad: TOAD_RIG,
  rhino: RHINO_RIG,
  wolf: WOLF_RIG,
};

/** defId 로 움직이는 조각 묶음을 찾는다. 없으면 null */
export function rigFor(defId: string): RigSpec | null {
  return RIGS[defId] ?? null;
}

/** defId 로 캐릭터 아트를 찾는다. 없으면 null (렌더 쪽에서 이모지로 넘어간다). */
export function artFor(defId: string): React.FC<ArtProps> | null {
  return REGISTRY[defId] ?? null;
}

// ------------------------------------------------------------ SVG 글로 옮기기

/*
  전투 판의 적은 Skia 캔버스에 그린다 (`BattleCanvas.tsx`).

  Skia 는 여기 컴포넌트를 못 읽으니 같은 그림을 SVG 글로 풀어서 넘긴다. 그림을
  두 벌 두면 한쪽만 고치고 다른 쪽을 잊는다 - 원본은 여기 한 곳에만 둔다.

  여기 그림 함수는 훅 없이 태그만 돌려주니, 그대로 불러서 태그를 글로 옮기면 된다.
*/
const TAGS = new Map<unknown, string>([
  [Svg, 'svg'],
  [Defs, 'defs'],
  [LinearGradient, 'linearGradient'],
  [RadialGradient, 'radialGradient'],
  [Stop, 'stop'],
  [Path, 'path'],
  [Circle, 'circle'],
  [Ellipse, 'ellipse'],
  [Rect, 'rect'],
  [Polygon, 'polygon'],
]);

/** 대문자가 섞였어도 SVG 에서 그 이름 그대로 쓰는 속성 */
const KEEP_CASE = new Set(['viewBox', 'gradientUnits', 'gradientTransform']);

function toMarkup(node: React.ReactNode): string {
  if (Array.isArray(node)) return node.map(toMarkup).join('');
  if (!React.isValidElement(node)) return '';
  const { children, ...props } = node.props as { children?: React.ReactNode } & Record<string, unknown>;
  const tag = TAGS.get(node.type);
  if (!tag) {
    const type = node.type as ((p: unknown) => React.ReactNode) & {
      prototype?: { isReactComponent?: object };
    };
    // Frame 같은 감싸개는 불러서 속을 푼다. 클래스 컴포넌트는 부를 수 없으니 속만 본다
    if (typeof type === 'function' && !type.prototype?.isReactComponent) {
      return toMarkup(type(node.props));
    }
    return toMarkup(children);
  }
  let attrs = tag === 'svg' ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  for (const [key, value] of Object.entries(props)) {
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const name = KEEP_CASE.has(key) ? key : key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
    attrs += ` ${name}="${String(value).replace(/"/g, '&quot;')}"`;
  }
  return `<${tag}${attrs}>${toMarkup(children)}</${tag}>`;
}

/** defId 의 그림을 한 변 size 픽셀짜리 SVG 글로. 그림이 없으면 null */
export function svgMarkup(defId: string, size: number): string | null {
  const Art = REGISTRY[defId];
  return Art ? toMarkup(<Art size={size} />) : null;
}
