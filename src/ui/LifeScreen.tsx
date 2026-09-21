import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CARDS,
  actionsOf,
  ageOf,
  answer,
  born,
  chapterOf,
  doAction,
  drawCard,
  homeDef,
  trackName,
  type Card,
} from '../life/engine';
import type { Action, Choice, Delta, Life, Line, StatKey } from '../life/types';
import { Text } from './Text';

/**
 * 인생 키우기 화면.
 *
 * 기획은 `docs/design.md`. 지금은 유년기 + 초등까지만 만들어져 있다.
 *
 * **버튼에 증감을 미리 보여 준다.** 이게 이 장르의 핵심이다 - 고르기 전에
 * 손익이 보여야 고민이 생긴다. 안 보이면 그냥 아무거나 누르게 된다.
 * 다만 **기질(거침·요령)은 안 보여 준다.** 보이면 최적해를 찾아 버리고,
 * 그러면 "착하게 키웠는데 날라리가 됐다" 가 안 나온다.
 *
 * 화면은 상태를 읽기만 한다. 바꾸는 건 `life/engine.ts` 뿐이다.
 */

/*
  색.

  앞 게임(디펜스)은 밤하늘 남보라였는데 여기는 안 맞는다. 인생 키우기는
  읽는 게임이라 글이 오래 눈에 머문다 - 어두운 바탕에 밝은 글씨로 스무 줄을
  읽으면 눈이 아프다. 밝은 바탕에 진한 글씨로 간다.
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
};

/** 스탯마다 색이 달라야 숫자가 아니라 '그것'으로 읽힌다 */
const STAT: Record<StatKey, { name: string; color: string; bg: string }> = {
  head: { name: '머리', color: '#2563eb', bg: '#e4edff' },
  body: { name: '체력', color: '#e0364a', bg: '#ffe6e9' },
  mind: { name: '멘탈', color: '#7c3aed', bg: '#efe6ff' },
  charm: { name: '매력', color: '#db2777', bg: '#ffe4f1' },
};

const TONE: Record<Line['tone'], { color: string; weight: boolean }> = {
  act: { color: P.ink, weight: false },
  ev: { color: P.blueDeep, weight: true },
  good: { color: P.good, weight: true },
  bad: { color: P.bad, weight: true },
  sys: { color: P.faint, weight: false },
};

/** `Delta` 를 버튼에 붙일 칩으로. 기질은 뺀다 */
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
  return out;
}

function Chips({ d }: { d: Delta }) {
  return (
    <View style={s.chips}>
      {chipsOf(d).map((c) => (
        <View key={c.text} style={[s.chip, { backgroundColor: c.bg }]}>
          <Text style={[s.chipText, { color: c.color }]}>{c.text}</Text>
        </View>
      ))}
    </View>
  );
}

export function LifeScreen({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  /** 환생해도 남는 것 */
  const [cards, setCards] = useState<string[]>([]);
  const [life, setLife] = useState<Life>(() => born([]));
  const [reward, setReward] = useState<Card | null>(null);
  const log = useRef<ScrollView>(null);

  const chapter = chapterOf(life);
  const home = homeDef(life.home);
  const acts = useMemo(() => actionsOf(life), [life]);

  const push = useCallback((next: Life) => {
    setLife({ ...next });
    requestAnimationFrame(() => log.current?.scrollToEnd({ animated: true }));
  }, []);

  const onAct = useCallback((a: Action) => push(doAction(life, a)), [life, push]);
  const onChoice = useCallback((c: Choice) => push(answer(life, c)), [life, push]);

  const onRebirth = useCallback(() => {
    /*
      카드를 **결과 화면에서** 준다. 죽자마자 다음 판이 좋아진다는 걸
      그 자리에서 봐야 다시 누른다.
    */
    const got = drawCard(cards);
    const owned = got ? [...cards, got.id] : cards;
    setCards(owned);
    setReward(got);
    setLife(born(owned));
  }, [cards]);

  const progress = Math.min(1, (life.day - 1) / chapter.days);

  return (
    <View style={[s.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
      {/* 바깥 배경이 앞 게임의 밤하늘이라 안전영역에 검은 띠가 남는다. 덮는다 */}
      <View pointerEvents="none" style={s.bleed} />
      {/* 머리 - 집안과 나이, 돈 */}
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Text style={s.home}>{home.name}</Text>
          <Text style={s.where}>
            {chapter.name} · {ageOf(life)}세
          </Text>
        </View>
        <View style={s.money}>
          <Text style={s.moneyText}>{life.money.toLocaleString()}원</Text>
        </View>
      </View>

      {/* 스탯 넷 */}
      <View style={s.stats}>
        {(Object.keys(STAT) as StatKey[]).map((k) => (
          <View key={k} style={[s.stat, { backgroundColor: STAT[k].bg }]}>
            <Text style={[s.statName, { color: STAT[k].color }]}>{STAT[k].name}</Text>
            <Text style={[s.statValue, { color: STAT[k].color }]}>{life.stats[k]}</Text>
          </View>
        ))}
      </View>

      {/*
        가운데 - 지금 몇 살인지.

        참고한 화면들은 여기에 캐릭터 일러스트가 크게 들어간다. 그림이 아직
        없어서 나이와 진행만 둔다. 그림이 생기면 이 칸을 그대로 갈아 끼운다.
      */}
      <View style={s.stage}>
        <View style={s.avatar}>
          <Text style={s.avatarAge}>{ageOf(life)}</Text>
          <Text style={s.avatarUnit}>세</Text>
        </View>
        <View style={s.dayWrap}>
          <View style={s.dayBarBg}>
            <View style={[s.dayBar, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={s.dayText}>
            {chapter.name} {life.day}일차 / {chapter.days}
          </Text>
        </View>
      </View>

      {/* 흐르는 글. 이게 게임의 본체다 */}
      <View style={s.logCard}>
        <ScrollView ref={log} contentContainerStyle={s.log} showsVerticalScrollIndicator={false}>
          {life.lines.map((ln) => (
            <Text
              key={ln.id}
              style={[s.line, { color: TONE[ln.tone].color }, TONE[ln.tone].weight && s.lineStrong]}
            >
              {ln.text}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* 아래 - 상황에 따라 셋 중 하나 */}
      {life.dead ? (
        <Ending life={life} reward={reward} onRebirth={onRebirth} onExit={onExit} />
      ) : life.pending ? (
        <View style={s.pane}>
          <View style={s.askCard}>
            <Text style={s.askText}>{life.pending.text}</Text>
          </View>
          {life.pending.choices?.map((c) => (
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
        <ScrollView
          style={s.actList}
          contentContainerStyle={s.pane}
          showsVerticalScrollIndicator={false}
        >
          {acts.map((a) => (
            <Pressable key={a.id} style={s.act} onPress={() => onAct(a)}>
              <View style={{ flex: 1 }}>
                <Text style={s.actName}>{a.name}</Text>
                <Text style={s.actHint}>{a.hint}</Text>
              </View>
              <Chips d={a.d} />
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
 * **이게 공유물이다.** 망한 엔딩이 잘된 엔딩보다 더 잘 돈다 - "34세 과로사"
 * 쪽이 "건물주" 보다 할 말이 많다. 그래서 한 장에 다 담기게 짠다.
 */
function Ending({
  life,
  reward,
  onRebirth,
  onExit,
}: {
  life: Life;
  reward: Card | null;
  onRebirth: () => void;
  onExit: () => void;
}) {
  const d = life.dead!;
  const home = homeDef(life.home);
  const rows: [string, string][] = [
    ['집안', home.name],
    ['갈래', trackName(life.track) || '—'],
    ['만난 사람', life.met.length ? life.met.join(', ') : '없음'],
  ];
  return (
    <View style={s.pane}>
      <View style={s.endCard}>
        <Text style={s.endAge}>{d.age}세</Text>
        <Text style={s.endName}>{d.name}</Text>
        <Text style={s.endLine}>{d.line}</Text>

        <View style={s.endStats}>
          {(Object.keys(STAT) as StatKey[]).map((k) => (
            <View key={k} style={s.endStat}>
              <Text style={[s.endStatName, { color: STAT[k].color }]}>{STAT[k].name}</Text>
              <Text style={[s.endStatValue, { color: STAT[k].color }]}>{life.stats[k]}</Text>
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

      <Pressable style={s.big} onPress={onRebirth}>
        <Text style={s.bigText}>다시 태어난다</Text>
      </Pressable>
      <Pressable style={s.small} onPress={onExit}>
        <Text style={s.smallText}>나가기 · 카드 {CARDS.length}종 중 수집 중</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg, paddingHorizontal: 12, gap: 8 },
  bleed: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -80,
    bottom: -80,
    backgroundColor: P.bg,
    zIndex: -1,
  },

  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  home: { color: P.ink, fontSize: 19 },
  where: { color: P.dim, fontSize: 12, marginTop: 1 },
  money: {
    backgroundColor: P.card,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: P.line,
  },
  moneyText: { color: P.ink, fontSize: 14 },

  stats: { flexDirection: 'row', gap: 6 },
  stat: { flex: 1, borderRadius: 12, paddingVertical: 7, alignItems: 'center' },
  statName: { fontSize: 11, opacity: 0.85 },
  statValue: { fontSize: 19, marginTop: -2 },

  stage: {
    backgroundColor: P.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#e4edff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAge: { color: P.blue, fontSize: 25, marginBottom: -3 },
  avatarUnit: { color: P.blue, fontSize: 11, opacity: 0.7 },
  dayWrap: { flex: 1, gap: 6 },
  dayBarBg: { height: 9, borderRadius: 999, backgroundColor: '#e2e8f4', overflow: 'hidden' },
  dayBar: { height: 9, borderRadius: 999, backgroundColor: P.blue },
  dayText: { color: P.dim, fontSize: 12 },

  logCard: {
    flex: 1,
    minHeight: 120,
    backgroundColor: P.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
  },
  log: { padding: 14, gap: 9 },
  line: { fontSize: 14, lineHeight: 21 },
  lineStrong: { fontSize: 15 },

  pane: { gap: 6 },
  /*
    행동이 일곱까지 늘어난다 (기질로 열리는 게 있다). 화면을 넘기니 목록만
    따로 굴린다. 글 칸은 줄어들되 안 사라지게 위쪽에 자리를 남긴다.
  */
  actList: { flexGrow: 0, maxHeight: 268 },

  act: {
    backgroundColor: P.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actName: { color: P.ink, fontSize: 16 },
  actHint: { color: P.faint, fontSize: 11, marginTop: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11 },

  askCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
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

  endCard: {
    backgroundColor: P.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    padding: 16,
  },
  endAge: { color: P.faint, fontSize: 13 },
  endName: { color: P.bad, fontSize: 24, marginTop: -2 },
  endLine: { color: P.dim, fontSize: 13, marginTop: 2, marginBottom: 10 },
  endStats: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  endStat: { flex: 1, alignItems: 'center' },
  endStatName: { fontSize: 11, opacity: 0.8 },
  endStatValue: { fontSize: 17, marginTop: -3 },
  endRow: { flexDirection: 'row', gap: 8, paddingVertical: 1 },
  endKey: { color: P.faint, fontSize: 12, width: 62 },
  endVal: { color: P.ink, fontSize: 12, flex: 1 },
  cardGot: {
    backgroundColor: '#e3f7e8',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  cardGotName: { color: P.good, fontSize: 14 },
  cardGotDesc: { color: '#2f7a48', fontSize: 12, marginTop: 1 },

  big: {
    backgroundColor: P.blue,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bigText: { color: '#ffffff', fontSize: 17 },
  small: { paddingVertical: 8, alignItems: 'center' },
  smallText: { color: P.dim, fontSize: 12 },
});
