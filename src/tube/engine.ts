import { CONCEPTS, EVENTS, QUESTS, STAGES, VIBES } from './content';
import type { Action, Choice, Concept, Dealt, Death, Delta, Ev, Line, Quest, Run, Stage } from './types';

/**
 * 유튜버 키우기 - 굴러가는 부분.
 *
 * 한 판이 곧 채널 하나다. 하루에 틱이 셋이고, 손에 든 카드 넉 장 중 하나를
 * 쓰면 틱이 하나 줄고, 틱이 다 떨어지면 하루가 넘어간다. 닷새마다 돈이
 * 들어오고, 구간 끝에서 다음 구간으로 올라간다.
 *
 * 상태는 **한 덩이**로 들고 다닌다 (`Run`). 화면은 읽기만 하고, 바꾸는 건
 * 여기 있는 함수뿐이다.
 */

const CAP = 99;
const clamp = (v: number) => Math.max(0, Math.min(CAP, v));

/** 하루에 쓰는 행동 수 */
export const TICKS = 3;
/** 손에 드는 카드 수 */
export const HAND = 4;
/** 한 채널에서 쓸 수 있는 새로고침 */
export const REROLLS = 8;
/** 며칠마다 애드센스가 들어오는가 */
export const PAYDAY = 5;
/** 알고리즘이 며칠마다 바뀌는가 */
export const WEEK = 7;
/**
 * 이번 주 결에 맞는 영상의 유입 배수.
 *
 * 임시값이다. 밸런스는 만드는 사람이 정한다.
 */
export const TREND_BOOST = 1.6;

function pick<T>(list: T[], weight: (t: T) => number): T {
  const total = list.reduce((s, t) => s + weight(t), 0);
  let r = Math.random() * total;
  for (const t of list) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return list[list.length - 1];
}

const one = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** 받침이 있으면 앞, 없으면 뒤. "사이버렉카로" 같은 게 나오면 글이 싸구려가 된다 */
export function josa(word: string, withJong: string, without: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return without;
  return (last - 0xac00) % 28 > 0 ? withJong : without;
}

/** 구독자는 자릿수가 커서 그대로 찍으면 안 읽힌다 */
export function fmtSubs(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}만`;
  return n.toLocaleString();
}

// ------------------------------------------------------------ 업로드 주기

/**
 * 업로드 주기.
 *
 * **이 게임의 중심 맞바꿈이다.** 물량으로 알고리즘을 두드릴지 한 편에 정성을
 * 쏟을지. 실제로 채널을 하는 사람이 매주 다시 하는 고민이라 카드 위에 둔다.
 */
export interface Cadence {
  id: string;
  name: string;
  hint: string;
  /** 하루에 올라가는 영상 수. 1 보다 작으면 며칠에 한 편이다 */
  videos: number;
  /** 한 편의 완성도 배수 */
  quality: number;
  /** 체력이 깎이는 배수 */
  toll: number;
}

export const CADENCES: Cadence[] = [
  { id: 'week1', name: '주 1편', hint: '한 편에 다 건다', videos: 0.55, quality: 1.45, toll: 0.55 },
  { id: 'week3', name: '주 3편', hint: '무난한 속도', videos: 1, quality: 1, toll: 1 },
  { id: 'daily', name: '1일 1영상', hint: '알고리즘을 두드린다', videos: 1.9, quality: 0.68, toll: 1.9 },
];

export const cadenceOf = (r: Run) => CADENCES.find((c) => c.id === r.cadence) ?? CADENCES[1];

export const vibeOf = (id: string) => VIBES.find((v) => v.id === id) ?? VIBES[0];

// ------------------------------------------------------------------ 퀘스트

/** 지금 뜬 퀘스트. 안 깬 것 중 첫 번째다 */
export function questOf(r: Run): Quest | null {
  return QUESTS.find((q) => !r.questDone.includes(q.id)) ?? null;
}

/**
 * 퀘스트를 깼는지 본다. 상태가 바뀔 때마다 부른다.
 *
 * 한 번에 여러 개가 깨질 수 있다 - 구독자 이정표는 한 영상에 둘을 넘기도
 * 한다. 그래서 돌면서 본다.
 */
function checkQuests(r: Run) {
  for (;;) {
    const q = questOf(r);
    if (!q || q.count(r) < q.need) return;
    r.questDone.push(q.id);
    r.money += q.reward;
    say(r, `퀘스트 완료 - ${q.text.replace(/<|>/g, '')} (+${q.reward.toLocaleString()}원)`, 'good');
  }
}

/** 이번 주 알고리즘을 새로 뽑는다. 지난주 것과는 다르게 */
function rollTrend(r: Run) {
  const pool = VIBES.filter((v) => v.id !== r.trend);
  r.trend = one(pool).id;
  r.trendKnown = false;
}

// ------------------------------------------------------------------ 조회

export function conceptOf(id: string): Concept {
  return CONCEPTS.find((c) => c.id === id) ?? CONCEPTS[0];
}

export function stageOf(r: Run): Stage {
  return STAGES[Math.min(r.stage, STAGES.length - 1)];
}

/**
 * 정산으로 들어올 돈.
 *
 * **기대보다 적게 나와야 한다.** 그게 이 직업의 분노 담당이다. 구독자
 * 만 명이면 한 달에 얼마냐고 다들 묻는데, 숫자를 듣고 다들 놀란다.
 */
export function payout(r: Run): number {
  const rpm = 1.1 * (r.yellow > 0 ? 0.25 : 1);
  return Math.floor(r.subs * rpm);
}

function say(r: Run, text: string, tone: Line['tone']) {
  r.lines.push({ id: r.nextLineId++, text, tone });
  r.lastLine = text;
  if (r.lines.length > 60) r.lines.splice(0, r.lines.length - 60);
}

/** 카드 한 장에 붙는 체력 값. 주기가 빠를수록 더 깎인다 */
export function bodyCost(r: Run, a: Action): number {
  const b = a.d.body ?? 0;
  if (b >= 0) return b;
  return Math.round(b * cadenceOf(r).toll);
}

function apply(r: Run, d: Delta) {
  r.stats.plan = clamp(r.stats.plan + (d.plan ?? 0));
  r.stats.edit = clamp(r.stats.edit + (d.edit ?? 0));
  r.stats.body = clamp(r.stats.body + (d.body ?? 0));
  r.stats.mind = clamp(r.stats.mind + (d.mind ?? 0));
  r.money += d.money ?? 0;
  r.subs = Math.max(0, r.subs + (d.subs ?? 0));
  r.spice += d.spice ?? 0;
  r.lazy += d.lazy ?? 0;
}

// ------------------------------------------------------------------ 카드

/**
 * 영상 하나가 데려오는 사람 수.
 *
 * **계산해서 붙인다.** 고정값으로 주면 스탯을 올릴 이유가 없어진다.
 * 기획이 노출을 만들고 편집이 이탈을 막는다. 자극은 당장 잘 먹히지만
 * 그만큼 다른 데서 값을 치른다.
 *
 * 카드를 **뽑을 때** 굴린다. 그래야 카드에 숫자가 박히고 비교가 된다.
 */
function reachOf(r: Run, a: Action): number {
  if (!a.reach) return 0;
  const c = cadenceOf(r);
  const skill = (1 + r.stats.plan / 26) * (1 + r.stats.edit / 34);
  const spice = 1 + Math.max(0, r.spice) * 0.045;
  const luck = 0.55 + Math.random() * 1.1;
  // 이번 주 알고리즘이 미는 결이면 뛴다. 숫자로는 안 알려 주니 이게 단서다
  const trend = a.vibe && a.vibe === r.trend ? TREND_BOOST : 1;
  return Math.round(stageOf(r).base * a.reach * c.videos * c.quality * skill * spice * luck * trend);
}

function dealOne(r: Run): Dealt {
  const pool = stageOf(r).actions.filter((a) => !a.when || a.when(r));
  const action = one(pool);
  return { key: r.nextKey++, action, gain: reachOf(r, action) };
}

/** 손이 넉 장이 되게 채운다 */
function fill(r: Run) {
  while (r.hand.length < HAND) r.hand.push(dealOne(r));
}

/** 손을 통째로 다시 뽑는다. 횟수가 정해져 있다 */
export function reroll(r: Run): Run {
  if (r.dead || r.pending || r.rerolls <= 0) return r;
  r.rerolls -= 1;
  r.hand = [];
  fill(r);
  checkQuests(r);
  return r;
}

// ------------------------------------------------------------------ 시작

export function start(cards: string[] = [], questDone: string[] = []): Run {
  const lucky = cards.includes('luckystart');
  const concept = pick(CONCEPTS, (c) => c.weight * (lucky && c.rank >= 4 ? 3 : 1));

  const r: Run = {
    seed: Math.floor(Math.random() * 1e9),
    stage: 0,
    day: 1,
    stats: { plan: 10, edit: 10, body: 60, mind: 40 },
    subs: 0,
    money: 300,
    spice: 0,
    lazy: 0,
    concept: concept.id,
    cadence: 'week3',
    yellow: 0,
    warned: 0,
    ticks: TICKS,
    trend: '',
    trendKnown: false,
    hand: [],
    rerolls: REROLLS,
    nextKey: 1,
    lines: [],
    nextLineId: 1,
    pending: null,
    dead: null,
    met: [],
    seen: [],
    lastLine: '',
    cards,
    uploads: 0,
    used: {},
    payouts: 0,
    cadenceChanges: 0,
    questDone: [...questDone],
  };
  apply(r, concept.d);
  if (cards.includes('gear')) r.stats.edit = clamp(r.stats.edit + 12);
  if (cards.includes('savings')) r.money += 500;

  say(r, `${concept.name}${josa(concept.name, '으로', '로')} 채널을 팠다.`, 'sys');
  say(r, concept.line, 'ev');
  rollTrend(r);
  fill(r);
  return r;
}

// ------------------------------------------------------------------ 하루

function rollEvent(r: Run): Ev | null {
  if (Math.random() > 0.55) return null;
  const s = stageOf(r);
  const pool = EVENTS.filter(
    (e) => e.at.includes(s.id) && !(e.once && r.seen.includes(e.id)) && (!e.when || e.when(r)),
  );
  return pool.length ? pick(pool, (e) => e.weight) : null;
}

function checkDead(r: Run): Death | null {
  if (r.stats.body <= 0) {
    return { name: '번아웃', line: '카메라를 켜는 게 무서워진 지 오래였다.', subs: r.subs };
  }
  if (r.stats.mind <= 0) {
    return { name: '댓글창을 닫았다', line: '마지막 영상은 올리지 못했다.', subs: r.subs };
  }
  if (r.money <= -1500) {
    return { name: '장비를 팔았다', line: '카메라가 제일 비싸게 나갔다.', subs: r.subs };
  }
  return null;
}

export const KILLS: Record<string, Death> = {
  canceled: {
    name: '고소장이 왔다',
    line: '채널은 내려갔고 영상은 남의 채널에서 돌아다닌다.',
    subs: 0,
  },
  quit: { name: '조용히 접었다', line: '마지막 영상의 조회수는 백이 안 됐다.', subs: 0 },
};

/**
 * 선을 넘었는지 본다.
 *
 * 자극도는 화면에 숫자로 안 보인다. 그래서 **경고를 먼저 준다** - 아무 예고
 * 없이 고소가 오면 억울하기만 하고 다시 안 한다. 두 번 경고하고 세 번째에
 * 끝낸다.
 */
function checkLine(r: Run): boolean {
  const over = [40, 60, 80];
  const step = over.findIndex((v) => r.spice < v);
  const level = step < 0 ? over.length : step;
  if (level <= r.warned) return false;
  r.warned = level;
  if (level === 1) {
    say(r, '커뮤니티 가이드 경고가 왔다. 한 번은 봐준다고 한다.', 'bad');
    return false;
  }
  if (level === 2) {
    say(r, '내용증명이 왔다. 변호사 이름이 적혀 있다.', 'bad');
    apply(r, { mind: -6, money: -300 });
    return false;
  }
  r.dead = { ...KILLS.canceled, subs: r.subs };
  return true;
}

/** 카드 한 장을 쓴다. 틱이 하나 줄고, 다 떨어지면 하루가 넘어간다 */
export function play(r: Run, card: Dealt): Run {
  if (r.dead || r.pending) return r;
  const at = r.hand.findIndex((h) => h.key === card.key);
  if (at < 0) return r;

  const a = card.action;
  apply(r, { ...a.d, body: bodyCost(r, a) });
  r.used[a.id] = (r.used[a.id] ?? 0) + 1;
  if (a.reach) r.uploads += 1;

  let line = one(a.lines);
  if (line === r.lastLine && a.lines.length > 1) line = one(a.lines.filter((t) => t !== line));
  say(r, line, 'act');

  if (card.gain > 0) {
    r.subs += card.gain;
    say(r, `구독자 +${card.gain.toLocaleString()}`, 'good');
  }

  // 쇼츠를 보면 이번 주 알고리즘을 알아낸다. 결 이름이 아니라 피드에서 본 것을 말한다
  if (a.id === 'shorts' || a.id === 'shorts2') {
    r.trendKnown = true;
    say(r, vibeOf(r.trend).hint, 'ev');
  }

  // 쓴 카드는 빠지고 새 카드가 들어온다
  r.hand.splice(at, 1);
  fill(r);

  r.ticks -= 1;
  if (r.ticks <= 0) endDay(r);
  checkQuests(r);
  return r;
}

/**
 * 하루가 넘어간다.
 *
 * 죽음과 선 넘기를 먼저 보고, 날짜를 넘기고, 정산을 하고, 구간을 보고,
 * 마지막에 일이 하나 끼어든다. 일은 맨 뒤여야 한다 - 고르는 일이면
 * 여기서 멈추는데, 그 앞에서 날짜가 이미 넘어가 있어야 답한 뒤 다시
 * 넘길 일이 없다.
 */
function endDay(r: Run): Run {
  if (checkLine(r)) return r;
  const dead = checkDead(r);
  if (dead) {
    r.dead = dead;
    return r;
  }

  if (r.yellow > 0) r.yellow -= 1;
  r.day += 1;
  r.ticks = TICKS;

  // 주가 바뀌면 알고리즘도 바뀐다. 바뀐 건 알려 주되 뭘로 바뀌었는지는 안 알려 준다
  if ((r.day - 1) % WEEK === 0) {
    rollTrend(r);
    say(r, '새 주가 시작됐다. 피드 분위기가 어딘가 달라졌다.', 'sys');
  }

  // 정산일. 기대보다 적게 들어오는 게 이 직업의 분노 담당이다
  if ((r.day - 1) % PAYDAY === 0 && r.subs > 0) {
    const got = payout(r);
    r.money += got;
    r.payouts += 1;
    say(r, `애드센스 정산 ${got.toLocaleString()}원${r.yellow > 0 ? ' (노란 딱지 반영)' : ''}`, 'good');
  }

  const s = stageOf(r);
  if (r.subs >= s.goal) {
    say(r, `구독자 ${fmtSubs(s.goal)} 돌파. 다음 구간으로 간다.`, 'good');
    r.stage += 1;
    r.day = 1;
    if (r.stage >= STAGES.length) {
      r.dead = {
        name: `구독자 ${fmtSubs(r.subs)}`,
        line: '여기까지가 지금 만들어진 채널이다.',
        subs: r.subs,
      };
      return r;
    }
    say(r, `${stageOf(r).name} 시작.`, 'sys');
    r.hand = [];
    fill(r);
    return r;
  }
  if (r.day > s.days) {
    r.dead = { ...KILLS.quit, subs: r.subs };
    return r;
  }

  // 손을 새로 뽑는다. 어제 남긴 패는 오늘 안 남는다
  r.hand = [];
  fill(r);

  const ev = rollEvent(r);
  if (ev) {
    if (ev.choices) {
      r.pending = ev;
      return r;
    }
    say(r, ev.text, 'ev');
    if (ev.d) apply(r, ev.d);
    if (ev.meets && !r.met.includes(ev.meets)) r.met.push(ev.meets);
    if (ev.once) r.seen.push(ev.id);
  }
  return r;
}

/** 이벤트 선택지를 고른다. 날짜는 이미 넘어가 있으니 여기서는 안 넘긴다 */
export function answer(r: Run, choice: Choice): Run {
  const ev = r.pending;
  if (!ev) return r;
  r.pending = null;
  if (ev.once) r.seen.push(ev.id);
  say(r, ev.text, 'ev');
  apply(r, choice.d);
  say(r, choice.line, choice.kills ? 'bad' : 'ev');
  const met = choice.meets ?? ev.meets;
  if (met && !r.met.includes(met)) r.met.push(met);
  if (choice.kills) {
    r.dead = { ...KILLS[choice.kills], subs: r.subs };
    return r;
  }
  const dead = checkDead(r);
  if (dead) r.dead = dead;
  checkQuests(r);
  return r;
}

/** 업로드 주기를 바꾼다. 틱을 안 쓴다 - 전략이지 행동이 아니다 */
export function setCadence(r: Run, id: string): Run {
  if (r.dead || r.cadence === id) return r;
  r.cadence = id;
  r.cadenceChanges += 1;
  const c = cadenceOf(r);
  say(r, `업로드 주기를 ${c.name}${josa(c.name, '으로', '로')} 바꿨다.`, 'sys');
  // 손에 든 카드의 이득은 주기로 계산한 것이라 다시 뽑는다
  r.hand = r.hand.map((h) => ({ ...h, gain: reachOf(r, h.action) }));
  checkQuests(r);
  return r;
}

// ------------------------------------------------------------------ 부계정

export interface Card {
  id: string;
  name: string;
  desc: string;
  rank: number;
}

/** 채널이 끝나면 한 장 얻는다. 다음 채널이 조금 덜 맨땅이 된다 */
export const CARDS: Card[] = [
  { id: 'savings', name: '모아 둔 돈', desc: '시작 자금 +500원', rank: 1 },
  { id: 'gear', name: '남은 장비', desc: '시작 편집 +12', rank: 2 },
  { id: 'luckystart', name: '터지는 컨셉', desc: '잘 터지는 컨셉이 나올 확률 세 배', rank: 3 },
];

export function drawCard(owned: string[]): Card | null {
  const pool = CARDS.filter((c) => !owned.includes(c.id));
  return pool.length ? pick(pool, (c) => 1 / c.rank) : null;
}
