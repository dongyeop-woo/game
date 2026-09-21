/** 스테이지 밖에서 유지되는 성장치 저장. 전투 상태는 저장하지 않는다. */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { AVATARS, STARTER_AVATAR } from './avatars';
import { createDaily, today } from './progress';
import type { MailItem, MetaProgress } from './types';

const KEY = 'paladog:meta:v2';

/** 이름을 바꾸는 화면이 아직 없다 - 붙기 전까지는 모두 이 이름으로 시작한다 */
export const DEFAULT_NICKNAME = '플레이어';
export const META_VERSION = 9;

export function createMeta(): MetaProgress {
  return {
    version: META_VERSION,
    gold: 0,
    clearedStages: [],
    stageStars: {},
    unlockedUnits: ['mouse'],
    avatarCopies: { [STARTER_AVATAR]: 1 },
    avatar: STARTER_AVATAR,
    summons: 0,
    attendStreak: 0,
    daily: createDaily(),
    nickname: DEFAULT_NICKNAME,
    lastSeen: Date.now(),
    tutorialDone: false,
    normalRuns: 0,
    mail: [welcomeMail()],
    showFps: false,
    haptics: true,
  };
}

/** 처음 켠 사람에게 우편함이 비어 있으면 그게 뭐 하는 곳인지 알 수가 없다 */
function welcomeMail(): MailItem {
  return {
    id: 'welcome',
    title: '입학을 환영합니다',
    body: '마법 학교에 온 걸 환영해요.\n첫 유닛을 살 밑천을 보냅니다.',
    gold: 300,
    at: Date.now(),
    claimed: false,
  };
}

function sanitize(raw: unknown): MetaProgress {
  const base = createMeta();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<MetaProgress>;

  const num = (v: unknown, fallback: number, min = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : fallback;

  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const numMap = (v: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (v && typeof v === 'object') {
      for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
        if (typeof n === 'number' && Number.isFinite(n)) out[k] = Math.max(0, n);
      }
    }
    return out;
  };

  // 정의가 사라진 아바타 id 는 버린다
  const avatarCopies: Record<string, number> = {};
  for (const [id, n] of Object.entries(numMap(s.avatarCopies))) {
    if (AVATARS.some((a) => a.id === id)) avatarCopies[id] = Math.max(1, Math.floor(n));
  }
  if (Object.keys(avatarCopies).length === 0) avatarCopies[STARTER_AVATAR] = 1;
  const owned = Object.keys(avatarCopies);

  const savedDaily = (s.daily ?? {}) as Partial<MetaProgress['daily']>;
  const daily =
    typeof savedDaily.day === 'string' && savedDaily.day === today()
      ? {
          ...createDaily(),
          ...savedDaily,
          day: savedDaily.day,
          claimed: strList(savedDaily.claimed),
          adsUsed: strList(savedDaily.adsUsed),
        }
      : createDaily();

  return {
    version: META_VERSION,
    gold: num(s.gold, 0),
    clearedStages: strList(s.clearedStages),
    stageStars: numMap(s.stageStars),
    // 예전 저장본에는 해금 목록이 없다 — 기본 유닛만 열어 준다
    unlockedUnits: strList(s.unlockedUnits).length ? strList(s.unlockedUnits) : ['mouse'],
    avatarCopies,
    // 저장된 아바타가 목록에 없으면(정의가 사라졌다면) 기본으로 되돌린다
    avatar: owned.includes(String(s.avatar)) ? String(s.avatar) : owned[0],
    summons: Math.floor(num(s.summons, 0)),
    attendStreak: Math.floor(num(s.attendStreak, 0)),
    daily,
    // 예전 저장본에는 없다 - 기본 이름으로 시작한다
    nickname: typeof s.nickname === 'string' && s.nickname.trim() ? s.nickname : DEFAULT_NICKNAME,
    lastSeen: num(s.lastSeen, Date.now()),
    // 예전 저장본에는 없다 - 안 한 것으로 본다
    tutorialDone: s.tutorialDone === true,
    normalRuns: Math.floor(num(s.normalRuns, 0)),
    // 예전 저장본에는 없다 - 환영 편지부터 다시 넣어 준다
    mail: Array.isArray(s.mail) ? (s.mail as MailItem[]) : [welcomeMail()],
    showFps: s.showFps === true,
    // 예전 저장본에는 없다 - 소리는 켠 채로 시작한다
    haptics: s.haptics !== false,
  };
}

export async function loadMeta(): Promise<MetaProgress | null> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? sanitize(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

export async function saveMeta(meta: MetaProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // 저장 실패가 진행을 막지는 않는다
  }
}

export async function clearMeta(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
