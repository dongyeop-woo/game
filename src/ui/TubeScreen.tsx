import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { CONCEPTS } from '../tube/content';
import {
  CARDS,
  TICKS,
  answer,
  bodyCost,
  buy,
  cadenceOf,
  canBuy,
  conceptOf,
  dateOf,
  dismissNotice,
  dismissReport,
  drawCards,
  fmtBig,
  fmtSubs,
  fmtWon,
  moodOf,
  nextCadence,
  payIn,
  play,
  questOf,
  rename,
  reroll,
  shopOf,
  stageOf,
  start,
  vibeOf,
  type Card,
} from '../tube/engine';
import type { Choice, Dealt, Delta, Item, Run, StatKey } from '../tube/types';
import { StudioScreen } from './StudioScreen';
import { Room } from './Room';
import { MusicBar } from './MusicBar';
import { Text } from './Text';

/**
 * 유튜버 키우기 화면.
 *
 * 기획은 `docs/design.md`.
 *
 * 방이 화면 전체에 깔리고, 위에 유튜브 홈처럼 로고 줄과 칩 줄, 아래에
 * 퀘스트·플레이어·메뉴가 뜬다. 창은 전부 가운데 모달이다 - 컨셉 뽑기,
 * 업로드(카드 손), 쇼핑, 스튜디오, 끼어드는 일, 주간 결산, 결과 카드.
 *
 * 화면은 상태를 읽기만 한다. 바꾸는 건 `tube/engine.ts` 뿐이다.
 */

const P = {
  bg: '#ffffff',
  soft: '#f3f4f6',
  line: '#e5e7eb',
  ink: '#111827',
  dim: '#6b7280',
  faint: '#9ca3af',
  red: '#ff0033',
  good: '#16a34a',
  bad: '#dc2626',
};

const STAT: Record<StatKey, { name: string; color: string }> = {
  plan: { name: '기획', color: '#2563eb' },
  edit: { name: '편집', color: '#0891b2' },
  mind: { name: '멘탈', color: '#7c3aed' },
  body: { name: '체력', color: '#f59e0b' },
};

/** 체력은 빨강, 멘탈은 초록. 바닥이면 흐려진다 */
const GAUGE: Partial<Record<StatKey, string>> = { body: '#ef4444', mind: '#22c55e' };

/** 썸네일 색. 행동 종류마다 다르면 카드가 그림 없이도 구분된다 */
const THUMB: Record<string, string> = {
  careful: '#1d4ed8',
  quick: '#6b7280',
  trend: '#7c3aed',
  bait: '#dc2626',
  study: '#0f766e',
  rest: '#a16207',
  shorts: '#334155',
  series: '#1d4ed8',
  collab: '#db2777',
  daily: '#6b7280',
  react: '#dc2626',
  sponsor: '#15803d',
  editor: '#0e7490',
  rest2: '#a16207',
  shorts2: '#334155',
  brand: '#15803d',
  team: '#0e7490',
  tv: '#db2777',
  merch: '#b45309',
  politics: '#dc2626',
  charity: '#1d4ed8',
  rest3: '#a16207',
  shorts3: '#334155',
};

/**
 * 썸네일 위에 크게 박을 주된 이득.
 *
 * 구독자가 붙으면 그게 주인공이다. 안 붙는 카드(공부·휴식)는 제일 많이
 * 오르는 스탯을 앞세운다.
 */
function headline(r: Run, h: Dealt): { label: string; value: string } {
  if (h.gain > 0) return { label: '예상 구독자', value: `+${h.gain.toLocaleString()}` };
  const d: Delta = { ...h.action.d, body: bodyCost(r, h.action) };
  let best: StatKey | null = null;
  for (const k of Object.keys(STAT) as StatKey[]) {
    const v = d[k] ?? 0;
    if (v > 0 && (best === null || v > (d[best] ?? 0))) best = k;
  }
  if (best) return { label: STAT[best].name, value: `+${d[best]}` };
  if (d.money && d.money > 0) return { label: '수익', value: `+${fmtWon(d.money)}` };
  return { label: '', value: '' };
}

/** 주된 이득 말고 나머지. 영상 아래 설명 줄에 작게 */
function meta(r: Run, h: Dealt, skip: string): string {
  const d: Delta = { ...h.action.d, body: bodyCost(r, h.action) };
  const out: string[] = [];
  (Object.keys(STAT) as StatKey[]).forEach((k) => {
    const v = d[k];
    if (v && STAT[k].name !== skip) out.push(`${STAT[k].name} ${v > 0 ? '+' : ''}${v}`);
  });
  if (d.money && skip !== '수익') out.push(`${d.money > 0 ? '+' : ''}${fmtWon(d.money)}`);
  return out.join(' · ');
}

/** 지금 퀘스트가 몇 번째인가. 진행 줄 앞에 붙는 숫자다 */
const QUESTS_INDEX = (r: Run) => r.questDone.length;

const TUT_KEY = 'tube.tutorialDone';

/** 글 한 줄. 댓글이면 앞의 💬 를 말풍선 아이콘으로 바꿔 그린다 */
function LineText({ text, style, lines }: { text: string; style: any; lines?: number }) {
  const isCmt = text.startsWith('💬');
  const color = StyleSheet.flatten(style)?.color ?? P.ink;
  return (
    <Text style={style} numberOfLines={lines}>
      {isCmt ? <MaterialCommunityIcons name="comment-outline" size={13} color={color} /> : null}
      {isCmt ? ' ' + text.slice(2).trimStart() : text}
    </Text>
  );
}

/**
 * 튜토리얼 일곱 단계. 말풍선 자리(위/아래)와 글. `wait` 가 있으면 "다음" 대신
 * 실제로 그 조작을 해야 넘어간다.
 */
const TUT: { at: 'top' | 'bottom'; text: string; wait?: string }[] = [
  { at: 'top', text: '구독자가 주인공입니다. 옆은 잔고와 실력 넷 - 기획은 노출, 편집은 이탈률과 업로드 주기, 체력이 0이면 번아웃, 멘탈이 0이면 댓글창을 닫습니다.' },
  { at: 'top', text: '밑의 작은 글씨가 지금 구간과 다음 목표, 정산일, 업로드 주기, 이번 주 알고리즘입니다. 알고리즘은 아직 ? 입니다.' },
  { at: 'bottom', text: '하루에 영상을 셋까지 올립니다. 아래 업로드를 눌러 보세요.', wait: '업로드 누르기' },
  { at: 'top', text: '카드 넉 장 중 하나를 고릅니다. 썸네일의 숫자는 예상 구독자, 밑 줄은 실력 변화입니다. 마음에 안 들면 다시 뽑기. 하나 골라서 올려 보세요.', wait: '카드 하나 올리기' },
  { at: 'bottom', text: '올렸습니다. 조회수는 내일 아침에 옵니다 - 올리고 자고 일어나서 보는 게 이 직업입니다. 셋을 다 쓰면 하루가 넘어갑니다.' },
  { at: 'bottom', text: '알고리즘은 매주 바뀝니다. 맞는 영상은 유입이 뛰고 틀리면 덜 뜹니다. "쇼츠를 본다" 카드로 알아내거나, 카드에 유독 큰 숫자를 보고 눈치채세요.' },
  { at: 'bottom', text: '스튜디오에서 내 채널을, 쇼핑에서 장비를 봅니다. 나머지는 퀘스트가 하나씩 알려 줍니다. 수위를 넘으면 경고가 오고, 세 번째엔 고소장입니다.' },
];

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
const good = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
const bad = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

export function TubeScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<string[]>([]);
  const [run, setRun] = useState<Run>(() => start([], []));
  /** 시작 창. 컨셉을 뽑고 이름을 짓는다 */
  const [intro, setIntro] = useState<'roll' | 'name' | null>('roll');
  /** 채널이 끝났을 때 고를 카드 둘 */
  const [offer, setOffer] = useState<Card[]>([]);
  const [studio, setStudio] = useState(false);
  const [sheet, setSheet] = useState<'study' | 'shop' | null>(null);
  /** 컴퓨터 앞에 앉은 횟수. 오를 때마다 방이 작업 장면이 된다 */
  const [work, setWork] = useState(0);
  /** 튜토리얼 단계. -1 이면 안 띄운다 (끝냈거나 아직 모름) */
  const [tut, setTut] = useState(-1);
  const [tutDone, setTutDone] = useState<boolean | null>(null);

  // 처음 켠 사람에게만 가르친다
  useEffect(() => {
    AsyncStorage.getItem(TUT_KEY)
      .then((v) => setTutDone(v === '1'))
      .catch(() => setTutDone(true));
  }, []);
  useEffect(() => {
    if (intro === null && tutDone === false && tut === -1) setTut(0);
  }, [intro, tutDone, tut]);
  // 조작이 필요한 단계는 실제로 해야 넘어간다
  useEffect(() => {
    if (tut === 2 && sheet === 'study') setTut(3);
    if (tut === 3 && run.uploads >= 1) setTut(4);
  }, [tut, sheet, run.uploads]);
  const endTut = useCallback(() => {
    setTut(-1);
    setTutDone(true);
    AsyncStorage.setItem(TUT_KEY, '1').catch(() => {});
  }, []);
  const win = useWindowDimensions();

  const stage = stageOf(run);
  const concept = conceptOf(run.concept);
  const cad = cadenceOf(run);
  const next = nextCadence(run);
  const mood = moodOf(run);
  const push = useCallback((next: Run) => setRun({ ...next }), []);

  // 채널이 끝나면 카드 둘을 내민다
  useEffect(() => {
    if (run.dead && offer.length === 0) {
      setOffer(drawCards(cards, 2));
      if (run.dead.good) good();
      else bad();
    }
  }, [run.dead, cards, offer.length]);

  const onPlay = useCallback(
    (h: Dealt) => {
      tap();
      // 쉬는 카드가 아니면 컴퓨터 앞에 앉는다. 창을 닫아야 장면이 보인다
      if (!(h.action.d.body && h.action.d.body > 0)) setWork((n) => n + 1);
      setSheet(null);
      const before = run.lines.length;
      const next = play(run, h);
      // 경고가 왔으면 손에 알려 준다
      if (next.lines.slice(before).some((l) => l.tone === 'bad')) bad();
      push(next);
    },
    [run, push],
  );
  const onChoice = useCallback(
    (c: Choice) => {
      tap();
      push(answer(run, c));
    },
    [run, push],
  );
  const onReroll = useCallback(() => {
    tap();
    push(reroll(run));
  }, [run, push]);
  const onBuy = useCallback(
    (i: Item) => {
      tap();
      push(buy(run, i.id));
    },
    [run, push],
  );
  const onPick = useCallback(
    (c: Card | null) => {
      const owned = c ? [...cards, c.id] : cards;
      setCards(owned);
      setOffer([]);
      // 깬 퀘스트는 들고 간다. 배운 걸 또 시키면 짜증난다
      setRun(start(owned, run.questDone));
      setIntro('roll');
    },
    [cards, run.questDone],
  );

  const quest = questOf(run);
  const daysLeft = stage.days - run.day + 1;
  const date = dateOf(run.age);
  const pay = payIn(run.age);

  return (
    <View style={s.root}>
      {/* 방이 화면 전체다. 나머지는 그 위에 뜬다 */}
      <View style={StyleSheet.absoluteFill}>
        <Room stage={stage.id} work={work} w={win.width} h={win.height} />
      </View>

      {/* ---------------- 위: 유튜브 홈처럼. 로고 줄 + 칩 줄 */}
      <View style={[s.top, { paddingTop: insets.top + 4 }]}>
        <View style={s.logoRow}>
          <View style={s.logo}>
            <View style={s.logoTri} />
          </View>
          <Text style={s.logoText} numberOfLines={1}>
            {run.name}
          </Text>
          {mood ? (
            <View style={s.mood}>
              <Text style={s.moodText}>{mood}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Text style={s.logoMeta}>
            {date.month}월 {date.day}일 · D-{daysLeft}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipsBox}>
          <View style={[s.chip, s.chipOn]}>
            <Text style={s.chipOnText}>구독자 {run.subs.toLocaleString()}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipText}>{fmtWon(run.money)}</Text>
          </View>
          {(['plan', 'edit'] as StatKey[]).map((k) => (
            <View key={k} style={s.chip}>
              <Text style={s.chipText}>
                {STAT[k].name} <Text style={{ color: STAT[k].color }}>{run.stats[k]}</Text>
              </Text>
            </View>
          ))}
        </ScrollView>
        {/* 체력·멘탈은 막대로. 0 이 되면 끝나는 값이라 숫자보다 길이가 먼저 보여야 한다 */}
        <View style={s.gauges}>
          {(['body', 'mind'] as StatKey[]).map((k) => (
            <View key={k} style={s.gauge}>
              <Text style={s.gaugeName}>{STAT[k].name}</Text>
              <View style={s.gaugeBg}>
                <View
                  style={[
                    s.gaugeBar,
                    { width: `${run.stats[k]}%`, backgroundColor: GAUGE[k], opacity: run.stats[k] <= 15 ? 0.55 : 1 },
                  ]}
                />
              </View>
              <Text style={[s.gaugeNum, run.stats[k] <= 15 && { color: P.bad }]}>{run.stats[k]}</Text>
            </View>
          ))}
        </View>
        <Text style={s.sceneMeta}>
          {concept.name} · {stage.name} · 다음 {fmtSubs(stage.goal)} · 정산 {pay === 0 ? '오늘' : `${pay}일 뒤`} · {cad.name}
          {next ? ` (편집 ${next.edit}이면 ${next.name})` : ''} · 알고리즘 {run.trendKnown ? vibeOf(run.trend).name : '?'}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* 최근 알림. 방 위에 바로 얹힌다 */}
      <View style={s.feed}>
        {run.lines.slice(-4).map((ln) => (
          <LineText
            key={ln.id}
            style={[
              s.feedLine,
              ln.tone === 'good' && { color: '#86efac' },
              ln.tone === 'bad' && { color: '#fca5a5' },
              ln.tone === 'ev' && { color: '#93c5fd' },
              ln.tone === 'sys' && { color: 'rgba(255,255,255,0.6)' },
            ]}
            lines={2}
            text={ln.text}
          />
        ))}
      </View>

      {/* 퀘스트 줄 */}
      {quest && !run.dead ? (
        <View style={s.questBox}>
          {quest.tip ? (
            <View style={s.tip}>
              <MaterialIcons name="lightbulb-outline" size={16} color="#a16207" style={{ marginTop: 1 }} />
              <Text style={s.tipText} numberOfLines={2}>
                {quest.tip}
              </Text>
            </View>
          ) : null}
          <View style={s.questRow}>
            <Text style={s.questNum}>{QUESTS_INDEX(run) + 1}.</Text>
            <Text style={s.questText} numberOfLines={1}>
              {quest.text}
            </Text>
            <Text style={s.questCount}>
              ({Math.min(quest.count(run), quest.need).toLocaleString()}/{quest.need.toLocaleString()})
            </Text>
          </View>
        </View>
      ) : null}

      <View style={{ marginBottom: 8 }}>
        <MusicBar />
      </View>

      {/* ---------------- 아래 메뉴. 업로드 · 스튜디오 · 쇼핑 */}
      <View style={[s.menu, { marginBottom: insets.bottom + 6 }]}>
        <MenuBtn label="업로드" badge={run.ticks > 0 ? String(run.ticks) : undefined} icon="play" onPress={() => setSheet('study')} />
        <MenuBtn label="스튜디오" icon="chart" onPress={() => setStudio(true)} />
        <MenuBtn label="쇼핑" icon="bag" onPress={() => setSheet('shop')} />
      </View>

      {/* ---------------- 가운데 창. 급한 것부터 */}
      {intro ? (
        <Intro run={run} phase={intro} onNext={() => setIntro('name')} onDone={(name) => {
          push(rename(run, name));
          setIntro(null);
        }} />
      ) : run.dead ? (
        <Sheet title="채널이 끝났다">
          <Ending run={run} offer={offer} onPick={onPick} />
        </Sheet>
      ) : run.notices.length ? (
        <Sheet title={run.notices[0].title} sub={run.notices[0].sub}>
          <ScrollView style={{ maxHeight: win.height * 0.55 }} showsVerticalScrollIndicator={false}>
            {run.notices[0].lines.map((ln, i) => (
              <View key={i} style={s.noteRow}>
                <View
                  style={[
                    s.noteDot,
                    ln.tone === 'good' && { backgroundColor: P.good },
                    ln.tone === 'bad' && { backgroundColor: P.bad },
                    ln.tone === 'ev' && { backgroundColor: '#3b82f6' },
                  ]}
                />
                <LineText style={[s.noteText, ln.tone === 'sys' && { color: P.dim }]} text={ln.text} />
              </View>
            ))}
          </ScrollView>
          <Pressable
            style={s.big}
            onPress={() => {
              tap();
              push(dismissNotice(run));
            }}
          >
            <Text style={s.bigText}>확인{run.notices.length > 1 ? ` (${run.notices.length - 1}개 더)` : ''}</Text>
          </Pressable>
        </Sheet>
      ) : run.pending ? (
        <Sheet title="일이 생겼다">
          <Text style={s.askText}>{run.pending.text}</Text>
          {run.pending.choices?.map((c) => (
            <Pressable key={c.label} style={s.choice} onPress={() => onChoice(c)}>
              <Text style={s.choiceText}>{c.label}</Text>
            </Pressable>
          ))}
        </Sheet>
      ) : run.report ? (
        <Sheet title={`${run.report.week}주차 결산`} sub="월요일 아침">
          <Report run={run} />
          <Pressable style={s.big} onPress={() => push(dismissReport(run))}>
            <Text style={s.bigText}>확인</Text>
          </Pressable>
        </Sheet>
      ) : studio ? (
        <View style={s.dim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setStudio(false)} />
          <StudioScreen run={run} onRun={push} onClose={() => setStudio(false)} />
        </View>
      ) : sheet === 'study' ? (
        <Sheet title="오늘 올릴 영상" sub={`${run.ticks}/${TICKS}편 남음`} onClose={() => setSheet(null)}>
          {run.hand.map((h) => {
            const head = headline(run, h);
            const hot = h.action.vibe && run.trendKnown && h.action.vibe === run.trend;
            return (
              <Pressable key={h.key} style={s.row} onPress={() => onPlay(h)}>
                <View style={[s.thumb, { backgroundColor: THUMB[h.action.id] ?? '#374151' }]}>
                  {hot ? (
                    <View style={s.hot}>
                      <MaterialIcons name="trending-up" size={11} color={P.ink} />
                      <Text style={s.hotText}>이번 주 결</Text>
                    </View>
                  ) : null}
                  <View style={s.badge}>
                    <Text style={s.badgeLabel}>{head.label}</Text>
                    <Text style={s.badgeVal}>{head.value}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.vTitle} numberOfLines={1}>
                    {h.action.name}
                  </Text>
                  <Text style={s.vHint} numberOfLines={1}>
                    {h.action.hint}
                  </Text>
                  <Text style={s.vMeta} numberOfLines={1}>
                    {meta(run, h, head.label)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Pressable onPress={onReroll} disabled={run.rerolls <= 0} style={[s.reroll, run.rerolls <= 0 && s.off]}>
            <Text style={s.rerollText}>아이디어 다시 뽑기 · {run.rerolls}번 남음</Text>
          </Pressable>
        </Sheet>
      ) : sheet === 'shop' ? (
        <Sheet title="쇼핑" sub={`잔고 ${fmtWon(run.money)}`} onClose={() => setSheet(null)}>
          <ScrollView style={{ maxHeight: win.height * 0.6 }} showsVerticalScrollIndicator={false}>
            {shopOf(run).map((i) => {
              const owned = i.once && run.gear.includes(i.id);
              const ok = canBuy(run, i);
              return (
                <View key={i.id} style={s.item}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{i.name}</Text>
                    <Text style={s.itemDesc}>{i.desc}</Text>
                  </View>
                  <Pressable disabled={!ok} onPress={() => onBuy(i)} style={[s.buy, owned && s.buyOwned, !ok && !owned && s.off]}>
                    <Text style={[s.buyText, owned && { color: P.dim }]}>{owned ? '보유' : fmtWon(i.price)}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </Sheet>
      ) : null}

      {/* ---------------- 튜토리얼 말풍선. 다른 창 위에 뜬다 */}
      {tut >= 0 && tut < TUT.length ? (
        <View pointerEvents="box-none" style={[s.tutWrap, TUT[tut].at === 'top' ? { top: insets.top + 118 } : { bottom: insets.bottom + 170 }]}>
          <View style={s.tut}>
            <Text style={s.tutStep}>
              {tut + 1}/{TUT.length}
            </Text>
            <Text style={s.tutText}>{TUT[tut].text}</Text>
            {TUT[tut].wait ? (
              <Text style={s.tutWait}>→ {TUT[tut].wait}</Text>
            ) : (
              <Pressable style={s.tutBtn} onPress={() => (tut + 1 >= TUT.length ? endTut() : setTut(tut + 1))}>
                <Text style={s.tutBtnText}>{tut + 1 >= TUT.length ? '시작' : '다음'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

    </View>
  );
}

/**
 * 시작 창. 컨셉이 룰렛처럼 돌다가 멈추고, 그다음 채널 이름을 짓는다.
 *
 * 컨셉은 엔진이 이미 뽑아 뒀다. 여기서는 **보여 주는 척**만 한다 - 돌아가는
 * 동안 기대가 생기고, 멈췄을 때 환호나 한숨이 나온다. 그게 첫 분노 담당이다.
 */
function Intro({ run, phase, onNext, onDone }: { run: Run; phase: 'roll' | 'name'; onNext: () => void; onDone: (name: string) => void }) {
  const concept = conceptOf(run.concept);
  const [spin, setSpin] = useState<string | null>(CONCEPTS[0].name);
  const [name, setName] = useState(run.name);

  useEffect(() => {
    if (phase !== 'roll') return;
    let i = 0;
    let delay = 70;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setSpin(CONCEPTS[i % CONCEPTS.length].name);
      delay *= 1.13;
      if (delay < 420) {
        t = setTimeout(tick, delay);
      } else {
        setSpin(null);
        if (concept.rank >= 4) good();
        else tap();
      }
    };
    t = setTimeout(tick, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);


  if (phase === 'roll') {
    return (
      <Sheet title="채널을 판다" sub="컨셉은 랜덤이다">
        <View style={s.roll}>
          <Text style={s.rollLabel}>{spin ? '뽑는 중' : '이번 채널은'}</Text>
          <Text style={[s.rollName, spin ? { color: P.faint } : null]}>{spin ?? concept.name}</Text>
          {spin ? null : (
            <>
              <View style={s.rollStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <MaterialIcons key={i} name={i <= concept.rank ? 'star' : 'star-border'} size={22} color={i <= concept.rank ? (concept.rank >= 4 ? P.red : '#f59e0b') : P.line} />
                ))}
              </View>
              <Text style={s.rollLine}>{concept.line}</Text>
            </>
          )}
        </View>
        {spin ? null : (
          <Pressable style={s.big} onPress={onNext}>
            <Text style={s.bigText}>이 컨셉으로 간다</Text>
          </Pressable>
        )}
        {spin ? null : <Text style={s.endFoot}>다른 컨셉은 못 고른다. 채널을 접고 다시 파면 된다.</Text>}
      </Sheet>
    );
  }
  return (
    <Sheet title="채널 이름" sub={concept.name}>
      <TextInput value={name} onChangeText={setName} maxLength={14} style={s.input} placeholder="채널 이름" placeholderTextColor={P.faint} autoFocus />
      <View style={s.sugg}>
        {concept.names.map((n) => (
          <Pressable key={n} style={[s.chip, name === n && s.chipOn]} onPress={() => setName(n)}>
            <Text style={name === n ? s.chipOnText : s.chipText}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={s.big} onPress={() => onDone(name)}>
        <Text style={s.bigText}>채널 개설</Text>
      </Pressable>
    </Sheet>
  );
}

/** 주간 결산 한 장. 지난주 알고리즘을 그제야 알려 준다 */
function Report({ run }: { run: Run }) {
  const r = run.report!;
  return (
    <View style={s.report}>
      <View style={s.reportRow}>
        <Text style={s.reportKey}>올린 영상</Text>
        <Text style={s.reportVal}>{r.videos}편</Text>
      </View>
      <View style={s.reportRow}>
        <Text style={s.reportKey}>조회수</Text>
        <Text style={s.reportVal}>{fmtBig(r.views)}</Text>
      </View>
      <View style={s.reportRow}>
        <Text style={s.reportKey}>구독자</Text>
        <Text style={[s.reportVal, { color: P.good }]}>+{r.subs.toLocaleString()}</Text>
      </View>
      <View style={s.hr} />
      <View style={s.reportRow}>
        <Text style={s.reportKey}>지난주 알고리즘</Text>
        <Text style={s.reportVal}>{r.trendWas}</Text>
      </View>
      <View style={s.reportRow}>
        <Text style={s.reportKey}>결에 맞춘 영상</Text>
        <Text style={s.reportVal}>
          {r.hits}/{r.videos}편
        </Text>
      </View>
      <Text style={s.reportFoot}>
        {r.videos === 0 ? '이번 주엔 아무것도 안 올렸다.' : r.hits === r.videos ? '다 맞췄다. 이런 주는 드물다.' : r.hits === 0 ? '하나도 안 맞췄다. 쇼츠를 봤어야 했다.' : '반쯤 맞췄다. 새 주의 결은 또 다르다.'}
      </Text>
    </View>
  );
}

/**
 * 아래 메뉴 한 칸. 유튜브 탭바처럼 얇은 선 아이콘 + 작은 글씨.
 * 아이콘은 선으로 그린 자리 표시다 - 그림이 오면 바꾼다. 빨간 점은 남은 편수.
 */
function MenuBtn({
  label,
  icon,
  badge,
  onPress,
}: {
  label: string;
  icon: 'play' | 'chart' | 'bag';
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.menuBtn} onPress={onPress}>
      <View style={s.menuIcon}>
        {icon === 'play' ? (
          <MaterialIcons name="add-circle-outline" size={28} color={P.ink} />
        ) : icon === 'chart' ? (
          <MaterialIcons name="insights" size={26} color={P.ink} />
        ) : (
          <MaterialCommunityIcons name="shopping-outline" size={25} color={P.ink} />
        )}
        {badge ? (
          <View style={s.dot}>
            <Text style={s.dotText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.menuLabel}>{label}</Text>
    </Pressable>
  );
}

/** 화면 가운데 뜨는 창. 뒤는 어두워지고, 닫기가 있으면 바깥을 눌러도 닫힌다 */
function Sheet({
  title,
  sub,
  onClose,
  children,
}: {
  title: string;
  sub?: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={s.dim}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} disabled={!onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>{title}</Text>
          {sub ? <Text style={s.sheetSub}>{sub}</Text> : null}
          <View style={{ flex: 1 }} />
          {onClose ? (
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialIcons name="close" size={22} color={P.ink} />
            </Pressable>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  );
}

/**
 * 결과 카드. **이게 공유물이다.** 망한 쪽이 잘된 쪽보다 더 잘 돈다.
 *
 * 카드 부분만 그림으로 떠서 공유한다. 그 밑에 부계정 카드 둘 중 하나를 고른다.
 */
function Ending({ run, offer, onPick }: { run: Run; offer: Card[]; onPick: (c: Card | null) => void }) {
  const d = run.dead!;
  const ref = useRef<View>(null);
  const concept = conceptOf(run.concept);
  const share = async () => {
    try {
      tap();
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch {
      // 공유가 안 되는 환경이면 조용히 넘어간다
    }
  };
  return (
    <View style={s.end}>
      <View ref={ref} collapsable={false} style={[s.card, d.good ? s.cardGood : s.cardBad]}>
        <View style={s.cardHead}>
          <View style={[s.logo, { backgroundColor: d.good ? '#ffffff' : P.red }]}>
            <View style={[s.logoTri, { borderLeftColor: d.good ? P.red : '#ffffff' }]} />
          </View>
          <Text style={s.cardChannel} numberOfLines={1}>
            {run.name}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={s.cardDays}>{run.age}일째</Text>
        </View>
        <Text style={s.cardName}>{d.name}</Text>
        <Text style={s.cardLine}>{d.line}</Text>
        <View style={s.cardNums}>
          <View style={s.cardNum}>
            <Text style={s.cardNumVal}>{fmtSubs(run.subs)}</Text>
            <Text style={s.cardNumKey}>구독자</Text>
          </View>
          <View style={s.cardNum}>
            <Text style={s.cardNumVal}>{run.videos.length}</Text>
            <Text style={s.cardNumKey}>영상</Text>
          </View>
          <View style={s.cardNum}>
            <Text style={s.cardNumVal}>{fmtBig(run.videos.reduce((a, v) => a + v.views, 0))}</Text>
            <Text style={s.cardNumKey}>조회수</Text>
          </View>
          <View style={s.cardNum}>
            <Text style={s.cardNumVal}>{run.met.length}</Text>
            <Text style={s.cardNumKey}>만난 사람</Text>
          </View>
        </View>
        <Text style={s.cardFoot}>
          {concept.name} · {cadenceOf(run).name} · 기획 {run.stats.plan} 편집 {run.stats.edit} 체력 {run.stats.body} 멘탈 {run.stats.mind}
        </Text>
        <Text style={s.cardBrand}>유튜버 키우기</Text>
      </View>

      <Pressable style={s.shareBtn} onPress={share}>
        <MaterialIcons name="share" size={18} color={P.ink} />
        <Text style={s.shareText}>결과 공유하기</Text>
      </Pressable>

      {offer.length ? (
        <>
          <Text style={s.offerTitle}>부계정 카드 - 하나만 들고 간다</Text>
          <View style={s.offerRow}>
            {offer.map((c) => (
              <Pressable key={c.id} style={s.offer} onPress={() => onPick(c)}>
                <View style={{ flexDirection: 'row' }}>
                  {Array.from({ length: c.rank }).map((_, i) => (
                    <MaterialIcons key={i} name="star" size={14} color="#f59e0b" />
                  ))}
                </View>
                <Text style={s.offerName}>{c.name}</Text>
                <Text style={s.offerDesc}>{c.desc}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <Pressable style={s.big} onPress={() => onPick(null)}>
          <Text style={s.bigText}>새 채널을 판다</Text>
        </Pressable>
      )}
      <Text style={s.endFoot}>
        카드 {CARDS.length}종 중 {run.cards.length}장 보유
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2b2f40' },

  /* 위. 흰 판 위에 로고 줄과 칩 줄 - 유튜브 홈 위쪽 */
  top: { backgroundColor: P.bg, paddingBottom: 10, paddingHorizontal: 12, gap: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { width: 28, height: 20, borderRadius: 6, backgroundColor: P.red, alignItems: 'center', justifyContent: 'center' },
  logoTri: {
    width: 0,
    height: 0,
    marginLeft: 2,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },
  logoText: { color: P.ink, fontSize: 18, maxWidth: 170 },
  logoMeta: { color: P.dim, fontSize: 12 },
  mood: { backgroundColor: '#fee2e2', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  moodText: { color: P.bad, fontSize: 11 },
  chipsBox: { flexGrow: 0, marginHorizontal: -12 },
  chips: { flexDirection: 'row', gap: 6, paddingHorizontal: 12 },
  chip: { backgroundColor: P.soft, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6 },
  chipOn: { backgroundColor: P.ink },
  chipText: { color: P.ink, fontSize: 13 },
  chipOnText: { color: P.bg, fontSize: 13 },
  sceneMeta: { color: P.dim, fontSize: 11, lineHeight: 16 },
  gauges: { flexDirection: 'row', gap: 14 },
  gauge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  gaugeName: { color: P.dim, fontSize: 11, width: 24 },
  gaugeBg: { flex: 1, height: 8, borderRadius: 999, backgroundColor: P.soft, overflow: 'hidden' },
  gaugeBar: { height: 8, borderRadius: 999 },
  gaugeNum: { color: P.ink, fontSize: 12, width: 22, textAlign: 'right' },

  feed: { gap: 3, paddingHorizontal: 16, paddingBottom: 8 },
  feedLine: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },

  /* 아래 메뉴. 유튜브 탭바 톤 - 흰 판, 얇은 아이콘, 작은 글씨. 자리는 독처럼 띄운다 */
  menu: {
    flexDirection: 'row',
    marginHorizontal: 12,
    backgroundColor: P.bg,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.line,
  },
  menuBtn: { flex: 1, alignItems: 'center', gap: 4 },
  menuIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { color: P.ink, fontSize: 11 },
  icoPlay: { width: 24, height: 18, borderRadius: 5, borderWidth: 2, borderColor: P.ink, alignItems: 'center', justifyContent: 'center' },
  icoTri: {
    width: 0,
    height: 0,
    marginLeft: 1,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: P.ink,
  },
  icoChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 18 },
  icoBar: { width: 5, borderRadius: 1.5, backgroundColor: P.ink },
  icoBag: { width: 20, height: 17, borderRadius: 3, borderWidth: 2, borderColor: P.ink, marginTop: 5, alignItems: 'center' },
  icoHandle: { width: 10, height: 8, borderWidth: 2, borderColor: P.ink, borderBottomWidth: 0, borderTopLeftRadius: 5, borderTopRightRadius: 5, marginTop: -8 },
  dot: { position: 'absolute', top: -3, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: P.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dotText: { color: '#ffffff', fontSize: 10 },

  questBox: { gap: 5, marginHorizontal: 12, marginBottom: 8 },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#f5e6a3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tipIcon: { fontSize: 14 },
  tipText: { color: '#5b4a0a', fontSize: 12, lineHeight: 17, flex: 1 },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17,24,39,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  questNum: { color: P.faint, fontSize: 12 },
  questText: { color: P.bg, fontSize: 13, flex: 1 },
  questCount: { color: '#fbbf24', fontSize: 12 },

  /* 튜토리얼 */
  tutWrap: { position: 'absolute', left: 14, right: 14 },
  tut: { backgroundColor: '#fffbe6', borderWidth: 1, borderColor: '#f5e6a3', borderRadius: 16, padding: 14, gap: 6 },
  tutStep: { color: '#a16207', fontSize: 11 },
  tutText: { color: '#3f3200', fontSize: 14, lineHeight: 21 },
  tutWait: { color: P.red, fontSize: 13, marginTop: 2 },
  tutBtn: { alignSelf: 'flex-end', backgroundColor: P.ink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, marginTop: 2 },
  tutBtnText: { color: P.bg, fontSize: 13 },

  /* 가운데 창 */
  dim: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 18 },
  sheet: { backgroundColor: P.bg, borderRadius: 22, padding: 16, gap: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  sheetTitle: { color: P.ink, fontSize: 18 },
  sheetSub: { color: P.dim, fontSize: 12 },
  sheetClose: { color: P.dim, fontSize: 13 },

  /* 영상 한 줄. 왼쪽 썸네일, 오른쪽 제목 */
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 6 },
  thumb: { width: 128, height: 72, borderRadius: 10, padding: 6, justifyContent: 'flex-end', alignItems: 'flex-end' },
  hot: { position: 'absolute', left: 6, top: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fbbf24', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  hotText: { color: P.ink, fontSize: 9 },
  badge: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'flex-end' },
  badgeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
  badgeVal: { color: '#ffffff', fontSize: 15, marginTop: -2 },
  vTitle: { color: P.ink, fontSize: 15 },
  vHint: { color: P.dim, fontSize: 11, marginTop: 1 },
  vMeta: { color: P.dim, fontSize: 11, marginTop: 2 },
  reroll: { alignItems: 'center', paddingVertical: 9, backgroundColor: P.soft, borderRadius: 999, marginTop: 4 },
  off: { opacity: 0.35 },
  rerollText: { color: P.ink, fontSize: 13 },

  /* 상점 */
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: P.line },
  itemName: { color: P.ink, fontSize: 15 },
  itemDesc: { color: P.dim, fontSize: 12, marginTop: 2 },
  buy: { backgroundColor: P.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, minWidth: 72, alignItems: 'center' },
  buyOwned: { backgroundColor: P.soft },
  buyText: { color: P.bg, fontSize: 13 },

  askText: { color: P.ink, fontSize: 15, lineHeight: 22, paddingHorizontal: 4, paddingBottom: 2 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: P.line },
  noteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P.faint, marginTop: 7 },
  noteText: { color: P.ink, fontSize: 14, lineHeight: 21, flex: 1 },
  choice: { backgroundColor: P.soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  choiceText: { color: P.ink, fontSize: 15 },

  /* 시작 창 */
  roll: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  rollLabel: { color: P.dim, fontSize: 13 },
  rollName: { color: P.ink, fontSize: 32, lineHeight: 40 },
  rollStars: { flexDirection: 'row', gap: 2 },
  rollLine: { color: P.dim, fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: P.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: P.ink, fontFamily: 'BMJUA' },
  sugg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  /* 주간 결산 */
  report: { gap: 2 },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  reportKey: { color: P.dim, fontSize: 14, flex: 1 },
  reportVal: { color: P.ink, fontSize: 17 },
  hr: { height: 1, backgroundColor: P.line, marginVertical: 6 },
  reportFoot: { color: P.dim, fontSize: 13, lineHeight: 19, marginTop: 6 },

  /* 결과 카드 */
  end: { gap: 10 },
  card: { borderRadius: 18, padding: 18, gap: 6 },
  cardGood: { backgroundColor: '#111827' },
  cardBad: { backgroundColor: '#7f1d1d' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardChannel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, maxWidth: 180 },
  cardDays: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  cardName: { color: '#ffffff', fontSize: 30, lineHeight: 38 },
  cardLine: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19 },
  cardNums: { flexDirection: 'row', marginTop: 10, gap: 6 },
  cardNum: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  cardNumVal: { color: '#ffffff', fontSize: 18 },
  cardNumKey: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },
  cardFoot: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 8 },
  cardBrand: { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'right' },
  shareBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, backgroundColor: P.soft, borderRadius: 999 },
  shareText: { color: P.ink, fontSize: 14 },
  offerTitle: { color: P.dim, fontSize: 12, textAlign: 'center', marginTop: 4 },
  offerRow: { flexDirection: 'row', gap: 8 },
  offer: { flex: 1, borderWidth: 1, borderColor: P.line, borderRadius: 14, padding: 12, gap: 3 },
  offerRank: { color: '#f59e0b', fontSize: 12 },
  offerName: { color: P.ink, fontSize: 16 },
  offerDesc: { color: P.dim, fontSize: 12, lineHeight: 17 },
  big: { backgroundColor: P.red, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  bigText: { color: '#ffffff', fontSize: 16 },
  endFoot: { color: P.faint, fontSize: 11, textAlign: 'center' },
});
