import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import { fmt } from '../game/format';
import {
  AD_REWARDS,
  ATTEND_REWARDS,
  MISSIONS,
  SWEEP_PER_DAY,
  adUsesLeft,
  attendDay,
  attendReward,
  canAttend,
  missionClaimable,
  missionDone,
  sweepsLeft,
} from '../game/progress';
import { Badge, Bar, Button, CoinPill, Frame, ScreenHeader, Slot, VTabs } from './components';
import { ScreenBackdrop } from './ScreenBackdrop';
import { C, inkShadow, numeric } from './theme';

type Tab = 'mission' | 'attend' | 'ad';

export function MissionScreen({ onBack }: { onBack: () => void }) {
  const { meta, claimMission, attend, watchAd } = useMeta();
  const [tab, setTab] = useState<Tab>('mission');

  const claimable = MISSIONS.filter((m) => missionClaimable(meta, m)).length;
  const adsLeft = AD_REWARDS.filter((a) => adUsesLeft(meta, a.id) > 0).length;

  return (
    <View style={styles.root}>
      <ScreenBackdrop />
      <ScreenHeader
        title="일일"
        subtitle="매일 자정에 초기화됩니다"
        right={<CoinPill value={fmt(meta.gold)} />}
        onClose={onBack}
      />

      <View style={styles.body}>
        <VTabs
          tabs={[
            { id: 'mission' as Tab, label: '미션' },
            { id: 'attend' as Tab, label: '출석' },
            { id: 'ad' as Tab, label: '광고 보상' },
          ]}
          value={tab}
          onChange={setTab}
          badges={{ mission: claimable, attend: canAttend(meta) ? 1 : 0, ad: adsLeft }}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.pane}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'mission' ? (
            <>
              {MISSIONS.map((m) => {
                const done = missionDone(meta, m);
                const claimed = meta.daily.claimed.includes(m.id);
                const progress = Math.min(m.goal, m.progress(meta.daily));
                return (
                  <Frame key={m.id} tone={done && !claimed ? 'hot' : 'wood'} style={styles.row}>
                    <View style={styles.rowHead}>
                      <Slot size={54}>
                        <Text style={styles.emoji}>{m.emoji}</Text>
                      </Slot>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{m.name}</Text>
                        <Bar
                          ratio={progress / m.goal}
                          color={done ? C.green : C.blue}
                          height={6}
                          style={{ marginTop: 5 }}
                        />
                        <Text style={styles.progress}>
                          {fmt(progress)} / {fmt(m.goal)} | 보상 💰 {fmt(m.reward)}
                        </Text>
                      </View>
                      <Button
                        label={claimed ? '완료' : done ? '받기' : '진행 중'}
                        tone={done && !claimed ? 'green' : 'plain'}
                        compact
                        disabled={claimed || !done}
                        onPress={() => claimMission(m.id)}
                      />
                    </View>
                  </Frame>
                );
              })}
              <Text style={styles.note}>
                오늘 남은 소탕 {sweepsLeft(meta)} / {SWEEP_PER_DAY}회
              </Text>
            </>
          ) : null}

          {tab === 'attend' ? (
            <>
              <Text style={styles.note}>연속 {meta.attendStreak}일</Text>
              <View style={styles.attendGrid}>
                {ATTEND_REWARDS.map((reward, i) => {
                  const day = attendDay(meta);
                  const past = i < day || (i === day && meta.daily.attended);
                  const isToday = i === day && !meta.daily.attended;
                  return (
                    <Frame key={i} tone={isToday ? 'hot' : 'wood'} style={styles.attendCard}>
                      <Text style={styles.attendDay}>{i + 1}일차</Text>
                      <Slot size={54} active={isToday}>
                        <Text style={styles.emoji}>{past ? '✅' : '💰'}</Text>
                      </Slot>
                      <Text style={styles.attendReward}>{fmt(reward)}</Text>
                    </Frame>
                  );
                })}
              </View>
              <Button
                label={canAttend(meta) ? `출석하고 💰 ${fmt(attendReward(meta))} 받기` : '오늘은 받았습니다'}
                tone={canAttend(meta) ? 'gold' : 'plain'}
                disabled={!canAttend(meta)}
                onPress={attend}
                style={{ marginTop: 12 }}
              />
            </>
          ) : null}

          {tab === 'ad' ? (
            <>
              <Text style={styles.warn}>
                ⚠ 실제 광고 SDK 는 붙어 있지 않습니다. 누르면 광고 없이 바로 지급되는 테스트
                동작입니다.
              </Text>
              {AD_REWARDS.map((a) => {
                const left = adUsesLeft(meta, a.id);
                return (
                  <Frame key={a.id} tone={left > 0 ? 'hot' : 'wood'} style={styles.row}>
                    <View style={styles.rowHead}>
                      <Slot size={54}>
                        <Text style={styles.emoji}>{a.emoji}</Text>
                      </Slot>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{a.name}</Text>
                        <Text style={styles.progress}>
                          {a.desc} | 오늘 {left} / {a.perDay}회 남음
                        </Text>
                      </View>
                      <View>
                        <Button
                          label="📺 시청"
                          tone={left > 0 ? 'green' : 'plain'}
                          compact
                          disabled={left <= 0}
                          onPress={() => watchAd(a.id)}
                        />
                        <Badge count={left} />
                      </View>
                    </View>
                  </Frame>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, flexDirection: 'row', padding: 14, gap: 14 },
  pane: { paddingBottom: 18, gap: 11 },

  row: { marginBottom: 0 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 26 },
  name: { color: C.text, fontSize: 15, fontWeight: '900', ...inkShadow },
  progress: { color: '#ffeccd', fontSize: 12, fontWeight: '700', marginTop: 4, ...numeric },
  note: { color: C.textDim, fontSize: 12.5, marginTop: 8, fontWeight: '700' },
  warn: {
    color: C.textDim,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 4,
    padding: 9,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.outline,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  attendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attendCard: { width: 104, alignItems: 'center' },
  attendDay: { color: '#ffeccd', fontSize: 11.5, fontWeight: '900', marginBottom: 6 },
  attendReward: { color: C.gold, fontSize: 14, fontWeight: '900', marginTop: 7, ...inkShadow, ...numeric },
});
