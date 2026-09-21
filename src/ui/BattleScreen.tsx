import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import {
  ALLY_BASE_X,
  CAP,
  ENEMY_BASE_X,
  FIELD_LENGTH,
  MAX_STEPS_PER_FRAME,
  STEP_SEC,
  WAVE,
} from '../game/balance';
import { canCast, canSummon, step, tryCast, trySummon } from '../game/combat';
import { SKILLS, UNITS, skillDef, stageDef, unitDef } from '../game/content';
import { useMeta, type BattleOutcome } from '../game/GameContext';
import { isUnitUnlocked, unlockText } from '../game/progress';
import { fmt, fmtClock } from '../game/format';
import type { Effect, Entity, Phase, World } from '../game/types';
import { createWorld, getBase } from '../game/world';
import { AllyBaseArt, EnemyBaseArt, HeroArt, artFor } from './art/characters';
import { GrassTuft, Mountains, SceneryArt } from './art/scenery';
import { Banner, Bar, Button, Frame, Slot, Starburst, Stars } from './components';
import { C, G, inkShadow, numeric, shadow } from './theme';

/** 화면 밖 이 거리까지만 그린다 */
const CULL = 90;
/** 하단 조작부가 차지하는 높이 — 유닛이 그 위에 서도록 지면을 잡는다 */
const CONTROL_H = 104;
/** 주인공이 화면 가장자리에 붙지 않도록 두는 최소 여백(px) */
const HERO_MARGIN = 110;
/** 전열 간 세로 간격(px). 뒤 열일수록 위쪽에 그려 원근을 만든다 */
const ROW_H = 15;
/** 유닛 등급 — 슬롯 배경색으로 급을 보여준다 */
const RARITY_OF: Record<string, 'common' | 'rare' | 'epic' | 'legend'> = {
  mouse: 'common',
  penguin: 'common',
  owl: 'rare',
  rhino: 'rare',
  dragon: 'legend',
};
/** 전경 풀 개수와 간격 — 두 값의 곱이 화면 폭보다 커야 끊김 없이 이어진다 */
const GRASS_N = 16;
const GRASS_GAP = 84;

// --------------------------------------------------------------- 엔티티

function EntityView({ e, camera, groundY }: { e: Entity; camera: number; groundY: number }) {
  const left = e.x - camera;
  const isEnemy = e.team === 'enemy';

  if (e.kind === 'base') {
    const Art = isEnemy ? EnemyBaseArt : AllyBaseArt;
    return (
      <View
        style={[styles.baseWrap, { left: left - 59, bottom: groundY - 12 }]}
        pointerEvents="none"
      >
        <View style={e.hitFlash > 0 ? styles.hurt : undefined}>
          <Art size={118} />
        </View>
      </View>
    );
  }

  const hero = e.kind === 'hero';
  const Art = artFor(e.defId);
  if (!Art) return null;

  const artSize = hero ? 70 : 54;

  return (
    <View
      style={[styles.entity, { left: left - artSize / 2, width: artSize, bottom: groundY + e.lane * ROW_H }]}
      pointerEvents="none"
    >
      <View style={styles.hpWrap}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${Math.max(0, Math.min(1, e.hp / e.maxHp)) * 100}%`,
              backgroundColor: hero ? C.gold : isEnemy ? C.red : C.green,
            },
          ]}
        />
      </View>

      <View>
        {/* 팀을 한눈에 구분시키는 발밑 그림자 */}
        <View
          style={[
            styles.footShadow,
            {
              width: artSize * 0.62,
              backgroundColor: hero
                ? 'rgba(255,201,74,0.5)'
                : isEnemy
                  ? 'rgba(255,85,102,0.45)'
                  : 'rgba(79,168,255,0.45)',
            },
          ]}
        />
        <View
          style={[
            isEnemy ? styles.faceLeft : null,
            e.hitFlash > 0 && styles.hurt,
            e.swing > 0 && { transform: [{ scale: 1.08 }] },
          ]}
        >
          <Art size={artSize} />
        </View>
      </View>

      {hero ? <View style={styles.heroMark} /> : null}
    </View>
  );
}

// --------------------------------------------------------------- 이펙트

function EffectView({ fx, camera, groundY }: { fx: Effect; camera: number; groundY: number }) {
  const t = 1 - fx.life / fx.maxLife;
  const left = fx.x - camera;

  if (fx.kind === 'damage' || fx.kind === 'heal') {
    const heal = fx.kind === 'heal';
    return (
      <Text
        pointerEvents="none"
        style={[
          styles.dmg,
          {
            left: left - 30,
            bottom: groundY + 54 + fx.lane * ROW_H + t * 32,
            opacity: 1 - t * t,
            color: heal ? C.green : fx.team === 'enemy' ? C.gold : C.red,
          },
        ]}
      >
        {heal ? `+${fmt(fx.value)}` : fmt(fx.value)}
      </Text>
    );
  }

  // 근접 타격 / 원거리 탄 / 폭발을 색과 크기로만 구분한다
  const spec =
    fx.kind === 'slash'
      ? { size: 20, color: '#fff2c4', alpha: 0.85 }
      : fx.kind === 'bolt'
        ? { size: 10, color: fx.team === 'ally' ? '#9fd8ff' : '#ffb0b8', alpha: 0.9 }
        : { size: 58, color: '#ffb347', alpha: 0.5 };

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: left - spec.size / 2,
        bottom: groundY + 16 + fx.lane * ROW_H,
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size / 2,
        backgroundColor: spec.color,
        opacity: (1 - t) * spec.alpha,
        transform: [{ scale: fx.kind === 'blast' ? 0.6 + t : 1 }],
      }}
    />
  );
}

/** 남은 쿨다운을 어둡게 덮어 보여준다 */
function CooldownVeil({ ratio }: { ratio: number }) {
  if (ratio <= 0) return null;
  return <View style={[styles.veil, { height: `${Math.min(1, ratio) * 100}%` }]} />;
}

// ---------------------------------------------------------------- 화면

export function BattleScreen({ stageId, onExit }: { stageId: string; onExit: () => void }) {
  const { meta, finishBattle } = useMeta();
  const stage = useMemo(() => stageDef(stageId), [stageId]);

  const worldRef = useRef<World>(createWorld(stageId));
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<Phase | null>(null);
  const [outcome, setOutcome] = useState<BattleOutcome | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const resultRef = useRef<Phase | null>(null);
  const finishRef = useRef(finishBattle);
  finishRef.current = finishBattle;

  // ------------------------------------------------------------ 게임 루프
  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    let acc = 0;
    let lastRender = 0;

    const loop = () => {
      const now = Date.now();
      acc += (now - last) / 1000;
      last = now;

      // 고정 스텝으로 돌려야 프레임이 흔들려도 판정이 일정하다
      let steps = 0;
      while (acc >= STEP_SEC && steps < MAX_STEPS_PER_FRAME) {
        const ev = step(worldRef.current, STEP_SEC);
        acc -= STEP_SEC;
        steps += 1;
        if (ev.finished && !resultRef.current) {
          resultRef.current = ev.finished;
          setOutcome(
            finishRef.current(
              stageId,
              ev.finished === 'win',
              worldRef.current.heroMinHp,
            ),
          );
          setResult(ev.finished);
        }
      }
      if (acc > STEP_SEC * MAX_STEPS_PER_FRAME) acc = 0;

      // 렌더는 30fps 로 낮춰 리렌더 부담을 줄인다
      if (now - lastRender >= 33) {
        lastRender = now;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stageId]);

  const restart = useCallback(() => {
    worldRef.current = createWorld(stageId);
    resultRef.current = null;
    setResult(null);
    setOutcome(null);
  }, [stageId]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }, []);

  const w = worldRef.current;
  const hero = w.heroId !== null ? (w.entities.find((e) => e.id === w.heroId) ?? null) : null;
  const enemyBase = getBase(w, 'enemy');
  const heroRatio = hero ? hero.hp / hero.maxHp : 0;
  const heroLow = heroRatio > 0 && heroRatio < 0.35;

  /** 유닛이 조작부에 가리지 않도록 지면을 조작부 위로 올린다 */
  const groundY = Math.max(CONTROL_H + 8, size.h * 0.4);

  /*
   * 카메라.
   *
   * 주인공만 따라가면 플레이어가 뒤에 있을 때 전투가 화면 밖에서 벌어지므로
   * 주인공과 '교전 지점'의 중간을 비춘다. 다만 그것만으로는 부족하다 —
   * 전장이 비어 있는 전투 시작 순간에는 교전 지점이 적 기지가 돼서 카메라가
   * 오른쪽으로 쏠리고, 정작 팔라독이 화면 왼쪽 밖으로 밀려났다.
   * 그래서 마지막에 '주인공은 무조건 화면 안'이라는 조건으로 한 번 더 조인다.
   */
  const camera = useMemo(() => {
    if (!size.w) return 0;
    const heroX = hero?.x ?? ALLY_BASE_X;

    let frontAlly = heroX;
    let frontEnemy = ENEMY_BASE_X;
    for (const e of w.entities) {
      if (e.kind === 'base') continue;
      if (e.team === 'ally') frontAlly = Math.max(frontAlly, e.x);
      else frontEnemy = Math.min(frontEnemy, e.x);
    }
    const target = (heroX + (frontAlly + frontEnemy) / 2) / 2;
    let cam = target - size.w / 2;

    // 주인공을 화면 가장자리에서 최소 이만큼 떨어뜨린다
    const margin = Math.min(HERO_MARGIN, size.w * 0.3);
    cam = Math.min(cam, heroX - margin);
    cam = Math.max(cam, heroX - size.w + margin);

    return Math.max(0, Math.min(Math.max(0, FIELD_LENGTH - size.w), cam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, hero?.x, w.entities, tick]);

  const allyCount = w.entities.filter((e) => e.team === 'ally' && e.kind === 'unit').length;
  const nextWaveIn = w.wavesDone ? null : Math.max(0, WAVE.interval - (w.time - w.lastWaveAt));

  return (
    <View style={styles.root} onLayout={onLayout}>
      {/* ========================================================== 전장 */}
      {/* 전장 레이어는 전부 이 안에서 잘린다. 밖으로 새면 화면에 가로
          스크롤이 생겨 화면 전체가 밀린다. */}
      <View style={styles.clip} pointerEvents="none">
      <LinearGradient colors={stage.sky} style={StyleSheet.absoluteFill} />

      <View style={[styles.moonGlow, { right: 70 - camera * 0.03 }]} pointerEvents="none" />
      <View style={[styles.moon, { right: 100 - camera * 0.03 }]} pointerEvents="none" />

      {size.w > 0 ? (
        <View
          style={[styles.hills, { bottom: groundY + 12, left: -((camera * 0.12) % 400) }]}
          pointerEvents="none"
        >
          <Mountains width={size.w + 800} height={78} color={stage.hillColor} />
        </View>
      ) : null}

      {/* 원경 / 근경 오브젝트 */}
      {size.w > 0
        ? Array.from({ length: 14 }, (_, i) => {
            const left = i * 210 + 40 - camera * 0.22;
            if (left < -80 || left > size.w + 80) return null;
            return (
              <View
                key={`far${i}`}
                style={[styles.sceneryFar, { left, bottom: groundY + 8 }]}
                pointerEvents="none"
              >
                <SceneryArt kind={stage.scenery} size={40} color={stage.sceneryColor} />
              </View>
            );
          })
        : null}
      {size.w > 0
        ? Array.from({ length: 14 }, (_, i) => {
            const left = i * 165 + 120 - camera * 0.55;
            if (left < -70 || left > size.w + 70) return null;
            return (
              <View
                key={`near${i}`}
                style={[styles.sceneryNear, { left, bottom: groundY - 6 }]}
                pointerEvents="none"
              >
                <SceneryArt kind={stage.scenery} size={64} color={stage.sceneryColor} />
              </View>
            );
          })
        : null}

      {/* 지면 */}
      <LinearGradient
        colors={stage.ground}
        style={[styles.ground, { height: groundY + 8 }]}
        pointerEvents="none"
      />
      {/* 유닛이 걷는 흙길 */}
      <View style={[styles.path, { bottom: groundY - 26, height: 34 }]} pointerEvents="none" />
      <View style={[styles.groundLine, { bottom: groundY + 6 }]} pointerEvents="none" />
      {size.w > 0
        ? Array.from({ length: 16 }, (_, i) => {
            const left = i * 105 + 20 - (camera % 105);
            if (left < -30 || left > size.w + 30) return null;
            return (
              <View
                key={`g${i}`}
                style={[styles.groundTick, { left, bottom: groundY - 22 }]}
                pointerEvents="none"
              />
            );
          })
        : null}

      {/* 엔티티 / 이펙트 */}
      {size.w > 0
        ? w.entities
            .filter((e) => {
              const l = e.x - camera;
              return l > -CULL && l < size.w + CULL;
            })
            // 뒤 열(lane 큰 쪽)을 먼저 그려야 앞 열이 위로 겹친다
            .slice()
            .sort((a, b) => b.lane - a.lane)
            .map((e) => <EntityView key={e.id} e={e} camera={camera} groundY={groundY} />)
        : null}
      {size.w > 0
        ? w.effects
            .filter((fx) => {
              const l = fx.x - camera;
              return l > -CULL && l < size.w + CULL;
            })
            .map((fx) => <EffectView key={fx.id} fx={fx} camera={camera} groundY={groundY} />)
        : null}

      {/* 전경 풀 — 카메라보다 빠르게 흘러 앞쪽에 있는 느낌을 준다 */}
      {size.w > 0
        ? Array.from({ length: GRASS_N }, (_, i) => {
            const span = GRASS_N * GRASS_GAP;
            const raw = i * GRASS_GAP - camera * 1.4;
            const left = ((raw % span) + span) % span;
            if (left > size.w) return null;
            return (
              <View
                key={`gr${i}`}
                style={[styles.grass, { left: left - 24, bottom: 2 + ((i * 29) % 86) }]}
                pointerEvents="none"
              >
                <GrassTuft size={46 + ((i * 17) % 34)} color={stage.grassColor} />
              </View>
            );
          })
        : null}

      {/* 아래쪽을 살짝 어둡게 눌러 시선을 전선으로 모은다 */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)'] as const}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      </View>

      {/* ====================================================== 상단 오버레이 */}
      <LinearGradient
        colors={['rgba(6,9,18,0.92)', 'rgba(6,9,18,0)'] as const}
        style={styles.topOverlay}
        pointerEvents="box-none"
      >
        <View style={styles.topRow}>
          <Pressable onPress={onExit} style={styles.exitBtn}>
            <Text style={styles.exitText}>✕</Text>
          </Pressable>

          <View style={styles.heroGauge}>
            <View style={styles.portrait}>
              <HeroArt size={28} />
            </View>
            <View style={{ flex: 1 }}>
              <Bar
                ratio={heroRatio}
                color={heroLow ? C.red : C.gold}
                height={10}
              />
              <Text style={[styles.gaugeLabel, heroLow && { color: C.red }]}>
                팔라독 {hero ? Math.ceil(hero.hp) : 0}
              </Text>
            </View>
          </View>

          <View style={styles.center}>
            <Text style={styles.stageName}>{stage.name}</Text>
            {w.wavesDone ? (
              <Text style={styles.counter}>마지막 웨이브 | 반격하라!</Text>
            ) : (
              <Text style={styles.waveText}>
                웨이브 {w.waveNo}/{stage.waveCount}
                {nextWaveIn !== null ? (
                  <Text style={styles.waveDim}>  다음 {nextWaveIn.toFixed(0)}초</Text>
                ) : null}
              </Text>
            )}
          </View>

          <View style={styles.gauge}>
            <Bar ratio={enemyBase.hp / enemyBase.maxHp} color={C.red} height={8} reverse />
            <Text style={[styles.gaugeLabel, { textAlign: 'right' }]}>적 기지</Text>
          </View>

          <Text style={styles.clock}>{fmtClock(w.time)}</Text>
        </View>

        {/* 전선 미니맵 */}
        <View style={styles.minimap}>
          {w.entities
            .filter((e) => e.kind !== 'base')
            .map((e) => (
              <View
                key={e.id}
                style={[
                  styles.blip,
                  {
                    left: `${((e.x - ALLY_BASE_X) / (ENEMY_BASE_X - ALLY_BASE_X)) * 100}%`,
                    backgroundColor:
                      e.kind === 'hero' ? C.gold : e.team === 'ally' ? C.blue : C.red,
                  },
                ]}
              />
            ))}
        </View>
      </LinearGradient>

      {allyCount === 0 && w.phase === 'playing' ? (
        <View style={styles.tip} pointerEvents="none">
          <Text style={styles.tipText}>
            유닛을 소환해 앞을 막아라 - 팔라독은 앞이 트여야 나아간다
          </Text>
        </View>
      ) : null}

      {heroLow && w.phase === 'playing' ? (
        <View style={styles.danger} pointerEvents="none">
          <Text style={styles.dangerText}>팔라독이 위험하다! 앞을 막아라</Text>
        </View>
      ) : null}

      {/* ==================================================== 하단 조작 (좌) */}
      <View style={[styles.leftPad, styles.skillRow]}>
        {SKILLS.map((s) => {
            const def = skillDef(s.id);
            const ok = canCast(w, s.id);
            return (
              <Pressable
                key={s.id}
                onPress={() => tryCast(worldRef.current, s.id)}
                style={({ pressed }) => [
                  !ok && styles.dim,
                  pressed && ok && { transform: [{ translateY: 2 }] },
                ]}
              >
                <View style={styles.cardWrap}>
                  <Slot size={60} active={ok} style={styles.card}>
                    <Text style={styles.skillEmoji}>{s.emoji}</Text>
                    <CooldownVeil ratio={(w.skillCd[s.id] ?? 0) / def.cd} />
                  </Slot>
                  <View style={[styles.tag, styles.manaTag]}>
                    <Text style={[styles.costText, w.mana < def.mana && styles.short]}>
                      {def.mana}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
      </View>

      {/* ================================================= 하단 자원 (가운데) */}
      <View style={styles.resPad} pointerEvents="none">
        <Frame tone="deep" padded={false}>
          <View style={styles.resBody}>
            <View style={styles.resRow}>
              <Text style={styles.resIcon}>🍖</Text>
              <Bar ratio={w.food / w.foodMax} color={C.food} height={9} style={{ width: 88 }} />
              <Text style={styles.resNum}>{Math.floor(w.food)}</Text>
            </View>
            <View style={styles.resRow}>
              <Text style={styles.resIcon}>💧</Text>
              <Bar ratio={w.mana / w.manaMax} color={C.mana} height={9} style={{ width: 88 }} />
              <Text style={styles.resNum}>{Math.floor(w.mana)}</Text>
            </View>
            <Text style={styles.troops}>
              부대 {allyCount}/{CAP.allyUnits}
            </Text>
          </View>
        </Frame>
      </View>

      {/* ==================================================== 하단 조작 (우) */}
      <View style={styles.rightPad}>
        {UNITS.map((u) => {
          const def = unitDef(u.id);
          const unlocked = isUnitUnlocked(meta, u.id);
          const ok = unlocked && canSummon(w, u.id);
          const Art = artFor(u.id);
          return (
            <Pressable
              key={u.id}
              onPress={() => (unlocked ? trySummon(worldRef.current, u.id) : undefined)}
              style={({ pressed }) => [
                !ok && styles.dim,
                pressed && ok && { transform: [{ translateY: 2 }] },
              ]}
            >
              <View style={styles.cardWrap}>
                <Slot
                  size={60}
                  active={ok}
                  locked={!unlocked}
                  rarity={RARITY_OF[u.id]}
                  style={styles.card}
                >
                  {Art ? <Art size={42} /> : null}
                  {unlocked ? <CooldownVeil ratio={(w.summonCd[u.id] ?? 0) / def.cd} /> : null}
                </Slot>
                <View style={[styles.tag, !unlocked && styles.tagLocked]}>
                  <Text
                    style={[
                      styles.costText,
                      !unlocked && styles.lockText,
                      unlocked && w.food < def.cost && styles.short,
                    ]}
                    numberOfLines={1}
                  >
                    {unlocked ? def.cost : unlockText()}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ========================================================== 결과 */}
      {result ? (
        <View style={styles.overlay}>
          <Frame style={styles.resultCard} tone={result === 'win' ? 'hot' : 'wood'}>
            <Banner title={result === 'win' ? '승  리' : '패  배'} style={{ marginTop: -24 }} />
            <View style={styles.trophyWrap}>
              {result === 'win' ? (
                <View style={styles.burst}>
                  <Starburst size={116} />
                </View>
              ) : null}
              <Text style={styles.resultEmoji}>{result === 'win' ? '🏆' : '💀'}</Text>
            </View>
            {result === 'win' ? (
              <View style={{ marginTop: 4 }}>
                <Stars value={outcome?.stars ?? 0} size={26} />
              </View>
            ) : null}
            {outcome?.improved && result === 'win' ? (
              <Text style={styles.newBest}>새 기록! 별 보너스 획득</Text>
            ) : null}
            <Text style={styles.resultSub}>
              {result === 'lose' ? '팔라독이 쓰러졌습니다' : stage.name} | {fmtClock(w.time)} | 적{' '}
              {w.kills}기 처치
            </Text>
            <Text style={styles.resultGold}>💰 +{outcome?.gold ?? 0}</Text>
            <View style={styles.resultRow}>
              <Button label="다시 도전" tone="plain" onPress={restart} style={{ flex: 1 }} />
              <View style={{ width: 10 }} />
              <Button label="나가기" tone="gold" onPress={onExit} style={{ flex: 1 }} />
            </View>
          </Frame>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },

  // -------------------------------------------------------------- 배경
  moon: {
    position: 'absolute',
    top: 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,246,214,0.45)',
  },
  moonGlow: {
    position: 'absolute',
    top: 6,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,246,214,0.045)',
  },
  hills: { position: 'absolute' },
  sceneryFar: { position: 'absolute', opacity: 0.4 },
  sceneryNear: { position: 'absolute', opacity: 0.75 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  groundLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  path: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  grass: { position: 'absolute' },
  bottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  groundTick: {
    position: 'absolute',
    width: 44,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // ------------------------------------------------------------ 엔티티
  entity: { position: 'absolute', alignItems: 'center' },
  baseWrap: { position: 'absolute', alignItems: 'center' },
  faceLeft: { transform: [{ scaleX: -1 }] },
  hurt: { opacity: 0.4 },
  hpWrap: {
    width: '72%',
    height: 3.5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  hpFill: { height: '100%' },
  footShadow: {
    position: 'absolute',
    bottom: 1,
    alignSelf: 'center',
    height: 6,
    borderRadius: 12,
  },
  heroMark: {
    position: 'absolute',
    top: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.gold,
  },
  dmg: {
    position: 'absolute',
    width: 60,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 3,
    ...numeric,
  },

  // -------------------------------------------------------------- 상단
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: 16 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 10,
  },
  exitBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: { color: C.textDim, fontSize: 13, fontWeight: '800' },
  gauge: { flex: 1, maxWidth: 148 },
  heroGauge: { flex: 1, maxWidth: 172, flexDirection: 'row', alignItems: 'center', gap: 7 },
  portrait: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.slotDeep,
    borderWidth: 2,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gaugeLabel: { color: C.textFaint, fontSize: 9.5, fontWeight: '700', marginTop: 3 },
  center: { flex: 1, alignItems: 'center' },
  stageName: { color: C.text, fontSize: 13, fontWeight: '900', ...inkShadow },
  waveText: { color: C.textDim, fontSize: 11, fontWeight: '700', marginTop: 2, ...numeric },
  counter: { color: C.gold, fontSize: 11, fontWeight: '800', marginTop: 2 },
  waveDim: { color: C.textFaint, fontWeight: '600' },
  clock: { color: C.textFaint, fontSize: 11, fontWeight: '700', width: 32, ...numeric },

  minimap: {
    height: 4,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  blip: { position: 'absolute', top: 0, width: 3, height: 4, borderRadius: 2 },

  tip: {
    position: 'absolute',
    alignSelf: 'center',
    top: 74,
    backgroundColor: 'rgba(10,16,30,0.85)',
    borderWidth: 1,
    borderColor: C.borderHi,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tipText: { color: C.textDim, fontSize: 12, fontWeight: '700' },
  danger: {
    position: 'absolute',
    alignSelf: 'center',
    top: 74,
    backgroundColor: 'rgba(120,20,32,0.85)',
    borderWidth: 1,
    borderColor: C.red,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dangerText: { color: '#ffdfe3', fontSize: 12.5, fontWeight: '900' },

  // -------------------------------------------------------- 하단 조작부
  leftPad: { position: 'absolute', left: 12, bottom: 12 },
  skillRow: { flexDirection: 'row', gap: 8 },
  skillEmoji: { fontSize: 26 },

  resPad: { position: 'absolute', left: 12, bottom: 84 },
  resBody: { paddingHorizontal: 10, paddingVertical: 8, gap: 5 },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  resIcon: { fontSize: 15 },
  resNum: { color: C.text, fontSize: 12, fontWeight: '900', width: 30, ...inkShadow, ...numeric },
  troops: { color: C.text, fontSize: 11.5, fontWeight: '900', ...inkShadow, ...numeric },

  rightPad: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', gap: 7 },
  card: { ...shadow(0.45, 6, 4) },
  cardWrap: { alignItems: 'center', width: 68 },
  tag: {
    marginTop: -8,
    minWidth: 46,
    maxWidth: 62,
    backgroundColor: '#2a1608',
    borderWidth: 1.5,
    borderColor: C.goldDeep,
    borderRadius: 7,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tagLocked: { borderColor: '#7a5735', backgroundColor: '#3a2a18' },
  lockText: { color: '#d8c3a0', fontSize: 8.5 },
  manaTag: { borderColor: C.blue },
  costText: { color: C.gold, fontSize: 12.5, fontWeight: '900', ...numeric },
  short: { color: C.red },
  dim: { opacity: 0.62 },
  veil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4,8,18,0.7)',
  },

  // -------------------------------------------------------------- 결과
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4,6,14,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: { width: 330, alignItems: 'center' },
  trophyWrap: { marginTop: 8, alignItems: 'center', justifyContent: 'center', height: 60 },
  burst: { position: 'absolute' },
  resultEmoji: { fontSize: 42 },
  newBest: { color: '#ffeec2', fontSize: 11.5, fontWeight: '900', marginTop: 4, ...inkShadow },
  resultSub: { color: '#ffeccd', fontSize: 12, marginTop: 4, fontWeight: '700', ...numeric },
  resultGold: { color: C.gold, fontSize: 20, fontWeight: '900', marginTop: 10, ...inkShadow, ...numeric },
  resultRow: { flexDirection: 'row', marginTop: 16, alignSelf: 'stretch' },
});
