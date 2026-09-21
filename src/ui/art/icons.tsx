import React from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

/**
 * 메뉴 아이콘.
 *
 * 이모지를 쓰다가 바꿨다. 이모지는 📖 갈색, 🔮 보라, 🛒 회색처럼 각자 색을
 * 들고 있어서 여섯 개를 나란히 놓으면 메뉴가 흩어져 보인다. 아이콘은 한
 * 가족처럼 보여야 하고, 그러려면 선 굵기와 색이 같아야 한다.
 *
 * 그림 파일로 뽑지 않은 이유: 아이콘은 이미지 생성 모델이 제일 못하는 종류다.
 * 여섯 장을 따로 뽑으면 굵기와 디테일이 제각각이 되어 이모지보다 더 산만해진다.
 * 도형이 단순하니 패스로 직접 그리는 편이 낫다 - 굵기를 상수 하나로 묶으면
 * 세트가 저절로 맞고, 벡터라 어느 크기에서도 선명하다.
 *
 * 좌표는 전부 24x24 기준이다.
 */

export type IconName =
  | 'codex'
  | 'summon'
  | 'shop'
  | 'daily'
  | 'friends'
  | 'settings'
  | 'gate'
  | 'coin'
  | 'chevron'
  | 'back'
  | 'mail'
  | 'reroll';

/**
 * 선 굵기는 여기 하나로 묶는다 - 이게 갈리면 세트가 무너진다.
 *
 * 1.9 로 시작했는데 배경이 밤하늘이라 가는 선이 묻혔다. 굵혀서 띄운다.
 */
const SW = 2.3;

export function MenuIcon({
  name,
  size = 20,
  color = '#ffffff',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const line = {
    stroke: color,
    strokeWidth: SW,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'codex' ? (
        <>
          {/* 펼친 책 - 가운데 접힘선이 있어야 '책'으로 읽힌다 */}
          <Path d="M12 7.2C10.4 5.7 8 5.2 4.6 5.7v12c3.4-.5 5.8 0 7.4 1.5" {...line} />
          <Path d="M12 7.2c1.6-1.5 4-2 7.4-1.5v12c-3.4-.5-5.8 0-7.4 1.5" {...line} />
          <Path d="M12 7.2v11.5" {...line} />
        </>
      ) : null}

      {name === 'summon' ? (
        <>
          {/* 수정구 + 받침 */}
          <Circle cx="12" cy="10" r="5.8" {...line} />
          <Path d="M7.6 17.2 6.4 20h11.2l-1.2-2.8" {...line} />
          {/*
            처음엔 안쪽에 호를 그렸는데 작게 줄이면 눈처럼 보여 얼굴이 됐다.
            유리라는 신호는 왼쪽 위 점 하나면 충분하다.
          */}
          <Circle cx="9.6" cy="7.9" r="1.15" fill={color} stroke="none" />
        </>
      ) : null}

      {name === 'shop' ? (
        <>
          {/*
            봉투가 휴지통으로 읽혔다. 손잡이를 크게 벌려 위로 세우고, 몸통에
            세로 접힘선을 넣어 '종이 봉투'라는 걸 만든다.
          */}
          <Path d="M4.9 7.6h14.2l-1.2 12a1.5 1.5 0 0 1-1.5 1.3H7.6a1.5 1.5 0 0 1-1.5-1.3z" {...line} />
          <Path d="M8.3 7.6V5.9a3.7 3.7 0 0 1 7.4 0v1.7" {...line} />
          <Path d="M9.6 11.2v6.4M14.4 11.2v6.4" {...line} />
        </>
      ) : null}

      {name === 'daily' ? (
        <>
          {/* 클립보드 + 체크 */}
          <Path
            d="M8.6 5H6.6A1.6 1.6 0 0 0 5 6.6v11.8A1.6 1.6 0 0 0 6.6 20h10.8a1.6 1.6 0 0 0 1.6-1.6V6.6A1.6 1.6 0 0 0 17.4 5h-2"
            {...line}
          />
          <Rect x="8.6" y="3.1" width="6.8" height="3.6" rx="1.3" {...line} />
          <Path d="M8.8 13.2 11 15.4l4.2-4.4" {...line} />
        </>
      ) : null}

      {name === 'friends' ? (
        <>
          {/* 앞사람 + 뒤에 반쯤 걸친 사람 */}
          <Circle cx="9.6" cy="9" r="3.3" {...line} />
          <Path d="M3.8 19.6a5.8 5.8 0 0 1 11.6 0" {...line} />
          <Circle cx="17.2" cy="9.9" r="2.4" {...line} />
          <Path d="M16.8 19.6h3.6a3.9 3.9 0 0 0-2.8-3.7" {...line} />
        </>
      ) : null}

      {name === 'mail' ? (
        <>
          {/* 봉투 - 덮개 선이 있어야 상자가 아니라 편지로 읽힌다 */}
          <Path d="M4 6.5h16v11H4z" {...line} />
          <Path d="M4.6 7.2 12 12.8l7.4-5.6" {...line} />
        </>
      ) : null}

      {name === 'back' ? (
        /* 되돌아가기 - 꺾쇠를 왼쪽으로 */
        <Path d="M14.5 5.5 8 12l6.5 6.5" {...line} />
      ) : null}

      {name === 'chevron' ? (
        /* 꺾쇠 - '❯' 글자는 글꼴마다 두께와 자리가 달라 제멋대로 보인다 */
        <Path d="M9.5 5.5 16 12l-6.5 6.5" {...line} />
      ) : null}

      {name === 'gate' ? (
        <>
          {/* 방패 - 성문 내구도. 가운데 세로선이 있어야 문짝으로도 읽힌다 */}
          <Path d="M12 3.4 19.2 6.2v5.1c0 4.1-2.9 7.2-7.2 8.5-4.3-1.3-7.2-4.4-7.2-8.5V6.2z" {...line} />
          <Path d="M12 7.6v8.2" {...line} />
        </>
      ) : null}

      {name === 'coin' ? (
        <>
          {/*
            동전 - 테두리 원에 별 하나.

            처음엔 원 안에 원을 넣었더니 과녁으로 보였다. 가운데에 새김이
            있어야 '무늬가 박힌 금속 조각'으로 읽힌다 (`assets/topup/coin.png`
            와 같은 별이다).
          */}
          <Circle cx="12" cy="12" r="8" {...line} />
          <Path
            d="M12 7.9 13.3 11h3.2l-2.6 2 1 3.1L12 14.2 9.1 16.1l1-3.1-2.6-2h3.2z"
            {...line}
          />
        </>
      ) : null}

      {name === 'reroll' ? (
        <>
          {/*
            다시 굴리기 - 끊긴 원 + 화살촉.

            처음엔 주사위를 그렸는데 19px 에서 눈이 뭉개져 그냥 네모로 보였다.
            '한 바퀴 돌린다'는 뜻은 화살 달린 원이 제일 빨리 읽힌다.
          */}
          <Path d="M19.2 12a7.2 7.2 0 1 1-2.1-5.1" {...line} />
          <Path d="M17.6 2.9v3.9h-3.9" {...line} />
        </>
      ) : null}

      {name === 'settings' ? (
        <>
          {/* 톱니 - 이빨을 방사형 짧은 선으로 둔다. 작은 크기에서 가장 잘 읽힌다. */}
          <Circle cx="12" cy="12" r="3.1" {...line} />
          <Circle cx="12" cy="12" r="6.1" {...line} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            const c = Math.cos(a);
            const s = Math.sin(a);
            return (
              <Path
                key={i}
                d={`M${12 + c * 6.1} ${12 + s * 6.1}L${12 + c * 8.6} ${12 + s * 8.6}`}
                {...line}
              />
            );
          })}
        </>
      ) : null}
    </Svg>
  );
}

/**
 * 모드 카드에 얹는 육각 배지.
 *
 * 이모지(⚔️🛡️📖)를 쓰다가 바꿨다. 이모지는 자기 색을 들고 있어서 카드 그림
 * 위에 얹으면 따로 논다. 레퍼런스처럼 육각형 안에 단색 심볼을 넣으면 배경이
 * 무엇이든 같은 무게로 읽힌다.
 */
export type ModeGlyph = 'duel' | 'shield' | 'book';

export function ModeBadge({
  glyph,
  size = 44,
  color = '#ffffff',
}: {
  glyph: ModeGlyph;
  size?: number;
  color?: string;
}) {
  const line = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* 육각 판 - 어둡게 깔아야 그림 위에서도 심볼이 뜬다 */}
      <Polygon
        points="12.00,1.00 2.47,6.50 2.47,17.50 12.00,23.00 21.53,17.50 21.53,6.50"
        fill="rgba(10,8,26,0.66)"
        stroke="rgba(255,255,255,0.42)"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {glyph === 'duel' ? (
        <>
          {/* 엇갈린 검 두 자루 */}
          <Path d="M7.6 16.6 15.2 9" {...line} />
          <Path d="M16.4 16.6 8.8 9" {...line} />
          <Path d="M14.6 7.4h2.4v2.4" {...line} />
          <Path d="M9.4 7.4H7v2.4" {...line} />
          <Path d="M6.6 17.6l1.6-1.6M17.4 17.6l-1.6-1.6" {...line} />
        </>
      ) : null}

      {glyph === 'shield' ? (
        <Path d="M12 5.4 17.6 7.6v4.2c0 3.2-2.2 5.6-5.6 6.8-3.4-1.2-5.6-3.6-5.6-6.8V7.6z" {...line} />
      ) : null}

      {glyph === 'book' ? (
        <>
          <Path d="M12 8.4c-1.2-1.1-3-1.5-5.4-1.1v9c2.4-.4 4.2 0 5.4 1.1" {...line} />
          <Path d="M12 8.4c1.2-1.1 3-1.5 5.4-1.1v9c-2.4-.4-4.2 0-5.4 1.1" {...line} />
          <Path d="M12 8.4v9" {...line} />
        </>
      ) : null}
    </Svg>
  );
}

// ------------------------------------------------------------- 등급 보석

/**
 * 등급 아이콘.
 *
 * 상점 왼쪽 레일에 색깔 네모를 다섯 개 놓았더니 아이콘이 아니라 물감 견본으로
 * 보였다. 레퍼런스(와일드리프트)는 칸마다 뜻이 있는 그림을 쓴다.
 *
 * 등급마다 다른 그림을 그리면 다섯 개가 흩어지니, 하나의 보석을 '깎는 면'만
 * 늘려 간다 - 원 → 마름모 → 육각 → 왕관 → 별. 색은 등급 그라데이션이 맡고
 * 여기서는 실루엣만 낸다.
 */
export function TierGem({
  tier,
  size = 26,
  color = '#ffffff',
}: {
  tier: string;
  size?: number;
  color?: string;
}) {
  const P: Record<string, string> = {
    // 굴리지 않은 조약돌
    common: 'M12 4.6a7.4 7.4 0 1 1 0 14.8 7.4 7.4 0 0 1 0-14.8z',
    // 마름모 - 처음으로 '깎았다'는 신호
    rare: 'M12 3.6 20.4 12 12 20.4 3.6 12z',
    // 육각 - 면이 늘어난다
    epic: 'M12 3.4l7.4 4.3v8.6L12 20.6 4.6 16.3V7.7z',
    // 왕관 - 여기서부터는 보석이 아니라 지위다
    legend: 'M4 17.6 5.4 6.8l4.1 3.4L12 5.2l2.5 5 4.1-3.4 1.4 10.8z',
    // 별 - 마지막 하나뿐인 등급
    mythic: 'M12 3.2l2.7 5.9 6.4.7-4.8 4.3 1.3 6.3L12 17.2l-5.6 3.2 1.3-6.3-4.8-4.3 6.4-.7z',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={P[tier] ?? P.common} fill={color} />
    </Svg>
  );
}

/** 자물쇠. 🔒 이모지는 혼자 노란 플라스틱이라 어디에 놓아도 임시로 보인다. */
export function LockGlyph({ size = 18, color = '#8579b0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x="5.6" y="10.4" width="12.8" height="9.2" rx="2.4" fill={color} />
    </Svg>
  );
}

// ------------------------------------------------------------------ 재화

/**
 * 골드 동전.
 *
 * 💰 이모지를 쓰다가 패스로 그렸고, 지금은 그림 파일이다.
 *
 * 이모지는 그림이 복잡해서(주머니 + 끈 + 달러 표시) 작게 줄이면 뭉개지고
 * 크게 두면 숫자보다 먼저 눈에 들었다. 그래서 단순한 원판을 패스로 그렸는데,
 * 충전 창에 3D 동전 묶음이 들어오고 나니 이번엔 **같은 재화인데 둘이 다른
 * 물건**으로 보였다 - 한쪽은 두툼한 별 동전, 한쪽은 밋밋한 원판.
 *
 * 그래서 같은 렌더로 뽑은 한 닢을 쓴다. 아이콘을 그림으로 두는 건 보통
 * 피하지만(크기마다 흐려진다) 이건 19~21px 한 크기로만 쓰고, 128px 원본에서
 * 줄이는 거라 선명하다. 실제 크기로 확인했다.
 */
export function CoinIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      source={require('../../../assets/topup/coin.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
