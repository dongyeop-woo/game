import { CHAPTERS, EVENTS, HOMES, TRACKS } from './content';
import type { Action, Choice, Death, Delta, Ev, Home, Life, Line } from './types';

/**
 * 인생 키우기 - 굴러가는 부분.
 *
 * 한 판이 곧 한 인생이다. 하루에 행동을 하나 고르면 스탯이 움직이고, 가끔
 * 일이 끼어들고, 챕터 끝에서 갈래가 갈린다.
 *
 * 상태는 **한 덩이**로 들고 다닌다 (`Life`). 화면은 그걸 읽기만 하고,
 * 바꾸는 건 여기 있는 함수뿐이다.
 */

/** 스탯은 0 아래로 안 내려가고 위로도 적당히 막는다 */
const CAP = 99;

function clamp(v: number) {
  return Math.max(0, Math.min(CAP, v));
}

function pick<T>(list: T[], weight: (t: T) => number): T {
  const total = list.reduce((s, t) => s + weight(t), 0);
  let r = Math.random() * total;
  for (const t of list) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return list[list.length - 1];
}

function one<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * 받침이 있으면 앞, 없으면 뒤를 쓴다.
 *
 * "모범생로 졸업" 같은 게 나오면 글이 통째로 싸구려가 된다. 글이 곧 게임인
 * 판에서는 조사 하나가 눈에 띈다.
 */
export function josa(word: string, withJong: string, without: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return without;
  return (last - 0xac00) % 28 > 0 ? withJong : without;
}

export function homeDef(id: string): Home {
  return HOMES.find((h) => h.id === id) ?? HOMES[0];
}

export function trackName(id: string | null): string {
  return id ? (TRACKS[id] ?? id) : '';
}

/** 지금 챕터 */
export function chapterOf(l: Life) {
  return CHAPTERS[Math.min(l.chapter, CHAPTERS.length - 1)];
}

/** 지금 나이. 챕터가 맡은 나이 폭에 일차를 비례로 얹는다 */
export function ageOf(l: Life): number {
  const c = chapterOf(l);
  return c.from + Math.floor(((l.day - 1) / c.days) * (c.to - c.from + 1));
}

function say(l: Life, text: string, tone: Line['tone']) {
  l.lines.push({ id: l.nextLineId++, text, tone });
  l.lastLine = text;
  // 화면에 남길 만큼만 들고 있는다
  if (l.lines.length > 60) l.lines.splice(0, l.lines.length - 60);
}

function apply(l: Life, d: Delta) {
  l.stats.head = clamp(l.stats.head + (d.head ?? 0));
  l.stats.body = clamp(l.stats.body + (d.body ?? 0));
  l.stats.mind = clamp(l.stats.mind + (d.mind ?? 0));
  l.stats.charm = clamp(l.stats.charm + (d.charm ?? 0));
  l.money += d.money ?? 0;
  l.rough += d.rough ?? 0;
  l.slick += d.slick ?? 0;
}

// ------------------------------------------------------------------ 시작

/**
 * 태어난다.
 *
 * 집안을 뽑는 게 첫 일이다. 좋은 집이 드물게 나오도록 무게를 매겨 뒀다 -
 * 흔하면 분노가 안 생기고, 분노가 안 생기면 결과 화면이 안 돌아다닌다.
 */
export function born(cards: string[] = []): Life {
  /*
    카드가 집안 뽑기에 끼어든다.

    `goldspoon` 을 들고 있으면 좋은 집(rank 4 이상)의 무게를 세 배로 본다.
    카드가 실제로 인생을 바꾸는 자리가 여기여야 한다 - 스탯 몇 점보다
    집안 한 칸이 훨씬 세다.
  */
  const lucky = cards.includes('goldspoon');
  const home = pick(HOMES, (h) => h.weight * (lucky && h.rank >= 4 ? 3 : 1));

  const l: Life = {
    seed: Math.floor(Math.random() * 1e9),
    age: 0,
    chapter: 0,
    day: 1,
    stats: { head: 10, body: 10, mind: 10, charm: 10 },
    money: 0,
    rough: 0,
    slick: 0,
    home: home.id,
    track: null,
    lines: [],
    nextLineId: 1,
    pending: null,
    dead: null,
    met: [],
    seen: [],
    lastLine: '',
    cards,
  };
  apply(l, home.d);
  if (cards.includes('mombonus')) l.money += 50;
  if (cards.includes('tough')) l.stats.body = clamp(l.stats.body + 20);

  say(l, `${home.name}에서 태어났다.`, 'sys');
  say(l, home.line, 'ev');
  l.age = ageOf(l);
  return l;
}

// ------------------------------------------------------------------ 하루

/** 지금 고를 수 있는 행동 */
export function actionsOf(l: Life): Action[] {
  return chapterOf(l).actions.filter((a) => !a.when || a.when(l));
}

/**
 * 끼어들 일을 고른다.
 *
 * 매일 나오면 행동을 고르는 맛이 없어진다. 셋 중 하나꼴로만 나온다.
 */
function rollEvent(l: Life): Ev | null {
  if (Math.random() > 0.38) return null;
  const c = chapterOf(l);
  const pool = EVENTS.filter(
    (e) => e.at.includes(c.id) && !(e.once && l.seen.includes(e.id)) && (!e.when || e.when(l)),
  );
  if (pool.length === 0) return null;
  return pick(pool, (e) => e.weight);
}

/**
 * 죽었는지 본다.
 *
 * 스탯이 0 인 것과 죽는 것은 다르다 - 머리가 0 이어도 살아는 있다.
 * **몸과 멘탈만** 사람을 끝낸다.
 */
function checkDead(l: Life): Death | null {
  if (!chapterOf(l).deadly) return null;
  const age = ageOf(l);
  if (l.stats.body <= 0) {
    return { name: '몸이 버티지 못했다', line: '아프다는 말을 아무도 안 들어 줬다.', age };
  }
  if (l.stats.mind <= 0) {
    return { name: '방에서 나오지 않았다', line: '문을 잠근 게 언제인지 기억나지 않는다.', age };
  }
  /*
    빚은 바로 안 죽인다.

    돈이 마이너스인 건 흔한 일이고, 그때마다 끝나면 게임이 안 된다. 깊게
    파였을 때만 집이 무너진다.
  */
  if (l.money <= -200) {
    return { name: '집이 넘어갔다', line: '이삿짐은 트럭 한 대로 충분했다.', age };
  }
  return null;
}

const KILLS: Record<string, Death> = {
  traffic: { name: '횡단보도', line: '친구 셋이 건너편에서 보고 있었다.', age: 0 },
};

/** 행동 하나를 고른다. 이벤트가 걸리면 `pending` 에 담고 답을 기다린다 */
export function doAction(l: Life, action: Action): Life {
  if (l.dead || l.pending) return l;
  apply(l, action.d);
  /*
    같은 줄이 연달아 나오면 글이 고장 난 것처럼 보인다. 한 번 더 뽑는다.
  */
  let line = one(action.lines);
  if (line === l.lastLine && action.lines.length > 1) line = one(action.lines.filter((t) => t !== line));
  say(l, line, 'act');

  const ev = rollEvent(l);
  if (ev) {
    if (ev.choices) {
      // 고르는 이벤트는 여기서 멈춘다. 화면이 답을 받아 `answer` 를 부른다
      l.pending = ev;
      return l;
    }
    say(l, ev.text, 'ev');
    if (ev.d) apply(l, ev.d);
    if (ev.meets && !l.met.includes(ev.meets)) l.met.push(ev.meets);
    if (ev.once) l.seen.push(ev.id);
  }
  return advance(l);
}

/** 이벤트 선택지를 고른다 */
export function answer(l: Life, choice: Choice): Life {
  const ev = l.pending;
  if (!ev) return l;
  l.pending = null;
  if (ev.once) l.seen.push(ev.id);
  say(l, ev.text, 'ev');
  apply(l, choice.d);
  say(l, choice.line, choice.kills ? 'bad' : 'ev');
  const met = choice.meets ?? ev.meets;
  if (met && !l.met.includes(met)) l.met.push(met);
  if (choice.kills) {
    l.dead = { ...KILLS[choice.kills], age: ageOf(l) };
    say(l, `${l.dead.age}세. ${l.dead.name}.`, 'bad');
    return l;
  }
  return advance(l);
}

/** 하루를 넘긴다. 챕터가 끝나면 관문을 지난다 */
function advance(l: Life): Life {
  const dead = checkDead(l);
  if (dead) {
    l.dead = dead;
    say(l, `${dead.age}세. ${dead.name}.`, 'bad');
    return l;
  }

  l.day += 1;
  const c = chapterOf(l);
  if (l.day > c.days) {
    const gate = c.gate(l);
    l.track = gate.track;
    say(l, gate.line, 'good');
    l.chapter += 1;
    l.day = 1;
    if (l.chapter >= CHAPTERS.length) {
      // 만든 데까지 왔다. 나머지 챕터가 붙으면 여기가 사라진다
      const t = trackName(l.track);
      l.dead = {
        name: `${t}${josa(t, '으로', '로')} 졸업`,
        line: '여기까지가 지금 만들어진 인생이다.',
        age: c.to,
      };
      l.age = c.to;
      return l;
    }
    say(l, `${chapterOf(l).name} 시작.`, 'sys');
  }
  l.age = ageOf(l);
  return l;
}

// ------------------------------------------------------------------ 환생

export interface Card {
  id: string;
  name: string;
  desc: string;
  rank: number;
}

/**
 * 환생 카드.
 *
 * **집안 뽑기를 건드리는 카드가 제일 세다.** 스탯 몇 점은 체감이 없는데
 * 집안 한 칸은 인생이 통째로 바뀐다.
 */
export const CARDS: Card[] = [
  { id: 'mombonus', name: '엄마 찬스', desc: '태어날 때 돈 +50', rank: 1 },
  { id: 'tough', name: '타고난 체력', desc: '태어날 때 체력 +20', rank: 2 },
  { id: 'goldspoon', name: '좋은 집 확률 ↑', desc: '잘사는 집이 나올 확률이 세 배', rank: 3 },
];

/** 죽거나 끝나면 한 장 뽑는다. 낮은 등급이 흔하다 */
export function drawCard(owned: string[]): Card | null {
  const pool = CARDS.filter((c) => !owned.includes(c.id));
  if (pool.length === 0) return null;
  return pick(pool, (c) => 1 / c.rank);
}
