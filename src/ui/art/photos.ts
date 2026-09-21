/**
 * 유닛 그림.
 *
 * 제미나이로 뽑은 3D 렌더 한 장이다 (`tools/unit-art-prompts.md` 에 프롬프트가
 * 유닛별로 통째로 들어 있다). 손으로 그린 SVG 로는 로비 아바타 옆에서 계속
 * 납작해 보여서, 그림이 있는 유닛은 그림을 쓴다.
 *
 * **여기 없는 유닛은 예전 SVG 나 이모지로 그대로 나온다.** 한 종씩 늘려 가면
 * 되고, 중간에 섞여 있어도 판이 안 깨진다.
 *
 * 넣는 법:
 *  1. 투명 배경 PNG 를 `assets/units/<아이디>.png` 로 저장한다
 *  2. `python3 tools/trim-units.py` - 둘레 여백을 바짝 자른다. 이걸 안 하면
 *     그림마다 캐릭터 크기가 제각각이라 판에서 어떤 놈은 크고 어떤 놈은 작다
 *  3. 아래 표에 한 줄 더한다. `require` 는 번들러가 빌드할 때 읽으니
 *     **경로를 변수로 만들면 안 된다**
 *  4. 새 파일을 넣었으면 번들러를 껐다 켜야 보인다
 */

export const PHOTOS: Record<string, number> = {
  penguin: require('../../../assets/units/penguin.png'),
};

export function photoFor(defId: string): number | null {
  return PHOTOS[defId] ?? null;
}
