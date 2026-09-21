import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CARDS,
  PAYDAY,
  TICKS,
  answer,
  bodyCost,
  cadenceOf,
  conceptOf,
  drawCard,
  fmtSubs,
  nextCadence,
  play,
  questOf,
  reroll,
  stageOf,
  start,
  vibeOf,
  type Card,
} from '../tube/engine';
import type { Choice, Dealt, Delta, Run, StatKey } from '../tube/types';
import { StudioScreen } from './StudioScreen';
import { Text } from './Text';

/**
 * 유튜버 키우기 화면.
 *
 * 기획은 `docs/design.md`. 지금은 무명 + 실버 구간까지 만들어져 있다.
 *
 * **유튜브 채널 페이지를 닮게 짰다.** 위에 배너와 둥근 아바타와 구독자 수,
 * 그 밑에 분석 막대, 오늘 올릴 영상이 썸네일 카드로 가로로 늘어서고, 아래에
 * 알림 피드. 소재가 유튜브라 자연스럽고, 다른 키우기 게임의 화면(어두운
 * 판 + 2×2 카드 + ♥)과 구조가 겹치지 않는다 - 그쪽은 화면 조합을 베끼면
 * 부정경쟁방지법에 걸릴 수 있다.
 *
 * 카드에는 **주된 이득 하나가 크게** 박힌다 - 고르기 전에 손익이 보여야
 * 고민이 생긴다. 숨은 축(자극·대충)은 안 보여 준다.
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

/** 썸네일 색. 행동 종류마다 다르면 카드가 그림 없이도 구분된다 */
const THUMB: Record<string, string> = {
  careful: '#1d4ed8',
  quick: '#6b7280',
  trend: '#7c3aed',
  bait: '#dc2626',
  study: '#0f766e',
  rest: '#a16207',
  series: '#1d4ed8',
  collab: '#db2777',
  daily: '#6b7280',
  react: '#dc2626',
  sponsor: '#15803d',
  editor: '#0e7490',
  rest2: '#a16207',
};

/**
 * 썸네일 위에 크게 박을 주된 이득.
 *
 * 구독자가 붙으면 그게 주인공이다. 안 붙는 카드(공부·휴식)는 제일 많이
 * 오르는 스탯을 앞세운다.
 */
function headline(r: Run, h: Dealt): { label: string; value: string } {
  if (h.gain > 0) return { label: '구독자', value: `+${h.gain.toLocaleString()}` };
  const d: Delta = { ...h.action.d, body: bodyCost(r, h.action) };
  let best: StatKey | null = null;
  for (const k of Object.keys(STAT) as StatKey[]) {
    const v = d[k] ?? 0;
    if (v > 0 && (best === null || v > (d[best] ?? 0))) best = k;
  }
  if (best) return { label: STAT[best].name, value: `+${d[best]}` };
  if (d.money && d.money > 0) return { label: '수익', value: `+${d.money.toLocaleString()}원` };
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
  if (d.money && skip !== '수익') out.push(`${d.money > 0 ? '+' : ''}${d.money.toLocaleString()}원`);
  return out.join(' · ');
}

/** 지금 퀘스트가 몇 번째인가. 진행 줄 앞에 붙는 숫자다 */
const QUESTS_INDEX = (r: Run) => r.questDone.length;

export function TubeScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<string[]>([]);
  const [run, setRun] = useState<Run>(() => start([], []));
  const [reward, setReward] = useState<Card | null>(null);
  /** 스튜디오를 열었는가. 지금 판을 그대로 읽어 보여 준다 */
  const [studio, setStudio] = useState(false);

  const stage = stageOf(run);
  const concept = conceptOf(run.concept);
  const cad = cadenceOf(run);
  const next = nextCadence(run);
  const push = useCallback((next: Run) => setRun({ ...next }), []);

  const onPlay = useCallback((h: Dealt) => push(play(run, h)), [run, push]);
  const onChoice = useCallback((c: Choice) => push(answer(run, c)), [run, push]);
  const onReroll = useCallback(() => push(reroll(run)), [run, push]);
  const onRestart = useCallback(() => {
    const got = drawCard(cards);
    const owned = got ? [...cards, got.id] : cards;
    setCards(owned);
    setReward(got);
    // 깬 퀘스트는 들고 간다. 배운 걸 또 시키면 짜증난다
    setRun(start(owned, run.questDone));
  }, [cards, run.questDone]);

  const quest = questOf(run);

  const daysLeft = stage.days - run.day + 1;
  const payIn = PAYDAY - ((run.day - 1) % PAYDAY);
  const toGoal = Math.min(1, run.subs / stage.goal);
  const feed = run.lines.slice(-7).reverse();

  if (studio) return <StudioScreen run={run} onClose={() => setStudio(false)} />;

  return (
    <View style={s.root}>
      {/* ---------------- 채널 헤더 */}
      <View style={[s.banner, { paddingTop: insets.top }]} />
      <View style={s.header}>
        {/*
          아바타. 그림은 사용자가 뽑아 온다 - 들어오면 이 원 안에 `Image` 를
          놓는다. 배경 투명 PNG, 얼굴 위주, 정면.
        */}
        <View style={s.avatar}>
          <Text style={s.avatarHint}>얼굴</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.chName}>{concept.name}</Text>
          <Text style={s.chSubs}>
            구독자 <Text style={s.chSubsNum}>{run.subs.toLocaleString()}</Text>명
          </Text>
          <View style={s.goalBg}>
            <View style={[s.goalBar, { width: `${toGoal * 100}%` }]} />
          </View>
          <Text style={s.chMeta}>
            {stage.name} · 다음 {fmtSubs(stage.goal)} · {daysLeft}일 남음
          </Text>
        </View>
      </View>

      <View style={s.chips}>
        {/* 주기는 고르는 게 아니라 편집이 정한다. 다음 주기가 열리는 편집 값을 옆에 적어 둔다 */}
        <View style={s.chip}>
          <Text style={s.chipText}>
            {cad.name}
            {next ? `  · 편집 ${next.edit}이면 ${next.name}` : ''}
          </Text>
        </View>
        <View style={[s.chip, s.chipQuiet]}>
          <Text style={s.chipQuietText}>잔고 {run.money.toLocaleString()}원</Text>
        </View>
        <View style={[s.chip, s.chipQuiet]}>
          <Text style={s.chipQuietText}>정산 {payIn}일 뒤</Text>
        </View>
        <Pressable style={[s.chip, s.chipStudio]} onPress={() => setStudio(true)}>
          <Text style={s.chipText}>스튜디오</Text>
        </Pressable>
        {/* 이번 주 알고리즘. 쇼츠를 봐서 알아내기 전엔 물음표다 */}
        <View style={[s.chip, run.trendKnown ? s.chipTrend : s.chipQuiet]}>
          <Text style={run.trendKnown ? s.chipText : s.chipQuietText}>
            알고리즘 {run.trendKnown ? vibeOf(run.trend).name : '?'}
          </Text>
        </View>
      </View>

      {/* ---------------- 퀘스트 - 안내 말풍선 + 진행 줄 */}
      {quest && !run.dead ? (
        <View style={s.questBox}>
          <View style={s.tip}>
            <Text style={s.tipIcon}>💡</Text>
            <Text style={s.tipText}>{quest.tip}</Text>
          </View>
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

      {/* ---------------- 분석 - 얇은 막대 넷 */}
      <View style={s.analytics}>
        {(Object.keys(STAT) as StatKey[]).map((k) => (
          <View key={k} style={s.stat}>
            <View style={s.statHead}>
              <Text style={s.statName}>{STAT[k].name}</Text>
              <Text style={[s.statVal, { color: STAT[k].color }]}>{run.stats[k]}</Text>
            </View>
            <View style={s.statBg}>
              <View style={[s.statBar, { width: `${run.stats[k]}%`, backgroundColor: STAT[k].color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* ---------------- 오늘 올릴 영상 - 가로 썸네일 */}
      {run.dead ? (
        <Ending run={run} reward={reward} onRestart={onRestart} />
      ) : run.pending ? (
        <View style={s.ask}>
          <Text style={s.askText}>{run.pending.text}</Text>
          {run.pending.choices?.map((c) => (
            <Pressable key={c.label} style={s.choice} onPress={() => onChoice(c)}>
              <Text style={s.choiceText}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <View style={s.rowHead}>
            <Text style={s.rowTitle}>오늘 올릴 영상</Text>
            <Text style={s.rowSub}>
              {run.ticks}/{TICKS}편 남음
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onReroll} disabled={run.rerolls <= 0} style={[s.rerollBtn, run.rerolls <= 0 && s.off]}>
              <Text style={s.rerollText}>아이디어 다시 뽑기 {run.rerolls}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.reel} style={s.reelBox}>
            {run.hand.map((h) => {
              const head = headline(run, h);
              return (
                <Pressable key={h.key} style={s.video} onPress={() => onPlay(h)}>
                  <View style={[s.thumb, { backgroundColor: THUMB[h.action.id] ?? '#374151' }]}>
                    <Text style={s.thumbHint}>{h.action.hint}</Text>
                    <View style={s.badge}>
                      <Text style={s.badgeLabel}>{head.label}</Text>
                      <Text style={s.badgeVal}>{head.value}</Text>
                    </View>
                  </View>
                  <Text style={s.vTitle} numberOfLines={1}>
                    {h.action.name}
                  </Text>
                  <Text style={s.vMeta} numberOfLines={1}>
                    {meta(run, h, head.label)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ---------------- 알림 */}
      <View style={s.feedHead}>
        <Text style={s.rowTitle}>알림</Text>
      </View>
      <ScrollView style={s.feed} contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
        {feed.map((ln) => (
          <View key={ln.id} style={s.noti}>
            <View
              style={[
                s.dot,
                ln.tone === 'good' && { backgroundColor: P.good },
                ln.tone === 'bad' && { backgroundColor: P.bad },
                ln.tone === 'ev' && { backgroundColor: '#2563eb' },
              ]}
            />
            <Text style={[s.notiText, ln.tone === 'sys' && { color: P.faint }]}>{ln.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

/**
 * 결과 화면. **이게 공유물이다.** 망한 쪽이 잘된 쪽보다 더 잘 돈다.
 */
function Ending({ run, reward, onRestart }: { run: Run; reward: Card | null; onRestart: () => void }) {
  const d = run.dead!;
  return (
    <View style={s.end}>
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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  banner: { height: 96, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 16, marginTop: -30 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.soft,
    borderWidth: 3,
    borderColor: P.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { color: P.faint, fontSize: 12 },
  chName: { color: P.ink, fontSize: 19, marginTop: 30 },
  chSubs: { color: P.dim, fontSize: 13, marginTop: 1 },
  chSubsNum: { color: P.ink, fontSize: 15 },
  goalBg: { height: 5, borderRadius: 999, backgroundColor: P.line, overflow: 'hidden', marginTop: 5 },
  goalBar: { height: 5, borderRadius: 999, backgroundColor: P.red },
  chMeta: { color: P.faint, fontSize: 11, marginTop: 3 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginTop: 10 },
  chip: { backgroundColor: P.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipQuiet: { backgroundColor: P.soft },
  chipText: { color: P.bg, fontSize: 12 },
  chipQuietText: { color: P.ink, fontSize: 12 },
  chipTrend: { backgroundColor: P.red },
  chipStudio: { backgroundColor: '#374151' },

  questBox: { marginHorizontal: 16, marginTop: 12, gap: 6 },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#f5e6a3',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tipIcon: { fontSize: 15 },
  tipText: { color: '#5b4a0a', fontSize: 13, lineHeight: 19, flex: 1 },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.ink,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  questNum: { color: P.faint, fontSize: 12 },
  questText: { color: P.bg, fontSize: 13, flex: 1 },
  questCount: { color: '#fbbf24', fontSize: 12 },

  analytics: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 12, columnGap: 14, rowGap: 6 },
  stat: { width: '47%' },
  statHead: { flexDirection: 'row', justifyContent: 'space-between' },
  statName: { color: P.dim, fontSize: 11 },
  statVal: { fontSize: 12 },
  statBg: { height: 4, borderRadius: 999, backgroundColor: P.line, overflow: 'hidden', marginTop: 2 },
  statBar: { height: 4, borderRadius: 999 },

  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  rowTitle: { color: P.ink, fontSize: 15 },
  rowSub: { color: P.dim, fontSize: 12 },
  rerollBtn: { paddingVertical: 2 },
  off: { opacity: 0.35 },
  rerollText: { color: '#2563eb', fontSize: 12 },

  reelBox: { flexGrow: 0 },
  reel: { paddingHorizontal: 16, gap: 10, paddingTop: 8 },
  video: { width: 168 },
  thumb: { height: 96, borderRadius: 12, padding: 8, justifyContent: 'space-between' },
  thumbHint: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  badge: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignItems: 'flex-end' },
  badgeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
  badgeVal: { color: '#ffffff', fontSize: 17, marginTop: -2 },
  vTitle: { color: P.ink, fontSize: 14, marginTop: 6 },
  vMeta: { color: P.dim, fontSize: 11, marginTop: 1 },

  feedHead: { paddingHorizontal: 16, marginTop: 14, marginBottom: 6 },
  feed: { flex: 1, paddingHorizontal: 16 },
  noti: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: P.line, marginTop: 6 },
  notiText: { color: P.ink, fontSize: 13, lineHeight: 19, flex: 1 },

  ask: { paddingHorizontal: 16, marginTop: 14, gap: 6 },
  askText: { color: P.ink, fontSize: 15, lineHeight: 22, paddingBottom: 4 },
  choice: { backgroundColor: P.soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  choiceText: { color: P.ink, fontSize: 15 },

  end: { paddingHorizontal: 16, marginTop: 14, gap: 4 },
  endName: { color: P.ink, fontSize: 24 },
  endLine: { color: P.dim, fontSize: 13 },
  endRow: { color: P.dim, fontSize: 12 },
  endCard: { color: P.good, fontSize: 13, marginTop: 4 },
  big: { backgroundColor: P.red, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  bigText: { color: '#ffffff', fontSize: 16 },
  endFoot: { color: P.faint, fontSize: 11, textAlign: 'center' },
});
