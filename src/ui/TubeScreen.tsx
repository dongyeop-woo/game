import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CADENCES,
  CARDS,
  PAYDAY,
  actionsOf,
  answer,
  cadenceOf,
  conceptOf,
  doAction,
  drawCard,
  fmtSubs,
  setCadence,
  stageOf,
  start,
  type Card,
} from '../tube/engine';
import type { Action, Choice, Delta, Line, Run, StatKey } from '../tube/types';
import { Text } from './Text';

/**
 * 유튜버 키우기 화면.
 *
 * 기획은 `docs/design.md`. 지금은 무명 + 실버 구간까지 만들어져 있다.
 *
 * **버튼에 증감을 미리 보여 준다.** 고르기 전에 손익이 보여야 고민이 생긴다.
 * 다만 **숨은 축(자극·대충)은 안 보여 준다.** 보이면 최적해를 찾아 버리고,
 * 그러면 "정직하게 하려다 어느새 사이버 렉카" 가 안 나온다.
 *
 * 화면은 상태를 읽기만 한다. 바꾸는 건 `tube/engine.ts` 뿐이다.
 */

const P = {
  bg: '#eaf0fa',
  card: '#ffffff',
  line: '#d6dfef',
  ink: '#1e293b',
  dim: '#64748b',
  faint: '#94a3b8',
  blue: '#3b74e8',
  blueDeep: '#2554b0',
  good: '#16a34a',
  bad: '#e0364a',
  /** 구독자 숫자에만 쓰는 색. 이 게임의 주인공 숫자다 */
  sub: '#e0364a',
};

const STAT: Record<StatKey, { name: string; color: string; bg: string }> = {
  plan: { name: '기획', color: '#2563eb', bg: '#e4edff' },
  edit: { name: '편집', color: '#0891b2', bg: '#e0f5fa' },
  body: { name: '체력', color: '#e0364a', bg: '#ffe6e9' },
  mind: { name: '멘탈', color: '#7c3aed', bg: '#efe6ff' },
};

const TONE: Record<Line['tone'], { color: string; strong: boolean }> = {
  act: { color: P.ink, strong: false },
  ev: { color: P.blueDeep, strong: true },
  good: { color: P.good, strong: true },
  bad: { color: P.bad, strong: true },
  sys: { color: P.faint, strong: false },
};

/** `Delta` 를 칩으로. 숨은 축은 뺀다 */
function chipsOf(d: Delta) {
  const out: { text: string; color: string; bg: string }[] = [];
  (Object.keys(STAT) as StatKey[]).forEach((k) => {
    const v = d[k];
    if (!v) return;
    out.push({ text: `${STAT[k].name} ${v > 0 ? '+' : ''}${v}`, color: STAT[k].color, bg: STAT[k].bg });
  });
  if (d.money) {
    out.push({
      text: `${d.money > 0 ? '+' : ''}${d.money.toLocaleString()}원`,
      color: d.money > 0 ? P.good : P.bad,
      bg: d.money > 0 ? '#e3f7e8' : '#ffe6e9',
    });
  }
  if (d.subs) {
    out.push({
      text: `구독 ${d.subs > 0 ? '+' : ''}${fmtSubs(Math.abs(d.subs))}`,
      color: P.sub,
      bg: '#ffe6e9',
    });
  }
  return out;
}

function Chips({ d, big }: { d: Delta; big?: boolean }) {
  return (
    <View style={[s.chips, big && s.chipsBig]}>
      {chipsOf(d).map((c) => (
        <View key={c.text} style={[s.chip, big && s.chipBig, { backgroundColor: c.bg }]}>
          <Text style={[s.chipText, big && s.chipTextBig, { color: c.color }]}>{c.text}</Text>
        </View>
      ))}
    </View>
  );
}

export function TubeScreen() {
  const insets = useSafeAreaInsets();
  /** 채널이 죽어도 남는 것 */
  const [cards, setCards] = useState<string[]>([]);
  const [run, setRun] = useState<Run>(() => start([]));
  const [reward, setReward] = useState<Card | null>(null);
  const log = useRef<ScrollView>(null);

  const stage = stageOf(run);
  const concept = conceptOf(run.concept);
  const acts = useMemo(() => actionsOf(run), [run]);

  const push = useCallback((next: Run) => {
    setRun({ ...next });
    requestAnimationFrame(() => log.current?.scrollToEnd({ animated: true }));
  }, []);

  const onAct = useCallback((a: Action) => push(doAction(run, a)), [run, push]);
  const onChoice = useCallback((c: Choice) => push(answer(run, c)), [run, push]);
  const onCadence = useCallback((id: string) => push(setCadence(run, id)), [run, push]);

  const onRestart = useCallback(() => {
    const got = drawCard(cards);
    const owned = got ? [...cards, got.id] : cards;
    setCards(owned);
    setReward(got);
    setRun(start(owned));
  }, [cards]);

  const toGoal = Math.min(1, run.subs / stage.goal);
  const payIn = PAYDAY - ((run.day - 1) % PAYDAY);

  return (
    <View style={[s.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
      {/*
        구독자가 주인공 숫자다.

        참고한 화면들은 가운데에 큰 덩어리가 하나 있다. 이 게임에 그림은
        아직 없으니 **숫자 자체를 크게** 세운다 - 키우기는 숫자가 올라가는
        장르라 그게 그림 역할을 한다.
      */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <Text style={s.heroLabel}>구독자</Text>
          <Text style={s.heroMoney}>
            {run.money.toLocaleString()}원 · 정산 {payIn}일
          </Text>
        </View>
        <Text style={s.heroSubs}>{run.subs.toLocaleString()}</Text>
        <View style={s.goalBg}>
          <View style={[s.goalBar, { width: `${toGoal * 100}%` }]} />
        </View>
        <Text style={s.heroWhere}>
          {concept.name} · {stage.name} {run.day}/{stage.days}일 · 다음 {fmtSubs(stage.goal)}
        </Text>
      </View>

      <View style={s.stats}>
        {(Object.keys(STAT) as StatKey[]).map((k) => (
          <View key={k} style={[s.stat, { backgroundColor: STAT[k].bg }]}>
            <Text style={[s.statName, { color: STAT[k].color }]}>{STAT[k].name}</Text>
            <Text style={[s.statValue, { color: STAT[k].color }]}>{run.stats[k]}</Text>
          </View>
        ))}
      </View>

      {/*
        업로드 주기.

        하루하루 고르는 것보다 위에 둔다 - 이건 행동이 아니라 전략이고,
        바꾸는 데 하루를 안 쓴다.
      */}
      <View style={s.cadence}>
        {CADENCES.map((c) => {
          const on = c.id === run.cadence;
          return (
            <Pressable
              key={c.id}
              style={[s.cad, on && s.cadOn]}
              onPress={() => onCadence(c.id)}
              disabled={!!run.dead}
            >
              <Text style={[s.cadName, on && s.cadNameOn]}>{c.name}</Text>
              <Text style={[s.cadHint, on && s.cadHintOn]}>{c.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 흐르는 글. 이게 게임의 본체다 */}
      <View style={s.logCard}>
        <ScrollView ref={log} contentContainerStyle={s.log} showsVerticalScrollIndicator={false}>
          {run.lines.map((ln) => (
            <Text
              key={ln.id}
              style={[s.line, { color: TONE[ln.tone].color }, TONE[ln.tone].strong && s.lineStrong]}
            >
              {ln.text}
            </Text>
          ))}
        </ScrollView>
      </View>

      {run.dead ? (
        <Ending run={run} reward={reward} onRestart={onRestart} />
      ) : run.pending ? (
        <View style={s.pane}>
          <View style={s.askCard}>
            <Text style={s.askText}>{run.pending.text}</Text>
          </View>
          {run.pending.choices?.map((c) => (
            <Pressable key={c.label} style={s.choice} onPress={() => onChoice(c)}>
              <Text style={s.choiceMark}>▶</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.choiceLabel}>{c.label}</Text>
                <Chips d={c.d} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <ScrollView style={s.actList} contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
          {acts.map((a) => (
            <Pressable key={a.id} style={s.act} onPress={() => onAct(a)}>
              <Text style={s.actName}>{a.name}</Text>
              <Text style={s.actHint}>{a.hint}</Text>
              <Chips d={a.d} big />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/**
 * 결과 화면.
 *
 * **이게 공유물이다.** 망한 쪽이 잘된 쪽보다 더 잘 돈다 - "고소장이 왔다"
 * 가 "구독자 100만" 보다 할 말이 많다.
 */
function Ending({ run, reward, onRestart }: { run: Run; reward: Card | null; onRestart: () => void }) {
  const d = run.dead!;
  const c = cadenceOf(run);
  const rows: [string, string][] = [
    ['컨셉', conceptOf(run.concept).name],
    ['주기', c.name],
    ['잔고', `${run.money.toLocaleString()}원`],
    ['만난 사람', run.met.length ? run.met.join(', ') : '없음'],
  ];
  return (
    <View style={s.pane}>
      <View style={s.endCard}>
        <Text style={s.endSubs}>구독자 {fmtSubs(run.subs)}</Text>
        <Text style={s.endName}>{d.name}</Text>
        <Text style={s.endLine}>{d.line}</Text>

        <View style={s.endStats}>
          {(Object.keys(STAT) as StatKey[]).map((k) => (
            <View key={k} style={s.endStat}>
              <Text style={[s.endStatName, { color: STAT[k].color }]}>{STAT[k].name}</Text>
              <Text style={[s.endStatValue, { color: STAT[k].color }]}>{run.stats[k]}</Text>
            </View>
          ))}
        </View>

        {rows.map(([k, v]) => (
          <View key={k} style={s.endRow}>
            <Text style={s.endKey}>{k}</Text>
            <Text style={s.endVal}>{v}</Text>
          </View>
        ))}

        {reward ? (
          <View style={s.cardGot}>
            <Text style={s.cardGotName}>카드 획득 — {reward.name}</Text>
            <Text style={s.cardGotDesc}>{reward.desc}</Text>
          </View>
        ) : null}
      </View>

      <Pressable style={s.big} onPress={onRestart}>
        <Text style={s.bigText}>새 채널을 판다</Text>
      </Pressable>
      <Text style={s.smallText}>카드 {CARDS.length}종 중 수집 중</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg, paddingHorizontal: 12, gap: 7 },

  /*
    구독자 덩어리.

    참고한 화면들은 가운데에 큰 캐릭터가 있다. 그림이 없으니 숫자를 그
    자리에 세운다 - 키우기는 숫자가 올라가는 장르라 숫자가 그림 역할을 한다.
  */
  hero: {
    backgroundColor: P.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  heroTop: { flexDirection: 'row', alignItems: 'baseline' },
  heroLabel: { color: P.dim, fontSize: 13, flex: 1 },
  heroMoney: { color: P.faint, fontSize: 12 },
  heroSubs: { color: P.sub, fontSize: 44, lineHeight: 52, letterSpacing: -1 },
  heroWhere: { color: P.dim, fontSize: 12, marginTop: 7 },

  goalBg: { height: 10, borderRadius: 999, backgroundColor: '#dbe3f2', overflow: 'hidden' },
  goalBar: { height: 10, borderRadius: 999, backgroundColor: P.sub },

  stats: { flexDirection: 'row', gap: 6 },
  stat: { flex: 1, borderRadius: 13, paddingVertical: 9, alignItems: 'center' },
  statName: { fontSize: 12, opacity: 0.85 },
  statValue: { fontSize: 25, marginTop: -3 },

  cadence: { flexDirection: 'row', gap: 6 },
  cad: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: P.card,
    borderWidth: 1,
    borderColor: P.line,
  },
  cadOn: { backgroundColor: P.blue, borderColor: P.blueDeep },
  cadName: { color: P.dim, fontSize: 15 },
  cadNameOn: { color: '#ffffff' },
  cadHint: { color: P.faint, fontSize: 10, marginTop: 1 },
  cadHintOn: { color: '#cfe0ff' },

  logCard: { flex: 1, minHeight: 110, backgroundColor: P.card, borderRadius: 16, borderWidth: 1, borderColor: P.line },
  log: { padding: 14, gap: 9 },
  line: { fontSize: 14, lineHeight: 21 },
  lineStrong: { fontSize: 15 },

  pane: { gap: 6 },
  /*
    행동을 두 칸 격자로.

    줄 일곱 개를 세로로 쌓으면 글씨가 작아지고 뭘 고르는지 안 읽힌다.
    큰 카드 둘씩이 참고한 화면 쪽에 가깝다 - 거기는 버튼이 아예 두 개다.
  */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  actList: { flexGrow: 0, maxHeight: 268 },

  act: {
    width: '48.4%',
    backgroundColor: P.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 9,
    gap: 2,
  },
  actName: { color: P.ink, fontSize: 17 },
  actHint: { color: P.faint, fontSize: 11 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  chipsBig: { justifyContent: 'flex-start', marginTop: 5 },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipBig: { paddingHorizontal: 9, paddingVertical: 4 },
  chipText: { fontSize: 11 },
  chipTextBig: { fontSize: 13 },

  askCard: { backgroundColor: '#1e3a8a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  askText: { color: '#eaf1ff', fontSize: 15, lineHeight: 22 },
  choice: {
    backgroundColor: '#dce8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b8cdf5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  choiceMark: { color: P.blue, fontSize: 12 },
  choiceLabel: { color: P.blueDeep, fontSize: 15 },

  endCard: { backgroundColor: P.card, borderRadius: 16, borderWidth: 1, borderColor: P.line, padding: 16 },
  endSubs: { color: P.sub, fontSize: 15 },
  endName: { color: P.ink, fontSize: 23, marginTop: -1 },
  endLine: { color: P.dim, fontSize: 13, marginTop: 2, marginBottom: 10 },
  endStats: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  endStat: { flex: 1, alignItems: 'center' },
  endStatName: { fontSize: 11, opacity: 0.8 },
  endStatValue: { fontSize: 17, marginTop: -3 },
  endRow: { flexDirection: 'row', gap: 8, paddingVertical: 1 },
  endKey: { color: P.faint, fontSize: 12, width: 62 },
  endVal: { color: P.ink, fontSize: 12, flex: 1 },
  cardGot: { backgroundColor: '#e3f7e8', borderRadius: 10, padding: 10, marginTop: 10 },
  cardGotName: { color: P.good, fontSize: 14 },
  cardGotDesc: { color: '#2f7a48', fontSize: 12, marginTop: 1 },

  big: { backgroundColor: P.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  bigText: { color: '#ffffff', fontSize: 17 },
  smallText: { color: P.dim, fontSize: 12, textAlign: 'center', paddingVertical: 6 },
});
