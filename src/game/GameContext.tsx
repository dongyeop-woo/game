import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { AVATARS, SUMMON_COST, SUMMON_COST_10, pull, type PullResult } from './avatars';
import { DEF_STAGES as STAGES, defStage as stageDef } from './defense';
import {
  AD_GOLD,
  AD_REWARDS,
  MISSIONS,
  adUsesLeft,
  attendReward,
  canAttend,
  canSweep,
  discover,
  missionClaimable,
  rollDaily,
  starsFor,
  sweepReward,
} from './progress';
import { avatarPrice } from './shop';
import { clearMeta, createMeta, loadMeta, saveMeta } from './storage';
import type { MetaProgress } from './types';

export interface BattleOutcome {
  gold: number;
  stars: number;
  /** 이번에 별이 늘었는가 */
  improved: boolean;
}

interface MetaApi {
  meta: MetaProgress;
  ready: boolean;

  isUnlocked: (stageId: string) => boolean;
  isCleared: (stageId: string) => boolean;

  /** 전투 종료 처리 */
  finishBattle: (stageId: string, won: boolean, heroMinHp: number) => BattleOutcome;
  /** 클리어한 스테이지를 즉시 소탕한다. 얻은 골드를 돌려준다(0이면 실패). */
  sweep: (stageId: string) => number;


  claimMission: (id: string) => number;
  attend: () => number;
  /** 광고 보상 — 실제 광고 SDK 는 붙어 있지 않다(목업) */
  watchAd: (id: string) => void;


  /** 조합으로 처음 만든 유닛을 도감에 등록한다 */
  discoverUnits: (ids: string[]) => void;

  /** 모드를 한 판 끝냈다 - 다음 모드 해금에 쓴다 */
  completeMode: (id: 'tutorial' | 'normal' | 'pvp') => void;

  /** 아바타 소환. 골드가 모자라면 null 을 돌려준다. */
  summon: (count: 1 | 10) => PullResult[] | null;
  /** 로비에 세울 아바타를 바꾼다 */
  equipAvatar: (id: string) => void;

  /**
   * 상점에서 아바타를 산다. 골드가 모자라면 false.
   * 이미 있는 아바타를 또 사면 장수가 늘어 별이 오른다 - 소환과 같은 규칙이다.
   */
  buyAvatar: (id: string) => boolean;

  /** 편지 한 통을 받는다. 들어온 골드를 돌려준다(0이면 이미 받았거나 없는 편지) */
  claimMail: (id: string) => number;
  /** 안 받은 편지를 전부 받는다 */
  claimAllMail: () => number;
  /** 전투 중 프레임 표시를 켜고 끈다 */
  setShowFps: (on: boolean) => void;
  /** 진동을 켜고 끈다 */
  setHaptics: (on: boolean) => void;

  /** 방금 해금된 유닛 — 화면에서 알려주고 지운다 */
  newlyUnlocked: string[];
  clearUnlockNotice: () => void;

  resetAll: () => void;
}

const Ctx = createContext<MetaApi | null>(null);

export function useMeta(): MetaApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useMeta 는 GameProvider 안에서만 쓸 수 있습니다');
  return api;
}

/** 조합으로 처음 만든 유닛을 도감에 등록한다 */
function withDiscovered(
  meta: MetaProgress,
  ids: string[],
  notify: (ids: string[]) => void,
): MetaProgress {
  const opened = discover(meta, ids);
  if (opened.length === 0) return meta;
  notify(opened);
  return { ...meta, unlockedUnits: [...meta.unlockedUnits, ...opened] };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<MetaProgress>(createMeta);
  const [ready, setReady] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  const notify = useCallback((ids: string[]) => {
    setNewlyUnlocked((prev) => [...prev, ...ids]);
  }, []);

  const metaRef = useRef(meta);
  metaRef.current = meta;

  // ------------------------------------------------------------- 최초 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadMeta();
      if (cancelled) return;
      if (saved) {
        const next = rollDaily(saved);
        setMeta({ ...next, lastSeen: Date.now() });
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --------------------------------------------- 백그라운드 복귀 / 하루 넘김
  useEffect(() => {
    if (!ready) return;
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        setMeta((prev) => rollDaily({ ...prev, lastSeen: Date.now() }));
      } else {
        setMeta((prev) => ({ ...prev, lastSeen: Date.now() }));
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [ready]);

  // 오래 켜 둬도 날짜 넘김을 놓치지 않게 주기적으로 찍는다
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      setMeta((prev) => rollDaily({ ...prev, lastSeen: Date.now() }));
    }, 15000);
    return () => clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (ready) void saveMeta(meta);
  }, [meta, ready]);

  // ------------------------------------------------------------------ 조회
  const isCleared = useCallback(
    (stageId: string) => meta.clearedStages.includes(stageId),
    [meta.clearedStages],
  );

  const isUnlocked = useCallback(
    (stageId: string) => {
      const index = STAGES.findIndex((s) => s.id === stageId);
      if (index <= 0) return true;
      return meta.clearedStages.includes(STAGES[index - 1].id);
    },
    [meta.clearedStages],
  );

  // ------------------------------------------------------------------ 전투
  const finishBattle = useCallback(
    (stageId: string, won: boolean, heroMinHp: number): BattleOutcome => {
      const stage = stageDef(stageId);
      const stars = starsFor(won, heroMinHp);
      let gained = 0;
      let improved = false;

      setMeta((prev) => {
        const before = prev.stageStars[stageId] ?? 0;
        const first = !prev.clearedStages.includes(stageId);
        improved = stars > before;

        if (won) {
          // 첫 클리어는 전액, 재도전은 절반. 별을 새로 얻으면 보너스.
          gained = first ? stage.reward : Math.floor(stage.reward * 0.5);
          if (!first && improved) gained += Math.floor(stage.reward * 0.3);
        } else {
          gained = Math.floor(stage.reward * 0.2);
        }

        const next: MetaProgress = {
          ...prev,
          gold: prev.gold + gained,
          clearedStages: won && first ? [...prev.clearedStages, stageId] : prev.clearedStages,
          stageStars: improved ? { ...prev.stageStars, [stageId]: stars } : prev.stageStars,
          daily: won ? { ...prev.daily, stageClears: prev.daily.stageClears + 1 } : prev.daily,
        };
        return next;
      });

      return { gold: gained, stars, improved };
    },
    [],
  );

  const sweep = useCallback((stageId: string): number => {
    let gained = 0;
    setMeta((prev) => {
      if (!canSweep(prev, stageId)) return prev;
      gained = sweepReward(prev, stageId);
      return {
        ...prev,
        gold: prev.gold + gained,
        daily: { ...prev.daily, sweeps: prev.daily.sweeps + 1 },
      };
    });
    return gained;
  }, []);

  // ----------------------------------------------------------- 일일 / 보상

  const claimMission = useCallback((id: string): number => {
    let gained = 0;
    setMeta((prev) => {
      const def = MISSIONS.find((m) => m.id === id);
      if (!def || !missionClaimable(prev, def)) return prev;
      gained = def.reward;
      return {
        ...prev,
        gold: prev.gold + def.reward,
        daily: { ...prev.daily, claimed: [...prev.daily.claimed, id] },
      };
    });
    return gained;
  }, []);

  const attend = useCallback((): number => {
    let gained = 0;
    setMeta((prev) => {
      if (!canAttend(prev)) return prev;
      gained = attendReward(prev);
      return {
        ...prev,
        gold: prev.gold + gained,
        attendStreak: prev.attendStreak + 1,
        daily: { ...prev.daily, attended: true },
      };
    });
    return gained;
  }, []);

  const watchAd = useCallback((id: string) => {
    setMeta((prev) => {
      if (adUsesLeft(prev, id) <= 0) return prev;
      const def = AD_REWARDS.find((a) => a.id === id);
      if (!def) return prev;
      // sweep 은 daily 기록만으로 소탕 횟수가 늘고, gold 는 바로 지급한다
      return {
        ...prev,
        gold: prev.gold + (AD_GOLD[id] ?? 0),
        daily: { ...prev.daily, adsUsed: [...prev.daily.adsUsed, id] },
      };
    });
  }, []);


  /** 스테이지에서 유닛을 조합해 처음 만들었을 때 — 도감 칸이 열린다 */
  /**
   * 모드를 한 판 끝냈다고 기록한다 (이기든 지든).
   *
   * 이기는 것을 조건으로 걸면, 밸런스가 어긋난 순간 아무것도 못 여는 상태에
   * 갇힌다. '해 봤는가'만 본다.
   */
  const completeMode = useCallback((id: 'tutorial' | 'normal' | 'pvp') => {
    setMeta((prev) => {
      if (id === 'tutorial') return prev.tutorialDone ? prev : { ...prev, tutorialDone: true };
      if (id === 'normal') return { ...prev, normalRuns: prev.normalRuns + 1 };
      return prev;
    });
  }, []);

  const discoverUnits = useCallback(
    (ids: string[]) => {
      setMeta((prev) => withDiscovered(prev, ids, notify));
    },
    [notify],
  );

  /**
   * 아바타 소환.
   *
   * 뽑기 결과는 화면에서 연출해야 해서 즉시 돌려주고, 저장은 setMeta 안에서 한다.
   * 골드 확인도 여기서 한 번만 한다 - 연출 도중에 또 눌러도 중복 차감되지 않게.
   */
  const summon = useCallback((count: 1 | 10): PullResult[] | null => {
    const cost = count === 10 ? SUMMON_COST_10 : SUMMON_COST;
    const prev = metaRef.current;
    if (prev.gold < cost) return null;

    const results = pull(count, prev.avatarCopies);
    const refund = results.reduce((s, r) => s + r.refund, 0);

    setMeta((m) => {
      const copies = { ...m.avatarCopies };
      // 환급된 장(별이 다 오른 것)은 장수를 늘리지 않는다
      for (const r of results) {
        if (r.refund === 0) copies[r.def.id] = (copies[r.def.id] ?? 0) + 1;
      }
      return {
        ...m,
        gold: m.gold - cost + refund,
        avatarCopies: copies,
        summons: m.summons + count,
      };
    });
    return results;
  }, []);

  const buyAvatar = useCallback((id: string): boolean => {
    const def = AVATARS.find((a) => a.id === id);
    if (!def) return false;
    const prev = metaRef.current;
    const cost = avatarPrice(def.tier);
    if (prev.gold < cost) return false;

    setMeta((m) => ({
      ...m,
      gold: m.gold - cost,
      avatarCopies: { ...m.avatarCopies, [id]: (m.avatarCopies[id] ?? 0) + 1 },
    }));
    return true;
  }, []);

  const equipAvatar = useCallback((id: string) => {
    setMeta((prev) => (prev.avatarCopies[id] ? { ...prev, avatar: id } : prev));
  }, []);

  const resetAll = useCallback(() => {
    void clearMeta();
    setMeta(createMeta());
    setNewlyUnlocked([]);
  }, []);

  const clearUnlockNotice = useCallback(() => setNewlyUnlocked([]), []);

  const claimMail = (id: string): number => {
    const m = meta.mail.find((x) => x.id === id);
    if (!m || m.claimed) return 0;
    setMeta((prev) => ({
      ...prev,
      gold: prev.gold + m.gold,
      mail: prev.mail.map((x) => (x.id === id ? { ...x, claimed: true } : x)),
    }));
    return m.gold;
  };

  const claimAllMail = (): number => {
    const sum = meta.mail.filter((x) => !x.claimed).reduce((a, x) => a + x.gold, 0);
    if (sum === 0) return 0;
    setMeta((prev) => ({
      ...prev,
      gold: prev.gold + sum,
      mail: prev.mail.map((x) => (x.claimed ? x : { ...x, claimed: true })),
    }));
    return sum;
  };

  const setShowFps = (on: boolean) => setMeta((prev) => ({ ...prev, showFps: on }));
  const setHaptics = (on: boolean) => setMeta((prev) => ({ ...prev, haptics: on }));

  const value = useMemo<MetaApi>(
    () => ({
      meta,
      ready,
      isUnlocked,
      isCleared,
      finishBattle,
      sweep,
      claimMission,
      attend,
      watchAd,
      discoverUnits,
      completeMode,
      summon,
      equipAvatar,
      buyAvatar,
      newlyUnlocked,
      clearUnlockNotice,
      claimMail,
      claimAllMail,
      setShowFps,
      setHaptics,
      resetAll,
    }),
    [
      meta,
      ready,
      isUnlocked,
      isCleared,
      finishBattle,
      sweep,
      claimMission,
      attend,
      watchAd,
      discoverUnits,
      completeMode,
      summon,
      equipAvatar,
      buyAvatar,
      newlyUnlocked,
      clearUnlockNotice,
      resetAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
