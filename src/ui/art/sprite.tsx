import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';

import type { SpriteMotion, SpriteSet } from './sprites';

/**
 * 구운 동작 그림을 넘겨 가며 보여 준다 (`sprites.ts`).
 *
 * 창 하나를 내고 그 뒤로 긴 그림을 옆으로 민다. 미는 일은 네이티브 애니메이션에
 * 맡긴다 - JS 는 처음 한 번만 시키고 손을 뗀다. 유닛이 열여섯이어도 프레임마다
 * 할 일이 없고, 화면을 다시 그리지 않아도 캐릭터는 계속 숨을 쉰다.
 *
 * 대기는 **돌고**, 공격은 **한 번만** 튼다. 공격은 반드시 첫 장부터 시작해야
 * 한다 - 예전에는 대기 타이머를 그대로 쓰다 보니 동작 중간부터 보여서, 받은
 * 모션과 다른 것이 나왔다.
 */
export const SpriteArt = React.memo(function SpriteArt({
  set,
  size,
  register,
  period,
}: {
  set: SpriteSet;
  /** 화면에 놓일 한 변(픽셀) */
  size: number;
  /** 이 유닛이 때리는 순간을 알려 준다. 공격 동작이 있으면 그 줄을 한 번 튼다 */
  register?: (fn: () => void) => () => void;
  /**
   * 다음 타격까지의 간격(밀리초).
   *
   * 공격 동작이 이보다 길면 아직 쏘는 중에 다음 발이 나가서, 동작이 매번
   * 처음으로 되돌아가느라 앞부분만 반복된다. 짧은 쪽에 맞춘다.
   */
  period?: number;
}) {
  const step = useRef(new Animated.Value(0)).current;
  const [motion, setMotion] = useState<SpriteMotion>('idle');
  /** 공격이 다시 들어온 걸 알리는 값. 같은 'attack' 이어도 처음부터 다시 튼다 */
  const [shot, setShot] = useState(0);

  const hasAttack = Boolean(set.attackMs) && set.motions.includes('attack');

  useEffect(() => {
    if (!register || !hasAttack) return;
    return register(() => {
      setMotion('attack');
      setShot((n) => n + 1);
    });
  }, [register, hasAttack]);

  useEffect(() => {
    step.setValue(0);
    const linear = { easing: Easing.linear, useNativeDriver: true } as const;
    if (motion === 'attack' && set.attackMs) {
      const ms = Math.min(set.attackMs, period ?? set.attackMs);
      const anim = Animated.timing(step, { toValue: set.frames, duration: ms, ...linear });
      anim.start(({ finished }) => {
        if (finished) setMotion('idle');
      });
      return () => anim.stop();
    }
    const anim = Animated.loop(
      Animated.timing(step, { toValue: set.frames, duration: set.loopMs, ...linear }),
    );
    anim.start();
    return () => anim.stop();
  }, [motion, shot, set, period, step]);

  /*
    부드럽게 흐르지 않고 **한 장씩 툭툭 넘어가야** 한다.

    그냥 이어서 밀면 두 장이 반씩 겹쳐 보인다. 한 장이 머무는 구간을 계단처럼
    끊어 두면 제 장만 보인다.
  */
  const rowsPer = Math.ceil(set.frames / set.cols);
  const slide = useMemo(() => {
    const input: number[] = [];
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i < set.frames; i += 1) {
      input.push(i, i + 0.999);
      const gx = -(i % set.cols) * size;
      const gy = -Math.floor(i / set.cols) * size;
      x.push(gx, gx);
      y.push(gy, gy);
    }
    const clamp = { inputRange: input, extrapolate: 'clamp' as const };
    return {
      x: step.interpolate({ ...clamp, outputRange: x }),
      y: step.interpolate({ ...clamp, outputRange: y }),
    };
  }, [set.frames, set.cols, size, step]);

  const row = Math.max(0, set.motions.indexOf(motion));

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }} pointerEvents="none">
      <Animated.Image
        source={set.src}
        resizeMode="stretch"
        style={{
          width: size * set.cols,
          height: size * rowsPer * set.motions.length,
          // 격자 안에서 한 칸을 고르고(x, y), 동작마다 그 묶음만큼 더 내려간다
          transform: [
            { translateX: slide.x },
            { translateY: slide.y },
            { translateY: -row * rowsPer * size },
          ],
        }}
      />
    </View>
  );
});

/**
 * 시트에서 첫 장만 꺼내 가만히 보여 준다.
 *
 * 상점 카드와 트레이에 쓴다. 판 위와 다른 그림을 쓰면 같은 유닛으로 안 읽히고,
 * 그렇다고 카드마다 동작을 돌리면 상점을 열 때마다 스무 개가 같이 돈다.
 */
export const SpriteStill = React.memo(function SpriteStill({
  set,
  size,
}: {
  set: SpriteSet;
  size: number;
}) {
  const rowsPer = Math.ceil(set.frames / set.cols);
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }} pointerEvents="none">
      <Image
        source={set.src}
        resizeMode="stretch"
        style={{ width: size * set.cols, height: size * rowsPer * set.motions.length }}
      />
    </View>
  );
});
