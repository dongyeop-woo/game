import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from './Text';

import { GOLD_PACKS, type GoldPack } from '../game/shop';

/**
 * 묶음별 상품 그림.
 *
 * 없으면 아래 동전 아이콘을 겹쳐 그린다. 그림이 들어오면 카드도 같이 키워야
 * 한다 - 지금 그림 자리는 세로 40pt 라 3D 렌더를 넣어도 디테일이 다 죽는다.
 * 프롬프트는 `tools/topup-art-prompts.md`.
 *
 *   p1: require('../../assets/topup/p1.png'),
 */
/** 카드 크기 - SVG 는 퍼센트로 주면 뷰포트가 어긋나니 숫자로 쓴다 */
const CARD_W = 142;
const CARD_H = 166;

const PACK_ART: Record<string, number> = {
  p1: require('../../assets/topup/p1.png'),
  p2: require('../../assets/topup/p2.png'),
  p3: require('../../assets/topup/p3.png'),
  p4: require('../../assets/topup/p4.png'),
  p5: require('../../assets/topup/p5.png'),
  p6: require('../../assets/topup/p6.png'),
};

/**
 * 자릿수를 끊어 적는다.
 *
 * 다른 화면은 `fmt` 로 6,000 을 '6.0K' 로 줄이는데, 돈을 내는 화면에서는
 * 그러면 안 된다 - 얼마인지 정확히 보여야 한다. ₩ 기호는 본문 폰트(BMJUA)에
 * 글리프가 없어 안 나오므로 '원'으로 적는다.
 */
const won = (n: number) => n.toLocaleString('ko-KR');
import { CoinIcon } from './art/icons';
import { C, inkShadow, numeric, shadow } from './theme';

/**
 * 골드 충전 창.
 *
 * **결제가 연결돼 있지 않다.** 스토어(IAP)를 붙이기 전까지는 상품만 보여
 * 주고 실제로 사지지 않는다 - 누르면 결제가 되는 것처럼 보이는 화면을
 * 만들어 두면, 나중에 붙이는 사람도 쓰는 사람도 속는다.
 *
 * 그래서 값도 숨기지 않고 그대로 적고, 누르면 아직 안 된다고 알린다.
 *
 * 화면이 아니라 창이다 - 로비를 떠나지 않고 값만 훑고 닫는 자리다.
 */
export function TopUpDialog({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState<string | null>(null);

  const tap = () => {
    setNotice('결제가 아직 연결되지 않았습니다');
    setTimeout(() => setNotice(null), 2200);
  };

  return (
    /* 바깥을 누르면 닫힌다 - 전체 화면짜리 창이 아니니 나가는 길이 있어야 한다 */
    <Pressable style={styles.veil} onPress={onClose}>
      <Pressable style={styles.panel} onPress={() => {}}>
        <View style={styles.head}>
          <Text style={styles.title}>골드 충전</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {GOLD_PACKS.map((p, i) => (
            <Pack key={p.id} pack={p} pile={i + 1} onPress={tap} />
          ))}
        </View>

        <Text style={styles.notice} numberOfLines={1}>
          {notice ?? '세금이 포함된 금액입니다'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

/**
 * 동전을 몇 줄로 어떻게 나눌지.
 *
 * 넷까지는 한 줄, 다섯은 2+3, 여섯은 3+3. 아래 줄이 더 길어야 더미가
 * 쌓인 것처럼 보인다 - 위가 더 길면 엎어 놓은 모양이 된다.
 */
function rowsOf(n: number): number[] {
  if (n <= 4) return [n];
  if (n === 5) return [2, 3];
  return [3, 3];
}

/**
 * 상품 한 칸.
 *
 * 묶음이 커질수록 동전을 더 쌓는다 - 숫자를 읽기 전에 크기 차이가 먼저
 * 보여야 고르기 쉽다. 그림 파일 없이 같은 동전 아이콘만 겹쳐 쓴다.
 */
function Pack({ pack, pile, onPress }: { pack: GoldPack; pile: number; onPress: () => void }) {
  const coins = Math.min(6, pile);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { transform: [{ scale: 0.97 }] }}>
      <View style={styles.card}>
        {/* 금색 기운만 옅게 - 꽉 칠하면 값이 안 읽힌다 */}
        <LinearGradient
          colors={['rgba(244,217,122,0.16)', 'rgba(201,162,39,0.06)'] as const}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] as const}
          style={styles.bevel}
          pointerEvents="none"
        />
        {/*
          홈 화면과 같은 방식 - 가장자리를 눌러 가운데로 시선을 모은다.

          카드가 고른 밝기라 그림이 배경에 묻혔다. 네 귀퉁이를 어둡게 하고
          그림 자리에만 옅은 금빛을 얹으면, 같은 그림인데 더 도드라진다.
        */}
        <Svg width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="packVig" cx="50%" cy="38%" rx="70%" ry="62%">
              <Stop offset="0" stopColor="#070518" stopOpacity={0} />
              <Stop offset="0.55" stopColor="#070518" stopOpacity={0.12} />
              <Stop offset="1" stopColor="#070518" stopOpacity={0.62} />
            </RadialGradient>
            <RadialGradient id="packGlow" cx="50%" cy="27%" rx="46%" ry="30%">
              <Stop offset="0" stopColor="#f0c84a" stopOpacity={0.2} />
              <Stop offset="1" stopColor="#f0c84a" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={CARD_W} height={CARD_H} fill="url(#packVig)" />
          <Rect x={0} y={0} width={CARD_W} height={CARD_H} fill="url(#packGlow)" />
        </Svg>

        {/*
          동전을 겹쳐 쌓는다.

          절대 좌표로 흩어 놓았더니 카드 왼쪽으로 잘려 나갔다. 줄로 세우고
          음수 간격으로 겹치면 가운데 정렬이 저절로 된다.

          다섯 개부터는 한 줄로 늘어놓으면 카드 폭을 넘어서 옆으로 길어진다.
          두 줄로 쌓으면 폭은 그대로면서 '더 많다'가 더 잘 보인다.
        */}
        <View style={styles.pile}>
          {PACK_ART[pack.id] ? (
            <Image source={PACK_ART[pack.id]} style={styles.art} resizeMode="contain" />
          ) : (
            rowsOf(coins).map((n, r) => (
              <View key={r} style={[styles.pileRow, r > 0 && { marginTop: -9 }]}>
                {Array.from({ length: n }, (_, i) => (
                  <View key={i} style={{ marginLeft: i === 0 ? 0 : -9 }}>
                    <CoinIcon size={coins > 3 ? 26 : 25} />
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/*
          덤이 없는 묶음은 그 줄을 아예 빼고, 남는 자리를 위아래로 나눠 갖는다.

          빈 줄을 그대로 두면 카드에 구멍이 난 것처럼 보였다. 카드 높이는
          고정이라 한 줄이 빠져도 옆 카드와 어긋나지 않는다.
        */}
        <View style={styles.info}>
          <Text style={styles.amount}>{won(pack.gold)}</Text>
          {pack.bonus > 0 ? (
            <Text style={styles.bonus}>+ {won(pack.bonus)} 덤</Text>
          ) : null}
          <View style={styles.priceTag}>
            <Text style={styles.price}>{won(pack.won)}원</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** 어둡게 깔아 뒤 화면을 눌러 준다 - 창이라는 걸 알린다 */
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,4,18,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 20,
  },
  panel: {
    // 화면을 꽉 채우면 '창'이 아니라 또 하나의 화면으로 보인다 - 양옆을 비운다
    width: 330,
    maxWidth: '94%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.goldDeep,
    backgroundColor: C.bgDeep,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    ...shadow(0.6, 18, 9),
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { flex: 1, textAlign: 'center', color: C.text, fontSize: 16, lineHeight: 23, ...inkShadow },
  close: { position: 'absolute', right: 2, padding: 4 },
  closeText: { color: C.textDim, fontSize: 16, lineHeight: 22 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  card: {
    width: CARD_W,
    // 높이를 묶는다 - 덤이 있고 없고에 따라 카드가 들쭉날쭉하면 안 된다
    height: CARD_H,
    alignItems: 'center',
    paddingTop: 84,
    paddingBottom: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.outline,
    backgroundColor: 'rgba(10,7,26,0.6)',
    overflow: 'hidden',
    ...shadow(0.5, 8, 4),
  },
  bevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 70 },
  /** 동전 더미가 놓이는 자리 - 카드 위쪽을 비워 두고 여기에 겹쳐 쌓는다 */
  pile: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pileRow: { flexDirection: 'row', alignItems: 'center' },
  art: {
    width: '100%',
    height: '100%',
  },

  /** 동전 더미 아래 남는 자리를 다 쓰고, 그 안에서 가운데로 모은다 */
  info: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  amount: { color: C.gold, fontSize: 16, lineHeight: 23, ...inkShadow, ...numeric },
  bonus: { color: C.textDim, fontSize: 10.5, lineHeight: 15, ...numeric },
  priceTag: {
    marginTop: 6,
    paddingHorizontal: 11,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(6,4,18,0.55)',
  },
  price: { color: C.text, fontSize: 12.5, lineHeight: 18, ...numeric },

  notice: { color: C.textDim, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
});
