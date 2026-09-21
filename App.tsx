import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

import { Text } from './src/ui/Text';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { UNITS } from './src/game/content';
import { GameProvider, useMeta } from './src/game/GameContext';
import { DefenseScreen } from './src/ui/DefenseScreen';
import { LifeScreen } from './src/ui/LifeScreen';
import { Board3D } from './src/ui/Board3D';
import { CodexScreen } from './src/ui/CodexScreen';
import { FriendScreen } from './src/ui/FriendScreen';
import { HomeScreen } from './src/ui/HomeScreen';
import { MissionScreen } from './src/ui/MissionScreen';
import { ShopScreen } from './src/ui/ShopScreen';
import { SummonScreen } from './src/ui/SummonScreen';
import { Frame } from './src/ui/components';
import { FONT } from './src/ui/Text';
import { C, inkShadow } from './src/ui/theme';

// 폰트가 준비될 때까지 스플래시를 붙잡아 둔다 (글자가 기본 폰트로 번쩍이는 걸 막는다)
void SplashScreen.preventAutoHideAsync();

/** 홈 배경 그림. 미리 받아 두려고 여기서 한 번 잡아 둔다 (HomeScreen 과 같은 파일이어야 한다) */
const BG_IMAGE = require('./assets/background.jpg');

/**
 * 배경 그림을 스플래시 뒤에서 미리 받아 둔다.
 *
 * 안 그러면 홈의 버튼과 캐릭터는 바로 뜨는데 배경만 뒤늦게 들어와서, 어두운
 * 맨바닥이 한 번 보였다가 그림이 덮는 게 눈에 띈다. 폰트를 기다리는 것과 같은 이유다.
 * 못 받아도 게임은 띄운다 - 배경 없이 시작할지언정 멈춰 있는 것보다 낫다.
 */
function useBackgroundReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };

    const uri = Image.resolveAssetSource(BG_IMAGE)?.uri;
    if (!uri) {
      done();
      return;
    }

    // 네트워크가 말썽이어도 여기서 앱이 멈추면 안 된다
    const timer = setTimeout(done, 2000);
    Image.prefetch(uri)
      .then(done)
      .catch(done)
      .finally(() => clearTimeout(timer));

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return ready;
}

type Screen =
  | { name: 'home' }
  | { name: 'life' }
  | { name: 'battle'; stageId: string; mode: 'tutorial' | 'normal' | 'pvp' }
  | { name: 'missions' }
  | { name: 'codex' }
  | { name: 'summon' }
  | { name: 'board3d' }
  | { name: 'shop' }
  | { name: 'friends' }
  // [임시] 3D 실험 화면 - 돌아가는지 확인용;

/** 새 유닛이 열렸을 때 잠깐 띄우는 알림 */
function UnlockNotice() {
  const { newlyUnlocked, clearUnlockNotice } = useMeta();
  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    const timer = setTimeout(clearUnlockNotice, 3200);
    return () => clearTimeout(timer);
  }, [newlyUnlocked, clearUnlockNotice]);

  if (newlyUnlocked.length === 0) return null;
  const names = newlyUnlocked
    .map((id) => UNITS.find((u) => u.id === id)?.name ?? id)
    .join(', ');

  return (
    <View style={styles.unlock} pointerEvents="none">
      <Frame tone="hot">
        <Text style={styles.unlockText}>🎉 새 유닛 해금 - {names}</Text>
      </Frame>
    </View>
  );
}

function Root() {
  const { ready, completeMode } = useMeta();
  const insets = useSafeAreaInsets();

  /*
   * 세로 고정.
   *
   * app.json 의 orientation 은 네이티브 빌드에서만 확실히 먹는다.
   * Expo Go 나 시뮬레이터에서는 그것만으로 안 돌아가므로 런타임에도 잠근다.
   */
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
      // 웹에서는 지원하지 않는다 - 창 크기로 대응하면 된다
    });
  }, []);

  // 홈은 정비 화면이다
  const [screen, setScreen] = useState<Screen>({ name: 'life' });

  if (!ready) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={C.gold} />
        <Text style={styles.loading}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        // 가로 모드에서는 노치가 좌우로 오므로 양쪽 여백을 준다
        { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      {screen.name === 'home' ? (
        <HomeScreen
          onPlay={(mode, stageId) => setScreen({ name: 'battle', stageId, mode })}
          onMissions={() => setScreen({ name: 'missions' })}
          onCodex={() => setScreen({ name: 'codex' })}
          onShop={() => setScreen({ name: 'shop' })}
          onFriends={() => setScreen({ name: 'friends' })}
        />
      ) : null}

      {screen.name === 'battle' ? (
        <DefenseScreen
          stageId={screen.stageId}
          mode={screen.mode}
          onExit={() => {
            // 한 판 했다는 것만 남긴다 - 이기든 지든 다음 모드가 열린다
            completeMode(screen.mode);
            setScreen({ name: 'home' });
          }}
        />
      ) : null}

      {screen.name === 'life' ? <LifeScreen onExit={() => setScreen({ name: 'home' })} /> : null}
      {screen.name === 'board3d' ? <Board3D onBack={() => setScreen({ name: 'home' })} /> : null}

      {screen.name === 'missions' ? (
        <MissionScreen onBack={() => setScreen({ name: 'home' })} />
      ) : null}

      {screen.name === 'codex' ? (
        <CodexScreen onBack={() => setScreen({ name: 'home' })} />
      ) : null}

      {screen.name === 'summon' ? (
        <SummonScreen onBack={() => setScreen({ name: 'home' })} />
      ) : null}

      {screen.name === 'shop' ? <ShopScreen onBack={() => setScreen({ name: 'home' })} /> : null}

      {screen.name === 'friends' ? (
        <FriendScreen onBack={() => setScreen({ name: 'home' })} />
      ) : null}


      <UnlockNotice />
    </View>
  );
}

export default function App() {
  // 앱 전체가 이 폰트 하나로 간다 (src/ui/Text.tsx 참고)
  const [fontsLoaded, fontError] = useFonts({
    [FONT]: require('./assets/BMJUA_otf.otf'),
  });
  const bgReady = useBackgroundReady();
  const ready = (fontsLoaded || !!fontError) && bgReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // 폰트 로딩에 실패해도 게임은 띄운다 (기본 폰트로 표시될 뿐)
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" hidden />
      <GameProvider>
        <Root />
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  loading: { color: C.textDim, fontSize: 13, marginTop: 10 },
  unlock: { position: 'absolute', top: 62, alignSelf: 'center' },
  unlockText: { color: C.text, fontSize: 13.5, fontWeight: '900', ...inkShadow },
});
