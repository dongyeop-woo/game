/**
 * 유튜버 키우기 - 한 판을 끝까지 돌려 본다.
 *
 * 화면을 손으로 눌러 보려면 채널을 팔 때부터 매번 다시 해야 한다. 여기서는
 * 아무거나 골라 가며 끝까지 밀어 보고, 글이 이어지는지와 채널이 죽는 조건이
 * 걸리는지를 본다.
 *
 *   npx tsx tools/tubesim.ts                     # 한 판 자세히
 *   TUBESIM_RUNS=300 npx tsx tools/tubesim.ts    # 여러 판 통계만
 */
import { CONCEPTS, STAGES } from '../src/tube/content';
import { answer, applyYpp, buy, cadenceOf, conceptOf, dismissNotice, dismissReport, fmtSubs, fmtWon, play, reroll, shopOf, start } from '../src/tube/engine';
import type { Run } from '../src/tube/types';

const one = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function playRun(): Run {
  let r = start([]);
  let guard = 0;
  while (!r.dead && guard++ < 900) {
    if (r.pending) {
      r = answer(r, one(r.pending.choices ?? []));
      continue;
    }
    if (r.report) r = dismissReport(r);
    while (r.notices.length) r = dismissNotice(r);
    if (r.ypp === 'eligible') r = applyYpp(r);
    // 열에 한 번은 새로고침을 눌러 본다. 손이 비면 안 되니 그다음 한 장을 쓴다
    if (r.rerolls > 0 && Math.random() < 0.1) r = reroll(r);
    // 돈이 있으면 가끔 뭘 산다
    if (Math.random() < 0.15) {
      const can = shopOf(r).filter((i) => r.money >= i.price && !(i.once && r.gear.includes(i.id)));
      if (can.length) r = buy(r, one(can).id);
    }
    if (r.hand.length === 0) break;
    r = play(r, one(r.hand));
  }
  return r;
}

const runs = Number(process.env.TUBESIM_RUNS ?? 1);

if (runs === 1) {
  const r = playRun();
  for (const ln of r.lines) console.log(`  ${ln.tone.padEnd(4)} ${ln.text}`);
  console.log('\n  ---');
  console.log(`  ${r.dead?.name} · 구독자 ${fmtSubs(r.subs)} · ${r.age}일째`);
  console.log(`  ${r.dead?.line}`);
  console.log(`  "${r.name}" · 컨셉 ${conceptOf(r.concept).name} · 주기 ${cadenceOf(r).name} · 잔고 ${fmtWon(r.money)} · 수익창출 ${r.ypp}`);
  console.log(`  기획 ${r.stats.plan} 편집 ${r.stats.edit} 체력 ${r.stats.body} 멘탈 ${r.stats.mind}`);
  console.log(`  숨은 축 자극 ${r.spice} 대충 ${r.lazy} · 산 것 ${r.gear.join(', ') || '없음'} · 만난 사람 ${r.met.join(', ') || '없음'}`);
} else {
  const show = (title: string, m: Record<string, number>) => {
    console.log(`\n  ${title}`);
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`    ${k.padEnd(18)} ${String(v).padStart(4)}  ${((v / runs) * 100).toFixed(1)}%`));
  };
  const end: Record<string, number> = {};
  const stage: Record<string, number> = {};
  const byCad: Record<string, { n: number; subs: number }> = {};
  let subSum = 0;
  let ageSum = 0;
  let paid = 0;
  let bought = 0;
  for (let i = 0; i < runs; i += 1) {
    const r = playRun();
    const cad = cadenceOf(r).name;
    end[r.dead?.name ?? '?'] = (end[r.dead?.name ?? '?'] ?? 0) + 1;
    const st = STAGES[Math.min(r.stage, STAGES.length - 1)].name;
    stage[st] = (stage[st] ?? 0) + 1;
    byCad[cad] = byCad[cad] ?? { n: 0, subs: 0 };
    byCad[cad].n += 1;
    byCad[cad].subs += r.subs;
    subSum += r.subs;
    ageSum += r.age;
    if (r.payouts > 0) paid += 1;
    bought += r.used.__bought ?? 0;
  }
  console.log(`  ${runs}판 · 평균 구독자 ${fmtSubs(Math.round(subSum / runs))} · 평균 ${(ageSum / runs).toFixed(1)}일 · 정산 받은 판 ${((paid / runs) * 100).toFixed(0)}% · 판당 구매 ${(bought / runs).toFixed(1)}`);
  show('끝난 방식', end);
  show('끝난 구간', stage);
  console.log('\n  끝났을 때 주기별 평균 구독자');
  Object.entries(byCad).forEach(([k, v]) =>
    console.log(`    ${k.padEnd(18)} ${fmtSubs(Math.round(v.subs / v.n)).padStart(8)}  (${v.n}판)`),
  );
  console.log(`\n  구간 ${STAGES.length}개 · 컨셉 ${CONCEPTS.length}종`);
}
