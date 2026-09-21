/**
 * 디펜스 유닛 로스터.
 *
 * 원랜디 방식이라 '무엇이 무엇으로 합쳐지는지' 트리를 짜지 않는다.
 * **같은 유닛 3개 -> 한 등급 위에서 무작위 1개**. 이 규칙 하나면
 * 15종 x 어떤 조합이든 성립하고, 유닛을 더해도 트리를 다시 안 짜도 된다.
 *
 * 등급 칸 수는 도감(progress.ts TIERS)과 같다 - 5 / 4 / 3 / 2 / 1 = 15칸.
 * 조합으로 처음 만든 유닛이 그 칸을 연다.
 */

import { TIER_ORDER } from './avatars';
import type { Tier } from './progress';

/*
  공격 속도 기준을 1.6 배로 올리고 한 방 피해를 그만큼 낮췄다.

  DPS 는 그대로다 - 세기가 아니라 **리듬**만 바꾼 것이다. 2초에 한 번 때리면
  판을 보다가 '멈춰 있나?' 싶은데, 같은 세기로 잘게 나눠 때리면 계속 뭔가
  일어난다. 한 방 피해가 소수점이 된 건 그래서다.
*/

/** 유닛이 가진 특수 효과. 없으면 그냥 때린다. */
export type Trait =
  | null
  /** 맞은 적을 느리게 */
  | 'slow'
  /** 같은 레인의 뒤쪽 적까지 함께 때림 */
  | 'splash'
  /** 체력이 가장 많은 적을 노림 */
  | 'focus'
  /** 맞은 적을 잠깐 멈춰 세움 */
  | 'stun';

export interface RosterUnit {
  id: string;
  name: string;
  tier: Tier;
  /** 판 위에 그릴 그림. 유닛 SVG 가 준비되면 그때 교체한다. */
  emoji: string;
  /** 한 방 피해 */
  atk: number;
  /** 초당 공격 횟수 */
  atkSpeed: number;
  /**
   * 사거리 - '칸' 단위 거리다. 판을 둘러싼 트랙까지의 직선 거리로 잰다.
   * 가장자리 칸에서 바로 옆 트랙까지가 약 1.3 이고, 대각선 반대편은 약 4.7 이다.
   * 근접 1.7 / 중거리 2.8 / 원거리 4.5 세 단계로 쓴다.
   */
  range: number;
  trait: Trait;
  /** 한 줄 소개 */
  desc: string;
}

/**
 * 등급 사이 능력치 배율.
 *
 * **조합이 3개 -> 1개이므로 이 값이 3보다 커야 조합이 이득이다.**
 * 처음에 2~2.7배로 뒀더니 합칠수록 판 전체 DPS 가 줄어서, 조합을 할수록
 * 약해지는 상황이 됐다. 3.4 배면 칸도 아끼고 세지기도 한다.
 */
export const TIER_DPS_STEP = 3.4;

export const ROSTER: RosterUnit[] = [
  // ------------------------------------------------------------ 일반 (5)
  { id: 'mouse', name: '길냥이 신병', emoji: '🐱', tier: 'common', atk: 1.7, atkSpeed: 3.74, range: 1.7, trait: null, desc: '작지만 쉬지 않고 쏜다' },
  { id: 'penguin', name: '철모 보초', emoji: '🪖', tier: 'common', atk: 2.4, atkSpeed: 2.45, range: 2.8, trait: null, desc: '옆 줄까지 총구가 닿는다' },
  { id: 'owl', name: '두건 저격수', emoji: '🎯', tier: 'common', atk: 1.4, atkSpeed: 2.88, range: 2.8, trait: 'slow', desc: '맞은 적의 발이 무거워진다' },
  { id: 'toad', name: '분홍모 화력조', emoji: '💗', tier: 'common', atk: 2.1, atkSpeed: 2.02, range: 1.7, trait: 'splash', desc: '터지는 탄이 뒤까지 닿는다' },
  { id: 'rhino', name: '후드 돌격병', emoji: '🧥', tier: 'common', atk: 3.8, atkSpeed: 1.44, range: 1.7, trait: 'stun', desc: '큰 탄으로 잠깐 멈춰 세운다' },

  // ------------------------------------------------------------ 희귀 (4)
  { id: 'wolf', name: '회색 사수', emoji: '🔫', tier: 'rare', atk: 6.3, atkSpeed: 3.6, range: 1.7, trait: null, desc: '앞줄에 대고 갈긴다' },
  { id: 'fox', name: '복면 폭파병', emoji: '🧨', tier: 'rare', atk: 6.3, atkSpeed: 2.88, range: 2.8, trait: 'splash', desc: '파편이 줄을 타고 번진다' },
  { id: 'crow', name: '고글 정찰병', emoji: '🥽', tier: 'rare', atk: 4.9, atkSpeed: 4.32, range: 4.5, trait: null, desc: '판 전체가 사정권이다' },
  { id: 'turtle', name: '중절모 저격수', emoji: '🎩', tier: 'rare', atk: 6.3, atkSpeed: 2.59, range: 2.8, trait: 'slow', desc: '맞은 적은 기어간다' },

  // ------------------------------------------------------------ 영웅 (3)
  { id: 'bear', name: '붉은 두건 화력반장', emoji: '🧰', tier: 'epic', atk: 32.8, atkSpeed: 2.3, range: 1.7, trait: 'stun', desc: '연발로 적을 주저앉힌다' },
  { id: 'ghost', name: '백묘 저격수', emoji: '🐈', tier: 'epic', atk: 18.1, atkSpeed: 3.46, range: 4.5, trait: 'slow', desc: '조준한 적을 붙잡아 둔다' },
  { id: 'serpent', name: '보라 두건 파괴반', emoji: '💜', tier: 'epic', atk: 21.6, atkSpeed: 3.17, range: 2.8, trait: 'splash', desc: '탄이 터져 줄을 쓸어 담는다' },

  // ------------------------------------------------------------ 전설 (2)
  { id: 'griffin', name: '청색 헬멧 분대장', emoji: '🪛', tier: 'legend', atk: 64.2, atkSpeed: 3.89, range: 4.5, trait: 'focus', desc: '가장 단단한 적부터 노린다' },
  { id: 'wyrm', name: '황금 헬멧 중화기', emoji: '🟡', tier: 'legend', atk: 86.8, atkSpeed: 2.88, range: 2.8, trait: 'splash', desc: '연사가 줄을 통째로 태운다' },

  // ------------------------------------------------------------ 신화 (1)
  { id: 'sage', name: '철가면 대장', emoji: '🦾', tier: 'mythic', atk: 232.7, atkSpeed: 3.74, range: 4.5, trait: 'focus', desc: '조준선이 적을 지목한다' },
];

export function unitDef(id: string): RosterUnit {
  return ROSTER.find((u) => u.id === id) ?? ROSTER[0];
}

export function rosterOfTier(tier: Tier): RosterUnit[] {
  return ROSTER.filter((u) => u.tier === tier);
}

export function dps(u: RosterUnit, star = 1): number {
  return u.atk * u.atkSpeed * starMul(star);
}

// ---------------------------------------------------------------- 뽑기

/**
 * 그 등급 안에서 아무나 한 마리.
 *
 * **카드는 일반만** 깐다. 위 등급으로 가는 길은 두 개다 - 셋을 모아 합치거나,
 * 상점에서 값을 치르고 바로 사거나(`shopPrice`). 카드까지 등급을 섞으면
 * 상점이 할 일이 없어진다.
 */
export function rollUnit(rnd = Math.random, tier: Tier = 'common'): RosterUnit {
  const pool = rosterOfTier(tier);
  return pool[Math.floor(rnd() * pool.length)];
}

/**
 * 유닛 한 마리당 골드 - **일반 기준**이다.
 *
 * 뽑을수록 비싸지게 해 봤더니 후반에 판이 그대로 멈췄다. 제약은 '아홉 칸'이
 * 이미 하고 있다 - 칸이 차면 합치거나 팔아야 다시 받을 수 있다.
 *
 * 예전엔 14 였다. 그때는 현상금이 들어오는 족족 뽑을 수 있어서 골드가 놀지
 * 않았는데, 지금은 라운드 시작에만 몰아서 지급하니 그 사이 골드가 쉰다.
 * 14 그대로 두면 후반 스테이지 승률이 반 토막 났다(리치의 제단 86%->29%).
 * 11 로 낮춰 예전 난이도 곡선에 맞췄다 - tools/defsim.ts 로 30회씩 재서 골랐다.
 */
export const ROLL_BASE = 11;

/**
 * 일반 값에서 등급마다 3 배씩 오르는 기준 값.
 *
 * 카드(일반) 값과, 상점표(`SHOP_PRICE`)에 없는 등급의 대비용으로만 쓴다.
 * 상점 값은 조합 수수료까지 넣어 따로 매긴다 - 이 값 그대로 팔면 조합보다
 * 싸져서 상점만 누르는 쪽이 늘 이긴다.
 */
export function unitPriceOf(tier: Tier, base: number): number {
  return base * Math.pow(COMBINE_COUNT, TIER_ORDER.indexOf(tier));
}

/**
 * 같은 웨이브 안에서 다시 굴릴 때마다 붙는 값.
 *
 * 처음엔 몇 번을 굴리든 11 이었다. 시뮬레이터가 50 웨이브 동안 1500 번을
 * 굴렸다 - 골드가 들어오는 족족 굴려 버리니 '석 장'이라는 제약이 사실상
 * 사라지고 다섯 스테이지 중 넷이 100% 승률이 됐다.
 *
 * 첫 판은 싸고 연달아 굴리면 비싸야 고민이 생긴다. n 번째 굴림이
 * 11 + 9n 이므로 11/20/29/38... 이고, 웨이브 수입(30 + 8*웨이브)으로는
 * 중반에 서너 번이 한계다.
 */
export const ROLL_STEP = 4;

/** @param rerolls 이번 웨이브에 이미 굴린 횟수 */
export function rollCost(rerolls: number): number {
  return ROLL_BASE + ROLL_STEP * Math.max(0, rerolls);
}

// ---------------------------------------------------------------- 조합

/**
 * 조합은 **같은 등급 아무거나 3개 -> 한 등급 위 무작위 1개**다.
 *
 * 처음엔 '같은 유닛 3개'로 했는데 아홉 칸에서 같은 종을 셋 모으는 게 사실상
 * 불가능했다(시뮬레이터에서 조합이 거의 안 일어나고 생쥐만 쌓였다).
 * 등급만 맞추면 되게 하니 뽑기 3회 = 희귀 1개로 길이 뚫린다.
 */
export const COMBINE_COUNT = 3;

export function nextTier(tier: Tier): Tier | null {
  return TIER_ORDER[TIER_ORDER.indexOf(tier) + 1] ?? null;
}

/** 이 등급을 합치면 나올 수 있는 것들. 최고 등급이면 빈 배열. */
export function combinePool(tier: Tier): RosterUnit[] {
  const next = nextTier(tier);
  return next ? rosterOfTier(next) : [];
}

/**
 * 조합표. 유닛마다 무엇이 되는지 **정해져 있다.**
 *
 * 전에는 다음 등급에서 무작위로 뽑았다. 그러면 모으는 동안 무엇을 노리는지가
 * 없어서, 조합이 '눌러 보는 것'이 된다. 정해져 있으면 "이걸 남기면 저게
 * 나온다"가 계획이 된다.
 *
 * 짝은 **역할을 물려주게** 묶었다 - 궁수는 궁수로, 느리게 만드는 애는 느리게
 * 만드는 애로. 그래야 한 번 외우면 다음부터는 표를 안 봐도 안다.
 */
export const UPGRADE: Record<string, string> = {
  // 일반 -> 희귀
  mouse: 'wolf', //     근접
  penguin: 'crow', //   활
  owl: 'turtle', //     느리게
  toad: 'fox', //       튀는 피해
  rhino: 'turtle', //   버티기
  // 희귀 -> 영웅
  wolf: 'bear', //      근접
  fox: 'serpent', //    튀는 피해
  crow: 'ghost', //     먼 거리
  turtle: 'ghost', //   느리게
  // 영웅 -> 전설
  bear: 'griffin', //   앞줄을 부순다
  ghost: 'griffin', //  먼 거리
  serpent: 'wyrm', //   튀는 피해
  // 전설 -> 신화
  griffin: 'sage',
  wyrm: 'sage',
};

/**
 * 이 유닛을 자리에 남기고 합치면 무엇이 되는가.
 *
 * 기준은 **자리를 물려받는 유닛**(재료 중 가장 약한 것)이다. 조합 카드에
 * 어느 셋이 없어지는지가 이미 보이니, 결과도 그 자리에서 알 수 있다.
 */
export function upgradeOf(defId: string): RosterUnit | null {
  const id = UPGRADE[defId];
  return id ? (ROSTER.find((u) => u.id === id) ?? null) : null;
}

/**
 * 최고 등급 유닛의 별.
 *
 * 등급이 신화에서 끝나므로 판 DPS 에 천장이 생긴다. 실제로 그 천장(약 1560)에
 * 부딪혀서 스테이지 배율을 조금만 올려도 전부 무너지는 절벽이 났다.
 * **신화 2개를 합치면 별이 오르게** 해서 천장을 연다. 신화만 적용하는 이유는
 * 아래 등급은 '등급 조합'이 더 이득이라 별로 갈 이유가 없기 때문이다.
 */
export const STAR_MAX_UNIT = 3;
export const STAR_NEED = 2;
export const STAR_MUL = [1, 2.4, 5.5];

export function starMul(star: number): number {
  return STAR_MUL[Math.min(STAR_MAX_UNIT, Math.max(1, star)) - 1];
}

/** 유닛을 팔았을 때 돌려받는 골드. 등급이 오를수록 크게. */
export function sellValue(id: string): number {
  const i = TIER_ORDER.indexOf(unitDef(id).tier);
  return Math.round(ROLL_BASE * 0.7 * Math.pow(COMBINE_COUNT, i));
}
