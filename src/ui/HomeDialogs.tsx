import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import { fmt } from '../game/format';
import { Button, Frame, Toggle } from './components';
import { MenuIcon } from './art/icons';
import { C, inkShadow, numeric } from './theme';

/**
 * 로비 오른쪽 위에서 열리는 작은 창들.
 *
 * 화면을 갈아 끼우지 않고 창으로 띄운다 - 우편을 받고 설정을 만지는 건
 * '들렀다 나오는' 일이라, 로비를 떠났다 돌아오면 한 걸음이 더 낀다.
 */

function Veil({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    // 바깥을 누르면 닫힌다 - 전체 화면짜리 창이 아니니 나가는 길이 있어야 한다
    <Pressable style={styles.veil} onPress={onClose}>
      <Pressable style={styles.panel} onPress={() => {}}>
        {children}
      </Pressable>
    </Pressable>
  );
}

// ------------------------------------------------------------------ 우편함

export function MailDialog({ onClose }: { onClose: () => void }) {
  const { meta, claimMail, claimAllMail } = useMeta();
  const [got, setGot] = useState(0);

  const list = [...meta.mail].sort((a, b) => b.at - a.at);
  const waiting = list.filter((m) => !m.claimed).length;

  const take = (n: number) => {
    if (n > 0) setGot(n);
  };

  return (
    <Veil onClose={onClose}>
      <Frame tone="deep" style={styles.box}>
        <View style={styles.head}>
          <MenuIcon name="mail" size={20} color={C.gold} />
          <Text style={styles.title}>우편함</Text>
        </View>

        {list.length === 0 ? (
          <Text style={styles.empty}>온 편지가 없습니다</Text>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {list.map((m) => (
              <View key={m.id} style={[styles.mail, m.claimed && styles.mailDone]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mailTitle}>{m.title}</Text>
                  <Text style={styles.mailBody}>{m.body}</Text>
                </View>
                <View style={styles.mailRight}>
                  <View style={styles.reward}>
                    <MenuIcon name="coin" size={13} color={C.gold} />
                    <Text style={styles.rewardNum}>{fmt(m.gold)}</Text>
                  </View>
                  {m.claimed ? (
                    <Text style={styles.done}>받음</Text>
                  ) : (
                    <Button
                      label="받기"
                      compact
                      onPress={() => take(claimMail(m.id))}
                      style={{ width: 62 }}
                    />
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* 편지가 쌓이면 한 통씩 누르는 게 일이 된다 */}
        {waiting > 1 ? (
          <Button label={`전부 받기 (${waiting})`} onPress={() => take(claimAllMail())} />
        ) : null}
        <View style={{ height: 8 }} />
        <Button label="닫기" tone="plain" onPress={onClose} />

        {got > 0 ? <Text style={styles.got}>+{fmt(got)} 골드</Text> : null}
      </Frame>
    </Veil>
  );
}

// -------------------------------------------------------------------- 설정

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { meta, setShowFps, setHaptics, resetAll } = useMeta();
  const [asking, setAsking] = useState(false);

  return (
    <Veil onClose={onClose}>
      <Frame tone="deep" style={styles.box}>
        <View style={styles.head}>
          <MenuIcon name="settings" size={20} color={C.gold} />
          <Text style={styles.title}>설정</Text>
        </View>

        <Toggle
          label="진동"
          note="때릴 때마다 짧게, 잡거나 성문이 깎이면 조금 세게"
          on={meta.haptics}
          onPress={() => setHaptics(!meta.haptics)}
        />

        <Toggle
          label="전투 중 프레임 표시"
          note="버벅임을 눈대중하지 않으려고 띄워 두는 숫자"
          on={meta.showFps}
          onPress={() => setShowFps(!meta.showFps)}
        />

        <View style={styles.line} />

        {asking ? (
          <>
            <Text style={styles.warn}>
              모은 아바타·도감·골드가 전부 사라집니다.{'\n'}되돌릴 수 없습니다.
            </Text>
            <Button
              label="정말 지우기"
              tone="red"
              onPress={() => {
                resetAll();
                onClose();
              }}
            />
            <View style={{ height: 8 }} />
            <Button label="그만두기" tone="plain" onPress={() => setAsking(false)} />
          </>
        ) : (
          <>
            <Pressable style={styles.row} onPress={() => setAsking(true)}>
              <Text style={styles.rowLabel}>데이터 초기화</Text>
              <Text style={styles.rowValue}>처음부터</Text>
            </Pressable>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>버전</Text>
              <Text style={styles.rowValue}>{meta.version}</Text>
            </View>
            <View style={{ height: 10 }} />
            <Button label="닫기" tone="plain" onPress={onClose} />
          </>
        )}
      </Frame>
    </Veil>
  );
}


const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  rowLabel: { color: C.text, fontSize: 13 },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,4,18,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  panel: { width: '100%', maxWidth: 360 },
  box: { width: '100%' },

  head: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  title: { color: C.text, fontSize: 18, ...inkShadow },

  empty: { color: C.textDim, fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  list: { maxHeight: 300, alignSelf: 'stretch', marginBottom: 10 },
  mail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 7,
    borderRadius: 11,
    backgroundColor: 'rgba(10,7,26,0.5)',
    borderWidth: 2,
    borderColor: C.outline,
  },
  mailDone: { opacity: 0.5 },
  mailTitle: { color: C.text, fontSize: 13 },
  mailBody: { color: C.textDim, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  mailRight: { alignItems: 'center', gap: 5 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rewardNum: { color: C.gold, fontSize: 12, ...numeric },
  done: { color: C.textFaint, fontSize: 10 },
  got: { color: C.gold, fontSize: 13, textAlign: 'center', marginTop: 10, ...numeric },

  rowValue: { color: C.textDim, fontSize: 12, ...numeric },
  line: { height: 2, backgroundColor: C.outline, marginVertical: 4 },
  warn: { color: C.textDim, fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginBottom: 12 },

});
