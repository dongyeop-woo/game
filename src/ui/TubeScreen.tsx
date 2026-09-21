import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CADENCES,
  CARDS,
  PAYDAY,
  TICKS,
  answer,
  bodyCost,
  cadenceOf,
  conceptOf,
  drawCard,
  fmtSubs,
  play,
  reroll,
  setCadence,
  stageOf,
  start,
  type Card,
} from '../tube/engine';
import type { Choice, Dealt, Delta, Run, StatKey } from '../tube/types';
import { Text } from './Text';

/**
 * 유튜버 키우기 화면.
 *
 * 기획은 `docs/design.md`. 지금은 무명 + 실버 구간까지 만들어져 있다.
 *
 * 위 절반은 캐릭터, 아래 절반은 어두운 반투명 판이다. 판 안에 스탯과
 * 카드가 있다. **카드에는 주된 이득 하나가 크게** 박히고 옆에 체력 값이
 * 붙는다 - 고르기 전에 손익이 보여야 고민이 생긴다. 숨은 축(자극·대충)은
 * 안 보여 준다.
 *
 * 화면은 상태를 읽기만 한다. 바꾸는 건 `tube/engine.ts` 뿐이다.
 */

const P = {
  bg: '#f6efe6',
  panel: 'rgba(24, 28, 44, 0.86)',
  card: 'rgba(255,255,255,0.94)',
  ink: '#1e293b',
  dim: '#64748b',
  faint: '#94a3b8',
  onDark: '#f1f5f9',
  onDarkDim: '#a7b0c4',
  blue: '#3b74e8',
  sub: '#e0364a',
  good: '#16a34a',
  heart: '#ff5c7a',
  tick: '#4ade80',
};

/** 화면에 보이는 스탯 셋. 체력은 따로 막대로 보여 준다 - 카드가 깎아 먹는 자원이라서 */
const STAT: Record<Exclude<StatKey, 'body'>, { name: string; color: string }> = {
  plan: { name: '기획', color: '#4f8dff' },
  edit: { name: '편집', color: '#22c1d6' },
  mind: { name: '멘탈', color: '#a78bfa' },
};

const STAT_NAME: Record<StatKey, string> = { plan: '기획', edit: '편집', body: '체력', mind: '멘탈' };

/**
 * 카드에 크게 박을 주된 이득.
 *
 * 구독자가 붙으면 그게 주인공이다. 안 붙는 카드(공부·휴식)는 제일 많이
 * 오르는 스탯을 앞세운다.
 */
function headline(r: Run, h: Dealt): { label: string; value: string; color: string } {
  if (h.gain > 0) return { label: '구독자', value: `+${h.gain.toLocaleString()}`, color: P.sub };
  const d = h.action.d;
  let best: StatKey | null = null;
  for (const k of ['plan', 'edit', 'mind', 'body'] as StatKey[]) {
    const v = k === 'body' ? bodyCost(r, h.action) : (d[k] ?? 0);
    if (v > 0 && (best === null || v > (d[best] ?? 0))) best = k;
  }
  if (best) {
    const v = best === 'body' ? bodyCost(r, h.action) : (d[best] ?? 0);
    const color = best === 'body' ? P.heart : STAT[best as Exclude<StatKey, 'body'>].color;
    return { label: STAT_NAME[best], value: `+${v}`, color };
  }
  if (d.money && d.money > 0) return { label: '수익', value: `+${d.money.toLocaleString()}원`, color: P.good };
  return { label: '', value: '', color: P.dim };
}

/** 주된 이득 말고 나머지 증감. 작게 붙인다 */
function rest(r: Run, h: Dealt, skip: string): string[] {
  const d: Delta = { ...h.action.d, body: bodyCost(r, h.action) };
  const out: string[] = [];
  (['plan', 'edit', 'mind'] as const).forEach((k) => {
    const v = d[k];
    if (v && STAT_NAME[k] !== skip) out.push(`${STAT_NAME[k]} ${v > 0 ? '+' : ''}${v}`);
  });
  if (d.money && skip !== '수익') out.push(`${d.money > 0 ? '+' : ''}${d.money.toLocaleString()}원`);
  return out;
}

export function TubeScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<string[]>([]);
  const [run, setRun] = useState<Run>(() => start([]));
  const [reward, setReward] = useState<Card | null>(null);

  const stage = stageOf(run);
  const concept = conceptOf(run.concept);
  const cad = cadenceOf(run);
  const push = useCallback((next: Run) => setRun({ ...next }), []);

  const onPlay = useCallback((h: Dealt) => push(play(run, h)), [run, push]);
  const onChoice = useCallback((c: Choice) => push(answer(run, c)), [run, push]);
  const onReroll = useCallback(() => push(reroll(run)), [run, push]);
  const onCadence = useCallback(() => {
    // 탭할 때마다 다음 주기로 돈다. 세 개뿐이라 메뉴를 띄울 것까지 없다
    const at = CADENCES.findIndex((c) => c.id === run.cadence);
    push(setCadence(run, CADENCES[(at + 1) % CADENCES.length].id));
  }, [run, push]);

  const onRestart = useCallback(() => {
    const got = drawCard(cards);
    const owned = got ? [...cards, got.id] : cards;
    setCards(owned);
    setReward(got);
    setRun(start(owned));
  }, [cards]);

  const daysLeft = stage.days - run.day + 1;
  const payIn = PAYDAY - ((run.day - 1) % PAYDAY);
  const last = run.lines[run.lines.length - 1];
  const ev = run.lines.filter((l) => l.tone === 'ev').slice(-1)[0];

  return (
    <View style={s.root}>
      {/* ---------------- 위 절반: 캐릭터 */}
      <View style={[s.scene, { paddingTop: insets.top + 8 }]}>
        <View style={s.topBar}>
          <View style={s.pill}>
            <Text style={s.pillKey}>D</Text>
            <Text style={s.pillVal}>-{daysLeft}</Text>
          </View>
          <View style={s.pill}>
            <Text style={s.pillVal}>{stage.name}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={[s.pill, s.pillMoney]}>
            <View style={s.coin} />
            <Text style={s.pillVal}>{run.money.toLocaleString()}</Text>
          </View>
        </View>

        <Pressable style={s.tag} onPress={onCadence}>
          <Text style={s.tagText}>{concept.name} · {cad.name} ▾</Text>
        </Pressable>

        {/*
          캐릭터 자리.

          그림은 사용자가 뽑아 온다. 들어오면 이 칸에 `Image` 를 놓고 아래
          `charHint` 를 지운다. 배경 투명 PNG, 허리 위, 정면.
        */}
        <View style={s.charBox}>
          <View style={s.charGhost} />
          <Text style={s.charHint}>캐릭터 자리</Text>
        </View>

        {/* 마지막 한 줄이 말풍선으로 뜬다. 긴 글은 판 안에서 읽는다 */}
        {last ? (
          <View style={s.bubble}>
            <Text style={s.bubbleText} numberOfLines={2}>
              {last.text}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ---------------- 아래 절반: 어두운 판 */}
      <View style={[s.panel, { paddingBottom: insets.bottom + 10 }]}>
        <View style={s.subRow}>
          <View style={s.subBig}>
            <Text style={s.subLabel}>구독자</Text>
            <Text style={s.subVal}>{run.subs.toLocaleString()}</Text>
          </View>
          <View style={s.subSide}>
            <Text style={s.subSideKey}>다음 구간</Text>
            <Text style={s.subSideVal}>{fmtSubs(stage.goal)}</Text>
          </View>
          <View style={s.subSide}>
            <Text style={s.subSideKey}>정산</Text>
            <Text style={s.subSideVal}>{payIn}일 뒤</Text>
          </View>
        </View>

        <View style={s.tiles}>
          {(Object.keys(STAT) as Exclude<StatKey, 'body'>[]).map((k) => (
            <View key={k} style={[s.tile, { backgroundColor: STAT[k].color }]}>
              <Text style={s.tileName}>{STAT[k].name}</Text>
              <Text style={s.tileVal}>{run.stats[k]}</Text>
            </View>
          ))}
        </View>

        <View style={s.bars}>
          <View style={s.barBlock}>
            <Text style={s.barKey}>남은 틱</Text>
            <View style={s.ticks}>
              {Array.from({ length: TICKS }, (_, i) => (
                <View key={i} style={[s.tickDot, i < run.ticks && s.tickOn]} />
              ))}
            </View>
          </View>
          <View style={[s.barBlock, { flex: 1.6 }]}>
            <View style={s.barHead}>
              <Text style={s.barKey}>체력</Text>
              <Text style={s.barNum}>{run.stats.body}</Text>
            </View>
            <View style={s.hpBg}>
              <View style={[s.hpFill, { width: `${run.stats.body}%` }]} />
            </View>
          </View>
          <Pressable
            style={[s.reroll, run.rerolls <= 0 && s.rerollOff]}
            onPress={onReroll}
            disabled={run.rerolls <= 0 || !!run.dead || !!run.pending}
          >
            <Text style={s.rerollIcon}>↻</Text>
            <Text style={s.rerollNum}>{run.rerolls}</Text>
          </Pressable>
        </View>

        {run.dead ? (
          <Ending run={run} reward={reward} onRestart={onRestart} />
        ) : run.pending ? (
          <View style={s.ask}>
            <Text style={s.askText}>{run.pending.text}</Text>
            {run.pending.choices?.map((c) => (
              <Pressable key={c.label} style={s.choice} onPress={() => onChoice(c)}>
                <Text style={s.choiceText}>▶ {c.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={s.grid}>
            {run.hand.map((h) => {
              const head = headline(run, h);
              const hp = bodyCost(run, h.action);
              return (
                <Pressable key={h.key} style={s.hcard} onPress={() => onPlay(h)}>
                  <Text style={s.hTitle} numberOfLines={1}>
                    {h.action.name}
                  </Text>
                  <Text style={s.hHint} numberOfLines={1}>
                    {h.action.hint}
                  </Text>
                  <View style={s.hMain}>
                    <View style={[s.hBadge, { backgroundColor: head.color }]}>
                      <Text style={s.hBadgeText}>{head.label}</Text>
                    </View>
                    <Text style={[s.hBig, { color: head.color }]}>{head.value}</Text>
                  </View>
                  <View style={s.hFoot}>
                    <Text style={s.hRest} numberOfLines={1}>
                      {rest(run, h, head.label).join(' · ')}
                    </Text>
                    <Text style={[s.hHp, hp >= 0 && { color: P.good }]}>
                      ♥ {hp > 0 ? '+' : ''}
                      {hp}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {ev && !run.dead && !run.pending ? (
          <Text style={s.evLine} numberOfLines={1}>
            {ev.text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * 결과 화면. **이게 공유물이다.** 망한 쪽이 잘된 쪽보다 더 잘 돈다.
 */
function Ending({ run, reward, onRestart }: { run: Run; reward: Card | null; onRestart: () => void }) {
  const d = run.dead!;
  return (
    <ScrollView style={s.end} contentContainerStyle={{ gap: 6 }}>
      <Text style={s.endName}>{d.name}</Text>
      <Text style={s.endLine}>{d.line}</Text>
      <Text style={s.endRow}>
        구독자 {fmtSubs(run.subs)} · {conceptOf(run.concept).name} · {cadenceOf(run).name} · 잔고{' '}
        {run.money.toLocaleString()}원
      </Text>
      <Text style={s.endRow}>만난 사람: {run.met.length ? run.met.join(', ') : '없음'}</Text>
      {reward ? (
        <Text style={s.endCard}>
          카드 획득 — {reward.name} · {reward.desc}
        </Text>
      ) : null}
      <Pressable style={s.big} onPress={onRestart}>
        <Text style={s.bigText}>새 채널을 판다</Text>
      </Pressable>
      <Text style={s.endFoot}>카드 {CARDS.length}종 중 {run.cards.length}장</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  scene: { flex: 1, paddingHorizontal: 12, backgroundColor: '#f3e6d6' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  pillMoney: { paddingLeft: 7 },
  pillKey: { color: P.faint, fontSize: 11 },
  pillVal: { color: P.ink, fontSize: 14 },
  coin: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#f5bf42', borderWidth: 2, borderColor: '#d9a12a' },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(30,58,138,0.85)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: { color: '#ffffff', fontSize: 12 },

  charBox: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  charGhost: {
    width: 190,
    height: 210,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderStyle: 'dashed',
  },
  charHint: { position: 'absolute', bottom: 100, color: 'rgba(30,41,59,0.45)', fontSize: 13 },

  bubble: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleText: { color: P.ink, fontSize: 13, lineHeight: 19 },

  panel: {
    backgroundColor: P.panel,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },

  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subBig: { flex: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  subLabel: { color: P.onDarkDim, fontSize: 11 },
  subVal: { color: '#ffffff', fontSize: 26, marginTop: -3 },
  subSide: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  subSideKey: { color: P.onDarkDim, fontSize: 11 },
  subSideVal: { color: P.onDark, fontSize: 15, marginTop: -1 },

  tiles: { flexDirection: 'row', gap: 6 },
  tile: { flex: 1, borderRadius: 11, paddingVertical: 7, paddingHorizontal: 10 },
  tileName: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
  tileVal: { color: '#ffffff', fontSize: 22, marginTop: -3 },

  bars: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barBlock: { flex: 1, gap: 4 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between' },
  barKey: { color: P.onDarkDim, fontSize: 11 },
  barNum: { color: P.onDark, fontSize: 12 },
  ticks: { flexDirection: 'row', gap: 5 },
  tickDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.18)' },
  tickOn: { backgroundColor: P.tick },
  hpBg: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  hpFill: { height: 10, borderRadius: 999, backgroundColor: '#2dd4bf' },
  reroll: { alignItems: 'center', paddingHorizontal: 6 },
  rerollOff: { opacity: 0.35 },
  rerollIcon: { color: P.onDark, fontSize: 22, lineHeight: 24 },
  rerollNum: { color: P.onDarkDim, fontSize: 11, marginTop: -2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hcard: {
    width: '48.6%',
    backgroundColor: P.card,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 8,
    gap: 3,
  },
  hTitle: { color: P.ink, fontSize: 15 },
  hHint: { color: P.faint, fontSize: 10 },
  hMain: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  hBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hBadgeText: { color: '#ffffff', fontSize: 10 },
  hBig: { fontSize: 22 },
  hFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  hRest: { color: P.dim, fontSize: 10, flex: 1 },
  hHp: { color: P.heart, fontSize: 13 },

  evLine: { color: '#ffe9a8', fontSize: 12, paddingHorizontal: 4 },

  ask: { gap: 6 },
  askText: { color: P.onDark, fontSize: 15, lineHeight: 22, paddingHorizontal: 4, paddingBottom: 4 },
  choice: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  choiceText: { color: '#ffffff', fontSize: 15 },

  end: { maxHeight: 300 },
  endName: { color: '#ffffff', fontSize: 24 },
  endLine: { color: P.onDarkDim, fontSize: 13 },
  endRow: { color: P.onDark, fontSize: 12 },
  endCard: { color: '#86efac', fontSize: 13, marginTop: 4 },
  big: { backgroundColor: P.blue, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  bigText: { color: '#ffffff', fontSize: 17 },
  endFoot: { color: P.onDarkDim, fontSize: 11, textAlign: 'center' },
});
