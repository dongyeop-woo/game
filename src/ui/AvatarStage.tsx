import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { TIER_FX, type AvatarDef } from '../game/avatars';
import { AvatarArt } from './art/avatar';
import { MagicCircle } from './art/wizard';

/**
 * 로비 한가운데 무대.
 *
 * 아바타는 능력치가 없으니 보상은 전부 '보이는 것'이다. 기준은 **등급 하나**다
 * (TIER_FX): 오라 -> 도는 마법진 -> 반짝이 -> 광선.
 *
 * 전에는 '몇 장 모았나'로 별을 매겨 크기와 반짝이를 더 얹었는데, 아바타는
 * 진화하지 않기로 해서 걷어냈다. 같은 아바타를 또 뽑아도 겉모습은 그대로다.
 */

export function AvatarStage({ def, size = 186 }: { def: AvatarDef; size?: number }) {
  const fx = TIER_FX[def.tier];
  const circle = size * 1.22;

  return (
    <View style={[styles.root, { width: circle, height: circle }]}>
      {fx.rays ? <Rays size={circle * 1.35} color={fx.color} /> : null}
      {fx.glow > 0 ? <Glow size={circle} color={fx.color} strength={fx.glow} /> : null}
      <SpinningCircle size={circle} color={fx.color} spin={fx.spin} />
      {fx.sparkles > 0 ? (
        <Sparkles count={fx.sparkles} color={fx.color} radius={circle * 0.44} />
      ) : null}
      <Breathing>
        <AvatarArt def={def} size={size} />
      </Breathing>
    </View>
  );
}

// --------------------------------------------------------------- 숨쉬기

/**
 * 가만히 서 있으면 그림처럼 보인다. 위아래로 아주 조금 까딱이면서 살짝
 * 눌렸다 펴지면 그것만으로 살아 있는 것처럼 읽힌다 (롤토체스 전설이의 idle).
 */
function Breathing({ children }: { children: React.ReactNode }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [t]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [2.5, -3.5] }) },
          { scaleY: t.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1.015] }) },
          { scaleX: t.interpolate({ inputRange: [0, 1], outputRange: [1.012, 0.99] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ------------------------------------------------------------- 도는 별

/** 3성에만 붙는다 - 캐릭터 주위를 별이 천천히 돈다 */
function Orbit({ count, radius }: { count: number; radius: number }) {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [turn]);

  const items = Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius * 0.5 };
  });

  return (
    <Animated.View
      style={[
        styles.layer,
        {
          transform: [
            { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {items.map((p, i) => (
        <View key={i} style={{ position: 'absolute', marginLeft: p.x, marginTop: p.y }}>
          <Svg width={13} height={13} viewBox="0 0 10 10">
            <Polygon points="5,0 6.1,3.6 10,5 6.1,6.4 5,10 3.9,6.4 0,5 3.9,3.6" fill="#ffe9a8" />
          </Svg>
        </View>
      ))}
    </Animated.View>
  );
}

// ------------------------------------------------------------- 도는 마법진

function SpinningCircle({ size, color, spin }: { size: number; color: string; spin: number }) {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (spin <= 0) return;
    const anim = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: spin * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin, turn]);

  const style =
    spin > 0
      ? {
          transform: [
            { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        }
      : undefined;

  return (
    <Animated.View style={[styles.layer, style]}>
      <MagicCircle size={size} color={color} />
    </Animated.View>
  );
}

// ----------------------------------------------------------------- 오라

/** 캐릭터 뒤에서 천천히 숨 쉬는 광채 */
function Glow({ size, color, strength }: { size: number; color: string; strength: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.layer,
        {
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.32 * strength, 0.72 * strength],
          }),
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="42" fill={color} opacity={0.16} />
        <Circle cx="50" cy="50" r="33" fill={color} opacity={0.2} />
        <Circle cx="50" cy="50" r="24" fill={color} opacity={0.24} />
      </Svg>
    </Animated.View>
  );
}

// ----------------------------------------------------------------- 광선

/** 전설 이상에만 붙는 배경 광선 */
function Rays({ size, color }: { size: number; color: string }) {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 34000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [turn]);

  const wedges = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);

  return (
    <Animated.View
      style={[
        styles.layer,
        {
          opacity: 0.22,
          transform: [
            { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {wedges.map((deg, i) => (
          <Polygon
            key={i}
            points="50,50 44,0 56,0"
            fill={color}
            opacity={i % 2 === 0 ? 0.85 : 0.4}
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

// --------------------------------------------------------------- 반짝이

function Sparkles({ count, color, radius }: { count: number; color: string; radius: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (Math.PI * 2 * i) / count + 0.6;
        return {
          x: Math.cos(a) * radius,
          y: Math.sin(a) * radius * 0.88,
          size: 5 + (i % 3) * 2.5,
          delay: (i * 2300) % 4200,
        };
      }),
    [count, radius],
  );

  return (
    <View style={styles.layer} pointerEvents="none">
      {items.map((s, i) => (
        <Sparkle key={i} {...s} color={color} />
      ))}
    </View>
  );
}

function Sparkle({
  x,
  y,
  size,
  delay,
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: x - size / 2,
        marginTop: y - size / 2,
        opacity: t.interpolate({ inputRange: [0, 0.25, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [7, -15] }) },
          { scale: t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 1, 0.7] }) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 10 10">
        <Polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4" fill={color} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
