/**
 * 유튜버 키우기 - 한 판을 끝까지 돌려 본다.
 *
 * 화면을 손으로 눌러 보려면 채널을 팔 때부터 매번 다시 해야 한다. 여기서는
 * 아무거나 골라 가며 끝까지 밀어 보고, 글이 이어지는지와 채널이 죽는 조건이
 * 걸리는지를 본다.
 *
 *   npx tsx tools/tubesim.ts                     # 한 판 자세히
 *   TUBESIM_RUNS=300 npx tsx tools/tubesim.ts    # 여러 판 통계만
 *   TUBESIM_CADENCE=daily npx tsx tools/tubesim.ts  # 주기를 고정하고
 */
import { CONCEPTS, STAGES } from '../src/tube/content';
import {
  CADENCES,
  actionsOf,
  answer,
  conceptOf,
  doAction,
  fmtSubs,
  setCadence,
  start,
} from '../src/tube/engine';
import type { Run } from '../src/tube/types';

const one = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function play(cadence?: string): Run {
  let r = start([]);
  if (cadence) r = setCadence(r, cadence);
  let guard = 0;
  while (!r.dead && guard++ < 600) {
    if (r.pending) {
      r = answer(r, one(r.pending.choices ?? []));
      continue;
    }
    const acts = actionsOf(r);
    if (acts.length === 0) break;
    r = doAction(r, one(acts));
  }
  return r;
}

const runs = Number(process.env.TUBESIM_RUNS ?? 1);
const fixed = process.env.TUBESIM_CADENCE;

if (runs === 1) {
  const r = play(fixed);
  for (const ln of r.lines) console.log(`  ${ln.tone.padEnd(4)} ${ln.text}`);
  console.log('\n  ---');
  console.log(`  ${r.dead?.name} · 구독자 ${fmtSubs(r.subs)}`);
  console.log(`  ${r.dead?.line}`);
  console.log(`  컨셉 ${conceptOf(r.concept).name} · 주기 ${r.cadence} · 잔고 ${r.money.toLocaleString()}원`);
  console.log(`  기획 ${r.stats.plan} 편집 ${r.stats.edit} 체력 ${r.stats.body} 멘탈 ${r.stats.mind}`);
  console.log(`  숨은 축 자극 ${r.spice} 대충 ${r.lazy} · 만난 사람 ${r.met.join(', ') || '없음'}`);
} else {
  const show = (title: string, m: Record<string, number>) => {
    console.log(`\n  ${title}`);
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`    ${k.padEnd(18)} ${String(v).padStart(4)}  ${((v / runs) * 100).toFixed(1)}%`));
  };
  const end: Record<string, number> = {};
  const byCad: Record<string, { n: number; subs: number }> = {};
  let subSum = 0;
  for (let i = 0; i < runs; i += 1) {
    const cad = fixed ?? one(CADENCES).id;
    const r = play(cad);
    end[r.dead?.name ?? '?'] = (end[r.dead?.name ?? '?'] ?? 0) + 1;
    byCad[cad] = byCad[cad] ?? { n: 0, subs: 0 };
    byCad[cad].n += 1;
    byCad[cad].subs += r.subs;
    subSum += r.subs;
  }
  console.log(`  ${runs}판 · 평균 구독자 ${fmtSubs(Math.round(subSum / runs))}`);
  show('끝난 방식', end);
  console.log('\n  주기별 평균 구독자');
  Object.entries(byCad).forEach(([k, v]) =>
    console.log(`    ${k.padEnd(18)} ${fmtSubs(Math.round(v.subs / v.n)).padStart(8)}  (${v.n}판)`),
  );
  console.log(`\n  구간 ${STAGES.length}개 · 컨셉 ${CONCEPTS.length}종`);
}
