/**
 * 구운 3D 동작 그림.
 *
 * 판 위 유닛을 실시간 3D 로 돌리면 한 마리당 CPU 를 9%p 씩 먹는다 (시뮬레이터에서
 * 여덟 마리에 31fps / 118%). 모델이 무거워서가 아니다 - 삼각형 5천, 뼈 28개로 이미
 * 모바일 예산 안이다. 자바스크립트가 매 프레임 그래픽 명령을 건네는 길이 비싸서,
 * 마릿수에 그대로 비례한다.
 *
 * 그래서 **미리 구워 둔다.** 3D 로 만든 동작을 여러 장으로 떠 두고 판에서는 넘겨
 * 가며 보여 준다. 움직임은 3D 그대로인데 값은 그림 한 장이고, 넘기는 일도 네이티브
 * 애니메이션이라 JS 는 놀고 있는다.
 *
 * 굽는 도구는 `tools/bake-sprites.py` 다. 각도는 0.5 라디안(3/4 시점)으로 고정해
 * 두었다 - 정면은 밋밋하고, 옆으로 더 돌리면 모자챙에 얼굴이 가린다.
 * 왼쪽을 보는 그림은 따로 굽지 않는다. 그리는 쪽에서 좌우를 뒤집는다.
 *
 * 새 그림을 넣었으면 번들러를 껐다 켜야 보인다.
 */

export type SpriteMotion = 'idle' | 'walk' | 'attack';

export interface SpriteSet {
  src: number;
  /** 한 동작이 몇 장인가 */
  frames: number;
  /**
   * 한 줄에 몇 장씩 놓였는가.
   *
   * 장수가 많으면 가로로만 늘어놓을 수 없다 - 그림 한 변이 4096 을 넘으면 기기가
   * 못 올린다. 접어서 격자로 굽고(`tools/bake-sprites.py --cols`), 여기 적어 둔
   * 열 수로 찾아간다.
   */
  cols: number;
  /** 세로로 놓인 동작 순서 */
  motions: SpriteMotion[];
  /** 한 바퀴 도는 시간(밀리초) */
  loopMs: number;
  /** 때린 뒤 공격 동작을 보여 주는 시간(밀리초). 없으면 대기만 돈다 */
  attackMs?: number;
}

/*
  고양이 디펜스 키트를 구운 것 (`tools/bake-kit.py`).

  키트는 동작마다 PNG 를 낱장으로 준다 - 대기 20장, 사격 10장. 그대로는 못
  쓰니 동작마다 12장으로 솎아 한 장에 격자로 구웠다. 한 칸 96픽셀, 한 줄 6칸,
  대기 두 줄 + 사격 두 줄이다.

  **등급 순서대로 놓았다.** C1~C5 는 작은 주황 고양이가 권총을, C6~C10 은 회색
  고양이가 큰 총을, C11~C15 는 흰 고양이가 소총을 든다. 낮은 등급일수록
  장비가 초라해 보이게 짝지어 두면 등급이 그림으로 읽힌다.
*/
export const SPRITES: Record<string, SpriteSet> = {
  mouse: {
    src: require('../../../assets/units/cat/C1.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  penguin: {
    src: require('../../../assets/units/cat/C2.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  owl: {
    src: require('../../../assets/units/cat/C3.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  toad: {
    src: require('../../../assets/units/cat/C4.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  rhino: {
    src: require('../../../assets/units/cat/C5.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  wolf: {
    src: require('../../../assets/units/cat/C6.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  fox: {
    src: require('../../../assets/units/cat/C7.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  crow: {
    src: require('../../../assets/units/cat/C8.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  turtle: {
    src: require('../../../assets/units/cat/C9.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  bear: {
    src: require('../../../assets/units/cat/C10.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  ghost: {
    src: require('../../../assets/units/cat/C11.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  serpent: {
    src: require('../../../assets/units/cat/C12.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  griffin: {
    src: require('../../../assets/units/cat/C13.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  wyrm: {
    src: require('../../../assets/units/cat/C14.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
  sage: {
    src: require('../../../assets/units/cat/C15.png'),
    frames: 12,
    cols: 6,
    motions: ['idle', 'attack'],
    loopMs: 1000,
    attackMs: 380,
  },
};

export function spriteFor(defId: string): SpriteSet | null {
  return SPRITES[defId] ?? null;
}

/**
 * 아바타 그림.
 *
 * 열둘은 판에 서는 유닛 시트를 그대로 가리킨다 - 같은 그림이라 자산이 안 늘고,
 * 프로필과 판 위가 같은 고양이로 읽힌다. 복서와 수호냥 둘만 따로 구웠다
 * (키트의 `CatBoxing` / `Cat Guardian`). 대기만 있으면 되니 한 줄뿐이다.
 */
const IDLE_ONLY = { frames: 12, cols: 6, motions: ['idle'] as SpriteMotion[], loopMs: 1000 };

export const AVATAR_SPRITES: Record<string, SpriteSet> = {
  // 일반
  mochi: SPRITES.mouse,
  soot: SPRITES.penguin,
  pebble: SPRITES.owl,
  hoot: SPRITES.toad,
  // 희귀
  ember_fox: SPRITES.rhino,
  snowbun: SPRITES.wolf,
  inkwing: SPRITES.fox,
  mossling: SPRITES.crow,
  // 영웅
  flamewolf: SPRITES.turtle,
  starfawn: SPRITES.bear,
  tidecall: SPRITES.serpent,
  // 전설 - 판에 안 서는 둘을 여기 둔다. 등급이 높을수록 눈에 띄어야 한다
  goldgriff: { src: require('../../../assets/avatar/cat/boxer.png'), ...IDLE_ONLY },
  umbra: { src: require('../../../assets/avatar/cat/guardian.png'), ...IDLE_ONLY },
  // 신화
  astra: SPRITES.sage,
};

export function avatarSpriteFor(id: string): SpriteSet | null {
  return AVATAR_SPRITES[id] ?? null;
}
