/** 전장 생성과 조회 헬퍼. 상태를 바꾸는 규칙은 combat.ts 에 있다. */

import {
  ALLY_BASE_X,
  COMBAT,
  lanesFor,
  ENEMY_BASE_X,
  HERO,
  RESOURCE,
  WAVE,
} from './balance';
import { stageDef, unitDef, type UnitDef } from './content';
import type { Entity, Team, World } from './types';

/**
 * 능력치 배율.
 *
 * 예전에는 골드로 사는 영구 강화가 이 값을 올렸는데, 강화 시스템을 없애면서
 * 전부 1(기본치)로 고정했다. 스테이지 난이도는 enemyPower / threatMul 로만 준다.
 */
const MODS: Record<string, number> = {
  heroAtk: 1,
  heroHp: 1,
  unitAtk: 1,
  unitHp: 1,
  foodRegen: 1,
  manaRegen: 1,
  baseHp: 1,
};

/** 가장 한산한 열에 배치한다 — 고르게 퍼져야 여럿이 동시에 교전한다. */
function pickLane(w: World, team: Team): number {
  const lanes = lanesFor(team);
  const counts = new Array(lanes).fill(0);
  for (const o of w.entities) {
    if (o.team !== team || o.kind !== 'unit') continue;
    counts[Math.max(0, Math.min(lanes - 1, o.lane))] += 1;
  }
  let best = 0;
  for (let i = 1; i < lanes; i++) if (counts[i] < counts[best]) best = i;
  return best;
}

export function makeEntity(
  w: World,
  def: UnitDef,
  team: Team,
  x: number,
  kind: Entity['kind'] = 'unit',
): Entity {
  // 적은 뒤 웨이브일수록 강하다 (스폰 시점의 배율이 그대로 굳는다)
  const hpMod = team === 'ally' ? w.mods.unitHp : w.enemyPower;
  const atkMod = team === 'ally' ? w.mods.unitAtk : w.enemyPower;
  const hp = def.hp * hpMod;

  return {
    id: w.nextId++,
    team,
    kind,
    defId: def.id,
    name: def.name,
    emoji: def.emoji,
    x,
    lane: pickLane(w, team),
    hp,
    maxHp: hp,
    atk: def.atk * atkMod,
    atkSpeed: def.atkSpeed,
    range: def.range,
    speed: def.speed,
    cooldown: 0,
    hitFlash: 0,
    swing: 0,
  };
}

export function makeHero(w: World): Entity {
  const hp = HERO.hp * w.mods.heroHp;
  return {
    id: w.nextId++,
    team: 'ally',
    kind: 'hero',
    defId: 'hero',
    name: HERO.name,
    emoji: '',
    x: HERO.spawnX,
    lane: Math.floor(lanesFor('ally') / 2),
    hp,
    maxHp: hp,
    atk: HERO.atk * w.mods.heroAtk,
    atkSpeed: HERO.atkSpeed,
    range: HERO.range,
    speed: HERO.speed,
    cooldown: 0,
    hitFlash: 0,
    swing: 0,
  };
}

function makeBase(w: World, team: Team, hp: number): Entity {
  return {
    id: w.nextId++,
    team,
    kind: 'base',
    defId: 'base',
    name: team === 'ally' ? '아군 기지' : '적 기지',
    emoji: team === 'ally' ? '🏰' : '🏯',
    x: team === 'ally' ? ALLY_BASE_X : ENEMY_BASE_X,
    lane: 0,
    hp,
    maxHp: hp,
    atk: 0,
    atkSpeed: 0,
    range: 0,
    speed: 0,
    cooldown: 0,
    hitFlash: 0,
    swing: 0,
  };
}

export function createWorld(stageId: string, threatMul = 1): World {
  const stage = stageDef(stageId);
  const mods = { ...MODS };

  const w: World = {
    stageId,
    phase: 'playing',
    time: 0,
    mods,
    enemyPower: stage.enemyPower * threatMul,
    entities: [],
    allyBaseId: -1,
    enemyBaseId: -1,
    heroId: null,
    food: RESOURCE.foodStart,
    foodMax: RESOURCE.foodMax,
    foodRegen: RESOURCE.foodRegen * mods.foodRegen,
    mana: RESOURCE.manaStart,
    manaMax: RESOURCE.manaMax,
    manaRegen: RESOURCE.manaRegen * mods.manaRegen,
    summonCd: {},
    skillCd: {},
    threatMul,
    waveNo: 0,
    // 첫 웨이브가 3초쯤 도착하도록 뒤로 당겨 둔다
    lastWaveAt: -WAVE.interval + 3,
    wavesDone: false,
    rageDone: false,
    loseReason: null,
    heroMinHp: 1,
    pending: [],
    effects: [],
    nextId: 1,
    kills: 0,
    summoned: 0,
  };

  const allyBase = makeBase(w, 'ally', stage.allyBaseHp * mods.baseHp);
  const enemyBase = makeBase(w, 'enemy', stage.enemyBaseHp);
  w.entities.push(allyBase, enemyBase);
  w.allyBaseId = allyBase.id;
  w.enemyBaseId = enemyBase.id;

  const hero = makeHero(w);
  w.entities.push(hero);
  w.heroId = hero.id;

  return w;
}

// ------------------------------------------------------------------- 조회

export function findById(w: World, id: number): Entity | null {
  return w.entities.find((e) => e.id === id) ?? null;
}

export function getHero(w: World): Entity | null {
  return w.heroId === null ? null : findById(w, w.heroId);
}

export function getBase(w: World, team: Team): Entity {
  const id = team === 'ally' ? w.allyBaseId : w.enemyBaseId;
  const base = findById(w, id);
  if (!base) throw new Error('기지가 사라졌습니다');
  return base;
}

/**
 * 앞을 막고 있는 아군이 있는지 본다.
 * **같은 열끼리만** 막는다 — 다른 열이면 나란히 서서 함께 때릴 수 있다.
 */
export function blockedAhead(w: World, e: Entity): boolean {
  const dir = e.team === 'ally' ? 1 : -1;
  for (const o of w.entities) {
    if (o === e || o.team !== e.team) continue;
    // 기지와 주인공은 길을 막지 않는다
    if (o.kind !== 'unit') continue;
    if (o.lane !== e.lane) continue;
    const ahead = (o.x - e.x) * dir;
    if (ahead > 0 && ahead < COMBAT.minGap) return true;
  }
  return false;
}

/**
 * 선두 아군 유닛이 이 엔티티보다 얼마나 앞서 있는가(px).
 * 앞선 아군이 하나도 없으면 -Infinity.
 *
 * 팔라독은 이 값이 escortGap 보다 클 때만 전진한다. 즉 "소환수가 앞을
 * 충분히 벌려 놨을 때만 따라간다". 이게 이 게임의 뼈대다.
 */
export function escortLead(w: World, e: Entity): number {
  let front = -Infinity;
  for (const o of w.entities) {
    if (o.team !== e.team || o.kind !== 'unit' || o.hp <= 0) continue;
    if (o.x > front) front = o.x;
  }
  return front === -Infinity ? -Infinity : front - e.x;
}

/**
 * 가장 가까운 적. 적 기지는 후보에 들어가지만 아군 기지는 아니다.
 * 이 게임에서 지켜야 하는 건 기지가 아니라 팔라독이기 때문이다.
 */
export function nearestEnemy(w: World, e: Entity): Entity | null {
  let best: Entity | null = null;
  let bestDist = Infinity;
  for (const o of w.entities) {
    if (o.team === e.team || o.hp <= 0) continue;
    if (o.kind === 'base' && o.team === 'ally') continue;
    const d = Math.abs(o.x - e.x);
    if (d < bestDist) {
      bestDist = d;
      best = o;
    }
  }
  return best;
}

export { unitDef };
