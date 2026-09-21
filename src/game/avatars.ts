/**
 * 아바타 (전설이).
 *
 * 로비 가운데에 서 있는 캐릭터다. 전투력에는 전혀 관여하지 않는다 -
 * 오직 '보여주기'용이고, 그래서 등급을 높일수록 화면이 화려해진다.
 * (전투력을 주면 뽑기가 곧 강함이 돼서 밸런스를 잡을 수 없다.)
 *
 * 아트는 하나의 파라미터화된 SVG 로 다 그린다 - 몸 색 + 귀 + 머리 장식 + 눈.
 * 새 아바타를 넣으려면 여기에 줄 하나만 추가하면 된다.
 */

import type { Tier } from './progress';

export type Ear = 'mouse' | 'cat' | 'rabbit' | 'fox' | 'owl' | 'dragon' | 'none';
export type Crown = 'none' | 'hat' | 'horn' | 'antler' | 'crown' | 'halo' | 'star';
export type Eye = 'round' | 'sparkle' | 'sleepy' | 'fierce';

export interface AvatarDef {
  id: string;
  name: string;
  tier: Tier;
  /** 몸 색 (밝은 쪽, 어두운 쪽) */
  body: readonly [string, string];
  /** 배·주둥이 색 */
  belly: string;
  /** 부리·발에 쓰는 강조색. 몸 색과 대비돼야 얼굴이 살아난다. */
  accent: string;
  ear: Ear;
  crown: Crown;
  eye: Eye;
  desc: string;
}

export const AVATARS: AvatarDef[] = [
  // ------------------------------------------------------------ 일반 (4)
  {
    id: 'mochi',
    name: '길냥이 신병',
    tier: 'common',
    body: ['#e8e2f2', '#b9b0cf'],
    belly: '#fbf7ff',
    accent: '#f0a86a',
    ear: 'mouse',
    crown: 'hat',
    eye: 'round',
    desc: '첫 총을 받은 날부터 늘 들떠 있다',
  },
  {
    id: 'soot',
    name: '철모 보초',
    tier: 'common',
    body: ['#5b5480', '#332d52'],
    belly: '#8a80b5',
    accent: '#f0c44d',
    ear: 'cat',
    crown: 'none',
    eye: 'fierce',
    desc: '초소를 제 자리라고 믿는다',
  },
  {
    id: 'pebble',
    name: '두건 저격수',
    tier: 'common',
    body: ['#7fc07a', '#3f7a44'],
    belly: '#d8f0c6',
    accent: '#f0a03c',
    ear: 'none',
    crown: 'none',
    eye: 'sleepy',
    desc: '탄창을 삼켜 버린 전적이 있다',
  },
  {
    id: 'hoot',
    name: '분홍모 화력조',
    tier: 'common',
    body: ['#c99a63', '#8a6234'],
    belly: '#f0dcb8',
    accent: '#f5b942',
    ear: 'owl',
    crown: 'none',
    eye: 'round',
    desc: '시끄러운 게 제일 좋다고 한다',
  },

  // ------------------------------------------------------------ 희귀 (4)
  {
    id: 'ember_fox',
    name: '후드 돌격병',
    tier: 'rare',
    body: ['#f0954a', '#b8541c'],
    belly: '#ffe3c0',
    accent: '#ffe08a',
    ear: 'fox',
    crown: 'none',
    eye: 'sparkle',
    desc: '모자를 벗은 걸 본 사람이 없다',
  },
  {
    id: 'snowbun',
    name: '회색 사수',
    tier: 'rare',
    body: ['#e6f2ff', '#a8c4e0'],
    belly: '#ffffff',
    accent: '#ffb3c7',
    ear: 'rabbit',
    crown: 'none',
    eye: 'round',
    desc: '탄을 세는 버릇이 있다',
  },
  {
    id: 'inkwing',
    name: '복면 폭파병',
    tier: 'rare',
    body: ['#4a4470', '#252045'],
    belly: '#6f68a0',
    accent: '#f0b03c',
    ear: 'owl',
    crown: 'star',
    eye: 'fierce',
    desc: '폭약 옆에서 낮잠을 잔다',
  },
  {
    id: 'mossling',
    name: '고글 정찰병',
    tier: 'rare',
    body: ['#6fc4a8', '#2f7a68'],
    belly: '#d4f5e6',
    accent: '#ffd166',
    ear: 'dragon',
    crown: 'none',
    eye: 'sleepy',
    desc: '남보다 먼저 보고 먼저 말한다',
  },

  // ------------------------------------------------------------ 영웅 (3)
  {
    id: 'flamewolf',
    name: '중절모 저격수',
    tier: 'epic',
    body: ['#ff7a5c', '#a8281c'],
    belly: '#ffd0a8',
    accent: '#ffe08a',
    ear: 'fox',
    crown: 'horn',
    eye: 'fierce',
    desc: '한 발이면 된다고 늘 말한다',
  },
  {
    id: 'starfawn',
    name: '붉은 두건 반장',
    tier: 'epic',
    body: ['#a8b4f0', '#4a54a8'],
    belly: '#e0e6ff',
    accent: '#ffd166',
    ear: 'none',
    crown: 'antler',
    eye: 'sparkle',
    desc: '보급이 늦으면 직접 가지러 간다',
  },
  {
    id: 'tidecall',
    name: '보라 두건 파괴반',
    tier: 'epic',
    body: ['#6fd0f0', '#1c6f9e'],
    belly: '#d0f4ff',
    accent: '#ffd98a',
    ear: 'none',
    crown: 'halo',
    eye: 'round',
    desc: '고친 것보다 부순 게 많다',
  },

  // ------------------------------------------------------------ 전설 (2)
  {
    id: 'goldgriff',
    name: '붉은 장갑 복서',
    tier: 'legend',
    body: ['#ffd76a', '#c08a12'],
    belly: '#fff2c4',
    accent: '#f2894a',
    ear: 'owl',
    crown: 'crown',
    eye: 'fierce',
    desc: '총을 안 든다. 그럴 필요가 없다',
  },
  {
    id: 'umbra',
    name: '냄비 수호냥',
    tier: 'legend',
    body: ['#8a5cf0', '#3d1c7a'],
    belly: '#c9a8ff',
    accent: '#f0c44d',
    ear: 'dragon',
    crown: 'horn',
    eye: 'fierce',
    desc: '머리에 쓴 게 냄비라는 걸 인정한 적 없다',
  },

  // ------------------------------------------------------------ 신화 (1)
  {
    id: 'astra',
    name: '철가면 대장',
    tier: 'mythic',
    body: ['#ffc9ec', '#c93da8'],
    belly: '#fff0fa',
    accent: '#ffd166',
    ear: 'rabbit',
    crown: 'horn',
    eye: 'sparkle',
    desc: '얼굴을 본 부대원이 아무도 없다',
  },
];

export function avatarDef(id: string): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function avatarsOfTier(tier: Tier): AvatarDef[] {
  return AVATARS.filter((a) => a.tier === tier);
}

/** 처음부터 갖고 시작하는 아바타 */
export const STARTER_AVATAR = 'mochi';

// -------------------------------------------------------------- 등급 효과

/**
 * 등급이 올라갈수록 로비가 화려해진다.
 *
 * 이게 이 시스템의 전부다 - 성능 차이가 없으니 '보이는 것'이 유일한 보상이고,
 * 그래서 단계 사이의 차이가 한눈에 보여야 한다. 오라 -> 회전 마법진 ->
 * 반짝이 -> 광선 순으로 하나씩 얹는다.
 */
export interface TierFx {
  label: string;
  /** 등급 대표색 (마법진 · 이름표 테두리) */
  color: string;
  /** 캐릭터 뒤 광채 세기 (0 = 없음) */
  glow: number;
  /** 마법진 한 바퀴에 걸리는 초 (0 = 안 돎) */
  spin: number;
  /** 떠다니는 반짝이 개수 */
  sparkles: number;
  /** 배경 광선 */
  rays: boolean;
  /** 뽑기 확률 (%) */
  rate: number;
  /** 중복으로 나왔을 때 돌려주는 골드 */
  refund: number;
}

export const TIER_FX: Record<Tier, TierFx> = {
  common: { label: '일반', color: '#8a80b5', glow: 0, spin: 0, sparkles: 0, rays: false, rate: 55, refund: 120 },
  rare: { label: '희귀', color: '#4f9fd8', glow: 0.35, spin: 0, sparkles: 3, rays: false, rate: 27, refund: 400 },
  epic: { label: '영웅', color: '#a56ee0', glow: 0.55, spin: 26, sparkles: 5, rays: false, rate: 13, refund: 1200 },
  legend: { label: '전설', color: '#f0c44d', glow: 0.8, spin: 17, sparkles: 8, rays: true, rate: 4.3, refund: 4000 },
  mythic: { label: '신화', color: '#ff8fd0', glow: 1, spin: 11, sparkles: 12, rays: true, rate: 0.7, refund: 12000 },
};

export const TIER_ORDER: Tier[] = ['common', 'rare', 'epic', 'legend', 'mythic'];

// --------------------------------------------------------------- 별 등급

/*
  별(1~3성)은 없앴다.

  같은 아바타를 모으면 별이 오르고 연출이 화려해지는 구조였는데, 아바타는
  진화하지 않기로 했다. `avatarCopies` 는 그대로 두되 이제 **가졌는지 아닌지**
  만 뜻한다 - 장수는 세지만 화면에서 쓰지 않는다.

  중복을 무엇으로 돌려줄지는 아직 안 정했다. 지금은 상점에서 이미 가진
  아바타를 못 사게 막아 두었고, 소환으로 겹치면 그냥 쌓인다.
*/

// ---------------------------------------------------------------- 뽑기

export const SUMMON_COST = 800;
/** 10연은 한 번 값을 깎아 준다 */
export const SUMMON_COST_10 = SUMMON_COST * 9;
/** 10연에서 이 등급 이상이 하나도 없으면 마지막 한 장을 올려 준다 */
export const TEN_PULL_FLOOR: Tier = 'rare';

/** 등급 하나를 확률표대로 뽑는다 */
export function rollTier(rnd = Math.random): Tier {
  const r = rnd() * 100;
  let acc = 0;
  for (const tier of TIER_ORDER) {
    acc += TIER_FX[tier].rate;
    if (r < acc) return tier;
  }
  return 'common';
}

export function rollAvatar(rnd = Math.random, tier = rollTier(rnd)): AvatarDef {
  const pool = avatarsOfTier(tier);
  if (pool.length === 0) return AVATARS[0];
  return pool[Math.floor(rnd() * pool.length)];
}

export interface PullResult {
  def: AvatarDef;
  /** 처음 나온 아바타인가 */
  isNew: boolean;
  /** 이미 가진 아바타라 골드로 돌려받은 양 (처음이면 0) */
  refund: number;
}

/**
 * 소환 결과를 만든다. 골드 차감/저장은 호출한 쪽에서 한다.
 *
 * `copies` 는 뽑기 시작 시점의 보유 장수다. 10연 안에서 같은 아바타가 여러 번
 * 나오면 그만큼 별이 오르므로, 여기서 장수를 늘려 가며 본다.
 */
export function pull(
  count: number,
  copies: Record<string, number>,
  rnd = Math.random,
): PullResult[] {
  const have: Record<string, number> = { ...copies };
  const out: PullResult[] = [];
  let best = 0;

  for (let i = 0; i < count; i += 1) {
    let def = rollAvatar(rnd);
    // 10연 바닥 보장 - 마지막 한 장까지 전부 일반이면 희귀 이상으로 올린다
    const isLast = i === count - 1;
    if (count >= 10 && isLast && best < TIER_ORDER.indexOf(TEN_PULL_FLOOR)) {
      def = rollAvatar(rnd, TEN_PULL_FLOOR);
    }
    best = Math.max(best, TIER_ORDER.indexOf(def.tier));

    /*
      이미 가진 아바타는 골드로 돌려준다.

      전에는 두 번째·세 번째 장이 별을 올렸는데 별을 없앴으니 쌓아 둘 이유가
      없다. 그냥 사라지면 "또 나왔네"로 끝나니, 등급에 맞는 값으로 바꿔 준다.
    */
    if (have[def.id]) {
      out.push({ def, isNew: false, refund: TIER_FX[def.tier].refund });
      continue;
    }
    have[def.id] = 1;
    out.push({ def, isNew: true, refund: 0 });
  }
  return out;
}

/** 보유 목록을 등급 높은 순 -> 정의 순으로 정렬한다 */
export function sortByTier(ids: string[]): AvatarDef[] {
  return ids
    .map(avatarDef)
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier) ||
        AVATARS.indexOf(a) - AVATARS.indexOf(b),
    );
}
