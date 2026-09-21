import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TubeScreen } from './src/ui/TubeScreen';
import { FONT } from './src/ui/Text';

/**
 * 유튜버 키우기.
 *
 * 기획은 `docs/design.md`.
 *
 * 앞서 이 저장소에는 원랜디 디펜스 게임이 있었다. 장르를 바꾸면서 도려냈고
 * 커밋 `1ff6697` 에 통째로 남아 있다 - 전투·웨이브·트랙·Skia 캔버스·고양이
 * 스프라이트가 필요하면 거기서 꺼내면 된다.
 */

// 폰트가 준비될 때까지 스플래시를 붙잡아 둔다 (글자가 기본 폰트로 번쩍이는 걸 막는다)
void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({ [FONT]: require('./assets/BMJUA_otf.otf') });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.wait}>
        <ActivityIndicator color="#3b74e8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" hidden />
      <View style={styles.root}>
        <TubeScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eaf0fa' },
  wait: { flex: 1, backgroundColor: '#eaf0fa', alignItems: 'center', justifyContent: 'center' },
});
