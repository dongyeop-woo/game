import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import {
  AVATARS,
  TIER_FX,
  type AvatarDef,
  SUMMON_COST,
  SUMMON_COST_10,
  type PullResult,
} from '../game/avatars';
import { fmt } from '../game/format';
import { TIERS } from '../game/progress';
import type { Tier } from '../game/progress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarArt } from './art/avatar';
import { ScreenBackdrop, useBackdropSeal } from './ScreenBackdrop';
import { ResultModal } from './SummonScreen';
import { TierGem } from './art/icons';
import { Button, CoinPill, ScreenHeader } from './components';
import { C, RARITY_G, inkShadow, numeric } from './theme';

/**
 * 상점.
 *
 * 세 번을 갈아엎었다. 격자로 늘어놓으니 무엇을 파는지 안 보였고, 카드 액자에
 * 넣으니 그림이 상자에 갇혀 작아 보였다. 지금은 액자를 없애고 화면 전체를
 * 무대로 쓴다 - 레퍼런스(와일드리프트 상점)와 같은 구성이다.
 *
 * 그때 얻은 교훈: 고급스러워 보이는 화면은 장식이 많은 게 아니라 장식이 얇다.
 * 두꺼운 검정 외곽선과 꽉 찬 금색 버튼은 캐주얼 게임의 문법이고, 여기서는
 * 머리띠 같은 금색 실선과 반투명 검정만 쓴다. 화면을 채우는 건 UI 가 아니라
 * 캐릭터여야 한다.
 *
 * 아직 못 메운 차이: 상품마다의 키 아트가 없다. 레퍼런스는 스킨 일러스트
 * 자체가 배경이라 배경과 캐릭터의 빛이 하나로 붙는데, 우리는 로비 배경을
 * 공용으로 쓴다. 그 대신 등급색 광채와 바닥 빛을 캐릭터 뒤에 깔아 최소한
 * '같은 공간에 서 있다'는 느낌은 만든다.
 */

/** 등급 레일 폭 - 아바타가 쓸 수 있는 폭을 여기서 뺀다 */
const RAIL_W = 62;

export function ShopScreen({ onBack }: { onBack: () => void }) {
  const { meta, summon } = useMeta();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const seal = useBackdropSeal();
  const [tier, setTier] = useState<Tier>('common');
  const [pickedId, setPickedId] = useState<string>(
    AVATARS.find((a) => a.tier === 'common')?.id ?? AVATARS[0].id,
  );
  const [results, setResults] = useState<PullResult[] | null>(null);

  const pull = (count: 1 | 10) => {
    const cost = count === 1 ? SUMMON_COST : SUMMON_COST_10;
    if (meta.gold < cost) {
      say('골드가 모자랍니다');
      return;
    }
    const got = summon(count);
    if (got) setResults(got);
  };
  const [notice, setNotice] = useState<string | null>(null);

  const say = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(null), 2200);
  };

  const list = AVATARS.filter((a) => a.tier === tier);
  const picked: AvatarDef = AVATARS.find((a) => a.id === pickedId) ?? list[0];
  const fx = TIER_FX[picked.tier];

  /*
    캐릭터 크기.

    '가장 큰 것이 파는 물건'이라고 폭을 다 줬더니 그림이 화면을 넘쳐 머리와
    발이 잘렸다. 무대 높이도 같이 봐야 한다 - 둘 중 작은 쪽에 맞춘다.
  */
  const art = Math.min(width - RAIL_W * 2 - 24, 250);

  const onTier = (t: Tier) => {
    setTier(t);
    const first = AVATARS.find((a) => a.tier === t);
    if (first) setPickedId(first.id);
  };

  return (
    <View style={styles.root}>
      {/*
        `absoluteFill` + `cover` 로 깔았더니 기기마다 어디가 잘릴지 달라져서
        배경이 확대된 한 귀퉁이만 보였다. 크기를 직접 재서 넣는 공용 배경으로
        바꾼다 (노치 위까지 덮는 것도 여기서 처리한다).
      */}
      <ScreenBackdrop dim={0.62} />
      {/* 등급색 광채 - 캐릭터가 배경 위에 붙인 스티커로 보이지 않게 한다 */}
      <Glow color={fx.color} />
      <Vignette />

      {/*
        머리띠는 다른 화면과 같은 것을 쓴다.

        여기만 따로 만들어 두었더니 제목 글자 크기도, 골드 표시 모양도
        달랐다 (도감은 동전 아이콘, 여기는 💰 이모지였다). 같은 자리에 같은
        것이 있어야 화면을 옮겨 다녀도 한 앱으로 읽힌다.
      */}
      {/*
        캐릭터는 배경의 마법진 위에 선다.

        **뿌리에 둬야 한다.** 무대 안에 넣었더니 top 이 무대 기준이 되어
        머리띠 높이만큼 아래로 밀렸다. 배경과 같은 좌표계를 써야 맞는다.

        발 위치는 그림 안에서 91.8% 지점이다(알파를 재서 나온 값). 그만큼
        올려야 발바닥이 마법진에 닿는다.
      */}
      <View
        style={[styles.figure, { width: art, height: art, top: seal.y - art * 0.918 }]}
        pointerEvents="none"
      >
        <GroundLight width={art * 0.72} color={fx.color} />
        <AvatarArt def={picked} size={art} />
      </View>

      <ScreenHeader title="상점" right={<CoinPill value={fmt(meta.gold)} />} onClose={onBack} />

      <View style={styles.body}>
        <View style={styles.rail}>
          {TIERS.map((t) => {
            const on = t.id === tier;
            const owned = AVATARS.filter(
              (a) => a.tier === t.id && (meta.avatarCopies[a.id] ?? 0) > 0,
            ).length;
            const all = AVATARS.filter((a) => a.tier === t.id).length;
            return (
              <Pressable
                key={t.id}
                onPress={() => onTier(t.id)}
                style={({ pressed }) => [
                  styles.railItem,
                  on && styles.railItemOn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                {/* 선택 표시는 왼쪽 세로 선 - 칸을 통째로 칠하면 무거워진다 */}
                {on ? <View style={styles.railMark} /> : null}
                <TierGem
                  tier={t.id}
                  size={26}
                  color={on ? TIER_FX[t.id].color : 'rgba(255,255,255,0.28)'}
                />
                <Text style={[styles.railLabel, on && styles.railLabelOn]}>{t.label}</Text>
                <Text style={[styles.railCount, on && { color: C.gold }]}>
                  {owned}/{all}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stage}>
          {/* 이름은 무대 위쪽에 - 레퍼런스처럼 그림이 글자를 밀어내지 않는다 */}
          <View style={styles.head}>
            <Text style={styles.name} numberOfLines={1}>
              {picked.name}
            </Text>
            <View style={styles.tags}>
              <View style={[styles.tag, { borderColor: `${fx.color}88` }]}>
                <TierGem tier={picked.tier} size={13} color={fx.color} />
                <Text style={[styles.tagText, { color: fx.color }]}>{fx.label}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>출현 {fx.rate}%</Text>
              </View>
            </View>
          </View>

        </View>

      </View>

      {/*
        아래는 뽑기 두 개.

        전에는 이 자리에 '이 등급의 아바타 넉 장'이 늘어서고 고른 하나를 사는
        식이었다. 그 목록은 도감에서 이미 보여 주는 것이고, 여기서 정작 하는
        일(뽑기)은 화면 어디에도 없었다. 상점이 하는 일 하나만 남긴다.
      */}
      <View style={styles.pullRow}>
        <Button
          label={`1회  ${fmt(SUMMON_COST)}`}
          tone="plain"
          onPress={() => pull(1)}
          style={{ flex: 1 }}
        />
        <View style={{ width: 10 }} />
        <Button
          label={`10회  ${fmt(SUMMON_COST_10)}`}
          tone="gold"
          onPress={() => pull(10)}
          style={{ flex: 1.35 }}
        />
      </View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <ResultModal results={results} onClose={() => setResults(null)} />

    </View>
  );
}

// ------------------------------------------------------------------ 빛

/** 캐릭터 뒤 등급색 광채. 배경과 캐릭터를 같은 공간에 묶는 유일한 장치다. */
function Glow({ color }: { color: string }) {
  return (
    <View style={styles.glow} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.42} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.14} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g)" />
      </Svg>
    </View>
  );
}

/** 가장자리를 눌러 시선을 가운데로 모은다. 없으면 화면이 그냥 넓기만 하다. */
function Vignette() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/*
        위쪽 그늘은 뺐다.

        배경이 이미 위를 눌러 깔고 있어서, 여기에 한 겹 더 얹으니 끝나는
        자리에 가로줄이 생겨 머리띠가 띠처럼 보였다.
      */}
      <LinearGradient
        colors={['rgba(9,6,24,0)', 'rgba(9,6,24,0.96)'] as const}
        style={styles.vBottom}
      />
    </View>
  );
}

/** 발밑 빛. 딱 떨어지는 검은 타원은 막대로 보이므로 가장자리를 풀어 준다. */
function GroundLight({ width, color }: { width: number; color: string }) {
  const h = width * 0.28;
  return (
    <View style={styles.ground} pointerEvents="none">
      <Svg width={width} height={h}>
        <Defs>
          <RadialGradient id="gl" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={color} stopOpacity={0.18} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={h / 2} rx={width / 2} ry={h / 2} fill="url(#gl)" />
      </Svg>
    </View>
  );
}

// ------------------------------------------------------------- 별 트랙

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDeep },

  glow: { position: 'absolute', left: 0, right: 0, top: '18%', height: '58%' },
  vBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 },


  /*
    세로 탭을 흐름에서 빼내 왼쪽에 띄운다.

    줄 안에 두었더니 무대가 '탭을 뺀 나머지 폭'의 가운데를 잡아서, 캐릭터가
    배경의 마법진보다 오른쪽에 섰다. 탭을 띄우면 무대가 화면 폭을 다 쓰고
    캐릭터가 마법진 위에 온다.
  */
  body: { flex: 1 },

  rail: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: RAIL_W,
    gap: 4,
    zIndex: 5,
  },
  railItem: {
    alignItems: 'center',
    gap: 1,
    paddingVertical: 7,
    borderRadius: 10,
  },
  railItemOn: { backgroundColor: 'rgba(0,0,0,0.35)' },
  railMark: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 2,
    borderRadius: 1,
    backgroundColor: C.gold,
  },
  railLabel: { color: 'rgba(255,255,255,0.42)', fontSize: 11, lineHeight: 16 },
  railLabelOn: { color: C.text },
  railCount: { color: 'rgba(255,255,255,0.3)', fontSize: 9.5, lineHeight: 14, ...numeric },

  stage: { flex: 1 },
  figure: { position: 'absolute', alignSelf: 'center' },
  ground: { position: 'absolute', bottom: '3%', alignSelf: 'center' },

  head: { position: 'absolute', top: 6, left: 0, right: 0, alignItems: 'center', gap: 7 },
  name: { color: C.text, fontSize: 20, lineHeight: 29, ...inkShadow },
  tags: { flexDirection: 'row', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tagText: { color: C.textDim, fontSize: 11, lineHeight: 16, ...numeric },



  notice: { flex: 1, color: C.textDim, fontSize: 12, lineHeight: 17 },
  pullRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 6 },
});
