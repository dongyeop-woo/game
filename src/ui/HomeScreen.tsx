import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';

import { useMeta } from '../game/GameContext';
import { DEF_STAGES as STAGES } from '../game/defense';
import { fmt } from '../game/format';
import {
  canAttend,
  claimableAdCount,
  claimableMissionCount,
  starsOf,
} from '../game/progress';
import { TIER_FX, avatarDef } from '../game/avatars';
import { AvatarArt } from './art/avatar';
import { MenuIcon, type IconName } from './art/icons';
import { MailDialog, SettingsDialog } from './HomeDialogs';
import { AvatarStage } from './AvatarStage';
import { TopUpDialog } from './TopUpScreen';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { HomeBackdrop, SEAL } from './HomeBackdrop';
import { Button, CoinPill, Frame } from './components';
import { C, G, inkShadow, numeric, shadow } from './theme';

/**
 * 메뉴 아이콘 색.
 *
 * 아이콘과 글자를 같은 색으로 묶어야 한 줄로 읽힌다. 이모지를 쓸 때는 각자
 * 색을 들고 있어서(갈색 책, 보라 구슬, 회색 봉투) 메뉴가 흩어져 보였다.
 *
 * 흰색으로 뒀더니 밤하늘 배경에 묻혔다. 금색은 이 앱이 이미 쓰는 강조색이라
 * (플레이 버튼, 코인, 별) 튀지 않으면서 어두운 배경 위에서 확실히 뜬다.
 */
/**
 * 상단 친구 아이콘 색.
 *
 * `C.gold` 를 그대로 썼더니 진해서 혼자 튀었다. 왼쪽 메뉴가 흰색이라
 * 둘 사이 어디쯤 - 금빛은 남기되 연하게 - 가 맞다.
 */
const MENU_TINT = '#f0debf';

/**
 * 왼쪽 메뉴 아이콘 색.
 *
 * 금색이었는데 배경 그림도 금색 등불이라 서로 묻혔다. 흰색이면 밤하늘
 * 위에서 확실히 떠오르고, 글자와도 같은 색이라 아이콘과 이름이 한 덩어리로
 * 읽힌다.
 */
const MENU_ICON = C.text;

/**
 * 배경 그림 원본 크기.
 *
 * PNG 1.05MB 를 쓰다가 JPEG 로 바꿨다. 그림이 다 뜨기까지 눈에 띄게 걸렸는데,
 * 원인이 파일 크기였다 - 게다가 768폭이라 3x 화면에서는 늘려 쓰느라 흐리기까지 했다.
 * 지금은 화면이 실제로 쓰는 1206폭이면서 용량은 1/3 이다. 알파가 없는 그림이라
 * JPEG 로 잃는 게 없다.
 */
const BG_W = 1206;
const BG_H = 2710;

/** 배경 그림을 세로 8칸으로 눌러 뽑은 평균색 - 그림이 오기 전 바탕으로 쓴다 */
const BG_TONES = [
  '#201a36',
  '#221c3c',
  '#241f4a',
  '#2e294d',
  '#705957',
  '#4e3f56',
  '#3d3457',
  '#403558',
] as const;
const BG_TONE_STOPS = [0.0625, 0.1875, 0.3125, 0.4375, 0.5625, 0.6875, 0.8125, 0.9375] as const;

/**
 * 화면 가장자리 여백.
 *
 * 상단 프로필은 14, 왼쪽 메뉴는 30 으로 서로 달라서 두 줄의 시작점이
 * 어긋나 보였다. 가장자리에 붙는 것은 전부 같은 값을 쓴다.
 */
const EDGE = 22;

/**
 * 마법진이 화면 세로에서 오는 자리.
 *
 * 전에는 배경을 화면 맨 위에 붙이고 마법진이 떨어지는 대로 뒀다. 배경은
 * 폭에 맞춰 늘어나니, 세로가 짧은 기기(SE)에서는 그림이 아래로 넘쳐
 * 마법진이 73% 지점까지 내려갔다 - 같은 화면인데 캐릭터가 바닥에 붙었다.
 *
 * 이제 반대로 한다. 마법진을 여기 고정하고 배경을 그에 맞춰 올린다.
 */
const SEAL_AT = 0.6;

/**
 * 아바타 크기 - 마법진 지름에 대한 비율.
 *
 * 176pt 고정이었는데, 마법진은 배경의 일부라 화면 폭에 비례해 커진다.
 * 그래서 작은 기기에서는 쥐가 원을 꽉 채우고(81%) 큰 기기에서는 원 안에서
 * 작아 보였다(69%). 원과 같이 커져야 어느 기기에서든 같은 그림이 된다.
 */
const HERO_OF_SEAL = 0.75;

/**
 * 아바타를 마법진 위로 얼마나 끌어올릴지 (아바타 크기의 배수).
 *
 * 0.9 였는데 발이 마법진보다 아래에 찍혔다. AvatarStage 의 상자가
 * 아바타보다 1.22배 크고(마법진 장식이 들어갈 자리) 그림은 그 가운데에
 * 그려지니, 그만큼 아래로 밀린 것이다.
 *
 *   발 위치 = -HERO_FEET + (1.22-1)/2 + 0.92
 *
 * 1.03 이면 발이 마법진에 정확히 닿는다.
 */
const HERO_FEET = 1.03;

/** 플레이 버튼이 마법진에서 얼마나 아래에 오는지 - 이것도 지름 기준 */
const PLAY_BELOW_SEAL = 0.25;

/**
 * 무엇을 하고 놀지.
 *
 * 고르는 화면을 따로 두면 로비 -> 모드 -> 전투로 한 단계가 더 낀다. 셋뿐이라
 * 로비에 그냥 늘어놓고 고르게 하는 편이 짧다.
 */
type ModeId = 'tutorial' | 'normal' | 'pvp';

type Mode = {
  id: ModeId;
  name: string;
  sky: readonly [string, string];
  /** 카드를 채우는 배경 그림. 카드 안에서 잘린다. */
  art?: number;
  /**
   * 캐릭터 크기 배율.
   *
   * 그림마다 여백이 다르다 - 캔버스에 여백이 넉넉한 것도 있고 캐릭터가 꽉
   * 찬 것도 있어서, 한 공식으로 맞추면 어떤 건 작고 어떤 건 카드를 다 덮는다.
   * 그림을 보고 눈으로 정하는 값이다.
   */
  heroScale?: number;
  /**
   * 발 높이 미세 보정 (카드 높이 대비).
   *
   * 잘라낸 그림 아래쪽에 거의 투명한 가장자리가 남으면 경계가 실제 발보다
   * 아래로 잡혀서, 같은 기준선에 맞춰도 그 그림만 위로 뜬다. 눈으로 재서 맞춘다.
   */
  heroY?: number;
  /** 좌우 미세 보정 (카드 폭 대비, 음수면 왼쪽) */
  heroX?: number;
  /**
   * 카드 위로 삐져나오는 캐릭터 (투명 PNG).
   *
   * 배경과 나누는 이유가 이것이다 - 한 장으로 두면 카드가 통째로 잘라 버려서
   * 그림이 액자 안에 갇힌다. 캐릭터만 따로 카드 바깥 층에 올려야 앞으로
   * 튀어나온 것처럼 보인다.
   */
  hero?: number;
  /** 아직 못 여는 이유. null 이면 열려 있다. */
  lockedWhy: (meta: { tutorialDone: boolean; normalRuns: number }) => string | null;
};

/**
 * 늘어놓는 순서와 여는 순서는 다르다.
 *
 * 화면에는 PVP - 일반 - 튜토리얼로 놓지만, 열리는 건 튜토리얼 -> 일반 -> PVP
 * 순이다. 처음 켠 사람에게 셋을 다 열어 주면 무엇부터 할지 모른다.
 * 조건은 이기는 것이 아니라 '해 봤는가'다 - 못 이기면 영영 못 여는 상태에
 * 갇히면 안 된다.
 */
const MODES: Mode[] = [
  {
    id: 'pvp',
    name: 'PVP',
    sky: G.purple,
    art: require('../../assets/mode/pvp.jpg'),
    hero: require('../../assets/mode/pvp-hero.png'),
    heroScale: 0.40,
    heroY: -0.02,
    lockedWhy: (m) => (m.normalRuns > 0 ? null : '일반을 한 판 하면 열립니다'),
  },
  {
    id: 'normal',
    name: '일반',
    sky: G.blue,
    art: require('../../assets/mode/normal.jpg'),
    hero: require('../../assets/mode/normal-hero.png'),
    heroScale: 0.48,
    heroX: -0.07,
    lockedWhy: (m) => (m.tutorialDone ? null : '튜토리얼을 먼저 하세요'),
  },
  {
    id: 'tutorial',
    name: '튜토리얼',
    sky: G.green,
    art: require('../../assets/mode/tutorial.jpg'),
    hero: require('../../assets/mode/tutorial-hero.png'),
    heroScale: 0.44,
    heroY: -0.03,
    lockedWhy: () => null,
  },
];

/**
 * 홈 = 정비 화면.
 *
 * 싸움은 여기서 일어나지 않는다. 가운데에 캐릭터가 서 있고 좌우로 버튼이 붙는
 * 로비 구성이다. 실제 전투는 아래 모드 버튼으로 들어간다.
 */
export function HomeScreen({
  onPlay,
  onMissions,
  onCodex,
  onShop,
  onFriends,
  active = true,
}: {
  /** 고른 모드로 바로 들어간다 - 모드 고르는 화면을 따로 두지 않는다 */
  onPlay: (mode: ModeId, stageId: string) => void;
  onMissions: () => void;
  onCodex: () => void;
  onShop: () => void;
  onFriends: () => void;
  /** [임시] 3D 실험 화면 */
  /**
   * 지금 화면에 보이는가. 홈은 다른 화면에 갔다 와도 배경을 다시 디코딩하지
   * 않으려고 계속 붙어 있는다 (App.tsx 참고). 안 보이는 동안 움직임까지
   * 돌릴 이유는 없어서, 이 값으로 배경 연출을 재운다.
   */
  active?: boolean;
}) {
  const { meta } = useMeta();
  const [notice, setNotice] = useState<string | null>(null);
  /** 모드 카드가 가운데 떠 있는가 - 플레이를 누르면 열리고, 한 번 더 누르면 들어간다 */
  const [modeOpen, setModeOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /*
    배경 그림 크기는 직접 계산한다 (`resizeMode` 에 맡기지 않는다).

    폭을 화면에 맞추는 게 기본이다 - 좌우 기둥이 온전히 남는다. 그림 아래쪽에
    바닥을 늘려 붙여 뒀기 때문에 세로도 화면보다 길어서 빈 곳이 없다.
    (혹시 더 긴 화면이면 세로 기준으로 넘어가 좌우가 잘린다.)

    App 의 루트가 안전영역만큼 안으로 밀어 놨는데, 배경은 노치 뒤까지 꽉 차야
    한다. 그래서 그 패딩을 음수 좌표로 되돌려 화면 전체를 덮는다.
  */
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bgHeight = Math.max(screenW * (BG_H / BG_W), screenH);
  const bgWidth = bgHeight * (BG_W / BG_H);
  /*
    그림의 세로 자리.

    마법진이 `SEAL_AT` 에 오도록 올리되, 그림이 화면을 못 덮을 만큼은
    못 움직인다 - 위가 남으면 검은 띠가, 아래가 모자라면 바닥이 빈다.
  */
  const bgTop = Math.min(
    0,
    Math.max(screenH - bgHeight, screenH * SEAL_AT - bgHeight * SEAL.y),
  );
  const bgBox = {
    // 그림을 가운데 두는 게 아니라 '마법진'을 기준으로 맞춘다.
    // 마법진이 그림의 정중앙이 아니라서, 그림을 가운데 두면 캐릭터와 어긋난다.
    left: screenW / 2 - bgWidth * SEAL.x - insets.left,
    top: bgTop - insets.top,
    width: bgWidth,
    height: bgHeight,
  };
  /*
    마법진의 화면 세로 좌표.

    배경은 폭에 맞춰 늘어나므로 마법진의 자리도 기기마다 달라진다. 전에는
    아바타와 플레이 버튼을 고정 pt 로 두었는데, 그러면 화면 비율이 다른
    기기에서 아바타가 마법진에서 내려오거나 떠올랐다.

    이 값 하나에 아바타와 버튼을 묶으면 어느 기기에서든 같은 그림이 된다.
  */
  const sealY = bgTop - insets.top + bgHeight * SEAL.y;
  /** 마법진 지름 - 아바타와 버튼 자리를 여기에 맞춘다 */
  const sealW = bgWidth * SEAL.w;
  const heroSize = sealW * HERO_OF_SEAL;
  const heroTop = sealY - heroSize * HERO_FEET;

  /*
    모드 카드와 그 위로 삐져나오는 캐릭터의 크기.

    Image 는 left+right 만으로는 폭을 못 받아 원본 크기 그대로 그려진다
    (배경 그림에서도 같은 걸 겪었다). 그래서 값을 직접 계산해 넣는다.
    카드 줄은 좌우 16 여백에 카드 사이 10 간격이다.
  */
  /*
    카드를 누르는 동안 살짝 눌린다.

    카드와 캐릭터가 서로 다른 층에 있어서(캐릭터는 카드들 위 한 층) 각자
    움직이면 어긋난다. 모드마다 값을 하나 두고 둘이 같이 쓴다.
  */
  const press = useRef(MODES.map(() => new Animated.Value(0))).current;
  const pressTo = (i: number, to: number) => {
    Animated.spring(press[i], {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };
  const pressScale = (i: number) =>
    press[i].interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });

  const cardW = (screenW - 32 - 20) / 3;
  const cardH = cardW / 0.74;
  /*
    캐릭터는 카드를 거의 채우고 위로 조금 넘친다.

    처음엔 작게 얹었더니 카드 가운데가 비어서 캐릭터와 아이콘 사이가 떴다.
    레퍼런스는 캐릭터가 카드 높이만큼 크고, 넘치는 건 위쪽 일부다.
  */
  const heroH = cardH * 1.2;

  const dailyBadge =
    claimableMissionCount(meta) + (canAttend(meta) ? 1 : 0) + claimableAdCount(meta);

  // 아직 안 깬 첫 스테이지 (다 깼으면 마지막)
  const nextStage = STAGES.find((s) => !meta.clearedStages.includes(s.id)) ?? STAGES[STAGES.length - 1];
  const nextIndex = STAGES.findIndex((s) => s.id === nextStage.id) + 1;

  // 로비에 세워 둔 아바타 - 등급이 연출과 이름표 색을 정한다
  const avatar = avatarDef(meta.avatar);
  const fx = TIER_FX[avatar.tier];

  const soon = (label: string) => () => {
    setNotice(`${label} 모드는 준비 중입니다`);
    setTimeout(() => setNotice(null), 2000);
  };

  return (
    <View style={styles.root}>
      {/*
        배경 그림.
        바닥에 마법진이 이미 그려져 있어서 아바타를 그 위에 세운다 - 그래서
        AvatarStage 의 받침 타원은 빼고, 무대 위치를 그림의 마법진에 맞춰 내렸다.
      */}
      {/*
        그림이 도착하기 전에 깔아 두는 바탕.

        그림은 파일을 받아 디코딩한 뒤에야 칠해져서, 그전까지는 루트 배경색이
        그대로 보였다 - 그림보다 훨씬 어둡고 푸른 색이라 '배경이 안 뜬' 티가 확 났다.
        그림과 똑같은 자리에 똑같은 색 흐름을 미리 깔아 두면, 언제 도착하든
        빈 화면이 보이지 않는다. 색은 그림을 세로 8칸으로 눌러 뽑은 평균값이라,
        배경 그림을 갈면 이 값도 같이 뽑아서 바꾼다.
      */}
      <LinearGradient
        colors={BG_TONES}
        locations={BG_TONE_STOPS}
        style={[styles.bgImage, bgBox]}
        pointerEvents="none"
      />
      <Image
        source={require('../../assets/background.jpg')}
        style={[styles.bgImage, bgBox]}
        resizeMode="stretch"
      />
      {/* 그림과 똑같은 자리에 겹쳐야 마법진 위에 빛먼지가 정확히 얹힌다 */}
      <View style={[styles.bgImage, bgBox]} pointerEvents="none">
        <HomeBackdrop width={bgWidth} height={bgHeight} active={active} />
      </View>
      {/*
        가장자리를 눌러 가운데로 시선을 모은다.

        배경 그림이 전체적으로 고르게 밝아서 아바타가 그림에 묻혔다. 네 귀퉁이를
        어둡게 하고 아바타 자리에만 옅은 빛을 얹으면, 같은 그림인데도 가운데가
        먼저 보인다. 그림을 고치는 게 아니라 빛으로만 만드는 거라 배경을 갈아도
        그대로 쓸 수 있다.
      */}
      <Svg
        /*
          노치 위까지 덮는다.

          앱 루트가 안전영역만큼 안으로 밀어 놔서, 그냥 화면을 채우면 비네트가
          노치 밑에서 갑자기 시작해 가로줄이 하나 생긴다 (배경 그림도 같은
          이유로 -insets.top 부터 그린다).
        */
        style={{ position: 'absolute', top: -insets.top, left: -insets.left }}
        width={screenW}
        height={screenH}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="homeVig" cx="50%" cy="52%" rx="64%" ry="54%">
            <Stop offset="0" stopColor="#080618" stopOpacity={0} />
            <Stop offset="0.52" stopColor="#080618" stopOpacity={0.1} />
            <Stop offset="1" stopColor="#080618" stopOpacity={0.74} />
          </RadialGradient>
          {/* 아바타가 선 자리에만 옅은 등불빛 */}
          <RadialGradient id="homeSpot" cx="50%" cy="55%" rx="32%" ry="24%">
            <Stop offset="0" stopColor="#ffe3a6" stopOpacity={0.14} />
            <Stop offset="1" stopColor="#ffe3a6" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/*
          크기를 퍼센트가 아니라 숫자로 준다.

          `100%` 로 뒀더니 SVG 안쪽 뷰포트가 화면보다 노치 높이만큼 짧게
          잡혀서, 아래쪽에 비네트가 안 닿는 띠가 남았다. 이 프로젝트에서
          퍼센트 크기로 밟는 함정이 이번이 네 번째다 - 재서 넣는다.
        */}
        <Rect x={0} y={0} width={screenW} height={screenH} fill="url(#homeVig)" />
        <Rect x={0} y={0} width={screenW} height={screenH} fill="url(#homeSpot)" />
      </Svg>

      {/* 아래쪽 돌바닥이 밝아 카드/버튼 글씨가 묻힌다 - 어둡게 깔아 준다 */}
      <LinearGradient
        colors={['rgba(11,8,32,0)', 'rgba(11,8,32,0.55)', 'rgba(11,8,32,0.92)'] as const}
        locations={[0.6, 0.82, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/*
        상단 - 누구인지와 가진 것.

        예전엔 재화 줄과 이름판이 따로 있고 이름판은 두꺼운 금테 액자였다.
        로비에서 제일 눈에 띄는 게 '이름표'가 되면 곤란하다. 프로필처럼
        한 줄로 눕히고 테두리를 걷어 그림이 드러나게 한다.
      */}
      {/*
        노치가 없는 기기에서는 앱 루트가 위를 안 밀어 준다(insets.top = 0).
        그대로 두면 프로필이 화면 맨 위에 붙는다. 노치가 먹는 만큼을 빼고
        모자란 만큼만 채워, 어느 기기에서든 위가 비슷하게 뜬다.
      */}
      <View style={[styles.topBar, { paddingTop: Math.max(10, 26 - insets.top) }]}>
        {/*
          여긴 '나'다. 아바타 이름과 등급은 캐릭터 위로 옮겼다 - 갈아 끼우는
          겉모습을 프로필 자리에 두면 누구의 로비인지가 안 보인다.
        */}
        <View style={styles.who}>
          <View style={[styles.whoArt, { borderColor: fx.color }]}>
            <AvatarArt def={avatar} size={30} />
          </View>
          <Text style={styles.whoName} numberOfLines={1}>
            {meta.nickname}
          </Text>
        </View>

        <View style={{ flex: 1 }} />
        <CoinPill value={fmt(meta.gold)} onPlus={() => setTopUpOpen(true)} />
        {/*
          유틸리티는 상단 우측에 모은다.

          친구는 '가서 머무는 곳'이 아니라 수시로 확인하는 것이라, 콘텐츠
          목적지(도감·소환·상점·일일)가 늘어선 우측 레일과 성격이 다르다.
          레일에 끼워 넣으면 다섯 줄이 되어 플레이 버튼까지 내려온다.
        */}
        <Pressable onPress={onFriends} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
          <MenuIcon name="friends" size={26} color={MENU_TINT} />
        </Pressable>

        {/* 우편 - 안 받은 게 있으면 점으로 알린다 */}
        <Pressable
          onPress={() => setMailOpen(true)}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <MenuIcon name="mail" size={26} color={MENU_TINT} />
          {meta.mail.some((m) => !m.claimed) ? <View style={styles.utilDot} /> : null}
        </Pressable>

        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <MenuIcon name="settings" size={26} color={MENU_TINT} />
        </Pressable>
      </View>

      {/* -------------------------------------------------------- 가운데 캐릭터 */}
      {/* 아래 줄 높이에 휘둘리지 않게, 자리만 차지하는 빈 칸 */}
      <View style={{ flex: 1 }} pointerEvents="none" />

      <View style={[styles.stage, { top: heroTop }]}>
        {/*
          캐릭터를 누르면 도감으로 간다.

          소환으로 보냈었는데, 눌러서 나오는 건 '지금 세워 둔 아바타'다.
          그걸 눌렀을 때 가고 싶은 곳은 아바타를 보고 바꾸는 도감이지
          새로 뽑는 소환이 아니다. 소환은 오른쪽 메뉴에 따로 있다.
        */}
        <Pressable style={styles.hero} onPress={onCodex}>
          {/*
            지금 세워 둔 아바타가 무엇인지. 흐름에서 빼서 캐릭터 바로 위에
            띄운다 - 자리를 차지하면 캐릭터가 마법진에서 내려온다.
          */}
          <View style={styles.plate} pointerEvents="none">
            <View style={[styles.tierTag, { backgroundColor: fx.color }]}>
              <Text style={styles.tierTagText}>{fx.label}</Text>
            </View>
            <Text style={styles.plateName} numberOfLines={1}>
              {avatar.name}
            </Text>
          </View>
          <AvatarStage def={avatar} size={heroSize} />
        </Pressable>
      </View>

      {/* ------------------------------------- 플레이 */}
      {/*
        카드는 평소엔 안 보인다. 플레이를 누르면 화면 한가운데에 펼쳐지고,
        카드를 누르면 곧바로 들어간다 - 고르고 나서 또 눌러야 하면 한 번이 더 든다.
      */}
      {/*
        메뉴.

        네모난 아이콘 버튼 두 줄이 캐릭터 양옆을 막고 있었다. 글자 목록으로
        눕히면 자리를 훨씬 덜 먹고 배경이 트인다. 흐름에서 빼서 띄우기 때문에
        항목을 늘리거나 줄여도 캐릭터 위치는 그대로다.
      */}
      <View style={styles.menu}>
        <MenuItem icon="codex" label="도감" onPress={onCodex} />
        <MenuItem icon="shop" label="상점" onPress={onShop} />
        <MenuItem icon="daily" label="일일" badge={dailyBadge} onPress={onMissions} />
      </View>

      {/*
        자리만 잡아 두는 빈 칸.

        버튼을 흐름에서 빼서 띄우면 그만큼 위의 stage(flex:1)가 커져 캐릭터가
        내려앉는다. 예전에 버튼 줄이 쓰던 높이를 그대로 남겨 두면 로비 배치가
        건드려지지 않는다 - 버튼 위치와 크기는 아래 playRow 에서만 정한다.
      */}
      <View style={styles.playSpacer} />

      {!modeOpen ? (
        <View style={[styles.playRow, { top: sealY + sealW * PLAY_BELOW_SEAL }]}>
          <PlayButton onPress={() => setModeOpen(true)} />
        </View>
      ) : null}

      {/* 우편함·설정 - 충전과 같은 방식으로 로비 위에 띄운다 */}
      {mailOpen ? (
        <View style={[styles.overlay, { top: -insets.top, left: -insets.left, right: -insets.right }]}>
          <MailDialog onClose={() => setMailOpen(false)} />
        </View>
      ) : null}
      {settingsOpen ? (
        <View style={[styles.overlay, { top: -insets.top, left: -insets.left, right: -insets.right }]}>
          <SettingsDialog onClose={() => setSettingsOpen(false)} />
        </View>
      ) : null}

      {/* 골드 충전 - 로비를 떠나지 않고 창으로 띄운다 */}
      {topUpOpen ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { top: -insets.top, left: -insets.left, right: -insets.right, zIndex: 20 },
          ]}
        >
          <TopUpDialog onClose={() => setTopUpOpen(false)} />
        </View>
      ) : null}

      {/* 모드 고르기 - 화면 한가운데 */}
      {modeOpen ? (
        <Pressable
          onPress={() => setModeOpen(false)}
          /*
            App 루트가 안전영역만큼 안으로 밀어 놨는데, 절대배치는 그 패딩
            안쪽에서 시작한다. 그대로 두면 노치 아래에 밝은 띠가 남아 헤더가
            잘린 것처럼 보인다 - 패딩만큼 되돌려 화면 전체를 덮는다.
          */
          style={[
            styles.modeOverlay,
            { top: -insets.top, left: -insets.left, right: -insets.right },
            /*
              좌우만 되채운다. 위쪽까지 채우면 세로 가운데가 안전영역만큼
              아래로 밀려 카드가 화면 중앙보다 내려앉는다.
            */
            { paddingLeft: insets.left, paddingRight: insets.right },
          ]}
        >
          <View style={styles.modeCards}>
            {MODES.map((m, i) => {
              const why = m.lockedWhy(meta);
              return (
                <Pressable
                  key={m.id}
                  style={styles.modeSlot}
                  onPressIn={() => pressTo(i, 1)}
                  onPressOut={() => pressTo(i, 0)}
                  onPress={() => {
                    if (why) {
                      setNotice(why);
                      setTimeout(() => setNotice(null), 2000);
                      return;
                    }
                    setModeOpen(false);
                    /*
                      튜토리얼은 늘 첫 스테이지다.

                      진행 중인 스테이지를 그대로 쓰면 '연습'인데 12웨이브짜리
                      후반 판이 열린다. 배우러 들어가는 곳이니 가장 쉬운 판이
                      고정으로 나와야 한다.
                    */
                    onPlay(m.id, m.id === 'tutorial' ? STAGES[0].id : nextStage.id);
                  }}
                >
                  {/*
                    입체감은 네 겹으로 만든다. 납작한 색면 하나로는 배경 위에
                    스티커처럼 얹혀 보인다.

                      1) 바탕 그라데이션 - 위가 밝고 아래로 어두워진다
                      2) 위쪽 베벨 - 유리처럼 빛을 한 줄 얹는다
                      3) 아래쪽 그늘막 - 글자가 얹힐 자리를 어둡게 깔아 준다
                      4) 안쪽 밝은 테두리 - 두꺼운 바깥선 안에 머리카락 선을 하나 더
                  */}
                  <Animated.View
                    style={[
                      styles.modeCard,
                      why != null && styles.modeLocked,
                      { transform: [{ scale: pressScale(i) }] },
                    ]}
                  >
                    {m.art ? (
                      <Image
                        source={m.art}
                        style={[styles.modeArt, { width: cardW, height: cardH }]}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={[m.sky[0], m.sky[1], m.sky[1]] as const}
                        locations={[0, 0.62, 1]}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)'] as const}
                      style={[styles.modeBevel, { height: cardH * 0.46 }]}
                      pointerEvents="none"
                    />
                    <LinearGradient
                      colors={['rgba(8,6,20,0)', 'rgba(8,6,20,0.72)'] as const}
                      style={[styles.modeScrim, { height: cardH * 0.52 }]}
                      pointerEvents="none"
                    />
                    <View style={styles.modeInner} pointerEvents="none" />

                    {why ? <View style={styles.modeVeil} /> : null}

                    {/*
                      열린 모드에는 아이콘을 안 넣는다.

                      육각 배지를 뒀었는데, 아래 이름이 이미 모드를 말하고
                      그림이 무엇인지 보여 준다. 배지는 셋째 설명이면서 캐릭터가
                      설 자리를 뺏어서, 캐릭터를 계속 위로 밀어 올려야 했다.
                      잠긴 모드만 자물쇠로 알린다.
                    */}
                    {why ? (
                      <View style={styles.modeBadge}>
                        <Text style={styles.modeIcon}>🔒</Text>
                      </View>
                    ) : null}
                    <Text style={styles.modeName} numberOfLines={1}>
                      {m.name}
                    </Text>
                  </Animated.View>
                </Pressable>
              );
            })}

            {/*
              캐릭터는 카드들 '위' 한 층에 모아 그린다.

              카드 안이나 슬롯 안에 두면, 나중에 그려지는 오른쪽 카드가 왼쪽
              캐릭터의 팔을 덮는다(실제로 PVP 가 잘렸다). 카드를 다 그린 뒤
              캐릭터만 따로 얹으면 누구도 서로를 자르지 않는다.
            */}
            <View style={styles.heroLayer} pointerEvents="none">
              {MODES.map((m, i) => (
                <View key={m.id} style={styles.heroCell}>
                  {m.hero
                    ? (() => {
                        const src = Image.resolveAssetSource(m.hero);
                        const h = heroH * (m.heroScale ?? 1);
                        const w = (h * src.width) / src.height;
                        return (
                          <Animated.Image
                            source={m.hero}
                            style={[
                              styles.modeHero,
                              {
                                width: w,
                                height: h,
                                left: (cardW - w) / 2 + cardW * (m.heroX ?? 0),
                                // 카드 위쪽에 세운다 - 아래는 이름이 앉을 자리
                                top: cardH * (0.68 + (m.heroY ?? 0)) - h,
                              },
                              m.lockedWhy(meta) != null && styles.modeHeroLocked,
                              { transform: [{ scale: pressScale(i) }] },
                            ]}
                            resizeMode="contain"
                          />
                        );
                      })()
                    : null}
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      ) : null}

      {notice ? (
        <View style={styles.notice} pointerEvents="none">
          <Frame tone="hot">
            <Text style={styles.noticeText}>{notice}</Text>
          </Frame>
        </View>
      ) : null}
    </View>
  );
}

/**
 * 플레이 버튼.
 *
 * 꽉 찬 금색 버튼이었는데, 로비 배경이 그림이 되고 나서는 그 위에 색면
 * 하나가 얹힌 꼴이 됐다. 배경을 가리지 않으면서도 제일 눌러야 할 것으로
 * 보여야 하니, 속을 비우고 테두리와 빛으로만 세운다.
 *
 *   1) 반투명한 남색 - 뒤 그림이 비친다
 *   2) 금색 테두리 두 겹 (바깥 굵게, 안쪽 가늘게)
 *   3) 위쪽 광택 한 줄
 *   4) 좌우 꺾쇠 - 앞으로 나아간다는 신호
 */
/** 플레이 버튼 너비 - 물결의 폭과 이동 거리를 여기에 맞춘다 */
const PLAY_W = 146;
/**
 * 금테 색.
 *
 * 단색 노랑은 물감으로 보인다. 금은 한 덩이 안에서 밝기가 크게 뒤집히는
 * 금속이라, 밝은 하이라이트 -> 짙은 골 -> 아래쪽 반사광 순으로 깔아야
 * '금속'으로 읽힌다.
 *
 * 채도만 낮췄더니 이번엔 바래 보였다. 톤을 내린다는 건 밝기를 함께
 * 내린다는 뜻이다 - 밝은 쪽을 그대로 두고 채도만 빼면 '연한 금'이 된다.
 */
const GOLD_RIM = ['#d8bd72', '#a8802a', '#523909', '#ab8837'] as const;
/** 테두리와 같은 결의 꺾쇠 색 - 테두리보다 한 톤 밝게 */
const GOLD_INK = '#c8a850';

/** 물결이 버튼 한 폭을 건너가는 데 걸리는 시간(밀리초) */
const WAVE_SWEEP = 2600;

function PlayButton({ onPress }: { onPress: () => void }) {
  /*
    물결이 왼쪽에서 오른쪽으로 끊임없이 흐른다.

    처음엔 빛 한 줄기가 한 번 훑고 지나가게 했는데, 바탕이 위에서 아래로
    어두워지는 세로 그라데이션이라 가로로 지나가는 빛과 결이 어긋났다.
    바탕을 가로로 눕히고 그 위에 물결을 계속 흘려 보내면 방향이 하나가 된다.

    **이음매가 안 보이게** 하는 요령: 무늬를 버튼 두 폭으로 그리되 한 폭마다
    같은 모양이 되게 색 자리를 잡는다. 그러면 한 폭만큼 밀고 0 으로 되돌려도
    그림이 똑같아서 끊긴 자리가 안 보인다.
  */
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: WAVE_SWEEP,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [t]);

  const flow = t.interpolate({ inputRange: [0, 1], outputRange: [-PLAY_W, 0] });

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        /*
          금테는 뺐다 - 지금은 청록 두 겹만으로 테를 삼는다.
          되살리려면 이 자리에 `GOLD_RIM` 그라데이션을 다시 감싸면 된다.
        */
        <View style={[styles.play, pressed && { transform: [{ scale: 0.96 }] }]}>
          {/*
            뒤를 눌러 주는 막.

            바탕을 옅게만 깔았더니 뒤에 있는 돌바닥 줄눈이 그대로 비쳐서
            버튼 안에 세로줄이 그어진 것처럼 보였다. 색 없는 어두운 막을 한 겹
            먼저 깔면 뒤가 뭉개지고, 그 위에 옅은 파랑을 얹으면 유리 느낌은
            그대로 남는다 - 유리는 원래 뒤가 '흐리게' 보이지 또렷하게 보이지 않는다.
          */}
          <View style={styles.playScrim} pointerEvents="none" />

          {/*
            바탕 - 가로로 눕혀서 물결과 결을 맞춘다.

            색은 빙하 바다에서 가져왔다. 처음엔 오른쪽 끝을 짙은 남색으로
            떨어뜨렸는데, 물결이 지나갈 때 밝은 결과 대비가 너무 세서 어두운
            덩어리가 먼저 눈에 들어왔다. **양 끝의 밝기를 붙여** 놓으면
            움직이는 건 물결뿐이 된다.
          */}
          <LinearGradient
            colors={['rgba(46,100,176,0.9)', 'rgba(22,58,134,0.93)'] as const}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            style={[styles.playWave, { transform: [{ translateX: flow }] }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={
                [
                  'rgba(255,255,255,0)',
                  'rgba(150,220,255,0.22)',
                  'rgba(255,255,255,0)',
                  'rgba(150,220,255,0.22)',
                  'rgba(255,255,255,0)',
                ] as const
              }
              locations={[0, 0.25, 0.5, 0.75, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/*
            위쪽 광택은 뺐다.

            버튼 위 18px 만 덮는 흰 그라데이션이었는데, 끝나는 자리에 가로줄이
            생겨 버튼을 위아래로 갈라 놓았다. 유리로 읽히게 하는 건 금테와
            안쪽 가는 선, 그리고 흐르는 물결이면 충분하다.
          */}
            <View style={styles.playInner} pointerEvents="none" />
            <View style={styles.playInner2} pointerEvents="none" />
          {/*
            글자와 꺾쇠를 한 줄로 묶어 가운데에 둔다.

            한때 꺾쇠를 줄에서 빼내 오른쪽에 절대배치했었다. 글자는 정확히
            가운데 왔지만 **양쪽 여백이 어긋났다** - 왼쪽 41pt, 오른쪽 35pt.
            눈은 글자 하나가 아니라 '플레이 >' 덩어리를 보고 여백을 잰다.
            한 줄로 묶으면 여백이 저절로 같아진다 (손으로 맞춘 값이 없다).
          */}
            <Text style={styles.playLabel}>플레이</Text>
          {/*
            꺾쇠 오른쪽 여백을 깎아 덩어리를 오른쪽으로 민다.

            두 번 어긋났다. 먼저 **글자 상자**의 양쪽을 맞춰도 눈에는 왼쪽으로
            쏠려 보였다 - 눈은 상자가 아니라 잉크를 보는데 한글은 상자 안에서
            왼쪽에 치우쳐 있다. 잉크의 양끝을 맞추고 나서도 여전히 쏠려
            보였는데, 이번엔 **무게** 때문이었다. 꺾쇠는 가는 선 하나라
            글자 덩어리보다 훨씬 가볍고, 눈은 잉크의 무게중심으로 가운데를 잰다.

            무게중심으로만 맞추면 8.7pt 를 밀어야 하는데 그러면 꺾쇠가
            오른쪽 벽에 붙어 보인다. 절반쯤에서 멈춘다 - 양끝과 무게 사이
            어디쯤이 눈에 맞는 자리다.
          */}
            <View style={{ marginRight: -13 }}>
              <MenuIcon name="chevron" size={17} color={GOLD_INK} />
            </View>
        </View>
      )}
    </Pressable>
  );
}

function MenuItem({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: IconName;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.55 }]}
    >
      <MenuIcon name={icon} size={26} color={MENU_ICON} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? <View style={styles.menuDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_TONES[2] },
  bgImage: { position: 'absolute' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: EDGE,
    paddingBottom: 6,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  whoArt: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,26,0.5)',
  },
  whoName: { color: C.text, fontSize: 15, ...inkShadow },
  /* 흐름에서 빼서 캐릭터 바로 위에 얹는다 */
  plate: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tierTag: {
    borderWidth: 1.5,
    borderColor: C.outline,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tierTagText: { color: '#2a1f10', fontSize: 10.5, fontWeight: '900' },
  plateName: { color: C.text, fontSize: 15, ...inkShadow },

  /*
    흐름에서 빼서 띄운다 - 항목을 늘려도 캐릭터 위치가 안 흔들린다.
    오른쪽에 붙이므로 아이콘이 화면 끝에 세로로 줄 서도록 글자를 앞에 둔다.
  */
  menu: {
    position: 'absolute',
    left: EDGE,
    top: 128,
    gap: 10,
    alignItems: 'flex-start',
    /*
      좌우 버튼 기둥을 걷어내면서 가운데 캐릭터(hero)가 flex:1 로 가로 전체를
      차지한다. 그게 메뉴를 덮으면 메뉴가 눌리지 않으니 메뉴를 뒤에 그린다
      (JSX 순서로 해결한다 - zIndex 만으로는 터치까지 확실히 넘어오지 않았다).
    */
    zIndex: 5,
  },
  /* 세로 여백이 없으면 글자 높이가 곧 터치 영역이라 누르기 어렵다 */
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
  menuLabel: { color: C.text, fontSize: 17, ...inkShadow },
  menuDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
    borderWidth: 1.5,
    borderColor: C.outline,
  },


  /*
    좌우 버튼 기둥이 있던 시절엔 row + space-between 이었다. 기둥을 걷어낸 뒤로는
    캐릭터 하나뿐인데 hero 가 flex:1 로 가로 전체를 먹어 메뉴 위를 덮었고,
    그래서 메뉴가 눌리지 않았다. 캐릭터는 제 크기만 차지하면 된다.
  */
  /** 마법진 위에 고정한다 - top 은 렌더에서 계산해 넣는다 */
  stage: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  hero: { alignItems: 'center', justifyContent: 'center' },

  // 협동/PVP 버튼이 있던 자리만큼 비워 카드 위치를 원래대로 유지한다
  modeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,4,18,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    // 좌우 아이콘 버튼이 zIndex 2 라 그냥 두면 카드를 덮는다
    zIndex: 10,
  },
  modeCards: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, alignSelf: 'stretch' },
  /* 캐릭터가 위로 넘치므로 여기서 잘라내면 안 된다 */
  modeSlot: { flex: 1, overflow: 'visible' },
  modeCard: {
    aspectRatio: 0.74,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: C.outline,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // 이름을 바닥에서 띄운다 - 카드 아래 여백이 받침처럼 보인다
    paddingBottom: 26,
    // 배경에서 확실히 떠 보이도록 그림자를 깊게 준다
    ...shadow(0.6, 14, 7),
  },
  /*
    absoluteFill 만으로는 Image 가 크기를 못 받아 원본 크기(384x514 포인트)로
    그려지고, 카드가 그 좌상단만 잘라 보여 준다 - 3배 확대된 것처럼 보인다.
    폭과 높이를 명시해야 카드에 맞춰진다.
  */
  /*
    크기를 퍼센트로 주면 안 된다.

    absoluteFill 만으로는 Image 가 크기를 못 받고, height:'100%' 는 패딩을 뺀
    안쪽 기준이라 카드 아래에 빈 띠가 남는다. 계산한 카드 크기를 그대로 준다.
  */
  modeArt: { position: 'absolute', top: 0, left: 0 },
  /* 카드 위 테두리를 넘어 올라간다 - 그래야 카드 앞에 선 것처럼 보인다 */
  modeHero: { position: 'absolute' },
  /* 카드 줄과 같은 자리에 겹쳐 놓아야 칸이 정확히 맞는다 */
  heroLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  heroCell: { flex: 1 },
  modeHeroLocked: { opacity: 0.35 },
  /** 위쪽 유리 반사 - 카드 윗면이 빛을 받는 것처럼 보이게 한다 */
  modeBevel: { position: 'absolute', top: 0, left: 0, right: 0 },
  /** 글자가 얹힐 자리 - 어둡게 깔아야 이름이 그림 위에서도 읽힌다 */
  modeScrim: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  /** 두꺼운 바깥선 안쪽에 머리카락 선을 하나 더 - 두께가 생긴다 */
  modeInner: {
    ...StyleSheet.absoluteFill,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  /** 잠긴 모드는 회색 막을 덮어 눌러도 안 되는 것임을 보여 준다 */
  modeLocked: { borderColor: C.textFaint },
  modeVeil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,8,24,0.62)' },
  /** 잠긴 모드의 자물쇠만 네모 받침을 쓴다 (육각 배지는 자체 판이 있다) */
  modeBadge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,8,26,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 9,
    ...shadow(0.5, 6, 3),
  },
  modeIcon: { fontSize: 24 },
  /*
    lineHeight 를 안 주면 글자 아래가 잘린다.

    BMJUA 는 글자가 기본 줄 높이보다 아래로 내려오는데, numberOfLines={1} 과
    만나면 그만큼 깎인다. 넉넉히 잡아 둔다.
  */
  modeName: { color: C.text, fontSize: 14, lineHeight: 21, ...inkShadow },

  /*
    흐름에서 빼서 띄운다.

    줄로 두면 이 줄의 여백을 건드릴 때마다 위의 stage(flex:1)가 그만큼 줄어
    캐릭터와 좌우 버튼이 따라 올라간다. 버튼 위치만 조정하고 싶은데 로비
    전체가 움직이면 안 된다.
  */
  overlay: { ...StyleSheet.absoluteFill, zIndex: 20 },
  /** 안 받은 우편이 있다는 점 - 아이콘 오른쪽 위에 붙인다 */
  utilDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red ?? '#e8615a',
  },
  /** 예전 버튼 줄이 쓰던 높이 (compact 버튼 44 + 아래 여백 135) */
  playSpacer: { height: 44, marginBottom: 135 },
  playRow: {
    position: 'absolute',
    // 화면 한가운데. 오른쪽에 붙여 뒀더니 마법진과 중심이 어긋나 보였다
    left: 0,
    right: 0,
    alignItems: 'center',
    // 어둡게 깔린 막 위에 남아야 한다
    zIndex: 11,
  },
  play: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: PLAY_W,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...shadow(0.5, 12, 6),
  },
  playScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(14,26,54,0.72)' },
  /** 흐르는 물결 - 버튼 두 폭으로 그려 두고 한 폭씩 민다 */
  playWave: { position: 'absolute', left: 0, top: 0, bottom: 0, width: PLAY_W * 2 },
  /** 굵은 금테 안쪽에 가는 선을 하나 더 - 유리처럼 두께가 생긴다 */
  /*
    안쪽 테 - 투톤의 두 번째 색.

    금테 하나만 두르면 테두리와 바탕이 맞닿는 자리가 밋밋하다. 안쪽에 밝은
    청록 테를 한 겹 더 두르면 금과 파랑 사이에 빛나는 경계가 생겨, 금테가
    '틀'이고 파랑이 '유리'인 게 분명해진다.

    바깥으로 갈수록 옅어지는 두 겹이라 한 줄로 그은 선보다 빛으로 읽힌다.
  */
  playInner: {
    ...StyleSheet.absoluteFill,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(148,228,255,0.85)',
  },
  playInner2: {
    ...StyleSheet.absoluteFill,
    margin: 2,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(120,200,240,0.3)',
  },
  playLabel: { color: C.text, fontSize: 18, lineHeight: 26, ...inkShadow },

  notice: { position: 'absolute', bottom: 150, alignSelf: 'center' },
  noticeText: { color: C.text, fontSize: 13.5, fontWeight: '900', ...inkShadow },
});
