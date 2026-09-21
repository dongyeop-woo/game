import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import { fmt } from '../game/format';
import { CoinPill, Frame, ScreenHeader } from './components';
import { ScreenBackdrop } from './ScreenBackdrop';
import { C, inkShadow } from './theme';

/**
 * 친구.
 *
 * 아직 서버가 없다. 친구 목록도 요청도 전부 서버에서 오는 것이라 지금은
 * 만들어 낼 수 없고, 만들어 내면 안 된다 - 가짜 친구를 채워 두면 나중에
 * 진짜를 붙일 때 어디까지가 껍데기인지 알 수 없게 된다.
 *
 * 그래서 자리와 빈 상태만 잡아 둔다. 서버가 붙으면 이 자리에 목록이 들어간다.
 */
export function FriendScreen({ onBack }: { onBack: () => void }) {
  const { meta } = useMeta();

  return (
    <View style={styles.root}>
      <ScreenBackdrop />
      <ScreenHeader
        title="친구"
        right={<CoinPill value={fmt(meta.gold)} />}
        onClose={onBack}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Frame tone="deep" style={styles.card}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>아직 친구가 없습니다</Text>
          <Text style={styles.emptyBody}>
            친구 기능은 서버가 붙어야 동작합니다.{'\n'}
            지금은 자리만 잡아 둔 상태입니다.
          </Text>
        </Frame>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { padding: 14 },
  card: { padding: 26, alignItems: 'center', gap: 7 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: C.text, fontSize: 15, marginTop: 4, ...inkShadow },
  emptyBody: { color: C.textDim, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
