/**
 * 인생 키우기 - 한 판을 끝까지 돌려 본다.
 *
 * 화면을 손으로 눌러 보려면 태어나는 것부터 매번 다시 해야 한다. 여기서는
 * 아무 행동이나 골라 가며 끝까지 밀어 보고, 글이 이어지는지와 죽는 조건이
 * 걸리는지를 본다.
 *
 *   npx tsx tools/lifesim.ts          # 한 판 자세히
 *   LIFESIM_RUNS=300 npx tsx tools/lifesim.ts   # 여러 판 통계만
 */
import { CHAPTERS, HOMES } from '../src/life/content';
import { actionsOf, answer, born, chapterOf, doAction, homeDef, trackName } from '../src/life/engine';
import type { Life } from '../src/life/types';

const one = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function play(cards: string[] = []): Life {
  let l = born(cards);
  let guard = 0;
  while (!l.dead && guard++ < 500) {
    if (l.pending) {
      l = answer(l, one(l.pending.choices ?? []));
      continue;
    }
    const acts = actionsOf(l);
    if (acts.length === 0) break;
    l = doAction(l, one(acts));
  }
  return l;
}

const runs = Number(process.env.LIFESIM_RUNS ?? 1);

if (runs === 1) {
  const l = play();
  for (const ln of l.lines) console.log(`  ${ln.tone.padEnd(4)} ${ln.text}`);
  console.log('\n  ---');
  console.log(`  ${l.dead?.age}세 · ${l.dead?.name}`);
  console.log(`  ${l.dead?.line}`);
  console.log(`  집안 ${homeDef(l.home).name} · 갈래 ${trackName(l.track)}`);
  console.log(`  머리 ${l.stats.head} 체력 ${l.stats.body} 멘탈 ${l.stats.mind} 매력 ${l.stats.charm} · ${l.money}원`);
  console.log(`  기질 거침 ${l.rough} 요령 ${l.slick} · 만난 사람 ${l.met.join(', ') || '없음'}`);
} else {
  const home: Record<string, number> = {};
  const track: Record<string, number> = {};
  const end: Record<string, number> = {};
  let ageSum = 0;
  for (let i = 0; i < runs; i += 1) {
    const l = play();
    home[homeDef(l.home).name] = (home[homeDef(l.home).name] ?? 0) + 1;
    const t = trackName(l.track) || '(중도)';
    track[t] = (track[t] ?? 0) + 1;
    end[l.dead?.name ?? '?'] = (end[l.dead?.name ?? '?'] ?? 0) + 1;
    ageSum += l.dead?.age ?? 0;
  }
  const show = (title: string, m: Record<string, number>) => {
    console.log(`\n  ${title}`);
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`    ${k.padEnd(16)} ${String(v).padStart(4)}  ${((v / runs) * 100).toFixed(1)}%`));
  };
  console.log(`  ${runs}판 · 평균 ${(ageSum / runs).toFixed(1)}세에 끝남`);
  show('집안', home);
  show('갈래', track);
  show('끝난 방식', end);
  console.log(`\n  챕터 ${CHAPTERS.length}개 · 집안 ${HOMES.length}종`);
}
