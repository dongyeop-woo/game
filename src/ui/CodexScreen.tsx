import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import { AVATARS, TIER_FX, type AvatarDef } from '../game/avatars';
import { fmt } from '../game/format';
import { TIERS } from '../game/progress';
import { AvatarArt } from './art/avatar';
import { LockGlyph, TierGem } from './art/icons';
import { Button, CoinPill, ScreenHeader } from './components';
import { ScreenBackdrop } from './ScreenBackdrop';
import { C, RARITY_G, inkShadow, numeric, shadow } from './theme';

/**
 * 도감 = 모아 놓은 아바타를 보는 곳.
 *
 * 격자만 죽 늘어놓았다가 구조를 바꿨다. 전에는 칸을 누르면 바로 장착됐는데,
 * 그러면 **무엇인지 보려면 장착부터 해야 했다.** 고르는 것과 쓰는 것은 다른
 * 일이다.
 *
 * 그래서 위에 미리보기 판을 두고 아래에 격자를 깐다. 칸을 누르면 위에서
 * 크게 보여 주고, 쓰겠다는 결정은 '장착' 단추로 따로 받는다. 못 가진
 * 아바타도 눌러서 볼 수 있다 - 무엇을 모으는 중인지 보여야 모으고 싶어진다.
 */
export function CodexScreen({ onBack }: { onBack: () => void }) {
  const { meta, equipAvatar } = useMeta();
  const [pickedId, setPickedId] = useState(meta.avatar);

  const picked: AvatarDef = AVATARS.find((a) => a.id === pickedId) ?? AVATARS[0];
  const fx = TIER_FX[picked.tier];
  const copies = meta.avatarCopies[picked.id] ?? 0;
  const owned = copies > 0;
  const equipped = picked.id === meta.avatar;
  const haveCount = AVATARS.filter((a) => meta.avatarCopies[a.id]).length;

  return (
    <View style={styles.root}>
      <ScreenBackdrop />
      <ScreenHeader
        title="도감"
        subtitle={`${haveCount} / ${AVATARS.length} 보유`}
        right={<CoinPill value={fmt(meta.gold)} />}
        onClose={onBack}
      />

      {/* ------------------------------------------------- 고른 아바타 */}
      <View style={styles.stage}>
        <Glow color={fx.color} />

        <View style={styles.art}>
          <GroundShadow width={128} />
          <View style={!owned && styles.dim}>
            <AvatarArt def={picked} size={150} />
          </View>
        </View>

        <View style={styles.tags}>
          <View style={[styles.tierTag, { backgroundColor: fx.color }]}>
            <Text style={styles.tierTagText}>{fx.label}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {picked.name}
          </Text>
        </View>

        {equipped ? (
          <View style={styles.using}>
            <Text style={styles.usingText}>사용 중</Text>
          </View>
        ) : owned ? (
          <Button
            label="장착"
            tone="gold"
            compact
            onPress={() => equipAvatar(picked.id)}
            style={styles.actBtn}
          />
        ) : (
          <View style={styles.locked}>
            <LockGlyph size={14} color={C.textFaint} />
            <Text style={styles.lockedText}>아직 없음</Text>
          </View>
        )}
      </View>

      {/* ------------------------------------------------------- 격자 */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {TIERS.map((tier) => {
          const list = AVATARS.filter((a) => a.tier === tier.id);
          if (list.length === 0) return null;
          const have = list.filter((a) => meta.avatarCopies[a.id]).length;
          return (
            <View key={tier.id} style={styles.group}>
              <View style={styles.groupHead}>
                <View style={[styles.tierTag, { backgroundColor: TIER_FX[tier.id].color }]}>
                  <Text style={styles.tierTagText}>{tier.label}</Text>
                </View>
                <Text style={styles.groupCount}>
                  {have} / {list.length}
                </Text>
              </View>

              <View style={styles.grid}>
                {list.map((a) => (
                  <Cell
                    key={a.id}
                    def={a}
                    owned={(meta.avatarCopies[a.id] ?? 0) > 0}
                    on={a.id === pickedId}
                    equipped={a.id === meta.avatar}
                    onPress={() => setPickedId(a.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * 격자 한 칸.
 *
 * 못 가진 것도 모양을 보여 주되 색을 지워 실루엣으로 둔다 - 반투명하게만
 * 낮추면 원래 색이 남아 진흙처럼 보인다(상점 썸네일에서 겪었다).
 */
function Cell({
  def,
  owned,
  on,
  equipped,
  onPress,
}: {
  def: AvatarDef;
  owned: boolean;
  /** 지금 위에서 보고 있는 칸 */
  on: boolean;
  equipped: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <View style={styles.cellWrap}>
      <View style={[styles.cell, owned && styles.cellOwned, on && styles.cellOn]}>
        <LinearGradient colors={RARITY_G[def.tier]} style={StyleSheet.absoluteFill} />
        <View style={styles.cellGloss} pointerEvents="none" />
        <AvatarArt def={def} size={46} />

        {owned ? null : (
          <>
            <View style={styles.veil} />
            <View style={styles.lockMark}>
              <LockGlyph size={15} color="rgba(255,255,255,0.5)" />
            </View>
          </>
        )}

        {equipped ? <View style={styles.usingDot} /> : null}
      </View>

      {/*
        등급 보석을 칸 위 테두리에 걸쳐 둔다.

        칸 바탕색만으로도 등급이 구분되긴 하지만, 색이 비슷한 두 등급은
        나란히 놓고 봐야 겨우 안다. 모양이 다른 표식이 하나 붙으면 한 칸만
        봐도 알 수 있다.
      */}
      <View style={styles.gem} pointerEvents="none">
        <TierGem tier={def.tier} size={14} color={TIER_FX[def.tier].color} />
      </View>
      </View>
    </Pressable>
  );
}

/** 고른 아바타 뒤 등급색 광채 - 배경과 캐릭터를 같은 공간에 묶는다 */
function Glow({ color }: { color: string }) {
  return (
    <View style={styles.glow} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="codexGlow" cx="50%" cy="46%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.34} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.1} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#codexGlow)" />
      </Svg>
    </View>
  );
}

/** 발밑 그림자 - 없으면 배경 위에 붙인 스티커처럼 보인다 */
function GroundShadow({ width }: { width: number }) {
  const h = width * 0.26;
  return (
    <View style={styles.shadow} pointerEvents="none">
      <Svg width={width} height={h}>
        <Defs>
          <RadialGradient id="codexShadow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#000" stopOpacity={0.5} />
            <Stop offset="0.55" stopColor="#000" stopOpacity={0.24} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={h / 2} rx={width / 2} ry={h / 2} fill="url(#codexShadow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  stage: { alignItems: 'center', paddingTop: 6, paddingBottom: 12 },
  glow: { ...StyleSheet.absoluteFill },
  art: { width: 150, height: 150, alignItems: 'center', justifyContent: 'flex-end' },
  shadow: { position: 'absolute', bottom: '4%', alignSelf: 'center' },
  /** 못 가진 아바타는 색을 빼고 보여 준다 */
  dim: { opacity: 0.4 },

  tags: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  tierTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  tierTagText: { color: '#1a1330', fontSize: 11, lineHeight: 16 },
  name: { color: C.text, fontSize: 19, lineHeight: 27, ...inkShadow },

  actBtn: { width: 128, marginTop: 12 },
  using: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.goldDeep,
    backgroundColor: 'rgba(232,195,82,0.14)',
  },
  usingText: { color: C.gold, fontSize: 13, lineHeight: 19 },
  locked: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  lockedText: { color: C.textFaint, fontSize: 13, lineHeight: 19 },

  list: { padding: 14, paddingTop: 4, gap: 14 },
  group: { gap: 8 },
  /*
    개수를 등급 딱지 옆에 붙인다.

    화면 오른쪽 끝에 떼어 놓았더니 '일반'과 '1/4' 사이가 한 뼘이라 둘을
    눈으로 이어 붙여야 했다. 붙여 두면 '일반 1/4' 한 덩어리로 읽힌다.
  */
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupCount: { color: C.gold, fontSize: 12.5, lineHeight: 18, ...numeric },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  /** 보석이 칸 위로 넘치므로 자르지 않는 바깥 상자가 필요하다 */
  cellWrap: { paddingTop: 6 },
  gem: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  cell: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow(0.4, 5, 3),
  },
  /** 가진 것은 금테, 못 가진 것은 기본 테 - 한눈에 갈라져야 모으는 맛이 난다 */
  cellOwned: { borderColor: C.goldDeep },
  /** 지금 위에서 보고 있는 칸 */
  cellOn: { borderColor: C.gold, borderWidth: 3 },
  cellGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7,5,18,0.72)' },
  lockMark: { position: 'absolute', right: 3, bottom: 3 },

  /** 지금 쓰고 있는 아바타 - 작은 점 하나면 충분하다 */
  usingDot: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
    borderWidth: 1.5,
    borderColor: C.outline,
  },
});
