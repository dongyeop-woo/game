/**
 * 공격 이펙트 그림.
 *
 * 흰색으로 그려 두고 색은 코드가 입힌다 (`brush.ts` 의 색 필터). 그림 한 장이 유닛
 * 수만큼의 색으로 쓰인다 - 색깔로 뽑았으면 불티만 열다섯 장이 필요했다.
 *
 * 방향이 있는 그림(날아가는 것)은 **오른쪽을 향해** 그려져 있다. 코드는
 * 각도만 돌리지 그림을 뒤집지 않는다.
 *
 * 규격과 프롬프트는 `tools/fx-art-prompts.md` 에 있다.
 * 새 파일을 넣었으면 번들러를 껐다 켜야 보인다.
 */

export interface FxSprite {
  src: number;
  /** 세로/가로 - 늘릴 때 비율을 지키려면 필요하다 */
  ratio: number;
}

/** 여러 장이 가로로 이어 붙은 띠. 그리는 쪽이 칸을 골라 쓴다 */
export interface FxStrip extends FxSprite {
  /** 몇 칸인가 */
  frames: number;
}

/**
 * 총구 화염.
 *
 * 고양이 키트는 **총구 화염을 따로 씌우는 걸 전제**로 만들어져 있다. 캐릭터의
 * 사격 동작은 총이 반동으로 튀는 게 전부라, 이걸 안 씌우면 판 크기에서
 * 쏘는 건지 서 있는 건지 구분이 안 된다.
 *
 * 밝은 고리가 왼쪽(총구), 불줄기가 오른쪽(앞)으로 뻗는다 - 오른쪽을 보는
 * 유닛에 그대로 맞는다.
 */
export const MUZZLE: FxStrip = {
  src: require('../../../assets/fx/muzzle.png'),
  ratio: 72 / 104,
  frames: 8,
};

/** 날아가는 총알 */
export const BULLET: FxSprite = {
  src: require('../../../assets/fx/bullet.png'),
  ratio: 57 / 96,
};

export const FX: Partial<Record<'fireball' | 'arrow' | 'beam' | 'breath' | 'comet', FxSprite>> = {
  fireball: { src: require('../../../assets/fx/fireball.png'), ratio: 325 / 767 },
  /*
    화살은 **색을 입히지 않는다.**

    나무 대와 쇠 촉이 이미 제 색을 갖고 있어서, 유닛 색을 덧씌우면 탁해진다.
    흰색으로 뽑아 색을 입히는 규칙은 빛·불티처럼 색이 없는 것에만 쓴다.
  */
  arrow: { src: require('../../../assets/fx/arrow.png'), ratio: 106 / 911 },
};

/**
 * 적이 걷는 띠.
 *
 * 한 종류가 가로로 열두 칸이다 (`tools/bake-kit.py --motions Walk:12 --cols 12`).
 * 그림은 **왼쪽을 보고** 걷는다 - 트랙 오른쪽 변에서는 그리는 쪽이 뒤집는다.
 */
export const ENEMY_WALK: Record<string, number> = {
  skeleton: require('../../../assets/enemies/skeleton.png'),
  ghost: require('../../../assets/enemies/ghost.png'),
  zombie: require('../../../assets/enemies/zombie.png'),
  orc: require('../../../assets/enemies/orc.png'),
  lich: require('../../../assets/enemies/lich.png'),
};
