/**
 * 스테이지 밖 진행 요소들.
 *
 * 별 등급 · 소탕 · 유닛 해금 · 도감 · 일일 미션 · 출석 · 광고 보상.
 * 전부 순수 함수라 화면 없이 검증할 수 있다.
 */

import { DEF_STAGES as STAGES, defStage as stageDef } from './defense';
import type { DailyState, MetaProgress } from './types';

// ------------------------------------------------------------------- 날짜

/** 로컬 기준 'YYYY-MM-DD' */
export function today(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDaily(day = today()): DailyState {
  return {
    day,
    kills: 0,
    stageClears: 0,
    combines: 0,
    sweeps: 0,
    claimed: [],
    attended: false,
    adsUsed: [],
  };
}

/** 날짜가 바뀌었으면 새 하루로 갈아끼운다 */
export function rollDaily(meta: MetaProgress, day = today()): MetaProgress {
  if (meta.daily.day === day) return meta;
  // 어제 출석했으면 연속, 아니면 끊긴다
  const yesterday = today(new Date(Date.now() - 86400_000));
  const streak = meta.daily.day === yesterday && meta.daily.attended ? meta.attendStreak : 0;
  return { ...meta, attendStreak: streak, daily: createDaily(day) };
}

// -------------------------------------------------------------------- 별

/**
 * 별 등급.
 * 이 게임의 주제가 '팔라독 호위'라 별도 팔라독이 얼마나 안 다쳤는지로 매긴다.
 */
export const STAR_RULES = [
  { stars: 1, label: '클리어' },
  { stars: 2, label: '팔라독 체력 50% 이상 유지' },
  { stars: 3, label: '팔라독 체력 90% 이상 유지' },
] as const;

export function starsFor(won: boolean, heroMinHp: number): number {
  if (!won) return 0;
  if (heroMinHp >= 0.9) return 3;
  if (heroMinHp >= 0.5) return 2;
  return 1;
}

export function starsOf(meta: MetaProgress, stageId: string): number {
  return meta.stageStars[stageId] ?? 0;
}

export function totalStars(meta: MetaProgress): number {
  return STAGES.reduce((s, st) => s + starsOf(meta, st.id), 0);
}

// ------------------------------------------------------------------ 소탕

/** 하루에 쓸 수 있는 소탕 횟수 */
export const SWEEP_PER_DAY = 10;

export function sweepsLeft(meta: MetaProgress): number {
  return Math.max(0, SWEEP_PER_DAY + adBonusSweeps(meta) - meta.daily.sweeps);
}

/** 광고로 늘린 소탕 횟수 */
function adBonusSweeps(meta: MetaProgress): number {
  return meta.daily.adsUsed.filter((id) => id === 'sweep').length * 3;
}

export function canSweep(meta: MetaProgress, stageId: string): boolean {
  return starsOf(meta, stageId) > 0 && sweepsLeft(meta) > 0;
}

/** 별이 많을수록 소탕 보상이 좋다 */
export function sweepReward(meta: MetaProgress, stageId: string): number {
  const stars = starsOf(meta, stageId);
  if (stars <= 0) return 0;
  return Math.floor(stageDef(stageId).reward * (0.4 + 0.2 * stars));
}

// -------------------------------------------------------------- 유닛 해금

/**
 * 유닛은 스테이지에서 조합으로 처음 만들었을 때 열린다.
 * (예전에는 사냥터 레벨/스테이지 클리어로 열었는데, 사냥터가 사라지면서 바뀌었다.)
 */
export function isUnitUnlocked(meta: MetaProgress, id: string): boolean {
  return meta.unlockedUnits.includes(id);
}

export function unlockText(): string {
  return '조합으로 해금';
}

/** 유닛을 처음 만들었을 때 도감에 등록한다. 새로 열린 id 를 돌려준다. */
export function discover(meta: MetaProgress, ids: string[]): string[] {
  return ids.filter((id) => !meta.unlockedUnits.includes(id));
}

// ------------------------------------------------------------------ 도감

export type Tier = 'common' | 'rare' | 'epic' | 'legend' | 'mythic';

/**
 * 도감 등급표.
 *
 * 도감은 '조합으로 만들어 본 유닛'의 기록이다. 스테이지에서 유닛을 조합해
 * 처음 만들면 그 칸의 잠금이 영구히 풀린다. slots 는 그 등급에 들어갈 총 칸 수라,
 * 아직 설계 안 된 자리는 잠긴 ??? 칸으로 보인다.
 */
export const TIERS: { id: Tier; label: string; slots: number }[] = [
  { id: 'common', label: '일반', slots: 5 },
  { id: 'rare', label: '희귀', slots: 4 },
  { id: 'epic', label: '영웅', slots: 3 },
  { id: 'legend', label: '전설', slots: 2 },
  { id: 'mythic', label: '신화', slots: 1 },
];

// ------------------------------------------------------------- 일일 미션

export interface MissionDef {
  id: string;
  name: string;
  emoji: string;
  goal: number;
  reward: number;
  progress: (d: DailyState) => number;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'kills',
    name: '잡몹 200마리 처치',
    emoji: '💀',
    goal: 200,
    reward: 600,
    progress: (d) => d.kills,
  },
  {
    id: 'stage',
    name: '스테이지 1회 클리어',
    emoji: '🏰',
    goal: 1,
    reward: 500,
    progress: (d) => d.stageClears,
  },
  {
    id: 'combine',
    name: '유닛 10회 조합',
    emoji: '🔮',
    goal: 10,
    reward: 400,
    progress: (d) => d.combines,
  },
  {
    id: 'sweep',
    name: '소탕 3회',
    emoji: '⚡',
    goal: 3,
    reward: 400,
    progress: (d) => d.sweeps,
  },
];

export function missionDone(meta: MetaProgress, m: MissionDef): boolean {
  return m.progress(meta.daily) >= m.goal;
}

export function missionClaimable(meta: MetaProgress, m: MissionDef): boolean {
  return missionDone(meta, m) && !meta.daily.claimed.includes(m.id);
}

export function claimableMissionCount(meta: MetaProgress): number {
  return MISSIONS.filter((m) => missionClaimable(meta, m)).length;
}

// ---------------------------------------------------------------- 출석

/** 7일 주기 출석 보상 */
export const ATTEND_REWARDS = [300, 500, 800, 1200, 1800, 2600, 4000];

export function attendDay(meta: MetaProgress): number {
  return meta.attendStreak % ATTEND_REWARDS.length;
}

export function attendReward(meta: MetaProgress): number {
  return ATTEND_REWARDS[attendDay(meta)];
}

export function canAttend(meta: MetaProgress): boolean {
  return !meta.daily.attended;
}

// ------------------------------------------------------------- 광고 보상

export interface AdRewardDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  /** 하루 사용 가능 횟수 */
  perDay: number;
}

export const AD_REWARDS: AdRewardDef[] = [
  {
    id: 'sweep',
    name: '소탕 횟수 +3',
    desc: '오늘 소탕을 3번 더',
    emoji: '🎫',
    perDay: 2,
  },
  {
    id: 'gold',
    name: '골드 300',
    desc: '광고를 보고 바로 받는다',
    emoji: '💰',
    perDay: 3,
  },
];

/** 광고 보상으로 바로 주는 골드 (없으면 0) */
export const AD_GOLD: Record<string, number> = { gold: 300 };

export function adUsesLeft(meta: MetaProgress, id: string): number {
  const def = AD_REWARDS.find((a) => a.id === id);
  if (!def) return 0;
  const used = meta.daily.adsUsed.filter((x) => x === id).length;
  return Math.max(0, def.perDay - used);
}

export function claimableAdCount(meta: MetaProgress): number {
  return AD_REWARDS.filter((a) => adUsesLeft(meta, a.id) > 0).length;
}

// --------------------------------------------------------------- 알림 뱃지

/** 화면별로 지금 처리할 게 몇 건인지 — 빨간 뱃지 숫자 */
export function badgeCounts(meta: MetaProgress) {
  return {
    missions: claimableMissionCount(meta) + (canAttend(meta) ? 1 : 0),
    ads: claimableAdCount(meta),
  };
}
