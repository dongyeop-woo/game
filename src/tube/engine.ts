import { CONCEPTS, EVENTS, STAGES } from './content';
import type { Action, Choice, Concept, Death, Delta, Ev, Line, Run, Stage } from './types';

/**
 * 유튜버 키우기 - 굴러가는 부분.
 *
 * 한 판이 곧 채널 하나다. 하루에 뭘 올릴지 고르면 구독자가 붙고, 가끔 일이
 * 끼어들고, 정산일에 돈이 들어오고, 구간 끝에서 다음 구간으로 올라간다.
 *
 * 상태는 **한 덩이**로 들고 다닌다 (`Run`). 화면은 읽기만 하고, 바꾸는 건
 * 여기 있는 함수뿐이다.
 */

const CAP = 99;
const clamp = (v: number) => Math.max(0, Math.min(CAP, v));

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
 * **이 게임의 중심 맞바꿈이다.** 물량으로 알고리즘을 두드릴지, 한 편에
 * 정성을 쏟을지. 실제로 채널을 하는 사람이 매주 다시 하는 고민이라
 * 하루하루 고르는 것보다 위에 둔다.
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

// ------------------------------------------------------------------ 조회

export function conceptOf(id: string): Concept {
  return CONCEPTS.find((c) => c.id === id) ?? CONCEPTS[0];
}

export function stageOf(r: Run): Stage {
  return STAGES[Math.min(r.stage, STAGES.length - 1)];
}

export function actionsOf(r: Run): Action[] {
  return stageOf(r).actions.filter((a) => !a.when || a.when(r));
}

/** 며칠마다 애드센스가 들어오는가 */
export const PAYDAY = 5;

/**
 * 정산으로 들어올 돈.
 *
 * **기대보다 적게 나와야 한다.** 그게 이 직업의 분노 담당이다. 구독자
 * 만 명이면 한 달에 얼마냐고 다들 묻는데, 실제로는 그 숫자를 듣고
 * 다들 놀란다.
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

// ------------------------------------------------------------------ 시작

export function start(cards: string[] = []): Run {
  const lucky = cards.includes('luckystart');
  const concept = pick(CONCEPTS, (c) => c.weight * (lucky && c.rank >= 4 ? 3 : 1));

  const r: Run = {
    seed: Math.floor(Math.random() * 1e9),
    stage: 0,
    day: 1,
    stats: { plan: 10, edit: 10, body: 20, mind: 20 },
    subs: 0,
    money: 300,
    spice: 0,
    lazy: 0,
    concept: concept.id,
    cadence: 'week3',
    yellow: 0,
    warned: 0,
    lines: [],
    nextLineId: 1,
    pending: null,
    dead: null,
    met: [],
    seen: [],
    lastLine: '',
    cards,
  };
  apply(r, concept.d);
  if (cards.includes('gear')) r.stats.edit = clamp(r.stats.edit + 12);
  if (cards.includes('savings')) r.money += 500;

  say(r, `${concept.name}${josa(concept.name, '으로', '로')} 채널을 팠다.`, 'sys');
  say(r, concept.line, 'ev');
  return r;
}

// ------------------------------------------------------------------ 하루

function rollEvent(r: Run): Ev | null {
  if (Math.random() > 0.38) return null;
  const s = stageOf(r);
  const pool = EVENTS.filter(
    (e) => e.at.includes(s.id) && !(e.once && r.seen.includes(e.id)) && (!e.when || e.when(r)),
  );
  return pool.length ? pick(pool, (e) => e.weight) : null;
}

/**
 * 영상 하나가 데려오는 사람 수.
 *
 * **계산해서 붙인다.** 고정값으로 주면 스탯을 올릴 이유가 없어진다.
 * 기획이 노출을 만들고 편집이 이탈을 막는다. 자극은 당장 잘 먹히지만
 * 그만큼 다른 데서 값을 치른다.
 */
function reachOf(r: Run, a: Action): number {
  if (!a.reach) return 0;
  const c = cadenceOf(r);
  const skill = (1 + r.stats.plan / 26) * (1 + r.stats.edit / 34);
  const spice = 1 + Math.max(0, r.spice) * 0.045;
  const luck = 0.55 + Math.random() * 1.1;
  return Math.round(stageOf(r).base * a.reach * c.videos * c.quality * skill * spice * luck);
}

/**
 * 채널이 끝났는지 본다.
 *
 * 스탯이 0 인 것과 채널이 죽는 것은 다르다 - 기획이 0 이어도 올리기는 한다.
 */
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

export function doAction(r: Run, action: Action): Run {
  if (r.dead || r.pending) return r;

  const c = cadenceOf(r);
  const d: Delta = { ...action.d };
  // 주기가 빠를수록 몸이 더 깎인다. 올라가는 건 그대로 둔다
  if (d.body && d.body < 0) d.body = Math.round(d.body * c.toll);
  apply(r, d);

  let line = one(action.lines);
  if (line === r.lastLine && action.lines.length > 1) {
    line = one(action.lines.filter((t) => t !== line));
  }
  say(r, line, 'act');

  const got = reachOf(r, action);
  if (got > 0) {
    r.subs += got;
    say(r, `구독자 +${got.toLocaleString()}`, 'good');
  } else if (action.reach) {
    say(r, '조회수가 안 나왔다.', 'sys');
  }

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
  return advance(r);
}

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
  return advance(r);
}

/** 업로드 주기를 바꾼다. 하루를 안 쓴다 - 전략이지 행동이 아니다 */
export function setCadence(r: Run, id: string): Run {
  if (r.dead || r.cadence === id) return r;
  r.cadence = id;
  const c = cadenceOf(r);
  say(r, `업로드 주기를 ${c.name}${josa(c.name, '으로', '로')} 바꿨다.`, 'sys');
  return r;
}

/**
 * 선을 넘었는지 본다.
 *
 * 자극도는 화면에 숫자로 안 보인다. 그래서 **경고를 먼저 준다** - 아무 예고
 * 없이 고소가 오면 억울하기만 하고 다시 안 한다. 두 번 경고하고 세 번째에
 * 끝낸다.
 */
function checkLine(r: Run): boolean {
  const over = [16, 24, 32];
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

function advance(r: Run): Run {
  if (checkLine(r)) return r;

  const dead = checkDead(r);
  if (dead) {
    r.dead = dead;
    return r;
  }

  if (r.yellow > 0) r.yellow -= 1;

  r.day += 1;

  // 정산일. 기대보다 적게 들어오는 게 이 직업의 분노 담당이다
  if ((r.day - 1) % PAYDAY === 0 && r.subs > 0) {
    const got = payout(r);
    r.money += got;
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
    return r;
  }

  if (r.day > s.days) {
    // 구간 안에 목표를 못 채웠다. 여기서 끝난다
    r.dead = { ...KILLS.quit, subs: r.subs };
    return r;
  }
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
