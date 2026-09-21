import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

/**
 * 그림을 조각내 관절처럼 움직인다.
 *
 * 그림 한 장을 통째로 밀고 기울이면 아무리 잘 짜도 '판때기가 흔들린다'로만
 * 보인다. 팔을 따로 떼어 어깨에서 돌리고, 몸이 따라 기울고, 꼬리가 한 박자
 * 늦게 따라오면 그제야 **휘두른 것**이 된다. Spine 이나 Live2D 가 쓰는 방식과
 * 같다 - 그림은 그대로 두고 조각의 각도만 시간에 따라 바꾼다.
 *
 * 조각이 **SVG 든 그림이든 상관없다.** 돌리는 건 조각이지 그림이 아니다. 그래서
 * 제미나이로 뽑은 그림을 머리·팔·몸으로 잘라 그대로 물릴 수 있다 - meshy 를
 * 거치지 않고도 그림의 품질과 움직임을 같이 가져간다.
 *
 * 구운 3D(`sprites.ts`)와 견주면 이쪽이 나은 점이 분명하다. 화풍이 안 깨지고
 * (원래 그 그림이다), 시트가 없고, 좌우 반전도 그냥 먹는다. 못 하는 건 몸을
 * 돌리는 것뿐인데 판 위 유닛은 한쪽만 보고 서 있으니 잃을 게 없다.
 *
 * 값은 전부 **네이티브 애니메이션**으로 돈다. 유닛마다 도는 값이 둘뿐이고
 * (대기 한 바퀴, 공격 한 번) 나머지는 그 둘에서 뽑아 쓰는 보간이라, JS 는
 * 시작할 때 한 번 말해 주고 손을 뗀다.
 */

export interface RigPart {
  /** 이 조각이 도는 중심. 아트 좌표(0~64)다 */
  pivot: [number, number];
  /**
   * 매달린 조각의 번호(`parts` 의 자리). 없으면 혼자 선다.
   *
   * 팔은 몸에 붙어 있다. 몸이 앞으로 기울면 어깨도 같이 가야 하는데, 조각이
   * 저마다 따로 돌면 팔만 제자리에 남아 어깨에서 떨어져 나간다. 부모를 적어
   * 두면 부모가 움직인 결과 위에서 제 각도를 더한다.
   *
   * 그리는 순서(`parts` 의 차례)와는 상관없다. 꼬리는 몸 **뒤에** 그리면서도
   * 몸에 매달릴 수 있다.
   */
  parent?: number;
  /** 대기할 때 흔드는 폭(도) */
  sway?: number;
  /**
   * 흔들리는 시점을 어긋내는 값(0~1).
   *
   * 조각이 전부 같이 흔들리면 인형이 통째로 떠는 것처럼 보인다. 꼬리와 머리를
   * 반 박자씩 늦추면 몸이 먼저 움직이고 끝이 따라오는 것으로 읽힌다.
   */
  phase?: number;
  /** 대기할 때 위아래로 뜨는 폭(한 변 대비) */
  bob?: number;
  /**
   * 때릴 때 거쳐 가는 각도(도). `RigSpec.times` 와 **길이가 같아야 한다.**
   *
   * 스프라이트 시트 한 장에 자세를 열 개 그려 넣는 것과 같은 일이다. 다만
   * 그림을 열 장 뜨는 대신 각도만 적어 두고 그 사이를 이어서 돈다 - 시트보다
   * 매끄럽고(60fps) 용량이 0 이다.
   */
  swing?: number[];
  /** 때릴 때 앞뒤로 미는 거리(한 변 대비). `times` 와 길이가 같다 */
  shift?: number[];
  /**
   * 그림 조각(`require`). 있으면 `art` 대신 이걸 쓴다.
   *
   * 조각 그림은 전부 **같은 네모 판**에 담아야 한다 - 한 장에서 잘라 낸
   * 그대로 자리를 지켜야 겹쳐 놓았을 때 원래 그림이 된다.
   */
  src?: number;
  art?: React.ReactNode;
}

export interface RigSpec {
  /** 조각마다 한 벌씩 들어간다. 그라데이션 이름은 SVG 한 장 안에서만 통한다 */
  defs?: React.ReactNode;
  /** 뒤에 있는 것부터 */
  parts: RigPart[];
  /**
   * 자세를 거치는 **시점**. 0 에서 시작해 1 로 끝난다.
   *
   * 여기가 이 방식의 핵심이다. 사이를 고르게 벌리면 밋밋하고, 촘촘한 데는
   * 빠르고 성긴 데는 느려진다. 뒤로 당길 땐 느긋하게(간격 넓게), 내려칠 땐
   * 두세 칸을 붙여서 확 지나가게 잡는다. 시트로 치면 '몇 프레임을 무느냐'다.
   */
  times: number[];
  /** 한 번 휘두르는 데 걸리는 시간(밀리초) */
  swingMs: number;
  /** 숨 한 번 쉬는 데 걸리는 시간(밀리초) */
  idleMs: number;
}

/** 사인 한 바퀴를 꺾은선으로 쓴다. 열두 토막이면 눈에 각이 안 보인다 */
const STEPS = 12;

/**
 * 칸 밖으로 내주는 여백(아트 좌표).
 *
 * 그림은 0~64 안에 그려져 있다. 그런데 칼을 앞으로 내려치면 칼끝이 그 밖으로
 * 나가서 잘린다. 조각마다 그림판을 사방 10 씩 넓게 잡아 두면, 돌아간 끝이
 * 잘리지 않는다. 보이는 크기와 도는 중심은 그대로다.
 */
const BLEED = 10;

function wave(driver: Animated.Value, phase: number) {
  const input: number[] = [];
  const at: number[] = [];
  for (let i = 0; i <= STEPS; i += 1) {
    input.push(i / STEPS);
    at.push(Math.sin(2 * Math.PI * (i / STEPS + phase)));
  }
  return { input, at };
}

function swayOf(driver: Animated.Value, amp: number, phase: number) {
  const { input, at } = wave(driver, phase);
  return driver.interpolate({ inputRange: input, outputRange: at.map((v) => `${v * amp}deg`) });
}

function bobOf(driver: Animated.Value, amp: number, phase: number, size: number) {
  const { input, at } = wave(driver, phase);
  return driver.interpolate({ inputRange: input, outputRange: at.map((v) => v * amp * size) });
}

export const RigArt = React.memo(function RigArt({
  spec,
  size,
  register,
  period,
}: {
  spec: RigSpec;
  /** 화면에 놓일 한 변(픽셀) */
  size: number;
  /** 이 유닛이 때리는 순간을 알려 준다 */
  register?: (fn: () => void) => () => void;
  /** 다음 타격까지의 간격(밀리초). 휘두르는 동작이 이보다 길면 다음 발과 겹친다 */
  period?: number;
}) {
  const idle = useRef(new Animated.Value(0)).current;
  const atk = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(idle, {
        toValue: 1,
        duration: spec.idleMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [idle, spec.idleMs]);

  useEffect(() => {
    if (!register) return;
    return register(() => {
      /*
        휘두르는 중에 다음 발이 오면 지금 각도에서 이어 간다.

        0 으로 되돌린 뒤 다시 시작하면 칼이 순간이동한다. Animated 는 값이 지금
        있는 자리에서 출발하니, 멈추기만 하고 새로 걸면 이어진다.
      */
      /*
        자세표를 처음부터 다시 훑는다.

        휘두르는 시간은 다음 타격까지의 간격을 넘지 않게 잡는다 - 넘기면 칼이
        아직 올라가는 중에 다음 발이 나간다. 값은 **고르게** 흐르고, 빠르고
        느린 건 `times` 의 간격이 만든다.
      */
      atk.stopAnimation();
      atk.setValue(0);
      Animated.timing(atk, {
        toValue: 1,
        duration: Math.min(spec.swingMs, period ?? spec.swingMs),
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
  }, [register, spec.swingMs, period, atk]);

  const styles = useMemo(() => {
    const own = spec.parts.map((p) => {
        const px = ((p.pivot[0] - 32) / 64) * size;
        const py = ((p.pivot[1] - 32) / 64) * size;
        const list: Animated.WithAnimatedValue<{ [k: string]: unknown }>[] = [];
        // 앞뒤로 미는 것은 회전 **밖**에 둬야 밀린 방향이 같이 안 돈다
        if (p.shift) {
          list.push({
            translateX: atk.interpolate({
              inputRange: spec.times,
              outputRange: p.shift.map((v) => v * size),
            }),
          });
        }
        if (p.bob) list.push({ translateY: bobOf(idle, p.bob, p.phase ?? 0, size) });
        // 중심으로 옮겨 놓고 돌린 뒤 되돌린다 - 안 그러면 조각 한가운데서 돈다
        list.push({ translateX: px }, { translateY: py });
        if (p.sway) list.push({ rotate: swayOf(idle, p.sway, p.phase ?? 0) });
        if (p.swing) {
          list.push({
            rotate: atk.interpolate({
              inputRange: spec.times,
              outputRange: p.swing.map((v) => `${v}deg`),
            }),
          });
        }
        list.push({ translateX: -px }, { translateY: -py });
        return list;
    });
    /*
      부모의 변환을 **앞에** 붙인다.

      변환은 왼쪽부터 차례로 먹으니, 부모 것을 먼저 두면 자식은 부모가 옮겨 놓은
      자리 위에서 돈다. 장면 그래프가 하는 일과 같은 것을 목록 이어 붙이기로 한다.
    */
    const done: (typeof own)[number][] = [];
    const build = (i: number, seen: Set<number>): (typeof own)[number] => {
      if (done[i]) return done[i];
      const up = spec.parts[i].parent;
      const base = up !== undefined && up !== i && !seen.has(up) ? build(up, new Set(seen).add(i)) : [];
      done[i] = [...base, ...own[i]];
      return done[i];
    };
    return spec.parts.map((_, i) => build(i, new Set([i])));
  }, [spec.parts, spec.times, size, idle, atk]);

  const wide = ((64 + BLEED * 2) / 64) * size;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {spec.parts.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Animated.View key={i} style={[StyleSheet.absoluteFill, { transform: styles[i] as never }]}>
          {p.src ? (
            <Image source={p.src} style={{ width: size, height: size }} resizeMode="contain" />
          ) : (
            <Svg
              width={wide}
              height={wide}
              viewBox={`${-BLEED} ${-BLEED} ${64 + BLEED * 2} ${64 + BLEED * 2}`}
              style={{ position: 'absolute', left: -(BLEED / 64) * size, top: -(BLEED / 64) * size }}
            >
              {spec.defs}
              {p.art}
            </Svg>
          )}
        </Animated.View>
      ))}
    </View>
  );
});
