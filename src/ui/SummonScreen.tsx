import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import {
  AVATARS,
  SUMMON_COST,
  SUMMON_COST_10,
  TIER_FX,
  TIER_ORDER,
  avatarDef,
  sortByTier,
  type PullResult,
} from '../game/avatars';
import { fmt } from '../game/format';
import { AvatarArt } from './art/avatar';
import { Button, CoinPill, Frame, ScreenHeader, Slot } from './components';
import { ScreenBackdrop } from './ScreenBackdrop';
import { C, RARITY_G, inkShadow, numeric } from './theme';

/**
 * 소환 (뽑기) 화면.
 *
 * 아바타는 전투력이 없다. 그래서 여기서 파는 건 오직 '로비가 얼마나 화려해지는가'
 * 하나뿐이고, 확률표를 숨기지 않고 그대로 펼쳐 둔다.
 */
export function SummonScreen({ onBack }: { onBack: () => void }) {
  const { meta, summon } = useMeta();
  const [results, setResults] = useState<PullResult[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ownedIds = Object.keys(meta.avatarCopies);
  const owned = sortByTier(ownedIds);
  const equipped = avatarDef(meta.avatar);

  const doSummon = (count: 1 | 10) => {
    const out = summon(count);
    if (!out) {
      setNotice('골드가 모자랍니다');
      setTimeout(() => setNotice(null), 1600);
      return;
    }
    setResults(out);
  };

  return (
    <View style={styles.root}>
      <ScreenBackdrop />
      <ScreenHeader
        title="소환"
        subtitle={`보유 ${ownedIds.length} / ${AVATARS.length}종`}
        right={<CoinPill value={fmt(meta.gold)} />}
        onClose={onBack}
      />

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* 지금 세워 둔 아바타 */}
          <Frame tone="deep" style={styles.showcase}>
            <View style={styles.showRow}>
              <View style={[styles.showArt, { borderColor: TIER_FX[equipped.tier].color }]}>
                <AvatarArt def={equipped} size={72} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.showHead}>
                  <TierTag tier={equipped.tier} />
                </View>
                <Text style={styles.showName}>{equipped.name}</Text>
                <Text style={styles.showDesc} numberOfLines={2}>
                  {equipped.desc}
                </Text>
              </View>
            </View>
          </Frame>

          {/* 확률표 */}
          <Frame tone="deep" style={styles.rates}>
            <Text style={styles.ratesTitle}>등급별 확률</Text>
            {TIER_ORDER.slice()
              .reverse()
              .map((tier) => {
                const fx = TIER_FX[tier];
                const have = ownedIds.filter((id) => avatarDef(id).tier === tier).length;
                const total = AVATARS.filter((a) => a.tier === tier).length;
                return (
                  <View key={tier} style={styles.rateRow}>
                    <View style={[styles.rateDot, { backgroundColor: fx.color }]} />
                    <Text style={[styles.rateLabel, { color: fx.color }]}>{fx.label}</Text>
                    <Text style={styles.rateFx}>{fxText(tier)}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.rateHave}>
                      {have}/{total}
                    </Text>
                    <Text style={styles.ratePct}>{fx.rate}%</Text>
                  </View>
                );
              })}
            <Text style={styles.ratesNote}>
              10연은 희귀 이상 1장이 확정입니다. 같은 아바타가 겹치면 별이 오릅니다
              (2장이면 2성, 4장이면 3성). 별을 다 올린 뒤부터 골드로 돌려받습니다.
            </Text>
          </Frame>

          <Button
            label={`🔮  소환  💰 ${fmt(SUMMON_COST)}`}
            tone="purple"
            onPress={() => doSummon(1)}
            style={{ marginTop: 4 }}
          />
          <Button
            label={`✨  10연 소환  💰 ${fmt(SUMMON_COST_10)}`}
            tone="gold"
            onPress={() => doSummon(10)}
          />
          <Text style={styles.totalNote}>지금까지 {fmt(meta.summons)}회 소환했습니다</Text>
        </ScrollView>

      {notice ? (
        <View style={styles.notice} pointerEvents="none">
          <Frame tone="hot">
            <Text style={styles.noticeText}>{notice}</Text>
          </Frame>
        </View>
      ) : null}

      <ResultModal results={results} onClose={() => setResults(null)} />
    </View>
  );
}

/** 등급이 무엇을 켜 주는지 한 줄로 */
function fxText(tier: string): string {
  switch (tier) {
    case 'mythic':
      return '광선 + 반짝이 12';
    case 'legend':
      return '광선 + 반짝이 8';
    case 'epic':
      return '도는 마법진';
    case 'rare':
      return '오라';
    default:
      return '기본';
  }
}

function TierTag({ tier }: { tier: keyof typeof TIER_FX }) {
  return (
    <View style={[styles.tierTag, { backgroundColor: TIER_FX[tier].color }]}>
      <Text style={styles.tierTagText}>{TIER_FX[tier].label}</Text>
    </View>
  );
}

// ------------------------------------------------------------- 결과 연출

export function ResultModal({
  results,
  onClose,
}: {
  results: PullResult[] | null;
  onClose: () => void;
}) {
  if (!results) return null;
  const best = results.reduce(
    (b, r) => (TIER_ORDER.indexOf(r.def.tier) > TIER_ORDER.indexOf(b.def.tier) ? r : b),
    results[0],
  );
  const refund = results.reduce((s, r) => s + r.refund, 0);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.resultBox}>
          <Text style={[styles.resultTop, { color: TIER_FX[best.def.tier].color }]}>
            {TIER_FX[best.def.tier].label} 등장!
          </Text>

          <View style={styles.resultGrid}>
            {results.map((r, i) => (
              <View key={i} style={styles.resultCell}>
                <LinearGradient colors={RARITY_G[r.def.tier]} style={styles.resultArt}>
                  <AvatarArt def={r.def} size={results.length > 1 ? 54 : 108} />
                </LinearGradient>
                <Text style={styles.resultName} numberOfLines={1}>
                  {r.def.name}
                </Text>
                {r.isNew ? (
                  <View style={styles.newTag}>
                    <Text style={styles.newText}>NEW</Text>
                  </View>
) : (
                  <Text style={styles.dupText}>💰 +{fmt(r.refund)}</Text>
                )}
              </View>
            ))}
          </View>

          {refund > 0 ? (
            <Text style={styles.refundNote}>
              별을 다 올린 아바타는 골드 {fmt(refund)} 로 돌려받았습니다
            </Text>
          ) : null}
          <Button label="확인" tone="gold" onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },


  body: { padding: 12, gap: 10, paddingBottom: 24 },

  showcase: { borderRadius: 14 },
  showRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  showArt: {
    width: 82,
    height: 82,
    borderRadius: 18,
    borderWidth: 2.5,
    backgroundColor: C.slotDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  showName: { color: C.text, fontSize: 17, marginTop: 4, ...inkShadow },
  showDesc: { color: C.textDim, fontSize: 11.5, marginTop: 3, lineHeight: 16 },

  tierTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.outline,
  },
  tierTagText: { color: '#1a1030', fontSize: 10.5 },

  rates: { borderRadius: 14 },
  ratesTitle: { color: C.text, fontSize: 14, marginBottom: 8, ...inkShadow },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  rateDot: { width: 9, height: 9, borderRadius: 5 },
  rateLabel: { fontSize: 13, width: 34 },
  rateFx: { color: C.textFaint, fontSize: 11 },
  rateHave: { color: C.textDim, fontSize: 11.5, ...numeric },
  ratePct: { color: C.text, fontSize: 13, width: 44, textAlign: 'right', ...numeric },
  ratesNote: {
    color: C.textFaint,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.outline,
  },
  totalNote: { color: C.textFaint, fontSize: 11, textAlign: 'center', marginTop: 2 },


  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6,4,18,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  resultBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: C.outline,
    backgroundColor: C.panel,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  resultTop: { fontSize: 19, ...inkShadow },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  resultCell: { alignItems: 'center', width: 62 },
  resultArt: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: { color: C.text, fontSize: 10, marginTop: 3, textAlign: 'center' },
  newTag: {
    marginTop: 2,
    backgroundColor: C.gold,
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  newText: { color: '#2a1f10', fontSize: 9 },
  dupText: { color: C.textFaint, fontSize: 9.5, marginTop: 3 },
  refundNote: { color: C.textDim, fontSize: 11.5, textAlign: 'center' },

  notice: { position: 'absolute', bottom: 90, alignSelf: 'center' },
  noticeText: { color: C.text, fontSize: 13.5, ...inkShadow },
});
