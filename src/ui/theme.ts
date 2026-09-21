import { Platform, type TextStyle } from 'react-native';

/**
 * 마법 학교 톤.
 *
 *   깊은 밤하늘 남보라 + 금색 장식 + 양피지 + 자주빛 강조
 *
 * 저작권 문제를 피하려고 특정 작품의 이름·문장·기숙사 색은 쓰지 않고,
 * '마법 학교' 라는 일반적인 분위기만 가져온다.
 */
export const C = {
  /** 화면 바탕 — 밤하늘 */
  bg: '#141033',
  bgDeep: '#0b0820',

  /** 모든 테두리에 쓰는 가장 진한 색 */
  outline: '#1a1338',
  /** 패널 안쪽 금색 실선 */
  inner: '#c9a227',

  panel: '#2e2560',
  panelLight: '#3d3179',
  panelDeep: '#211a4a',

  /** 움푹 파인 슬롯 */
  slot: '#332a63',
  slotDeep: '#1d1742',

  gold: '#e8c352',
  goldDeep: '#a8801c',
  goldEdge: '#6d5210',

  /** 양피지 */
  parch: '#f0e3c2',
  parchDark: '#d8c294',

  text: '#f6efdc',
  textDark: '#2a1f10',
  textDim: '#c2b3e0',
  textFaint: '#8579b0',

  green: '#5fc46a',
  red: '#e05252',
  blue: '#5aa8e8',
  purple: '#a874e8',
  orange: '#e89a3c',

  /** 자원 */
  food: '#e8b04a',
  mana: '#6fc8f5',

  /** 예전 이름 호환 */
  woodEdge: '#211a4a',
  woodMid: '#2e2560',
  woodLight: '#3d3179',
  border: '#1a1338',
  borderHi: '#a8801c',
} as const;

export const G = {
  /** 기본 패널 — 밤하늘 남보라 */
  wood: ['#3d3179', '#241c52'] as const,
  /** 더 어두운 패널 (헤더·바닥) */
  woodDeep: ['#241c52', '#140f33'] as const,
  /** 양피지 내지 */
  parch: ['#f5ead0', '#dcc79b'] as const,
  /** 강조 패널 — 지금 살 수 있다 / 받을 수 있다 */
  hot: ['#5b4aa0', '#332764'] as const,

  gold: ['#f4d97a', '#c9a227'] as const,
  green: ['#87dc8e', '#2f8a3a'] as const,
  red: ['#f08a8a', '#a82c2c'] as const,
  blue: ['#8cc9f0', '#2a6ba8'] as const,
  purple: ['#c9a2f5', '#6a35b8'] as const,
  plain: ['#5b5288', '#382f5e'] as const,
  /** 배너(리본) — 자주빛 */
  banner: ['#8a3fc0', '#4d1f7a'] as const,

  /** 예전 이름 */
  card: ['#3d3179', '#241c52'] as const,
  cardHot: ['#5b4aa0', '#332764'] as const,
  hud: ['#241c52', '#0b0820'] as const,
} as const;

/** 등급별 슬롯 그라데이션 */
export const RARITY_G = {
  common: ['#6b6390', '#3d3663'] as const,
  rare: ['#4f9fd8', '#255f96'] as const,
  epic: ['#a56ee0', '#5f2c9e'] as const,
  legend: ['#f0c44d', '#b8830f'] as const,
  mythic: ['#ff8fd0', '#a3238e'] as const,
};

/** 버튼 아랫면(두께) 색 */
export const EDGE: Record<string, string> = {
  gold: '#8a670f',
  green: '#1e5c26',
  red: '#701c1c',
  blue: '#174a75',
  purple: '#42217a',
  plain: '#2a2347',
};

/** 버튼 글자색 — 밝은 버튼은 진한 글자가 훨씬 잘 읽힌다 */
export const BTN_TEXT: Record<string, string> = {
  gold: '#2a1f10',
  green: '#0d2b10',
  red: '#f6efdc',
  blue: '#f6efdc',
  purple: '#f6efdc',
  plain: '#f6efdc',
};

export const numeric: TextStyle = Platform.select({
  ios: { fontVariant: ['tabular-nums'] },
  default: {},
})!;

/** 글자가 배경에 묻히지 않게 하는 외곽 그림자 */
export const inkShadow: TextStyle = {
  textShadowColor: 'rgba(8,5,24,0.85)',
  textShadowOffset: { width: 0, height: 1.5 },
  textShadowRadius: 2,
};

export function shadow(opacity = 0.4, radius = 8, elevation = 3) {
  return {
    shadowColor: '#05030f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}
