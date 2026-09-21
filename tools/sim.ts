/**
 * 전투 밸런스 시뮬레이터 (개발 도구).
 *
 *   npm run sim            # 전 스테이지
 *   npm run sim -- s3      # s3 만
 *   npm run sim -- sweep   # 난이도 배율 스윕
 *
 * "적당히 잘 하는 플레이어"를 흉내내서 화면 없이 전투를 끝까지 돌린다.
 * 스테이지가 이길 수 있는지, 얼마나 걸리는지, 전선이 어디서 형성되는지 본다.
 */

import { ALLY_BASE_X, ENEMY_BASE_X, STEP_SEC } from '../src/game/balance';
import { canCast, canSummon, step, tryCast, trySummon } from '../src/game/combat';
import { SKILLS, STAGES, UNITS, stageDef } from '../src/game/content';
import { fmt, fmtClock } from '../src/game/format';
import type { World } from '../src/game/types';
import { createWorld, getHero } from '../src/game/world';

const MAX_SECONDS = Number(process.env.SIM_MAX ?? 420);

/**
 * 쓸 수 있는 유닛 목록. 해금을 흉내내려면 SIM_UNITS 로 제한한다.
 *   SIM_UNITS=mouse,penguin npm run sim -- s1 0
 */
const ALLOWED = (process.env.SIM_UNITS ?? '').trim();
const USABLE = ALLOWED ? UNITS.filter((u) => ALLOWED.split(',').includes(u.id)) : UNITS;

/** 비싼 유닛을 우선하되, 식량이 남으면 싼 것도 계속 뽑는 정책 */
function playerTurn(w: World): void {
  const byCost = [...USABLE].sort((a, b) => b.cost - a.cost);
  for (const u of byCost) {
    // 드래곤용 식량을 어느 정도 남겨두되, 식량이 넘치면 그냥 쓴다
    if (u.cost < 50 && w.food < 60 && w.foodMax - w.food > 30) continue;
    if (canSummon(w, u.id)) trySummon(w, u.id);
  }

  const hero = getHero(w);
  if (hero) {
    // 앞쪽 적이 2기 이상 몰려 있으면 마법을 쓴다
    for (const s of SKILLS) {
      if (!canCast(w, s.id)) continue;
      if (s.kind === 'heal') {
        const hurt = w.entities.filter(
          (e) => e.team === 'ally' && e.kind !== 'base' && e.hp < e.maxHp * 0.6,
        ).length;
        if (hurt >= 2) tryCast(w, s.id);
      } else {
        const targets = w.entities.filter(
          (e) =>
            e.team === 'enemy' &&
            e.kind !== 'base' &&
            e.x >= hero.x - 40 &&
            e.x <= hero.x + s.reach,
        ).length;
        if (targets >= 2) tryCast(w, s.id);
      }
    }

  }
}

function frontLine(w: World): number {
  const allies = w.entities.filter((e) => e.team === 'ally' && e.kind === 'unit');
  if (allies.length === 0) return ALLY_BASE_X;
  return Math.max(...allies.map((e) => e.x));
}

function runStage(stageId: string, threatMul = 1) {
  const w = createWorld(stageId, threatMul);
  const stage = stageDef(stageId);

  let steps = 0;
  let heroDeaths = 0;
  let frontSum = 0;
  let samples = 0;
  let minHeroRatio = 1;

  while (w.phase === 'playing' && w.time < MAX_SECONDS) {
    // 사람이 계속 붙어 있진 않으니 0.25초에 한 번만 판단하게 한다
    if (steps % 15 === 0) playerTurn(w);
    const ev = step(w, STEP_SEC);
    if (ev.heroDied) heroDeaths++;
    steps++;

    if (steps % 30 === 0) {
      frontSum += frontLine(w);
      samples++;
      const h = getHero(w);
      if (h) minHeroRatio = Math.min(minHeroRatio, h.hp / h.maxHp);
    }
  }

  const enemy = w.entities.find((e) => e.id === w.enemyBaseId);
  const hero = getHero(w);
  const result = w.phase === 'playing' ? '시간초과' : w.phase === 'win' ? '승리' : '패배';

  const avgFront = samples > 0 ? frontSum / samples : ALLY_BASE_X;
  const frontPct = ((avgFront - ALLY_BASE_X) / (ENEMY_BASE_X - ALLY_BASE_X)) * 100;

  return {
    id: stageId,
    name: stage.name,
    result,
    time: w.time,
    heroPct: hero ? (hero.hp / hero.maxHp) * 100 : 0,
    enemyPct: enemy ? Math.max(0, (enemy.hp / enemy.maxHp) * 100) : 0,
    minHeroPct: minHeroRatio * 100,
    heroDeaths,
    kills: w.kills,
    summoned: w.summoned,
    frontPct,
  };
}

function sweep(): void {
  console.log('\n=== 난이도 배율 스윕 (s1) — 적의 질+양을 함께 올린다 ===\n');
  console.log('  배율   결과      소요    팔라독최저    전선');
  console.log('  ' + '-'.repeat(46));
  for (const mul of [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5]) {
    // 난수 영향을 줄이려고 3판 평균
    const runs = [0, 1, 2].map(() => runStage('s1', mul));
    const avg = (f: (r: ReturnType<typeof runStage>) => number) =>
      runs.reduce((s, r) => s + f(r), 0) / runs.length;
    const results = runs.map((r) => r.result).join('/');
    console.log(
      `  ${mul.toFixed(2).padStart(4)}   ${results.padEnd(14)} ` +
        `${fmtClock(avg((r) => r.time)).padStart(5)}  ` +
        `${avg((r) => r.minHeroPct).toFixed(0).padStart(8)}% ` +
        `${avg((r) => r.frontPct).toFixed(0).padStart(6)}%`,
    );
  }
  console.log('');
}

function main(): void {
  const arg = process.argv[2];
  if (arg === 'sweep') return sweep();
  const ids = arg && arg !== 'all' ? [arg] : STAGES.map((s) => s.id);

  // 웨이브 편성과 크리티컬이 무작위라 한 판만 보면 판단을 그르친다.
  // 여러 번 돌려 승률로 본다.
  const runs = Number(process.env.SIM_RUNS ?? 7);

  console.log(`\n=== 전투 시뮬레이션 (${runs}회 시행) ===\n`);
  console.log('  스테이지        승률     평균소요  팔라독최저  적기지잔여  전선');
  console.log('  ' + '-'.repeat(70));

  for (const id of ids) {
    const results = Array.from({ length: runs }, () => runStage(id));
    const wins = results.filter((r) => r.result === '승리');
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
    const rate = (wins.length / runs) * 100;
    const bar = '█'.repeat(Math.round(rate / 10)).padEnd(10, '·');

    console.log(
      `  ${results[0].name.padEnd(12)} ${bar} ${String(wins.length + '/' + runs).padStart(4)}  ` +
        `${fmtClock(avg(results.map((r) => r.time))).padStart(6)}  ` +
        `${avg(results.map((r) => r.minHeroPct)).toFixed(0).padStart(8)}% ` +
        `${avg(results.map((r) => r.enemyPct)).toFixed(0).padStart(9)}% ` +
        `${avg(results.map((r) => r.frontPct)).toFixed(0).padStart(5)}%`,
    );
  }
  console.log(
    '\n  팔라독이 쓰러지면 그 자리에서 패배. 최저% 가 낮을수록 아슬아슬했다는 뜻이다.\n' +
      '  전선 = 아군 유닛 선두의 평균 위치 (0% 출발점, 100% 적 기지).\n',
  );
}

main();
