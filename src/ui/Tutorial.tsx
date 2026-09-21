import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { C, inkShadow, shadow } from './theme';

/**
 * 튜토리얼 안내 말풍선.
 *
 * 적이 실시간으로 걸어오는 게임이라 **화면을 막지 않는다.** 어둡게 덮고
 * '확인'을 누르게 하면 그 사이에 정문이 뚫린다 - 읽는 동안에도 판은 굴러야
 * 한다. 그래서 말풍선만 떠 있고 뒤는 그대로 만질 수 있다.
 *
 * 넘어가는 방법도 둘이다. 직접 해 보면 저절로 넘어가고(`done`), 읽고 넘기고
 * 싶으면 말풍선을 누른다. 글을 읽는 사람과 손이 먼저 나가는 사람이 다르다.
 */
export interface GuideStep {
  text: string;
  /** 말풍선이 놓이는 세로 자리 (화면 높이 비율) */
  at: number;
  /** 꼬리가 가리키는 쪽 */
  tail: 'up' | 'down';
  /**
   * 해 보라고 시키는 걸음인가.
   *
   * 시키는 걸음에서는 판을 멈춘다 - 처음 하는 사람이 말을 읽고 손을 움직이는
   * 동안 적이 계속 걸어오면 배우기 전에 쫓긴다.
   *
   * 반대로 '보라'는 걸음(적이 길을 돈다, 골드가 쌓인다)에서는 멈추면 안 된다.
   * 멈춰 놓고 "적이 움직입니다"라고 하면 보여 줄 게 없다.
   */
  pause?: boolean;
  /**
   * 이 걸음에서 열어 둘 조작.
   *
   * 처음 하는 사람에게 판 전체를 열어 두면 시키지도 않은 걸 건드리다
   * 길을 잃는다. 시키는 것 하나만 되게 하고 나머지는 막는다.
   *   'card'  - 아래 카드를 끌어다 놓기
   *   'board' - 판을 눌러 아바타 보내기
   *   'none'  - 읽기만. 아무것도 안 먹는다 (기본)
   */
  allow?: 'card' | 'board' | 'none';
  /**
   * 아바타 위에 붙어 따라다니는가.
   *
   * 판에 대한 이야기는 화면 한 자리에 못 박아 두면 무엇을 가리키는지가
   * 흐려진다. 아바타 위에 얹히면 시선이 판을 벗어나지 않는다.
   */
  follow?: boolean;
}

export const GUIDE: GuideStep[] = [
  {
    text: '아래 카드 세 장을 판으로 끌어다 놓으세요',
    at: 0.62,
    tail: 'down',
    pause: true,
    allow: 'card',
  },
  {
    text: '적은 판을 두르는 길을 돕니다\n유닛은 사거리에 든 적을 칩니다',
    at: 0.2,
    tail: 'down',
    follow: true,
  },
  {
    text: '판의 빈 곳을 누르면 아바타가 그리로 갑니다',
    at: 0.2,
    tail: 'down',
    pause: true,
    follow: true,
    allow: 'board',
  },
  {
    text: '적을 잡으면 골드가 쌓입니다',
    at: 0.2,
    tail: 'down',
    follow: true,
    // 사라고 해 놓고 막으면 안 된다
    allow: 'card',
  },
  /*
    상점과 리롤은 **가르쳐야 한다.**

    카드 석 장만 받고 둘 다 모르면 어느 스테이지도 못 깬다(시뮬레이터 0%).
    둘 중 하나만 알아도 앞 스테이지는 넘길 수 있게 맞춰 뒀다 - 상점은 빠르고
    칸을 아끼는 대신 조합보다 조금 비싸다.
  */
  {
    text: '위 상점에서 골드로 높은 등급을 바로 뽑습니다\n카드는 오른쪽 ↻ 로 다시 뽑을 수 있어요',
    at: 0.62,
    tail: 'down',
    pause: true,
    allow: 'card',
  },
];

export function TutorialBubble({
  step,
  anchorX,
  anchorY,
  screenW,
  onNext,
}: {
  step: GuideStep;
  /** 아바타의 화면 좌표 - `follow` 인 걸음에서 말풍선이 그 위에 붙는다 */
  anchorX?: number | null;
  anchorY?: number | null;
  screenW: number;
  onNext: () => void;
}) {
  /*
    따라다니는 걸음은 '아바타 바로 위'에 놓는다.

    말풍선 높이를 모르니 top 에서 빼는 대신, 위에서 아바타까지를 상자로
    잡고 그 바닥에 붙인다 - 글이 한 줄이든 두 줄이든 아래끝이 늘 같은 자리다.
  */
  const follows = step.follow && anchorY != null;
  const place = follows
    ? { top: 0, height: Math.max(60, anchorY! - 14), justifyContent: 'flex-end' as const }
    : { top: `${step.at * 100}%` as const };

  /*
    좌우도 따라간다.

    가운데 고정으로 두었더니 아바타가 옆으로 걸어가면 꼬리가 엉뚱한 데를
    가리켰다. 말풍선 폭을 재지 않고 옮기려고, 가운데 정렬은 그대로 두고
    화면 중앙에서 아바타까지의 차이만큼 밀어 준다.

    다만 끝까지 밀면 화면 밖으로 나가니 붙잡아 두고, 못 간 만큼은 꼬리만
    더 밀어 아바타를 계속 가리키게 한다.
  */
  const want = follows && anchorX != null ? anchorX - screenW / 2 : 0;
  const limit = Math.max(0, screenW / 2 - 158);
  const dx = Math.max(-limit, Math.min(limit, want));
  const tailDx = Math.max(-70, Math.min(70, want - dx));

  const tail = (
    <View
      style={[
        styles.tail,
        step.tail === 'up' ? styles.tailUp : styles.tailDown,
        { transform: [{ translateX: tailDx }, { rotate: '45deg' }] },
      ]}
    />
  );

  return (
    <View style={[styles.wrap, place]} pointerEvents="box-none">
      <Pressable
        onPress={onNext}
        style={({ pressed }) => [
          styles.bubble,
          { transform: [{ translateX: dx }] },
          pressed && { opacity: 0.8 },
        ]}
      >
        {step.tail === 'up' ? tail : null}
        <Text style={styles.text}>{step.text}</Text>
        <Text style={styles.hint}>눌러서 넘기기</Text>
        {step.tail === 'down' ? tail : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  bubble: {
    maxWidth: 300,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.goldDeep,
    backgroundColor: 'rgba(12,8,30,0.94)',
    alignItems: 'center',
    ...shadow(0.6, 12, 6),
  },
  text: { color: C.text, fontSize: 14, lineHeight: 21, textAlign: 'center', ...inkShadow },
  hint: { color: C.textFaint, fontSize: 10.5, lineHeight: 16, marginTop: 5 },
  /** 꼬리 - 네모를 45도 돌려 만든다 (삼각형 하나 때문에 SVG 를 물리지 않는다) */
  tail: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: 'rgba(12,8,30,0.94)',
    borderColor: C.goldDeep,
  },
  tailDown: { bottom: -8, borderRightWidth: 1.5, borderBottomWidth: 1.5 },
  tailUp: { top: -8, borderLeftWidth: 1.5, borderTopWidth: 1.5 },
});
