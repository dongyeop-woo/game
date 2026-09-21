/** 전투 한 판의 내부 상태를 초 단위로 찍어보는 디버그 도구. */

import { ALLY_BASE_X, ENEMY_BASE_X, STEP_SEC } from '../src/game/balance';
import { canSummon, step, trySummon } from '../src/game/combat';
import { UNITS } from '../src/game/content';
import type { World } from '../src/game/types';
import { createWorld } from '../src/game/world';

const stageId = process.argv[2] ?? 's1';
const threatMul = Number(process.argv[3] ?? 1);

const w = createWorld(stageId, threatMul);

function pct(x: number): number {
  return ((x - ALLY_BASE_X) / (ENEMY_BASE_X - ALLY_BASE_X)) * 100;
}

function playerTurn(w: World): void {
  for (const u of [...UNITS].sort((a, b) => b.cost - a.cost)) {
    if (u.cost < 50 && w.food < 60 && w.foodMax - w.food > 30) continue;
    if (canSummon(w, u.id)) trySummon(w, u.id);
  }
}

let allyDeaths = 0;
let prevAlly = 0;

console.log(`\n=== ${stageId} 추적 (압박 배율 ${threatMul}) ===\n`);
console.log('   초  아군수 적수  전선   아군HP합  적HP합  웨이브 대기  아군기지  적기지');
console.log('  ' + '-'.repeat(78));

for (let i = 0; i < 60 * 180 && w.phase === 'playing'; i++) {
  if (i % 15 === 0) playerTurn(w);
  step(w, STEP_SEC);

  const allyUnits = w.entities.filter((e) => e.team === 'ally' && e.kind === 'unit');
  if (allyUnits.length < prevAlly) allyDeaths += prevAlly - allyUnits.length;
  prevAlly = allyUnits.length;

  if (i % 600 === 0) {
    const enemyUnits = w.entities.filter((e) => e.team === 'enemy' && e.kind === 'unit');
    const front = allyUnits.length ? Math.max(...allyUnits.map((e) => e.x)) : ALLY_BASE_X;
    const allyHp = allyUnits.reduce((s, e) => s + e.hp, 0);
    const enemyHp = enemyUnits.reduce((s, e) => s + e.hp, 0);
    const ab = w.entities.find((e) => e.id === w.allyBaseId)!;
    const eb = w.entities.find((e) => e.id === w.enemyBaseId)!;
    console.log(
      `  ${String(Math.round(w.time)).padStart(3)}  ` +
        `${String(allyUnits.length).padStart(5)} ${String(enemyUnits.length).padStart(4)}  ` +
        `${pct(front).toFixed(0).padStart(4)}%  ` +
        `${Math.round(allyHp).toString().padStart(7)}  ` +
        `${Math.round(enemyHp).toString().padStart(6)}  ` +
        `${(w.waveNo + (w.wavesDone ? ' (끝)' : '')).toString().padStart(5)}  ` +
        `${String(w.pending.length).padStart(4)}  ` +
        `${((ab.hp / ab.maxHp) * 100).toFixed(0).padStart(7)}%  ` +
        `${((eb.hp / eb.maxHp) * 100).toFixed(0).padStart(5)}%`,
    );
  }
}

console.log(`\n  결과: ${w.phase} / 아군 유닛 사망 ${allyDeaths}기 / 적 처치 ${w.kills}기\n`);
