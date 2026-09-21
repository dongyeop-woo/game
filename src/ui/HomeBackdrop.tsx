import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

/**
 * 홈 배경 위에 얹는 움직이는 레이어.
 *
 * 배경은 정지 그림 한 장이고, 여기서 별을 깜빡이고 빛먼지를 띄우고 마법진을
 * 숨쉬게 해서 살아 있는 화면으로 만든다. Lottie 나 동영상 대신 이렇게 하는 이유:
 * Expo Go 에서 그대로 돌고, 용량이 0 이고, 배터리 부담이 거의 없다.
 *
 * 좌표는 전부 '배경 그림 안에서의 비율'이다 - 이 컴포넌트는 그림과 똑같은
 * 크기/위치로 겹쳐 놓고 쓴다. 그래야 화면 크기가 달라져도 마법진 위에 정확히
 * 얹힌다.
 */

/**
 * 그림 속 바닥 마법진의 위치와 크기 (원본 768x1376 기준 비율).
 * 눈대중이 아니라 노란 선 픽셀 범위를 실제로 재서 넣은 값이다.
 */
export const SEAL = { x: 0.498, y: 0.582, w: 0.582, h: 0.041 };

export function HomeBackdrop({
  width,
  height,
  active = true,
}: {
  width: number;
  height: number;
  /** 홈이 화면에 보이는 동안만 움직인다 - 뒤에 숨어 있을 때 태울 배터리가 아깝다 */
  active?: boolean;
}) {
  return (
    <View
      style={[StyleSheet.absoluteFill, { width, height }]}
      pointerEvents="none"
      collapsable={false}
    >
      {/*
        그림 윗변을 배경 그라데이션에 녹인다. 화면이 그림보다 길어서 위에 빈
        공간이 생기는데, 이걸 안 하면 기둥이 허공에서 뚝 시작하는 게 보인다.
      */}
      <LinearGradient
        colors={['#27244a', 'rgba(39,36,74,0)'] as const}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.1 }}
      />
      <SealGlow width={width} height={height} active={active} />
      <Motes width={width} height={height} active={active} />
    </View>
  );
}

// ------------------------------------------------------------ 마법진 숨쉬기

/** 바닥 마법진이 천천히 밝아졌다 어두워진다 */
function SealGlow({ width, height, active }: { width: number; height: number; active: boolean }) {
  const t = useLoop(3400, 0, active);
  const w = width * SEAL.w * 1.35;
  const h = height * SEAL.h * 2.6;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: width * SEAL.x - w / 2,
        top: height * SEAL.y - h / 2,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.05] }) }],
      }}
    >
      <Svg width={w} height={h} viewBox="0 0 100 40">
        <Ellipse cx="50" cy="20" rx="50" ry="20" fill="#e8c352" opacity={0.16} />
        <Ellipse cx="50" cy="20" rx="38" ry="14" fill="#f4d97a" opacity={0.2} />
        <Ellipse cx="50" cy="20" rx="24" ry="8" fill="#fff2c4" opacity={0.22} />
      </Svg>
    </Animated.View>
  );
}

// 창(밤하늘) 쪽에는 아무것도 움직이지 않는다. 별 깜빡임과 유성을 넣어 봤는데
// 그려진 하늘 위에 겉도는 점처럼 보여서 뺐다. 움직임은 바닥에만 둔다.



// --------------------------------------------------------------- 빛먼지

/** 마법진에서 피어올라 사라지는 입자 */
function Motes({ width, height, active }: { width: number; height: number; active: boolean }) {
  const items = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        // 마법진 폭 안에서 고르게 흩는다
        x: width * (SEAL.x + (((i * 7) % 9) / 9 - 0.45) * SEAL.w * 0.9),
        y: height * SEAL.y,
        size: 3 + (i % 3) * 1.6,
        rise: height * (0.075 + (i % 4) * 0.02),
        ms: 4200 + (i % 5) * 900,
        delay: (i * 1300) % 5200,
      })),
    [width, height],
  );

  return (
    <>
      {items.map((m, i) => (
        <Mote key={i} {...m} active={active} />
      ))}
    </>
  );
}

function Mote({
  x,
  y,
  size,
  rise,
  ms,
  delay,
  active,
}: {
  x: number;
  y: number;
  size: number;
  rise: number;
  ms: number;
  delay: number;
  active: boolean;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: ms,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [t, ms, delay, active]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#ffe9a8',
        opacity: t.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.85, 0.5, 0] }),
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) }],
      }}
    />
  );
}

// ----------------------------------------------------------------- 유성

/**
 * 20초에 한 번쯤 지나간다. 자주 나오면 눈에 거슬리고, 아예 없으면 하늘이
 * 심심하다.
 */

// ------------------------------------------------------------------ 공용

/** 0 -> 1 -> 0 을 무한 반복하는 값 */
function useLoop(ms: number, delay = 0, active = true) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: ms,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: ms,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [t, ms, delay, active]);
  return t;
}
