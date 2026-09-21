import React from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Rect, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

/**
 * 로비 말고 다른 화면(도감·상점·소환·일일)의 배경.
 *
 * 이 화면들은 단색 보라 위에 칸만 얹혀 있어서, 그림 한 장이 깔린 로비에서
 * 넘어오면 같은 게임이 아닌 것처럼 보였다. **같은 그림을 쓰되 깊이 눌러**
 * 깐다 - 그러면 한 세계로 이어지면서도 읽을 것은 글자와 칸이 된다.
 *
 * 로비처럼 마법진에 맞춰 앉히지 않는다. 여기서는 그림이 '무엇을 가리키는
 * 배경'이 아니라 '벽지'라서, 화면을 덮기만 하면 된다.
 */

/** 원본 크기 - 비율을 지켜야 돌기둥이 안 휜다 */
const BG_W = 1206;
const BG_H = 2710;

/** 그림 속 바닥 마법진의 세로 자리(비율). 로비에서 재 둔 값과 같다. */
const SEAL_Y = 0.582;
/** 마법진 지름(그림 폭 대비) */
const SEAL_W = 0.582;

/** 그림이 화면에서 차지하는 크기 - 배경과 그 위에 세울 것이 같은 계산을 써야 한다 */
function fit(width: number, height: number) {
  const h = Math.max(width * (BG_H / BG_W), height);
  return { w: h * (BG_W / BG_H), h };
}

/**
 * 배경 속 마법진이 화면 어디에 오는가.
 *
 * 캐릭터를 그 위에 세우려면 필요하다. 눈대중으로 아래 여백을 주면 화면
 * 비율이 다른 기기에서 캐릭터가 마법진 밖에 선다.
 */
export function useBackdropSeal() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { w, h } = fit(width, height);
  return { y: -insets.top + h * SEAL_Y, size: w * SEAL_W };
}

export function ScreenBackdrop({
  /** 얼마나 눌러 깔지. 글자가 많은 화면일수록 세게 */
  dim = 0.74,
}: {
  dim?: number;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /*
    화면을 덮되 비율은 지킨다.

    `resizeMode="cover"` 로 맡기면 기기마다 어디가 잘릴지 달라진다. 크기를
    직접 재서 넣으면 어느 기기에서도 같은 자리가 보인다 (로비에서 이미 겪은
    함정이다 - 퍼센트로 두면 3배로 늘어나기도 했다).
  */
  const { w, h } = fit(width, height);
  const box = {
    left: (width - w) / 2 - insets.left,
    top: -insets.top,
    width: w,
    height: h,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={require('../../assets/background.jpg')} style={[styles.img, box]} />
      {/*
        위가 더 어둡다.

        머리글과 칸 이름이 위쪽에 몰려 있어서 거기가 제일 깨끗해야 한다.
        아래는 조금 열어 두면 그림이 남아 화면이 안 죽는다.
      */}
      <Svg style={[styles.img, box]} width={w} height={h}>
        <Defs>
          <SvgGradient id="codexDim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0d0a20" stopOpacity={Math.min(1, dim + 0.14)} />
            <Stop offset="0.45" stopColor="#0d0a20" stopOpacity={dim} />
            <Stop offset="1" stopColor="#0d0a20" stopOpacity={Math.max(0, dim - 0.1)} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill="url(#codexDim)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { position: 'absolute' },
});
