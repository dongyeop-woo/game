import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Mountains, SceneryArt } from './scenery';
import type { StageDef } from '../../game/defense';

/**
 * 전투 화면 배경.
 *
 * 원래는 `stage.sky` 그라데이션 두 색이 전부였다. 판이 화면 폭에 이미 꽉 차
 * 있어서 위아래로 남는 세로가 통째로 빈 파란 벽이 됐고, 그래서 판이 세상
 * 안에 있는 게 아니라 빈 화면에 얹힌 사각형으로 보였다.
 *
 * 여기서 만드는 건 딱 세 가지다 - 지평선, 그 뒤의 것들, 가장자리 어둠.
 * 셋 다 코드로 그리니 용량이 0 이고, 스테이지마다 색만 갈아 끼우면
 * 다른 장소처럼 보인다.
 *
 * 별·나무 자리는 난수를 쓰되 스테이지 id 로 고정한다. 매 프레임 새로 뽑으면
 * 배경이 지직거린다 (전에 실제로 그랬다).
 */

/** 지평선 높이 - 화면 위에서부터의 비율 */
const HORIZON = 0.42;

/**
 * 스테이지마다의 경기장 그림.
 *
 * 그림 한 장에 배경과 마당이 같이 들어 있다. 따로 뽑으면 두 그림의 빛과 색이
 * 안 맞아 판이 배경 위에 얹힌 사각형으로 보인다.
 *
 * **그림을 화면에 맞추지 않고 판을 그림의 마당에 맞춰 앉힌다.** 그래서 그림
 * 안에서 마당이 어디쯤인지(`yardY`)를 같이 적어 둔다 - 홈 화면이 배경의
 * 마법진에 캐릭터를 맞추는 것과 같은 방식이다.
 *
 * 값은 눈대중하지 말고 `python3 tools/measure-arena.py <파일>` 로 재서 넣는다.
 * 프롬프트는 `tools/arena-art-prompts.md`.
 */
type ArenaArt = {
  art: number;
  /**
   * 그림 안에서 **판(경기장 사각형)이 어디에 얼마만 하게** 그려져 있는가.
   *
   * 이 값이 있으면 코드는 판을 아예 안 그린다. 그림에 길과 마당이 이미
   * 그려져 있고, 그 그림을 계산된 판 자리에 정확히 앉히기만 하면 되기 때문이다.
   * 바닥·길·배경을 따로 그리면 세 개가 서로 안 맞는다 - 한 장이면 그럴 일이 없다.
   *
   * cx, size 는 **그림 폭** 기준, cy 는 **그림 높이** 기준 (0~1).
   * 눈대중하지 말고 `python3 tools/measure-arena.py <파일>` 로 재서 넣는다.
   */
  board: { cx: number; cy: number; size: number };
};

const ARENA_BG: Record<string, ArenaArt> = {
  s1: {
    art: require('../../../assets/arena/s1.jpg'),
    board: { cx: 0.4975, cy: 0.52, size: 0.945 },
  },
};

/**
 * 아직 자기 그림이 없는 스테이지가 빌려 쓰는 그림.
 *
 * 늪지에 성문이 서 있는 건 맞지 않지만, 다섯 장을 다 뽑기 전까지는 코드로
 * 그린 배경보다 이쪽이 낫다. **s2~s5 를 다 넣으면 이 줄을 지운다.**
 */
const ARENA_FALLBACK: ArenaArt | null = ARENA_BG.s1 ?? null;

/** 이 스테이지에 경기장 그림이 있는가 (있으면 코드가 판을 안 그린다) */
export function arenaArtFor(stageId: string): ArenaArt | null {
  return ARENA_BG[stageId] ?? ARENA_FALLBACK;
}

/**
 * 판 안쪽 바닥 무늬.
 *
 * 경기장 그림이 없는 스테이지에서만 쓴다. 그림이 있으면 그 안에 바닥이
 * 이미 들어 있다 - 따로 깔면 두 겹이 된다.
 */
const ARENA_FLOOR: number | null = null;

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/*
  전투 화면은 초당 30번 다시 그린다. 배경은 그 사이 아무것도 안 바뀌는데
  매번 같이 딸려 그려지면(그림 + 그라데이션 두 장 + 별·나무) 그게 그대로
  프레임을 갉아먹는다. 바뀐 게 없으면 건너뛰게 memo 로 감싼다.

  단, props 로 넘어오는 `board` 객체를 부르는 쪽에서 매번 새로 만들면
  memo 가 아무 소용이 없다 - 거기서도 useMemo 로 묶어야 한다.
*/
export const ArenaBackdrop = React.memo(function ArenaBackdrop({
  stage,
  width,
  height,
  board,
  inset = 0,
}: {
  /** 화면에서 판이 차지하는 정사각형. 그림을 여기에 맞춰 앉힌다. */
  board?: { x: number; y: number; size: number } | null;
  /**
   * 노치 높이. 앱 루트가 그만큼 아래에서 시작하기 때문에, 배경은 그만큼
   * 위로 올려야 화면 맨 위까지 덮는다.
   *
   * 안 그러면 그늘이 노치 밑에서 갑자기 시작해 가로줄이 하나 생긴다
   * (실제로 그랬다). 판 좌표(`board.y`)도 화면 기준이라 여기 맞춰야 한다.
   */
  inset?: number;
  stage: StageDef;
  width: number;
  height: number;
}) {
  const horizonY = height * HORIZON;

  const { stars, props } = useMemo(() => {
    const r = rng(stage.id);
    return {
      // 별은 지평선 위에만. 아래에 뿌리면 땅에서 빛나는 점이 된다.
      stars: Array.from({ length: 46 }, () => ({
        x: r() * width,
        y: r() * horizonY * 0.92,
        s: 0.7 + r() * 1.5,
        o: 0.25 + r() * 0.55,
      })),
      /*
        좌우 가장자리에만 세운다. 가운데는 판이 차지하니 거기 세우면
        판 뒤로 삐죽 나온 나무가 되어 오히려 지저분해진다.
      */
      props: Array.from({ length: 8 }, (_, i) => {
        const left = i % 2 === 0;
        const depth = r(); // 0 = 멀다, 1 = 가깝다
        return {
          x: left ? width * (0.03 + r() * 0.1) : width * (0.87 + r() * 0.1),
          y: horizonY + depth * height * 0.5,
          size: 26 + depth * 44,
          opacity: 0.3 + depth * 0.45,
        };
      }),
    };
  }, [stage.id, width, height, horizonY]);

  const full = {
    position: 'absolute' as const,
    top: -inset,
    left: 0,
    right: 0,
    height,
  };

  const art = arenaArtFor(stage.id);
  if (art) {
    return (
      <View style={full} pointerEvents="none">
        {/*
          크기를 직접 재서 넣는다.

          `absoluteFill` + `resizeMode="cover"` 에 맡겼더니 그림이 3배로
          확대돼 나왔다 - 이 프로젝트에서 RN Image 로 세 번째 밟는 함정이라
          이제는 처음부터 계산해서 준다. 홈 배경도 같은 방식이다.
        */}
        {(() => {
          /*
            그림을 **판에 맞춰** 앉힌다. 화면에 맞추는 게 아니다.

            그림 안에 이미 길과 마당이 그려져 있으니, 그려진 판이 계산된 판
            자리에 정확히 겹쳐야 적이 그려진 길 위를 걷고 유닛이 그려진 마당
            안에 선다. 화면 크기가 달라져도 같이 커지고 같이 움직인다.

            크기를 직접 재서 넣는 이유: `absoluteFill` + `resizeMode="cover"`
            에 맡겼더니 그림이 3배로 확대돼 나왔다. 이 프로젝트에서 RN Image
            크기로 밟는 세 번째 함정이라 이제는 처음부터 계산해서 준다.
          */
          const src = Image.resolveAssetSource(art.art);
          const b = art.board;
          /*
            그려진 판이 계산된 판과 같은 크기가 되도록 늘린다.

            다만 그 배율로는 그림이 화면보다 작아질 수 있다 - 그러면 가장자리가
            빈다. 화면을 덮을 만큼은 키운다. 판이 1~2% 커지는 건 안 보인다.
          */
          const fit = board ? board.size / b.size : width;
          const w = Math.max(fit, width, (height * src.width) / src.height);
          const h = (w * src.height) / src.width;
          const cx = board ? board.x + board.size / 2 : width / 2;
          const cy = board ? board.y + board.size / 2 : height / 2;
          return (
            <Image
              source={art.art}
              style={{
                position: 'absolute',
                left: cx - b.cx * w,
                top: cy - b.cy * h,
                width: w,
                height: h,
              }}
              resizeMode="cover"
            />
          );
        })()}
        {/* 그림 위에도 가장자리는 눌러 준다 - 시선이 판에 모여야 한다 */}
        <LinearGradient
          colors={['rgba(6,4,16,0.85)', 'rgba(6,4,16,0.25)', 'transparent'] as const}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: height * 0.2,
          }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(6,4,16,0.6)', 'rgba(6,4,16,0.95)'] as const}
          locations={[0, 0.45, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: height * 0.34,
          }}
        />
      </View>
    );
  }

  return (
    <View style={full} pointerEvents="none">
      {/* 하늘 */}
      <LinearGradient colors={stage.sky} style={StyleSheet.absoluteFill} />

      {/* 별 */}
      <Svg style={StyleSheet.absoluteFill}>
        {stars.map((s, i) => (
          <Circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.s}
            fill="#ffffff"
            opacity={s.o}
          />
        ))}
      </Svg>

      {/* 지평선 광채 - 하늘과 땅 사이를 이어 준다. 없으면 두 색이 딱 잘린다 */}
      <LinearGradient
        colors={
          [
            'transparent',
            `${stage.sceneryColor}00`,
            '#ffffff26',
            'transparent',
          ] as const
        }
        locations={[0, 0.55, 0.82, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: horizonY - height * 0.16,
          height: height * 0.2,
        }}
      />

      {/* 먼 산 */}
      <View style={{ position: 'absolute', left: 0, top: horizonY - 54 }}>
        <Mountains width={width} height={56} color={`${stage.sceneryColor}`} />
      </View>

      {/* 땅 - 하늘보다 어둡고 따뜻하게 눌러 앞으로 나오게 한다 */}
      <LinearGradient
        colors={['rgba(10,7,22,0.42)', 'rgba(6,4,16,0.86)'] as const}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: horizonY,
          bottom: 0,
        }}
      />

      {/* 좌우 나무·기둥 */}
      {props.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.x - p.size / 2,
            top: p.y,
            opacity: p.opacity,
          }}
        >
          <SceneryArt
            kind={stage.scenery}
            size={p.size}
            color={stage.sceneryColor}
          />
        </View>
      ))}

      {/* 가장자리 어둠 - 시선을 판으로 모은다 */}
      <LinearGradient
        colors={['rgba(6,4,16,0.75)', 'transparent'] as const}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: height * 0.16,
        }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(6,4,16,0.9)'] as const}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.26,
        }}
      />
    </View>
  );
});

/**
 * 판이 땅에 놓여 있다는 신호.
 *
 * 판 자체에 그림자(elevation)를 주면 카드가 떠 있는 느낌이 나는데, 이건
 * 바닥에 놓인 무대라서 아래로 퍼지는 그림자가 맞다.
 */
export function ArenaShadow({ width }: { width: number }) {
  const h = width * 0.22;
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        bottom: -h * 0.55,
        width,
        height: h,
      }}
    >
      <Svg width={width} height={h}>
        <Defs>
          <RadialGradient id="as" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#000" stopOpacity={0.6} />
            <Stop offset="0.6" stopColor="#000" stopOpacity={0.22} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={width / 2}
          cy={h / 2}
          rx={width / 2}
          ry={h / 2}
          fill="url(#as)"
        />
      </Svg>
    </View>
  );
}

/**
 * 전투판.
 *
 * 전에는 둥근 사각형 두 개였다 - 밝은 보라 테두리 안에 어두운 보라 사각형.
 * 그러니까 판이 아니라 그냥 '액자'로 읽혔고, 적이 걷는 바깥 띠가 길이라는
 * 것도 안 보였다.
 *
 * 세 가지를 고친다.
 *   1. 길을 점선으로 끊는다. 둥근 사각형 경로에 dash 를 주면 그게 곧
 *      포석 이음새가 된다 - 돌을 하나씩 그리는 것보다 훨씬 싸고 깔끔하다.
 *   2. 판 가장자리에 턱을 준다. 위는 밝고 아래는 어두운 테두리 한 겹이면
 *      평평한 사각형이 '놓인 무대'가 된다.
 *   3. 안쪽 마당은 가운데가 밝고 가장자리가 어둡게. 빛이 위에서 든다.
 */
export function ArenaBoard({
  size,
  road,
  radius,
}: {
  size: number;
  /** 적이 걷는 띠의 폭 (px) */
  road: number;
  radius: number;
}) {
  const midR = radius - road / 2;
  const inR = Math.max(2, radius - road);
  // 포석 한 장의 길이. 길 폭에 비례해야 어느 화면에서나 같은 비율로 보인다.
  const stone = road * 0.62;
  const yard = { x: road, y: road, width: size - road * 2, height: size - road * 2, rx: inR };

  /*
    판을 배경 '위에' 얹지 않고 '안에' 박는다.

    처음엔 판 전체를 불투명한 검보라로 칠했다. 그러니까 배경이 아무리 좋아도
    가운데에 검은 사각형이 하나 떠 있는 꼴이 됐다 - 경계선이 그대로 이음새로
    보인다.

    그래서 바탕을 없앴다. 적이 걷는 띠는 배경의 땅바닥이 그대로 비치도록
    반투명한 그늘만 얹고, 불투명한 건 유닛이 서는 안쪽 마당 하나뿐이다.
    마당은 '땅에 놓인 단'이라 불투명해도 되고, 오히려 그래야 단으로 읽힌다.
  */
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 1. 적이 걷는 길 - 배경의 땅이 비쳐야 한다 */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* 길 그늘 */}
        <Rect
          x={road / 2}
          y={road / 2}
          width={size - road}
          height={size - road}
          rx={midR}
          fill="none"
          stroke="#160f33"
          strokeOpacity={0.42}
          strokeWidth={road}
        />
        {/* 포석 이음새 */}
        <Rect
          x={road / 2}
          y={road / 2}
          width={size - road}
          height={size - road}
          rx={midR}
          fill="none"
          stroke="#0d0922"
          strokeOpacity={0.28}
          strokeWidth={road}
          strokeDasharray={`${stone} 2.5`}
        />
        {/* 길 바깥 가장자리 - 여기까지가 판이라는 것만 알리면 된다 */}
        <Rect
          x={1.25}
          y={1.25}
          width={size - 2.5}
          height={size - 2.5}
          rx={radius}
          fill="none"
          stroke="#cbbdf0"
          strokeOpacity={0.16}
          strokeWidth={2.5}
        />
      </Svg>

      {/* 2. 마당 바닥 그림 - 땅에 놓인 단 */}
      {ARENA_FLOOR ? (
        <Image
          source={ARENA_FLOOR}
          style={{
            position: 'absolute',
            left: yard.x,
            top: yard.y,
            width: yard.width,
            height: yard.height,
            borderRadius: inR,
          }}
          resizeMode="cover"
        />
      ) : null}

      {/* 3. 단의 턱과 그늘 */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="abYard" cx="50%" cy="36%" rx="70%" ry="70%">
            <Stop offset="0" stopColor="#584a94" />
            <Stop offset="0.6" stopColor="#3a2f6d" />
            <Stop offset="1" stopColor="#241c4c" />
          </RadialGradient>
        </Defs>
        {/* 그림이 깔려 있으면 가장자리만 눌러 주고, 없으면 이게 바닥이 된다 */}
        <Rect {...yard} fill="url(#abYard)" opacity={ARENA_FLOOR ? 0.22 : 1} />
        {/* 단이 올라와 있다는 신호 - 위는 밝고 아래는 어둡게 */}
        <Rect
          {...yard}
          fill="none"
          stroke="#0d0922"
          strokeOpacity={0.45}
          strokeWidth={2.5}
        />
        <Rect
          x={yard.x + 1.5}
          y={yard.y + 1.5}
          width={yard.width - 3}
          height={yard.height - 3}
          rx={inR}
          fill="none"
          stroke="#e8c352"
          strokeOpacity={0.22}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}
