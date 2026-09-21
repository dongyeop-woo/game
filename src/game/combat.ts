/**
 * 전투 시뮬레이션.
 *
 * 매 스텝 규칙은 유닛·주인공·기지 모두 같다:
 *   1) 가장 가까운 적을 찾는다 (적 기지 포함)
 *   2) 사거리 안이면 멈춰서 때린다
 *   3) 아니면 앞으로 간다 (앞을 막은 아군이 있으면 대기)
 * 주인공만 예외로, 플레이어 입력이 있으면 그 방향으로 움직이면서도 때린다.
 */

import { ALLY_BASE_X, CAP, COMBAT, EFFECT_LIFE, ENEMY_BASE_X, HERO, WAVE } from './balance';
import {
  skillDef,
  stageDef,
  unitDef,
  unlockedPool,
  waveSpec,
  type WaveDef,
} from './content';
import type { Effect, EffectKind, Entity, StepEvents, World } from './types';
import { blockedAhead, escortLead, getHero, makeEntity, nearestEnemy } from './world';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function pushEffect(
  w: World,
  kind: EffectKind,
  x: number,
  lane: number,
  value: number,
  team: Entity['team'],
): void {
  const life = EFFECT_LIFE[kind];
  w.effects.push({ id: w.nextId++, kind, x, lane, value, life, maxLife: life, team });
  // 화면에 너무 많이 쌓이면 오래된 것부터 버린다
  if (w.effects.length > 60) w.effects.splice(0, w.effects.length - 60);
}

// ------------------------------------------------------------------ 웨이브

function queueWave(w: World, wave: WaveDef, baseTime: number): void {
  for (let i = 0; i < wave.count; i++) {
    w.pending.push({ at: baseTime + wave.at + i * wave.gap, defId: wave.defId });
  }
}

function countUnits(w: World, team: Entity['team']): number {
  let n = 0;
  for (const e of w.entities) if (e.team === team && e.kind === 'unit') n++;
  return n;
}

function spawnEnemy(w: World, defId: string): void {
  if (countUnits(w, 'enemy') >= CAP.enemyUnits) return;
  w.entities.push(makeEntity(w, unitDef(defId), 'enemy', ENEMY_BASE_X - 58));
}

function updateWaves(w: World, dt: number, ev: StepEvents): void {
  const stage = stageDef(w.stageId);

  // 2) 적 기지 절반 격파 시 한 번 터지는 특수 웨이브
  if (!w.rageDone) {
    const base = w.entities.find((e) => e.id === w.enemyBaseId);
    if (base && base.hp / base.maxHp <= COMBAT.rageThreshold) {
      w.rageDone = true;
      ev.rageWave = true;
      for (const wave of stage.rage) queueWave(w, wave, w.time);
    }
  }

  // 3) 예약된 스폰 방출
  if (w.pending.length > 0) {
    const ready = w.pending.filter((p) => p.at <= w.time);
    if (ready.length > 0) {
      w.pending = w.pending.filter((p) => p.at > w.time);
      for (const p of ready) spawnEnemy(w, p.defId);
    }
  }

  // 4) 정해진 횟수만큼만 웨이브를 내보낸다. 다 쓰면 전장이 비고 반격 차례.
  if (!w.wavesDone && w.time - w.lastWaveAt >= WAVE.interval) {
    const spec = waveSpec(stage, w.waveNo);
    const pool = unlockedPool(stage, w.time);
    if (pool.length > 0) {
      // 이번 웨이브에 나올 적은 이 강화 배율로 굳는다
      w.enemyPower = spec.power * w.threatMul;

      let left = spec.budget;
      let slot = 0;
      // 비싼 적을 우선 담되 가끔 섞는다 — 균등 추첨이면 싸구려만 나온다
      const ranked = [...pool].sort((a, b) => unitDef(b).cost - unitDef(a).cost);
      for (let guard = 0; guard < 40 && left > 0; guard++) {
        const affordable = ranked.filter((id) => unitDef(id).cost <= left);
        if (affordable.length === 0) break;
        const pick =
          Math.random() < 0.55
            ? affordable[0]
            : affordable[Math.floor(Math.random() * affordable.length)];
        left -= unitDef(pick).cost;
        w.pending.push({ at: w.time + slot * WAVE.spawnGap, defId: pick });
        slot++;
      }

      w.waveNo++;
      w.lastWaveAt = w.time;
      if (w.waveNo >= stage.waveCount) w.wavesDone = true;
    }
  }
}

// ------------------------------------------------------------------- 전투

function attack(w: World, attacker: Entity, target: Entity, ev: StepEvents): void {
  target.hp -= attacker.atk;
  target.hitFlash = COMBAT.hitFlash;
  attacker.swing = COMBAT.swing;
  attacker.cooldown = 1 / Math.max(0.05, attacker.atkSpeed);

  pushEffect(w, 'damage', target.x, target.lane, attacker.atk, target.team);
  if (attacker.range > 100) {
    // 원거리는 날아가는 느낌을 주기 위해 중간 지점에 표식을 남긴다
    pushEffect(w, 'bolt', (attacker.x + target.x) / 2, attacker.lane, 0, attacker.team);
  } else {
    pushEffect(w, 'slash', target.x, target.lane, 0, attacker.team);
  }

  if (target.kind === 'base') ev.baseHit = true;
  if (target.kind === 'hero') ev.heroHurt = true;
}

function advance(w: World, e: Entity, dt: number): void {
  if (blockedAhead(w, e)) return;
  const dir = e.team === 'ally' ? 1 : -1;
  e.x = clamp(e.x + dir * e.speed * dt, ALLY_BASE_X, ENEMY_BASE_X);
}

function simulateEntity(w: World, e: Entity, dt: number, ev: StepEvents): void {
  e.cooldown = Math.max(0, e.cooldown - dt);
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.swing = Math.max(0, e.swing - dt);

  if (e.kind === 'base') return; // 기지는 맞기만 한다

  const target = nearestEnemy(w, e);
  const inRange = target !== null && Math.abs(target.x - e.x) <= e.range;

  if (e.kind === 'hero') {
    // 팔라독은 선두 아군과 충분히 벌어져 있을 때만 따라 나간다
    if (inRange && target) {
      if (e.cooldown <= 0) attack(w, e, target, ev);
    } else if (escortLead(w, e) > HERO.escortGap) {
      advance(w, e, dt);
    }
    return;
  }

  if (inRange && target) {
    if (e.cooldown <= 0) attack(w, e, target, ev);
  } else {
    advance(w, e, dt);
  }
}

// ------------------------------------------------------------------- 정리

function cleanup(w: World, ev: StepEvents): void {
  if (!w.entities.some((e) => e.hp <= 0 && e.kind !== 'base')) return;

  const survivors: Entity[] = [];
  for (const e of w.entities) {
    if (e.hp > 0 || e.kind === 'base') {
      survivors.push(e);
      continue;
    }
    if (e.kind === 'hero') {
      w.heroId = null;
      ev.heroDied = true;
    } else if (e.team === 'enemy') {
      w.kills += 1;
    }
  }
  w.entities = survivors;
}

function updateEffects(w: World, dt: number): void {
  if (w.effects.length === 0) return;
  const alive: Effect[] = [];
  for (const fx of w.effects) {
    fx.life -= dt;
    if (fx.life > 0) alive.push(fx);
  }
  w.effects = alive;
}

// -------------------------------------------------------------- 메인 스텝

export function step(w: World, dt: number): StepEvents {
  const ev: StepEvents = {
    heroDied: false,
    heroHurt: false,
    baseHit: false,
    rageWave: false,
    finished: null,
  };
  if (w.phase !== 'playing') return ev;

  w.time += dt;
  w.food = Math.min(w.foodMax, w.food + w.foodRegen * dt);
  w.mana = Math.min(w.manaMax, w.mana + w.manaRegen * dt);

  for (const id in w.summonCd) w.summonCd[id] = Math.max(0, w.summonCd[id] - dt);
  for (const id in w.skillCd) w.skillCd[id] = Math.max(0, w.skillCd[id] - dt);

  updateWaves(w, dt, ev);

  // 별 등급 판정을 위해 팔라독이 가장 위험했던 순간을 남긴다
  const heroNow = getHero(w);
  if (heroNow) w.heroMinHp = Math.min(w.heroMinHp, heroNow.hp / heroNow.maxHp);

  // 반복 중 배열이 바뀌지 않도록 스냅샷을 떠서 돈다
  const acting = w.entities.slice();
  for (const e of acting) {
    if (e.hp <= 0 && e.kind !== 'base') continue;
    simulateEntity(w, e, dt, ev);
  }

  cleanup(w, ev);
  updateEffects(w, dt);

  const enemyBase = w.entities.find((e) => e.id === w.enemyBaseId);
  if (enemyBase && enemyBase.hp <= 0) {
    w.phase = 'win';
    ev.finished = 'win';
  } else if (ev.heroDied) {
    // 호위 실패 — 이 게임의 유일한 패배 조건
    w.phase = 'lose';
    w.loseReason = 'hero';
    ev.finished = 'lose';
  }

  return ev;
}

// ------------------------------------------------------------- 플레이어 액션

export function canSummon(w: World, defId: string): boolean {
  const def = unitDef(defId);
  return (
    w.phase === 'playing' &&
    w.food >= def.cost &&
    (w.summonCd[defId] ?? 0) <= 0 &&
    countUnits(w, 'ally') < CAP.allyUnits
  );
}

export function trySummon(w: World, defId: string): boolean {
  if (!canSummon(w, defId)) return false;
  const def = unitDef(defId);
  w.food -= def.cost;
  w.summonCd[defId] = def.cd;
  w.entities.push(makeEntity(w, def, 'ally', ALLY_BASE_X + 58));
  w.summoned += 1;
  return true;
}

export function canCast(w: World, skillId: string): boolean {
  const s = skillDef(skillId);
  return (
    w.phase === 'playing' &&
    w.heroId !== null &&
    w.mana >= s.mana &&
    (w.skillCd[skillId] ?? 0) <= 0
  );
}

export function tryCast(w: World, skillId: string): boolean {
  if (!canCast(w, skillId)) return false;
  const s = skillDef(skillId);
  const hero = getHero(w);
  if (!hero) return false;

  w.mana -= s.mana;
  w.skillCd[skillId] = s.cd;

  if (s.kind === 'damage') {
    // 기지는 마법으로 못 깬다 — 기지는 유닛으로 밀어야 한다
    for (const o of w.entities) {
      if (o.team !== 'enemy' || o.kind === 'base' || o.hp <= 0) continue;
      if (o.x < hero.x - 40 || o.x > hero.x + s.reach) continue;
      o.hp -= s.power;
      o.hitFlash = COMBAT.hitFlash;
      pushEffect(w, 'damage', o.x, o.lane, s.power, o.team);
    }
    pushEffect(
      w,
      s.id === 'blast' ? 'blast' : 'bolt',
      hero.x + s.reach / 2,
      0,
      0,
      'ally',
    );
  } else {
    for (const o of w.entities) {
      if (o.team !== 'ally' || o.kind === 'base' || o.hp <= 0) continue;
      if (Math.abs(o.x - hero.x) > s.reach) continue;
      const healed = Math.min(o.maxHp - o.hp, o.maxHp * s.power);
      if (healed <= 0) continue;
      o.hp += healed;
      pushEffect(w, 'heal', o.x, o.lane, healed, 'ally');
    }
  }

  return true;
}
