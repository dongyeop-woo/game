/**
 * 그리드 랜덤 디펜스 밸런스 시뮬레이터 (개발 도구).
 *
 *   npm run defsim          # 전 스테이지
 *   npm run defsim -- s3    # s3 만
 *
 * "적당히 잘 하는 플레이어"를 흉내낸다 - 골드가 되면 뽑고, 합칠 수 있으면
 * 바로 합친다. 화면 없이 끝까지 돌려 승률과 어디서 무너지는지를 본다.
 */

import {
  DEF_STAGES,
  EARLY_HP_RAMP,
  STEP_SEC,
  boardDps,
  combinableTiers,
  combineAll,
  createDefWorld,
  defStage,
  freeSlots,
  lifeRatio,
  SLOTS,
  SHOP_TIERS,
  shopPrice,
  summon,
  WAVE_REWARD,
  WAVE_REWARD_PER,
  UNIT_PRICE,
  offerPrice,
  buyAndPlace,
  takeGold,
  unitAtSlot,
  nextRollCost,
  rerollOffer,
  sellUnit,
  stepDef,
  type DefWorld,
} from '../src/game/defense';
import { dps, unitDef } from '../src/game/roster';

const MAX_SECONDS = Number(process.env.DEFSIM_MAX ?? 900);

/** DEFSIM_RAMP='[0.25,0.4,0.55,0.75]' - 초반 체력 배율표를 코드 수정 없이 바꿔 본다 */
if (process.env.DEFSIM_RAMP) {
  EARLY_HP_RAMP.splice(0, EARLY_HP_RAMP.length, ...(JSON.parse(process.env.DEFSIM_RAMP) as number[]));
}

/** DEFSIM_STAGES='{"s1":{"power":0.9}}' - 스테이지 값을 코드 수정 없이 바꿔 본다 */
if (process.env.DEFSIM_STAGES) {
  const patch = JSON.parse(process.env.DEFSIM_STAGES) as Record<string, Partial<{ power: number; countBase: number; countPer: number }>>;
  for (const st of DEF_STAGES) Object.assign(st, patch[st.id] ?? {});
}

/** DEFSIM_NOREROLL=1 - 다시 굴리기 버튼을 아예 안 쓰는 사람의 바닥값 */
const NO_REROLL = process.env.DEFSIM_NOREROLL === '1';

/**
 * DEFSIM_SHOPGREEDY=1 - 상점에서 **살 수 있으면 바로** 가장 높은 등급을 사는 사람.
 *
 * 기본 흉내는 '한 웨이브 수입으로 살 만한 등급까지만' 사서 점잖다. 실제로
 * 손으로 해 보면 전설 값이 모이는 순간 누른다 - 그 사람이 느끼는 난이도를
 * 재려면 이 흉내가 따로 있어야 한다.
 */
const SHOP_GREEDY = process.env.DEFSIM_SHOPGREEDY === '1';

/** 한 판의 경제 기록 - DEFSIM_ECON=1 일 때 표로 찍는다 */
interface Econ {
  waveReward: number;
  bounty: number;
  goldCard: number;
  sell: number;
  shop: Record<string, number>;
  /** 그 등급을 처음 판에 가진 웨이브 (0 = 끝까지 못 가짐) */
  first: Record<string, number>;
  /** 10 웨이브 구간별 동시에 살아 있던 적의 최대 수 (성능 확인용) */
  peakAlive: number[];
}
let econ: Econ = newEcon();
function newEcon(): Econ {
  return { waveReward: 0, bounty: 0, goldCard: 0, sell: 0, shop: {}, first: {}, peakAlive: [0, 0, 0, 0, 0] };
}

/**
 * 플레이어 판단 - 0.4초에 한 번.
 *
 * 경제를 '웨이브마다 카드 석 장을 사서 배치'로 바꾼 뒤로 이 함수가 아무것도
 * 안 사고 있었다(예전엔 유닛이 자동으로 들어왔다). 그래서 전 스테이지가
 * 0% 로 나왔다 - 게임이 아니라 시뮬이 고장 나 있던 것이다.
 *
 * 흉내내는 사람: 살 수 있으면 다 사고, 합칠 수 있으면 바로 합친다.
 */
function playerTurn(w: DefWorld) {
  const b = w.boards[0];
  combineAll(w);

  // 이번 웨이브 제안을 살 수 있는 만큼 산다
  const o = w.offer;
  if (o) {
    for (let i = 0; i < o.slots.length; i += 1) {
      if (o.bought[i]) continue;
      const slot = o.slots[i];
      if (slot.kind === 'gold') {
        econ.goldCard += takeGold(w, i);
        continue;
      }
      // 못 사는 카드는 건너뛴다(break 가 아니다) - 등급 카드는 값이 제각각이라
      // 비싼 게 앞에 끼면 뒤의 싼 카드까지 못 사게 된다
      if (b.gold < offerPrice(slot)) continue;
      // 빈 칸을 찾아 거기에 놓는다 - 짚은 칸이 차 있으면 안 사진다
      const free = SLOTS.findIndex((_, k) => !unitAtSlot(b, k));
      if (free < 0) break;
      buyAndPlace(w, i, SLOTS[free].x, SLOTS[free].y);
    }
  }

  /*
    **위 등급은 상점에서 산다.**

    카드는 아무리 굴려도 일반만 나온다. 골드가 한 웨이브 수입만큼 쌓였으면
    그 돈으로 살 수 있는 가장 높은 등급을 상점에서 집는다 - 일반을 여러 마리
    사는 것보다 위 등급 하나가 칸을 덜 먹기 때문이다. 열여섯 칸이 진짜 병목이다.

    DEFSIM_NOSHOP=1 로 끄면 상점을 모르는 사람의 바닥값이 나온다.
  */
  if (process.env.DEFSIM_NOSHOP !== '1') {
    const income = WAVE_REWARD + WAVE_REWARD_PER * Math.max(1, w.wave);
    for (let guard = 0; guard < 20; guard += 1) {
      if (freeSlots(b) === 0) break;
      // 한 웨이브 수입으로 살 만한 등급까지만 - 그 아래는 카드가 더 싸다
      const tier = [...SHOP_TIERS]
        .reverse()
        .find(
          (t) =>
            t !== 'common' && (SHOP_GREEDY || shopPrice(t) <= income) && b.gold >= shopPrice(t),
        );
      if (!tier) break;
      if (!summon(w, tier)) break;
      econ.shop[tier] = (econ.shop[tier] ?? 0) + 1;
      combineAll(w);
    }
  }

  /*
    돈이 남으면 다시 굴린다.

    카드가 웨이브마다 석 장뿐이라 골드가 쌓이기만 하고 쓸 데가 없었다.
    남는 돈을 유닛으로 바꾸는 길이 있어야 판이 안 막힌다.
  */
  for (let guard = 0; guard < 30 && !NO_REROLL; guard += 1) {
    if (freeSlots(b) === 0) break;
    // 한 번 더 굴리고 석 장을 살 만큼은 남겨 둔다
    if (b.gold < nextRollCost(b) + UNIT_PRICE * 2) break;
    if (!rerollOffer(w)) break;
    const o2 = w.offer;
    if (!o2) break;
    for (let i = 0; i < o2.slots.length; i += 1) {
      if (o2.bought[i]) continue;
      const slot = o2.slots[i];
      if (slot.kind === 'gold') {
        econ.goldCard += takeGold(w, i);
        continue;
      }
      if (b.gold < offerPrice(slot)) continue;
      const free = SLOTS.findIndex((_, k) => !unitAtSlot(b, k));
      if (free < 0) break;
      buyAndPlace(w, i, SLOTS[free].x, SLOTS[free].y);
    }
    combineAll(w);
  }

  // 자리가 꽉 찼는데 합칠 것도 없으면 판이 멈춘다 - 가장 약한 유닛을 판다
  for (let guard = 0; guard < 40; guard += 1) {
    if (freeSlots(b) > 0) break;
    if (combinableTiers(b).length > 0) {
      combineAll(w);
      continue;
    }
    const weakest = b.units
      .slice()
      .sort((a, c) => dps(unitDef(a.defId), a.star) - dps(unitDef(c.defId), c.star))[0];
    if (!weakest || b.units.length <= 1) break;
    const g0 = b.gold;
    sellUnit(w, weakest.id);
    econ.sell += b.gold - g0;
  }
}

function run(stageId: string) {
  const w = createDefWorld(stageId);
  let steps = 0;
  let peakDps = 0;
  let firstLeakWave = 0;

  econ = newEcon();
  while (w.phase === 'playing' && w.time < MAX_SECONDS) {
    if (steps % 12 === 0) {
      playerTurn(w);
      for (const u of w.boards[0].units) {
        const t = unitDef(u.defId).tier;
        if (!econ.first[t]) econ.first[t] = Math.max(1, w.wave);
      }
    }
    const prevWave = w.wave;
    const ev = stepDef(w, STEP_SEC);
    // ev.gold 에는 웨이브 보상과 현상금이 섞여 온다 - 보상액은 정해져 있으니 뺀다
    const pay = ev.waveStarted && prevWave > 0 ? WAVE_REWARD + WAVE_REWARD_PER * prevWave : 0;
    econ.waveReward += pay;
    econ.bounty += ev.gold - pay;
    const bucket = Math.min(4, Math.floor(Math.max(0, w.wave - 1) / 10));
    econ.peakAlive[bucket] = Math.max(econ.peakAlive[bucket], w.enemies.length);
    if (ev.leaked && firstLeakWave === 0) firstLeakWave = w.wave;
    peakDps = Math.max(peakDps, boardDps(w.boards[0]));
    steps += 1;
  }

  const b = w.boards[0];
  const top = b.units
    .slice()
    .sort((a, c) => dps(unitDef(c.defId), c.star) - dps(unitDef(a.defId), a.star))[0];
  const best = top ? { name: `${unitDef(top.defId).name} ${'★'.repeat(top.star)}` } : null;

  return {
    result: w.phase,
    wave: w.wave,
    life: Math.max(0, w.life),
    lifePct: lifeRatio(w) * 100,
    dps: peakDps,
    rolls: b.rolls,
    best: best ? best.name : '-',
    found: w.discovered.length,
    firstLeakWave,
    time: w.time,
    econ,
  };
}

function main() {
  const arg = process.argv[2];
  const ids = arg && arg !== 'all' ? [arg] : DEF_STAGES.map((s) => s.id);
  const runs = Number(process.env.DEFSIM_RUNS ?? 7);

  /*
    DEFSIM_JSON=1 - 스테이지마다 한 줄씩 JSON 으로 낸다.

    설정을 여러 벌 나란히 돌려 비교할 때(밸런스 스윕) 표를 눈으로 긁는 대신
    기계로 모으려고 둔다.
  */
  if (process.env.DEFSIM_JSON === '1') {
    for (const id of ids) {
      const rs = Array.from({ length: runs }, () => run(id));
      const avg = (f: (r: (typeof rs)[0]) => number) => rs.reduce((t, r) => t + f(r), 0) / rs.length;
      const first = (t: string) => {
        const got = rs.filter((r) => r.econ.first[t]);
        return {
          wave: got.length ? got.reduce((a, r) => a + r.econ.first[t], 0) / got.length : null,
          pct: (got.length / rs.length) * 100,
        };
      };
      // 어디서 죽었나 - 평균만 보면 '끝까지 가는 판'과 '초반에 몰살하는 판'이 섞여 안 보인다
      const bucket = (r: (typeof rs)[0]) =>
        r.result === 'win' ? 'win'
          : r.wave <= 5 ? '≤5'
            : r.wave <= 10 ? '6-10'
              : r.wave <= 20 ? '11-20'
                : r.wave <= 35 ? '21-35'
                  : '36-49';
      const deaths: Record<string, number> = {};
      for (const r of rs) deaths[bucket(r)] = (deaths[bucket(r)] ?? 0) + 100 / runs;
      console.log(
        JSON.stringify({
          id,
          deaths,
          wins: (rs.filter((r) => r.result === 'win').length / runs) * 100,
          wave: avg((r) => r.wave),
          gate: avg((r) => r.lifePct),
          dps: avg((r) => r.dps),
          epic: first('epic'),
          legend: first('legend'),
          mythic: first('mythic'),
          shopEpic: avg((r) => r.econ.shop.epic ?? 0),
          shopLegend: avg((r) => r.econ.shop.legend ?? 0),
          waveReward: avg((r) => r.econ.waveReward),
          bounty: avg((r) => r.econ.bounty),
          goldCard: avg((r) => r.econ.goldCard),
          peakAlive: [0, 1, 2, 3, 4].map((k) => Math.max(...rs.map((r) => r.econ.peakAlive[k]))),
          peakAliveAvg: [0, 1, 2, 3, 4].map((k) => rs.reduce((t, r) => t + r.econ.peakAlive[k], 0) / rs.length),
        }),
      );
    }
    return;
  }

  console.log(`\n=== 디펜스 시뮬레이션 (${runs}회 시행) ===\n`);
  console.log('  스테이지        승률     웨이브   남은정문   최고DPS  뽑기  최고유닛');
  console.log('  ' + '-'.repeat(74));

  const econRuns = new Map<string, Econ[]>();
  for (const id of ids) {
    const rs = Array.from({ length: runs }, () => run(id));
    econRuns.set(id, rs.map((r) => r.econ));
    const wins = rs.filter((r) => r.result === 'win').length;
    const avg = (f: (r: (typeof rs)[0]) => number) => rs.reduce((s, r) => s + f(r), 0) / rs.length;
    const bar = '█'.repeat(Math.round((wins / runs) * 10)).padEnd(10, '|');
    const stage = defStage(id);

    console.log(
      `  ${stage.name.padEnd(12)} ${bar} ${wins}/${runs}  ` +
        `${avg((r) => r.wave).toFixed(1).padStart(5)}/${stage.waves}  ` +
        `${avg((r) => r.lifePct).toFixed(0).padStart(7)}%  ` +
        `${avg((r) => r.dps).toFixed(0).padStart(8)}  ` +
        `${avg((r) => r.rolls).toFixed(0).padStart(4)}  ` +
        `${rs[0].best}`,
    );
  }

  if (process.env.DEFSIM_ECON === '1') {
    console.log('\n  경제 (판 평균)       웨이브보상   현상금  골드카드    판매  |  첫 영웅  첫 전설  첫 신화  |  상점 희귀/영웅/전설');
    console.log('  ' + '-'.repeat(108));
    for (const id of ids) {
      const rs = econRuns.get(id)!;
      const avg = (f: (e: Econ) => number) => rs.reduce((t, e) => t + f(e), 0) / rs.length;
      // 첫 등급 웨이브는 '가진 판'끼리만 평균 - 못 가진 판을 0 으로 섞으면 빨라 보인다
      const firstAvg = (t: string) => {
        const got = rs.filter((e) => e.first[t]);
        if (got.length === 0) return '    -   ';
        const v = got.reduce((a, e) => a + e.first[t], 0) / got.length;
        return `${v.toFixed(1).padStart(5)}(${String(Math.round((got.length / rs.length) * 100)).padStart(3)}%)`.slice(0, 11);
      };
      const n = (v: number) => Math.round(v).toString().padStart(8);
      console.log(
        `  ${defStage(id).name.padEnd(12)}  ${n(avg((e) => e.waveReward))}  ${n(avg((e) => e.bounty))}  ${n(avg((e) => e.goldCard))}  ${n(avg((e) => e.sell))}  |  ` +
          `${firstAvg('epic')} ${firstAvg('legend')} ${firstAvg('mythic')}  |  ` +
          `${avg((e) => e.shop.rare ?? 0).toFixed(1)}/${avg((e) => e.shop.epic ?? 0).toFixed(1)}/${avg((e) => e.shop.legend ?? 0).toFixed(1)}`,
      );
    }
    console.log('  첫 등급 = 판에 처음 올라온 웨이브 (괄호: 그 등급을 가져 본 판의 비율)');
  }

  console.log('\n  정문이 뚫리면 패배. 웨이브를 다 막으면 승리.');
  console.log('  뽑기 -> 조합만으로 DPS 가 웨이브 체력 상승을 따라가야 한다.\n');
}

main();
