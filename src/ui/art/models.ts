/**
 * 3D 모델.
 *
 * meshy 에서 뽑아 `tools/shrink-glb.py --strip` 을 거친 GLB 다. 여기 등록된
 * 캐릭터는 평면 그림 대신 이 모델로 그려진다.
 *
 * `require` 는 번들러가 빌드할 때 읽는다 - **경로를 변수로 만들면 안 된다.**
 * 파일을 새로 넣었으면 번들러를 껐다 켜야 보인다.
 *
 * 규격과 뽑는 법은 `tools/unit-render-prompts.md` 에 있다.
 */

export interface ModelSet {
  /** 가만히 서 있는 모습. 반드시 있어야 한다 */
  idle: number;
  /** 때리는 순간 */
  attack?: number;
  /** 걷기. 주인공과 적만 쓴다 */
  walk?: number;
  /**
   * 비율 보정. 이미지에서 복원한 모델은 몸통이 길쭉하고 머리가 작은
   * '작은 사람'으로 나온다. 우리 캐릭터는 머리가 크고 몸이 둥근 치비라
   * 그대로 두면 로비의 아바타와 딴 캐릭터로 보인다.
   *
   * `torso` 는 척추 마디 간격(0.6 이면 몸통 6할), `belly` 는 몸통 굵기,
   * `head` 는 머리 크기(1.2 면 1.2배). 기준은 `assets/avatar/mochi.png` 다.
   */
  torso?: number;
  belly?: number;
  head?: number;
}

/*
  아바타와 유닛은 **다른 캐릭터다.** 이름이 비슷해서 헷갈리기 쉽다:
    아바타 `mochi` (흰쥐 견습생) - 로비에 서 있고 판에서는 주인공이 된다.
                                    걸어 다니지만 **공격은 안 한다**
    유닛   `mouse` (생쥐 견습생)   - 판에 배치돼서 적을 친다

  그래서 필요한 모션이 다르다. 아바타는 idle + walk, 유닛은 idle + attack.
  한쪽 모델을 다른 쪽에 물리면 안 된다.
*/
/*
  전투 주인공은 3D 로 둔다.

  발열 때문에 로비와 같은 그림(PNG)으로 바꿔 봤는데, 판 위에서 눈에 띄게
  싸구려가 돼서 되돌렸다. 발열은 다른 데서 줄인다(적·이펙트 그리기).
*/
export const MODELS: Record<string, ModelSet> = {
  mochi: {
    idle: require('../../../assets/units/mochi/idle.glb'),
    walk: require('../../../assets/units/mochi/walk.glb'),
    torso: 0.6,
    // 몸통을 얼굴 폭에 맞춘 값 (얼굴 0.649 / 몸통 0.440)
    belly: 1.48,
    head: 1.2,
  },
};
