import { COMMENTS, CONCEPTS, ENDINGS, EVENTS, LOW_BODY, LOW_MIND, PEOPLE, QUESTS, SHOP, STAGES, VIBES } from './content';
import type { Action, Choice, Comment, Concept, Dealt, Death, Delta, Ev, Item, Line, Notice, Quest, Run, Stage, Video } from './types';

/**
 * 유튜버 키우기 - 굴러가는 부분.
 *
 * 한 판이 곧 채널 하나다. 하루에 틱이 셋이고, 손에 든 카드 넉 장 중 하나를
 * 쓰면 틱이 하나 줄고, 틱이 다 떨어지면 하루가 넘어간다. **올린 영상의
 * 결과는 다음 날 아침에 온다.** 매달 21일에 돈이 들어오고, 구간 끝에서
 * 다음 구간으로 올라간다.
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
/** 한 달. 게임 안 달력은 30일로 딱 떨어진다 */
export const MONTH = 30;
/** 애드센스는 매달 21일에 들어온다. 실제 유튜브가 그렇다 */
export const PAYDAY = 21;
/** 채널을 판 날의 날짜. 1월 1일 - 첫 21일이 3주째에 온다. 그쯤이면 승인이 나 있다 */
export const START_DAY = 1;
/** 알고리즘이 며칠마다 바뀌는가 */
export const WEEK = 7;
/** 이번 주 결에 맞는 영상의 유입 배수 / 틀린 결의 배수 */
export const TREND_BOOST = 1.6;
export const TREND_MISS = 0.8;

/**
 * 수익 창출. 실제 유튜브 파트너 프로그램을 따른다.
 *
 * 구독자 1,000 + (지난 90일 시청 4,000시간 또는 조회수 1,000만) → 신청 →
 * 사흘 뒤 승인 → 조회수 1,000회당 RPM 만큼 쌓이고, 21일에 잔액이 최소
 * 지급액(100달러 ≈ 10만 원)을 넘으면 들어온다.
 */
export const YPP_SUBS = 1000;
export const YPP_HOURS = 4000;
export const YPP_VIEWS = 10_000_000;
export const YPP_WINDOW = 90;
export const YPP_REVIEW_DAYS = 3;
/** 조회수 천 회당 원. 노란 딱지면 4분의 1 */
export const RPM = 2200;
export const MIN_PAYOUT = 100000;

/** 원화. 만 단위로 줄여서 */
export function fmtWon(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 100000000) return `${sign}${(a / 100000000).toFixed(1)}억 원`;
  if (a >= 10000) return `${sign}${Math.round(a / 10000).toLocaleString()}만 원`;
  return `${sign}${a.toLocaleString()}원`;
}

/** 채널을 판 날(age 1)이 1월 1일 */
export function dateOf(age: number): { month: number; day: number } {
  const i = age - 1 + (START_DAY - 1);
  return { month: Math.floor(i / MONTH) + 1, day: (i % MONTH) + 1 };
}

/** 다음 정산까지 며칠 남았나. 오늘이 21일이면 0 */
export function payIn(age: number): number {
  const d = dateOf(age).day;
  return d <= PAYDAY ? PAYDAY - d : MONTH - d + PAYDAY;
}

/**
 * 구독자 한 명당 조회수·좋아요·댓글 비율. 스튜디오에 보여 주는 장식 숫자다.
 */
const VIEWS_PER_SUB = 55;
const LIKE_RATE = 0.032;
const COMMENT_RATE = 0.0025;
/** 시청 시간(시간) = 조회수 × 평균 시청(분) / 60 */
const AVG_MINUTES = 3.4;

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

/** 조회수 같은 큰 수. 실제 스튜디오처럼 만·천 단위로 */
export function fmtBig(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

// ------------------------------------------------------------ 업로드 주기

/**
 * 업로드 주기.
 *
 * **고르는 게 아니라 편집 실력이 정한다.** 편집이 10인데 1일 1영상을 고를 수
 * 있으면 말이 안 된다. 편집이 오르면 주 3편이 열리고 더 오르면 1일 1영상이
 * 열린다 - 그래서 편집이 성장의 열쇠가 된다.
 */
export interface Cadence {
  id: string;
  name: string;
  /** 이 주기가 열리는 편집 값 */
  edit: number;
  /** 하루에 올라가는 영상 수. 1 보다 작으면 며칠에 한 편이다 */
  videos: number;
  /** 한 편의 완성도 배수 */
  quality: number;
  /** 체력이 깎이는 배수 */
  toll: number;
}

export const CADENCES: Cadence[] = [
  { id: 'week1', name: '주 1편', edit: 0, videos: 0.55, quality: 1.45, toll: 0.55 },
  { id: 'week3', name: '주 3편', edit: 20, videos: 1, quality: 1, toll: 1 },
  { id: 'daily', name: '1일 1영상', edit: 45, videos: 1.9, quality: 0.68, toll: 1.9 },
];

/** 지금 편집 실력으로 되는 가장 빠른 주기 */
export function cadenceOf(r: Run): Cadence {
  let best = CADENCES[0];
  for (const c of CADENCES) if (r.stats.edit >= c.edit) best = c;
  return best;
}

/** 다음 주기가 열리려면 편집이 얼마여야 하는가. 다 열렸으면 null */
export function nextCadence(r: Run): Cadence | null {
  const now = cadenceOf(r);
  return CADENCES.find((c) => c.edit > now.edit) ?? null;
}

export const vibeOf = (id: string) => VIBES.find((v) => v.id === id) ?? VIBES[0];

// ------------------------------------------------------------ 스튜디오

/** 지난 28일 채널 분석. 스튜디오 화면의 네 칸이다 */
export function analytics(r: Run) {
  const recent = r.videos.filter((v) => v.settled && r.age - v.day < 28);
  const views = recent.reduce((s, v) => s + v.views, 0);
  const subs = recent.reduce((s, v) => s + v.gain, 0);
  return {
    views,
    hours: Math.round((views * AVG_MINUTES) / 60),
    subs,
    revenue: r.ypp === 'on' ? Math.round((views / 1000) * RPM * (r.yellow > 0 ? 0.25 : 1)) : 0,
  };
}

/** 수익 창출 조건 진행. 스튜디오 수익 탭이 보여 준다 */
export function yppProgress(r: Run) {
  const recent = r.videos.filter((v) => v.settled && r.age - v.day < YPP_WINDOW);
  const views = recent.reduce((s, v) => s + v.views, 0);
  const hours = Math.round((views * AVG_MINUTES) / 60);
  return { subs: r.subs, views, hours, ok: r.subs >= YPP_SUBS && (hours >= YPP_HOURS || views >= YPP_VIEWS) };
}

/** 수익 창출을 신청한다. 조건을 채웠을 때만 */
export function applyYpp(r: Run): Run {
  if (r.ypp !== 'eligible' || r.dead) return r;
  r.ypp = 'applied';
  r.yppAt = r.age;
  say(r, '수익 창출을 신청했다. 검토에 사흘 걸린단다.', 'sys');
  checkQuests(r);
  return r;
}

/** 조회수 순위. 1 이 제일 많이 본 영상 */
export function rankOf(r: Run, v: Video): number {
  return [...r.videos].sort((a, b) => b.views - a.views).findIndex((x) => x.id === v.id) + 1;
}

/** 도감 설명 */
export function personOf(name: string) {
  return PEOPLE.find((p) => p.name === name) ?? { name, desc: '' };
}

/** 최근 댓글. 스튜디오 커뮤니티 탭. 숨긴 건 안 나온다 */
export function recentComments(r: Run, n = 20): (Comment & { title: string; videoId: number })[] {
  const out: (Comment & { title: string; videoId: number })[] = [];
  for (let i = r.videos.length - 1; i >= 0 && out.length < n; i -= 1) {
    const v = r.videos[i];
    for (const c of v.replies) if (!c.hidden) out.push({ ...c, title: v.title, videoId: v.id });
  }
  return out.slice(0, n);
}

// ------------------------------------------------------------ 댓글 관리

/**
 * 댓글을 지우거나 숨기거나 쓴 사람을 차단한다.
 *
 * 악플을 치우면 멘탈이 조금 돌아온다. 차단은 그 닉네임이 다시는 못 달게
 * 한다 - 실제 스튜디오의 "채널에서 사용자 숨기기" 다.
 */
function findComment(r: Run, videoId: number, cid: number) {
  const v = r.videos.find((x) => x.id === videoId);
  const c = v?.replies.find((x) => x.id === cid);
  return v && c ? { v, c } : null;
}

export function hideComment(r: Run, videoId: number, cid: number): Run {
  const f = findComment(r, videoId, cid);
  if (!f || f.c.hidden) return r;
  f.c.hidden = true;
  if (f.c.tone === 'bad') apply(r, { mind: 1 });
  return r;
}

export function deleteComment(r: Run, videoId: number, cid: number): Run {
  const f = findComment(r, videoId, cid);
  if (!f) return r;
  f.v.replies = f.v.replies.filter((x) => x.id !== cid);
  f.v.comments = Math.max(0, f.v.comments - 1);
  if (f.c.tone === 'bad') apply(r, { mind: 1 });
  return r;
}

export function block(r: Run, who: string): Run {
  if (r.blocked.includes(who)) return r;
  r.blocked.push(who);
  let bads = 0;
  for (const v of r.videos) for (const c of v.replies) if (c.who === who && !c.hidden) {
    c.hidden = true;
    if (c.tone === 'bad') bads += 1;
  }
  apply(r, { mind: Math.min(4, 1 + bads) });
  say(r, `${who}${josa(who, '을', '를')} 차단했다. 이제 그 사람 댓글은 안 보인다.`, 'sys');
  return r;
}

/** 지금 상태 한 마디. 바닥이면 화면에 뜬다 */
export function moodOf(r: Run): string | null {
  if (r.stats.body <= 15) return '번아웃 직전';
  if (r.stats.mind <= 15) return '멘탈 바닥';
  if (r.warned >= 2) return '내용증명 받음';
  if (r.warned >= 1) return '경고 1회';
  return null;
}

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
    say(r, `퀘스트 완료 - ${q.text.replace(/<|>/g, '')} (+${fmtWon(q.reward)})`, 'good');
    const nextQ = questOf(r);
    notify(r, '퀘스트 완료', [
      { id: 0, text: q.text.replace(/<|>/g, ''), tone: 'good' },
      { id: 1, text: `보상 ${fmtWon(q.reward)}`, tone: 'sys' },
      ...(nextQ ? [{ id: 2, text: `다음: ${nextQ.text.replace(/<|>/g, '')}`, tone: 'ev' as const }] : []),
    ]);
  }
}

/** 이번 주 알고리즘을 새로 뽑는다. 지난주 것과는 다르게 */
function rollTrend(r: Run) {
  const pool = VIBES.filter((v) => v.id !== r.trend);
  r.trend = one(pool).id;
  r.trendKnown = false;
}

// ------------------------------------------------------------------ 조회

export function conceptOf(id: string): Concept & { names: string[] } {
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
  return r.ypp === 'on' && r.earned >= MIN_PAYOUT ? Math.floor(r.earned) : 0;
}

/** 알림 창을 하나 세운다 */
function notify(r: Run, title: string, lines: Line[], sub?: string) {
  if (lines.length === 0) return;
  r.notices.push({ id: r.nextLineId++, title, sub, lines: lines.map((l) => ({ ...l })) });
}

/** 알림 창을 봤다 */
export function dismissNotice(r: Run): Run {
  r.notices.shift();
  return r;
}

function say(r: Run, text: string, tone: Line['tone']) {
  r.lines.push({ id: r.nextLineId++, text, tone });
  r.lastLine = text;
  if (r.lines.length > 80) r.lines.splice(0, r.lines.length - 80);
}

/** 같은 말을 연달아 하지 않게 뽑는다 */
function fresh(r: Run, list: string[]): string {
  let t = one(list);
  if (t === r.lastLine && list.length > 1) t = one(list.filter((x) => x !== t));
  return t;
}

/** 카드 한 장에 붙는 체력 값. 주기가 빠를수록 더 깎인다. 좋은 의자가 있으면 덜 깎인다 */
export function bodyCost(r: Run, a: Action): number {
  const b = a.d.body ?? 0;
  if (b >= 0) return b;
  const chair = r.gear.includes('chair') ? 0.8 : 1;
  return Math.round(b * cadenceOf(r).toll * chair);
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
 * 영상 하나가 데려올 사람 수 - **예상**이다.
 *
 * 계산해서 붙인다. 고정값으로 주면 스탯을 올릴 이유가 없어진다.
 * 기획이 노출을 만들고 편집이 이탈을 막는다. 자극은 당장 잘 먹히지만
 * 그만큼 다른 데서 값을 치른다. 이번 주 결에 맞으면 뛰고 틀리면 덜 뜬다 -
 * 숫자로는 안 알려 주니 카드의 숫자가 단서다.
 *
 * 카드를 **뽑을 때** 굴린다. 실제 숫자는 다음 날 아침에 운이 섞여 온다.
 */
function reachOf(r: Run, a: Action): number {
  if (!a.reach) return 0;
  const c = cadenceOf(r);
  // 더하기로 묶는다. 곱하면 후반에 스탯 99 × 자극 80 이 수십 배가 돼서 골드가 닷새 만에 끝난다
  const skill = 1 + r.stats.plan / 55 + r.stats.edit / 65;
  const spice = 1 + Math.max(0, r.spice) * 0.015;
  const trend = a.vibe ? (a.vibe === r.trend ? TREND_BOOST : TREND_MISS) : 1;
  const wobble = 0.85 + Math.random() * 0.3;
  return Math.round(stageOf(r).base * a.reach * c.videos * c.quality * skill * spice * trend * r.reachMul * r.boost * wobble);
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

/** 손의 숫자를 지금 상태로 다시 굴린다. 배수나 주기가 바뀌었을 때 */
function reprice(r: Run) {
  r.hand = r.hand.map((h) => ({ ...h, gain: reachOf(r, h.action) }));
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

export function start(cards: string[] = [], questDone: string[] = [], name = ''): Run {
  const lucky = cards.includes('luckystart');
  const concept = pick(CONCEPTS, (c) => c.weight * (lucky && c.rank >= 4 ? 3 : 1));

  const r: Run = {
    seed: Math.floor(Math.random() * 1e9),
    stage: 0,
    day: 1,
    stats: { plan: 10, edit: 10, body: 60, mind: 40 },
    subs: 0,
    money: 300000,
    spice: 0,
    lazy: 0,
    concept: concept.id,
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
    questDone: [...questDone],
    age: 1,
    paidUpTo: 0,
    videos: [],
    name: name || one(concept.names),
    gear: [],
    reachMul: 1,
    boost: 1,
    report: null,
    notices: [],
    week: { videos: 0, views: 0, subs: 0, hits: 0, n: 1 },
    cooled: 0,
    blocked: [],
    nextCid: 1,
    ypp: 'none',
    yppAt: 0,
    earned: 0,
  };
  apply(r, concept.d);

  // 부계정 카드. 다음 채널이 조금 덜 맨땅이 된다
  if (cards.includes('gear')) r.stats.edit = clamp(r.stats.edit + 12);
  if (cards.includes('savings')) r.money += 500000;
  if (cards.includes('fans')) r.subs += 200;
  if (cards.includes('mentor')) r.stats.plan = clamp(r.stats.plan + 10);
  if (cards.includes('thickskin')) r.stats.mind = clamp(r.stats.mind + 15);
  if (cards.includes('lawyer')) r.spice -= 15;
  if (cards.includes('ideas')) r.rerolls += 4;
  if (cards.includes('body')) r.stats.body = clamp(r.stats.body + 20);

  say(r, `${concept.name}${josa(concept.name, '으로', '로')} 채널을 팠다. 이름은 "${r.name}".`, 'sys');
  rollTrend(r);
  fill(r);
  return r;
}

/** 채널 이름을 바꾼다. 시작 화면에서 짓는다 */
export function rename(r: Run, name: string): Run {
  const n = name.trim();
  if (n) r.name = n.slice(0, 14);
  return r;
}

// ------------------------------------------------------------------ 상점

export function shopOf(r: Run): Item[] {
  return SHOP.filter((i) => !i.when || i.when(r));
}

export function canBuy(r: Run, item: Item): boolean {
  if (r.money < item.price) return false;
  if (item.once && r.gear.includes(item.id)) return false;
  return true;
}

export function buy(r: Run, id: string): Run {
  const item = SHOP.find((i) => i.id === id);
  if (!item || r.dead || !canBuy(r, item)) return r;
  r.money -= item.price;
  if (item.once) r.gear.push(item.id);
  if (item.d) apply(r, item.d);
  if (item.reach) r.reachMul *= item.reach;
  if (item.boost) r.boost = Math.max(r.boost, item.boost);
  if (item.cool) {
    r.spice -= item.cool;
    r.cooled += 1;
  }
  r.used.__bought = (r.used.__bought ?? 0) + 1;
  say(r, `${item.name}${josa(item.name, '을', '를')} 샀다. ${item.desc}.`, 'sys');
  // 배수가 바뀌었으니 손의 숫자도 다시
  if (item.reach || item.boost) reprice(r);
  checkQuests(r);
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
  if (r.money <= -1500000) {
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
  exposed: { name: '폭로당했다', line: '해명 영상은 끝내 못 올렸다. 댓글은 아직도 달린다.', subs: 0 },
  retired: { name: '은퇴 영상을 올렸다', line: '마지막 영상이 역대 조회수 1위가 됐다.', subs: 0 },
};

/**
 * 선을 넘었는지 본다.
 *
 * 자극도는 화면에 숫자로 안 보인다. 그래서 **경고를 먼저 준다** - 아무 예고
 * 없이 고소가 오면 억울하기만 하고 다시 안 한다. 두 번 경고하고 세 번째에
 * 끝낸다. 변호사를 쓰면 자극도가 내려가 경고 단계도 같이 내려간다.
 */
function checkLine(r: Run): boolean {
  const over = [40, 60, 80];
  const step = over.findIndex((v) => r.spice < v);
  const level = step < 0 ? over.length : step;
  if (level < r.warned) {
    r.warned = level;
    return false;
  }
  if (level <= r.warned) return false;
  r.warned = level;
  if (level === 1) {
    say(r, '커뮤니티 가이드 경고가 왔다. 한 번은 봐준다고 한다.', 'bad');
    return false;
  }
  if (level === 2) {
    say(r, '내용증명이 왔다. 변호사 이름이 적혀 있다.', 'bad');
    apply(r, { mind: -6, money: -300000 });
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
  const before = cadenceOf(r).id;
  apply(r, { ...a.d, body: bodyCost(r, a) });
  r.used[a.id] = (r.used[a.id] ?? 0) + 1;

  say(r, fresh(r, a.lines), 'act');

  let boosted = false;
  if (a.reach) {
    r.uploads += 1;
    r.week.videos += 1;
    if (a.vibe && a.vibe === r.trend) r.week.hits += 1;
    // 올렸다. 숫자는 내일 아침에 온다
    r.videos.push({
      id: r.uploads,
      title: a.titles ? one(a.titles) : a.name,
      day: r.age,
      expect: card.gain,
      gain: 0,
      views: 0,
      likes: 0,
      comments: 0,
      vibe: a.vibe,
      settled: false,
      replies: [],
    });
    boosted = r.boost !== 1;
    r.boost = 1;
    say(r, '올렸다. 조회수는 내일 아침에.', 'sys');
  }

  // 쓴 카드는 빠지고 새 카드가 들어온다
  r.hand.splice(at, 1);

  // 편집이 문턱을 넘으면 주기가 바뀐다. 한 번짜리 배수를 썼으면 나머지 카드의 숫자도 내려온다
  const after = cadenceOf(r);
  if (after.id !== before) say(r, `편집이 늘었다. 이제 ${after.name}${josa(after.name, '이', '가')} 된다.`, 'good');
  if (after.id !== before || boosted) reprice(r);
  fill(r);

  // 쇼츠를 보면 이번 주 알고리즘을 알아낸다. 결 이름이 아니라 피드에서 본 것을 말한다
  if (a.id.startsWith('shorts')) {
    r.trendKnown = true;
    say(r, vibeOf(r.trend).hint, 'ev');
  }

  r.ticks -= 1;
  if (r.ticks <= 0) endDay(r);
  checkQuests(r);
  return r;
}

/**
 * 아침. 어제 올린 영상의 숫자가 온다.
 *
 * 카드의 예상에 운이 섞인다. 댓글이 달리고, 댓글이 멘탈을 건드린다.
 */
function settle(r: Run) {
  const todo = r.videos.filter((v) => !v.settled);
  for (const v of todo) {
    const luck = 0.6 + Math.random() * 0.9;
    v.gain = Math.round(v.expect * luck);
    v.views = Math.round(Math.max(v.gain, 1) * VIEWS_PER_SUB * (0.7 + Math.random() * 0.6));
    v.likes = Math.round(v.views * LIKE_RATE);
    v.settled = true;
    r.subs += v.gain;
    r.week.views += v.views;
    r.week.subs += v.gain;
    if (r.ypp === 'on') r.earned += (v.views / 1000) * RPM * (r.yellow > 0 ? 0.25 : 1);

    // 댓글. 결과가 좋으면 칭찬이 많고, 자극이 높으면 욕이 는다
    const n = v.views < 30 ? (Math.random() < 0.5 ? 1 : 0) : 1 + Math.floor(Math.random() * 3);
    const badW = 0.15 + Math.max(0, r.spice) / 120 + (r.lazy > 5 ? 0.1 : 0);
    const goodW = 0.4 + (luck > 1.15 ? 0.25 : 0);
    for (let i = 0; i < n; i += 1) {
      const pool = pick(COMMENTS, (c) => (c.tone === 'bad' ? badW : c.tone === 'good' ? goodW : 0.3));
      // 차단한 사람은 못 단다. 그 사람 자리는 비어 있는 채로
      const who = one(pool.who.filter((w) => !r.blocked.includes(w)));
      if (!who) continue;
      v.replies.push({ id: r.nextCid++, who, text: one(pool.text), tone: pool.tone });
    }
    v.comments = Math.max(v.replies.length, Math.round(v.views * COMMENT_RATE));

    const tag = luck > 1.25 ? ' 터졌다.' : luck < 0.75 ? ' 생각보다 안 나왔다.' : '';
    say(r, `"${v.title}" 조회수 ${fmtBig(v.views)} · 구독자 +${v.gain.toLocaleString()}.${tag}`, v.gain > 0 ? 'good' : 'bad');
    const c = v.replies[0];
    if (c) {
      say(r, `💬 ${c.who}: ${c.text}`, c.tone === 'bad' ? 'bad' : 'ev');
      const bads = v.replies.filter((x) => x.tone === 'bad').length;
      const goods = v.replies.filter((x) => x.tone === 'good').length;
      apply(r, { mind: goods - bads });
    }
  }
}

/** 주간 결산. 지난주 알고리즘을 그제야 알려 준다 */
function closeWeek(r: Run) {
  r.report = {
    week: r.week.n,
    videos: r.week.videos,
    views: r.week.views,
    subs: r.week.subs,
    trendWas: vibeOf(r.trend).name,
    hits: r.week.hits,
  };
  r.week = { videos: 0, views: 0, subs: 0, hits: 0, n: r.week.n + 1 };
}

/** 주간 결산을 봤다 */
export function dismissReport(r: Run): Run {
  r.report = null;
  return r;
}

/** 끝까지 갔다. 어떤 유튜버가 됐는지는 숨은 축이 정한다 */
function finish(r: Run) {
  const e = ENDINGS.find((x) => x.when(r)) ?? ENDINGS[ENDINGS.length - 1];
  r.endingId = e.id;
  r.dead = { name: e.name, line: e.line, subs: r.subs, good: true };
}

/**
 * 하루가 넘어간다.
 *
 * 선 넘기와 죽음을 먼저 보고, 날짜를 넘기고, **아침 결과**를 받고, 주간
 * 결산·정산을 하고, 구간을 보고, 마지막에 일이 하나 끼어든다. 일은 맨
 * 뒤여야 한다 - 고르는 일이면 여기서 멈추는데, 그 앞에서 날짜가 이미
 * 넘어가 있어야 답한 뒤 다시 넘길 일이 없다.
 */
function endDay(r: Run): Run {
  if (checkLine(r)) return r;
  const dead = checkDead(r);
  if (dead) {
    r.dead = dead;
    return r;
  }

  if (r.yellow > 0) r.yellow -= 1;
  // 시간이 지나면 자극도도 조금 식는다. 한 번 넘었다고 영영 못 돌아오면 억울하다
  if (r.spice > 0) r.spice -= 1;
  r.day += 1;
  r.age += 1;
  r.ticks = TICKS;

  const d = dateOf(r.age);
  say(r, `${d.month}월 ${d.day}일 아침.`, 'sys');
  const from = r.lines.length;
  settle(r);

  // 수익 창출. 조건을 채우면 알려 주고, 신청했으면 사흘 뒤 승인
  if (r.ypp === 'none' && yppProgress(r).ok) {
    r.ypp = 'eligible';
    say(r, '수익 창출 조건을 채웠다. 스튜디오 → 수익에서 신청할 수 있다.', 'good');
  } else if (r.ypp === 'applied' && r.age - r.yppAt >= YPP_REVIEW_DAYS) {
    r.ypp = 'on';
    say(r, '수익 창출이 승인됐다. 이제부터 조회수가 돈이 된다.', 'good');
  }

  // 바닥이면 숫자보다 먼저 몸이 말한다
  if (r.stats.body <= 15) say(r, fresh(r, LOW_BODY), 'bad');
  else if (r.stats.mind <= 15) say(r, fresh(r, LOW_MIND), 'bad');

  // 주가 바뀌면 결산 한 장과 새 알고리즘. 바뀐 건 알려 주되 뭘로 바뀌었는지는 안 알려 준다
  if ((r.age - 1) % WEEK === 0) {
    closeWeek(r);
    rollTrend(r);
    say(r, '새 주가 시작됐다. 피드 분위기가 어딘가 달라졌다.', 'sys');
  }

  // 21일. 기대보다 적게 들어오는 게 이 직업의 분노 담당이다
  if (d.day === PAYDAY) {
    const got = payout(r);
    r.paidUpTo = r.age;
    if (got > 0) {
      r.money += got;
      r.earned = 0;
      r.payouts += 1;
      say(r, `21일. 애드센스 정산 ${fmtWon(got)}${r.yellow > 0 ? ' (노란 딱지 반영)' : ''}`, 'good');
    } else if (r.ypp === 'on') {
      say(r, `21일. 애드센스 잔액 ${fmtWon(Math.floor(r.earned))}. 최소 지급액 ${fmtWon(MIN_PAYOUT)}이 안 돼 다음 달로 넘어간다.`, 'sys');
    } else {
      say(r, '21일. 남들은 정산받는 날이다. 나는 아직 수익 창출이 안 됐다.', 'sys');
    }
  }

  // 밤사이 일어난 일을 한 창에 모아 세운다. 올린 게 없고 아무 일도 없으면 안 세운다
  const morning = r.lines.slice(from).filter((l) => l.tone !== 'sys' || l.text.startsWith('21일'));
  notify(r, `${d.month}월 ${d.day}일 아침`, morning, `${r.day}일차 · D-${stageOf(r).days - r.day + 1}`);

  const s = stageOf(r);
  if (r.subs >= s.goal) {
    say(r, `구독자 ${fmtSubs(s.goal)} 돌파. 다음 구간으로 간다.`, 'good');
    r.stage += 1;
    r.day = 1;
    if (r.stage >= STAGES.length) {
      finish(r);
      return r;
    }
    say(r, `${stageOf(r).name} 시작.`, 'sys');
    r.hand = [];
    fill(r);
    checkQuests(r);
    return r;
  }
  if (r.day > s.days) {
    r.dead = { ...KILLS.quit, subs: r.subs };
    return r;
  }

  // 댓글이 멘탈을 바닥까지 끌고 갔을 수 있다
  const dead2 = checkDead(r);
  if (dead2) {
    r.dead = dead2;
    return r;
  }

  // 손을 새로 뽑는다. 어제 남긴 패는 오늘 안 남는다
  r.hand = [];
  fill(r);
  checkQuests(r);

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

// ------------------------------------------------------------------ 부계정

export interface Card {
  id: string;
  name: string;
  desc: string;
  rank: number;
}

/** 채널이 끝나면 둘 중 하나를 고른다. 다음 채널이 조금 덜 맨땅이 된다 */
export const CARDS: Card[] = [
  { id: 'savings', name: '모아 둔 돈', desc: '시작 자금 +50만 원', rank: 1 },
  { id: 'body', name: '튼튼한 몸', desc: '시작 체력 +20', rank: 1 },
  { id: 'ideas', name: '아이디어 노트', desc: '다시 뽑기 +4', rank: 1 },
  { id: 'gear', name: '남은 장비', desc: '시작 편집 +12', rank: 2 },
  { id: 'mentor', name: '선배 유튜버', desc: '시작 기획 +10', rank: 2 },
  { id: 'thickskin', name: '굳은살', desc: '시작 멘탈 +15', rank: 2 },
  { id: 'fans', name: '따라온 팬', desc: '시작 구독자 +200', rank: 3 },
  { id: 'lawyer', name: '아는 변호사', desc: '첫 경고가 멀어진다', rank: 3 },
  { id: 'luckystart', name: '터지는 컨셉', desc: '잘 터지는 컨셉이 나올 확률 세 배', rank: 3 },
];

/** 안 가진 카드 중 n 장. 드문 것이 덜 나온다 */
export function drawCards(owned: string[], n = 2): Card[] {
  let pool = CARDS.filter((c) => !owned.includes(c.id));
  const out: Card[] = [];
  while (pool.length && out.length < n) {
    const c = pick(pool, (x) => 1 / x.rank);
    out.push(c);
    pool = pool.filter((x) => x.id !== c.id);
  }
  return out;
}
