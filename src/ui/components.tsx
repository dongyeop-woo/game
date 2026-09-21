import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';

import { Text } from './Text';
import Svg, { Polygon } from 'react-native-svg';

import { CoinIcon, MenuIcon } from './art/icons';
import { BTN_TEXT, C, EDGE, G, RARITY_G, inkShadow, numeric, shadow } from './theme';

// ------------------------------------------------------------------ 패널

/**
 * 나무 패널.
 * 바깥은 진한 갈색 외곽선, 안쪽은 금색 실선 한 겹, 그 안이 나무 결.
 * 한국 캐주얼 RPG UI 의 기본 골격이다.
 */
export function Frame({
  children,
  tone = 'wood',
  style,
  padded = true,
  accent,
}: {
  children: React.ReactNode;
  tone?: 'wood' | 'parch' | 'deep' | 'hot';
  style?: ViewStyle;
  padded?: boolean;
  /** 안쪽 실선 색을 갈아끼운다 (아바타 등급색 등) */
  accent?: string;
}) {
  const fill = tone === 'parch' ? G.parch : tone === 'deep' ? G.woodDeep : tone === 'hot' ? G.hot : G.wood;
  return (
    <View style={[styles.frameOuter, style]}>
      {/* 'hot' 은 지금 살 수 있다/받을 수 있다는 뜻 — 노란 테두리로 눈에 띄게 한다 */}
      <View
        style={[
          styles.frameGold,
          tone === 'hot' && styles.frameGoldHot,
          accent ? { borderColor: accent } : null,
        ]}
      >
        <LinearGradient colors={fill} style={[styles.frameFill, padded && styles.framePad]}>
          <View style={styles.frameGloss} />
          {children}
        </LinearGradient>
      </View>
    </View>
  );
}

/** 패널 위쪽에 걸치는 리본 배너 제목 */
export function Banner({ title, style }: { title: string; style?: ViewStyle }) {
  return (
    <View style={[styles.bannerWrap, style]}>
      <LinearGradient colors={G.banner} style={styles.banner}>
        <View style={styles.bannerGloss} />
        <Text style={styles.bannerText}>{title}</Text>
      </LinearGradient>
      <View style={[styles.bannerTail, styles.bannerTailL]} />
      <View style={[styles.bannerTail, styles.bannerTailR]} />
    </View>
  );
}

/** 움푹 파인 아이템 슬롯 */
export function Slot({
  children,
  size = 60,
  active,
  locked,
  rarity,
  style,
}: {
  children?: React.ReactNode;
  size?: number;
  active?: boolean;
  /** 아직 못 쓰는 칸 — 자물쇠를 덮는다 */
  locked?: boolean;
  rarity?: keyof typeof RARITY_G;
  style?: ViewStyle;
}) {
  const radius = size * 0.22;
  return (
    <LinearGradient
      colors={rarity ? RARITY_G[rarity] : (['#7a5330', '#472d16'] as const)}
      style={[
        styles.slot,
        { width: size, height: size, borderRadius: radius },
        active && styles.slotActive,
        style,
      ]}
    >
      {/* 위쪽 광택. 절대배치 레이어라 내용물을 zIndex 로 확실히 위에 올려 둔다. */}
      <View style={[styles.slotInner, { borderRadius: radius - 3 }]} pointerEvents="none" />
      <View style={styles.slotContent}>{locked ? null : children}</View>
      {locked ? (
        <View style={styles.lockVeil}>
          <Text style={{ fontSize: size * 0.42 }}>🔒</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

// ------------------------------------------------------------ 알림 뱃지

/** 버튼 위에 붙는 빨간 알림. 0이면 안 그린다. */
export function Badge({ count, style }: { count: number; style?: ViewStyle }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

// ---------------------------------------------------------- 외곽선 숫자

/**
 * 두꺼운 검은 외곽선이 들어간 글자.
 * RN 은 textShadow 를 하나만 줄 수 있어서, 어두운 사본 네 개를 살짝 어긋나게
 * 깔고 그 위에 본체를 얹는 식으로 만든다. 큰 숫자에만 쓸 것(노드가 5개다).
 */
export function OutlineText({
  children,
  style,
  outline = '#2a1608',
  width = 1.6,
}: {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  outline?: string;
  width?: number;
}) {
  const offsets = [
    [-width, 0],
    [width, 0],
    [0, -width],
    [0, width],
  ];
  return (
    <View style={styles.outlineWrap}>
      {offsets.map(([dx, dy], i) => (
        <Text
          key={i}
          style={[style, styles.outlineCopy, { color: outline, left: dx, top: dy }]}
          pointerEvents="none"
        >
          {children}
        </Text>
      ))}
      <Text style={style}>{children}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ 별

/** 클리어 등급 별 */
export function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[0, 1, 2].map((i) => (
        <Text key={i} style={{ fontSize: size, opacity: i < value ? 1 : 0.25 }}>
          ⭐
        </Text>
      ))}
    </View>
  );
}

/** 승리 연출용 폭발 뱃지 배경 */
export function Starburst({ size = 150, color = '#ffd45e' }: { size?: number; color?: string }) {
  const pts: string[] = [];
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? 50 : 34;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={pts.join(' ')} fill={color} stroke="#8a5c10" strokeWidth={2} />
    </Svg>
  );
}

// -------------------------------------------------------- 아이콘 버튼

/**
 * 아이콘 타일 + 아래 라벨.
 * 레퍼런스 로비의 좌우 아이콘 열이 전부 이 모양이다.
 */
export function IconButton({
  icon,
  label,
  badge = 0,
  tone = 'plain',
  size = 46,
  onPress,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  tone?: keyof typeof TONE;
  size?: number;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        style,
        pressed && { transform: [{ translateY: 2 }] },
      ]}
    >
      <View style={[styles.iconEdge, { backgroundColor: EDGE[tone] }]}>
        <LinearGradient colors={TONE[tone]} style={[styles.iconFace, { width: size, height: size }]}>
          <View style={styles.btnGloss} />
          {typeof icon === 'string' ? <Text style={{ fontSize: size * 0.46 }}>{icon}</Text> : icon}
        </LinearGradient>
      </View>
      <View style={styles.iconLabelWrap}>
        <Text style={styles.iconLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Badge count={badge} style={{ top: -4, right: -4 }} />
    </Pressable>
  );
}

// ------------------------------------------------------------ 화면 헤더

/**
 * 팝업 화면 위쪽 바.
 * 레퍼런스처럼 왼쪽에 아이콘+제목, 오른쪽에 재화와 ✕ 를 둔다.
 */
export function ScreenHeader({
  title,
  subtitle,
  right,
  onClose,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  /** 되돌아가기 - 왼쪽 꺾쇠가 부른다 */
  onClose: () => void;
}) {
  return (
    <View style={styles.header}>
      {/*
        왼쪽 꺾쇠 하나로 되돌아간다.

        전에는 왼쪽에 화면 아이콘 상자, 오른쪽에 빨간 ✕ 가 있었다. 아이콘은
        제목 옆에 같은 말을 두 번 하는 것이고(글자로 이미 '도감'이라 적혀
        있다), ✕ 는 '닫는다'는 뜻이라 로비로 **돌아간다**는 것과 안 맞았다.
      */}
      <Pressable
        onPress={onClose}
        hitSlop={12}
        style={({ pressed }) => [styles.headerBack, pressed && { opacity: 0.55 }]}
      >
        <MenuIcon name="back" size={24} color={C.text} />
      </Pressable>
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

// ------------------------------------------------------------ 세로 탭

export function VTabs<T extends string>({
  tabs,
  value,
  onChange,
  badges,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  badges?: Partial<Record<T, number>>;
}) {
  return (
    <View style={styles.vtabs}>
      {tabs.map((x) => (
        <Pressable
          key={x.id}
          onPress={() => onChange(x.id)}
          style={({ pressed }) => [pressed && { transform: [{ translateX: 2 }] }]}
        >
          <View style={[styles.vtab, value === x.id && styles.vtabOn]}>
            <Text style={[styles.vtabText, value === x.id && styles.vtabTextOn]}>{x.label}</Text>
            <Badge count={badges?.[x.id] ?? 0} style={styles.vtabBadge} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ 버튼

const TONE = {
  gold: G.gold,
  green: G.green,
  red: G.red,
  blue: G.blue,
  purple: G.purple,
  plain: G.plain,
} as const;

/**
 * 두툼한 입체 버튼.
 * 아랫면에 어두운 '두께'를 깔고 그 위에 밝은 면을 얹어 눌리는 느낌을 만든다.
 */
export function Button({
  label,
  sub,
  onPress,
  disabled,
  tone = 'gold',
  compact,
  style,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: keyof typeof TONE;
  compact?: boolean;
  style?: ViewStyle;
}) {
  const edge = disabled ? '#15102e' : EDGE[tone];
  const fg = disabled ? '#6f6790' : BTN_TEXT[tone];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [style, pressed && !disabled && { transform: [{ translateY: 2 }] }]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.btnEdge,
            { backgroundColor: edge },
            compact && styles.btnEdgeCompact,
            pressed && !disabled && { paddingBottom: 1 },
          ]}
        >
          <LinearGradient
            colors={disabled ? (['#332c55', '#241e44'] as const) : TONE[tone]}
            style={[styles.btnFace, compact && styles.btnFaceCompact]}
          >
            {/*
              광택.

              흰색 사각형 한 장으로 위 절반을 덮었더니 광택이 아니라 납작한
              띠 두 개로 보였다. 아래로 갈수록 사라지는 그라데이션이라야
              면이 둥글어 보인다.
            */}
            <LinearGradient
              colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.06)', 'transparent'] as const}
              locations={[0, 0.55, 1]}
              style={styles.btnGloss}
              pointerEvents="none"
            />
            {/* 아래쪽 그늘 - 위에서 빛이 든다는 신호는 둘이 한 쌍이어야 산다 */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.18)'] as const}
              style={styles.btnFloor}
              pointerEvents="none"
            />
            <Text style={[styles.btnLabel, { color: fg }, compact && { fontSize: 13.5 }]}>
              {label}
            </Text>
            {sub ? <Text style={[styles.btnSub, { color: fg }]}>{sub}</Text> : null}
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}

/** Frame 의 예전 이름 */
export function Card({
  children,
  highlight,
  style,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Frame tone={highlight ? 'hot' : 'wood'} style={style}>
      {children}
    </Frame>
  );
}

// -------------------------------------------------------------- 재화 표시

/**
 * 재화 알약.
 *
 * 레퍼런스처럼 아이콘이 알약 왼쪽 밖으로 걸쳐 나오고, 숫자는 오른쪽에 붙는다.
 * onPlus 를 주면 아이콘에 파란 + 뱃지가 붙고 눌러서 얻는 화면으로 보낼 수 있다.
 */
/**
 * 재화 알약.
 *
 * 아이콘과 숫자를 한 캡슐에 담고, 더하기는 그 오른쪽에 따로 둔다.
 *
 * 전에는 동전이 캡슐 왼쪽 밖으로 걸쳐 나오고 그 아래에 파란 + 가 겹쳐
 * 있었다. 세 덩어리가 서로 파고들어 작게 보면 뭉개졌고, 파란색은 이 화면에
 * 없는 색이라 혼자 튀었다. 나란히 놓고 색을 맞추면 셋 다 제 몫만 한다.
 */
export function CoinPill({
  value,
  onPlus,
  style,
}: {
  value: string;
  onPlus?: () => void;
  style?: ViewStyle;
}) {
  const body = (
    <View style={[styles.pillWrap, style]}>
      <View style={styles.pill}>
        {/*
          더하기는 동전에 붙인다.

          따로 떼어 두면 '동전 옆의 또 다른 단추'로 읽혀서, 무엇을 더하는
          건지가 한 번 더 생각해야 나온다. 동전 모서리에 붙으면 '이 재화를
          채운다'가 그림 하나로 읽힌다.
        */}
        <CoinIcon size={22} />
        <Text style={styles.pillValue} numberOfLines={1}>
          {value}
        </Text>
        {onPlus ? (
          <View style={styles.pillPlus}>
            <Text style={styles.pillPlusText}>+</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!onPlus) return body;
  return (
    <Pressable onPress={onPlus} style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}>
      {body}
    </Pressable>
  );
}

// -------------------------------------------------------------------- 바

export function Bar({
  ratio,
  color,
  height = 12,
  style,
  reverse,
}: {
  ratio: number;
  color: string;
  height?: number;
  style?: ViewStyle;
  reverse?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const radius = height / 2;
  return (
    <View style={[styles.track, { height, borderRadius: radius }, style]}>
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: radius,
          alignSelf: reverse ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={[styles.barGloss, { borderRadius: radius }]} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ 대화창

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  tone = 'gold',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: keyof typeof TONE;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Frame style={styles.dialog} padded={false}>
          <Banner title={title} style={{ marginTop: -20, marginBottom: 10 }} />
          <View style={styles.dialogBody}>
            <Text style={styles.dialogText}>{message}</Text>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <Button label="취소" tone="plain" onPress={onCancel} style={{ flex: 1 }} />
              <View style={{ width: 10 }} />
              <Button label={confirmLabel} tone={tone} onPress={onConfirm} style={{ flex: 1 }} />
            </View>
          </View>
        </Frame>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ------------------------------------------------------------- 패널
  frameOuter: {
    backgroundColor: C.outline,
    borderRadius: 20,
    padding: 4,
    ...shadow(0.5, 12, 6),
  },
  frameGold: {
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: C.goldDeep,
    overflow: 'hidden',
  },
  frameGoldHot: { borderColor: C.gold, borderWidth: 2.5 },
  frameFill: { borderRadius: 13, overflow: 'hidden' },
  framePad: { padding: 14 },
  frameGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // ------------------------------------------------------------- 배너
  bannerWrap: { alignSelf: 'center', alignItems: 'center' },
  banner: {
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: C.goldDeep,
    overflow: 'hidden',
    ...shadow(0.45, 6, 4),
  },
  bannerGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bannerText: { color: C.text, fontSize: 16.5, fontWeight: '900', letterSpacing: 1, ...inkShadow },
  bannerTail: {
    position: 'absolute',
    top: '55%',
    width: 15,
    height: 15,
    backgroundColor: '#8f1f18',
    transform: [{ rotate: '45deg' }],
  },
  bannerTailL: { left: -6 },
  bannerTailR: { right: -6 },

  // ------------------------------------------------------------- 슬롯
  slot: {
    borderWidth: 3,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotContent: { zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  slotActive: { borderColor: C.gold, borderWidth: 3.5 },
  lockVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: 'rgba(20,11,4,0.66)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 4,
    backgroundColor: '#e03127',
    borderWidth: 1.5,
    borderColor: '#fff2e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },

  outlineWrap: { position: 'relative' },
  outlineCopy: { position: 'absolute' },


  iconBtn: { alignItems: 'center' },
  iconEdge: { borderRadius: 15, paddingBottom: 4, ...shadow(0.4, 6, 3) },
  iconFace: {
    borderRadius: 15,
    borderWidth: 3,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconLabelWrap: {
    marginTop: -7,
    backgroundColor: C.outline,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.goldDeep,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  iconLabel: { color: C.text, fontSize: 10, fontWeight: '900', ...inkShadow },

  /*
    머리띠는 **배경을 덮지 않고 얹힌다.**

    어두운 판에 아래 선까지 그어 두었더니, 배경 그림을 깐 뒤로는 화면 위에
    띠 하나가 가로로 걸린 것처럼 보였다. 바탕을 걷어내면 글자와 단추만
    떠 있게 되는데, 배경 자체가 위쪽을 더 눌러 깔아 두어 그대로도 읽힌다.
  */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBack: { width: 30, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: '900', ...inkShadow },
  headerSub: { color: C.textDim, fontSize: 11.5, fontWeight: '700', marginTop: 1, ...inkShadow },

  vtabs: { gap: 9 },
  vtab: {
    minWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: C.panel,
    borderWidth: 3,
    borderColor: C.outline,
    alignItems: 'center',
    ...shadow(0.35, 4, 2),
  },
  vtabOn: { backgroundColor: C.gold },
  vtabText: { color: '#f2ddb8', fontSize: 14, fontWeight: '900' },
  vtabTextOn: { color: '#3b2414' },
  vtabBadge: { top: -7, right: -7 },
  slotInner: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: '48%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  // ------------------------------------------------------------- 버튼
  pillWrap: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 112,
    /*
      반투명하게.

      꽉 찬 갈색이라 로비 배경 위에 색면 하나가 얹힌 꼴이었다. 뒤가 비치면
      숫자는 그대로 읽히면서 배경을 덜 가린다 - 플레이 버튼을 속 비운 것과
      같은 이유다.
    */
    backgroundColor: 'rgba(14,9,30,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 15,
    paddingLeft: 9,
    paddingRight: 8,
    paddingVertical: 4,
    justifyContent: 'flex-start',
  },
  pillValue: { flex: 1, textAlign: 'right', color: C.text, fontSize: 16, ...inkShadow, ...numeric },
  /** 더하기 - 동전 오른쪽 아래에 글자만 얹는다 (받침 없이) */
  /*
    더하기 - 숫자 오른쪽에 붙는 동그란 단추.

    동전 모서리에 글자만 얹어 봤더니 받침이 없어 렌더가 깨진 것처럼 보였다.
    받침을 주고 동전에 물려도 봤는데, 그러면 동전·단추가 한 덩어리로 뭉쳐
    숫자가 뒤로 밀렸다. 읽어야 할 건 숫자고 단추는 그다음이다.
  */
  pillPlus: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 3,
    borderWidth: 1.3,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(20,14,40,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillPlusText: { color: C.text, fontSize: 13, lineHeight: 15, marginTop: -1 },

  btnEdge: { borderRadius: 15, paddingBottom: 5, ...shadow(0.4, 6, 3) },
  btnEdgeCompact: { borderRadius: 12, paddingBottom: 4 },
  btnFace: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: C.outline,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnFaceCompact: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  btnGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '58%' },
  btnFloor: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '34%' },
  btnLabel: { fontSize: 15.5, fontWeight: '900' },
  btnSub: { fontSize: 12, fontWeight: '800', marginTop: 2, opacity: 0.92, ...numeric },

  // ------------------------------------------------------------- 재화

  // ------------------------------------------------------------- 바
  track: {
    backgroundColor: '#3a2414',
    borderWidth: 2,
    borderColor: C.outline,
    overflow: 'hidden',
  },
  barGloss: { height: '42%', backgroundColor: 'rgba(255,255,255,0.3)' },

  // ------------------------------------------------------------- 대화창
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,7,22,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: { width: '100%', maxWidth: 380 },
  dialogBody: { paddingHorizontal: 14, paddingBottom: 14 },
  dialogText: { color: '#f6e7c2', fontSize: 13, lineHeight: 20, fontWeight: '600' },
});

/**
 * 켜기/끄기 한 줄.
 *
 * 설정은 로비에도 있고 판 안에도 있다 - 싸우는 중에 진동을 끄고 싶은 사람이
 * 로비까지 나갔다 오게 만들면 안 된다. 그래서 두 곳이 같은 줄을 쓴다.
 */
export function Toggle({
  label,
  note,
  on,
  onPress,
}: {
  label: string;
  note: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={toggleStyles.row} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Text style={toggleStyles.note}>{note}</Text>
      </View>
      {/* 켜짐/꺼짐을 색과 자리 둘 다로 알린다 - 색맹이라도 구슬 위치로 안다 */}
      <View style={[toggleStyles.switch, on && toggleStyles.switchOn]}>
        <View style={[toggleStyles.knob, on && toggleStyles.knobOn]} />
      </View>
    </Pressable>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  label: { color: C.text, fontSize: 13 },
  note: { color: C.textFaint, fontSize: 10, marginTop: 2 },
  switch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10,7,26,0.6)',
    borderWidth: 2,
    borderColor: C.outline,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: 'rgba(60,140,90,0.5)', borderColor: '#4f9a63' },
  knob: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: C.textDim,
    marginLeft: 3,
  },
  knobOn: { backgroundColor: '#9be8ae', marginLeft: 21 },
});
