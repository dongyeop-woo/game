import * as Haptics from 'expo-haptics';

/**
 * 진동. 이 게임의 타격감은 소리가 아니라 여기서 나온다.
 *
 * 세기를 층으로 나눈다. 전부 같은 세기면 무엇이 일어났는지 손으로 구분이 안 된다.
 *  - 때릴 때  : 제일 약하게. 대신 칠 때마다
 *  - 잡을 때  : 한 단계 세게, 0.25초에 한 번까지
 *  - 성문·보스: 드물고 무거운 일이라 가장 세게
 *
 * 시뮬레이터에서는 아무 일도 안 일어난다 - 확인은 실기기로 해야 한다.
 */

export type Buzz = 'hit' | 'kill' | 'boss' | 'gate' | 'place' | 'combine' | 'win' | 'lose';

/**
 * 이 시간(밀리초) 안에는 다시 안 울린다.
 *
 * 타격은 **칠 때마다** 울린다. 다만 60밀리초 밑으로는 의미가 없다 - 탭틱 엔진이
 * 그보다 빨리 오는 건 뭉쳐 버려서, 더 보내 봐야 배터리만 먹는다.
 */
const GAP: Record<Buzz, number> = {
  hit: 60,
  kill: 250,
  boss: 0,
  gate: 400,
  place: 60,
  combine: 0,
  win: 0,
  lose: 0,
};

const last = new Map<Buzz, number>();
let on = true;

/** 설정의 진동 켜기/끄기 */
export function setHapticsOn(next: boolean) {
  on = next;
}

export function buzz(kind: Buzz) {
  if (!on) return;
  const now = Date.now();
  if (GAP[kind] && now - (last.get(kind) ?? 0) < GAP[kind]) return;
  last.set(kind, now);

  // 진동 하나 때문에 게임이 멈추면 안 된다 - 실패는 그냥 삼킨다
  const run = (p: Promise<void>) => void p.catch(() => {});
  switch (kind) {
    case 'hit':
      return run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    case 'kill':
      return run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    case 'place':
      return run(Haptics.selectionAsync());
    case 'combine':
      return run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    case 'boss':
      return run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    case 'gate':
      return run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
    case 'win':
      return run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    case 'lose':
      return run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  }
}
