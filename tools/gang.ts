/** 동시에 교전 중인 아군 수를 재서 '다구리'가 실제로 되는지 확인한다. */
import { STEP_SEC } from '../src/game/balance';
import { canSummon, step, trySummon } from '../src/game/combat';
import { UNITS } from '../src/game/content';
import { createWorld, nearestEnemy } from '../src/game/world';


const w = createWorld('s2');
let samples = 0;
let engagedSum = 0;
let maxEngaged = 0;

for (let i = 0; i < 60 * 150 && w.phase === 'playing'; i++) {
  if (i % 15 === 0) {
    for (const u of [...UNITS].sort((a, b) => b.cost - a.cost)) {
      if (canSummon(w, u.id)) trySummon(w, u.id);
    }
  }
  step(w, STEP_SEC);

  if (i % 30 === 0) {
    // 지금 사거리 안에 적을 두고 때리는 중인 아군 유닛 수
    let engaged = 0;
    for (const e of w.entities) {
      if (e.team !== 'ally' || e.kind !== 'unit') continue;
      const t = nearestEnemy(w, e);
      if (t && Math.abs(t.x - e.x) <= e.range) engaged++;
    }
    if (engaged > 0) {
      engagedSum += engaged;
      maxEngaged = Math.max(maxEngaged, engaged);
      samples++;
    }
  }
}
console.log('평균 동시 교전 아군:', (engagedSum / Math.max(1, samples)).toFixed(1), '기');
console.log('최대 동시 교전 아군:', maxEngaged, '기');
