import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { Model3D } from './art/Model3D';
import { MODELS } from './art/models';
import { Button } from './components';
import { C, inkShadow } from './theme';

/**
 * 3D 모델 확인용 화면.
 *
 * 새 모델을 넣었을 때 크게 띄워 놓고 보려고 남겨 둔 곳이다. 실제 렌더는
 * `art/Model3D.tsx` 가 다 하고 여기는 크기만 준다.
 */
export function Board3D({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.root}>
      <Model3D
        source={MODELS.mochi.idle}
        size={340}
        shape={{ torso: MODELS.mochi.torso, belly: MODELS.mochi.belly, head: MODELS.mochi.head }}
      />
      <Text style={styles.label}>mochi · idle</Text>
      <Button label="닫기" tone="plain" compact onPress={onBack} style={{ width: 90 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  label: { color: C.text, fontSize: 12 },
});
