import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * RN 에서 three 를 돌리기 위한 접착제.
 *
 * 여기 있는 우회는 전부 이유가 있어서 들어갔다. 하나라도 빼면 화면이 비거나
 * 앱이 죽으니 주석을 지우지 말 것.
 */

/*
  GLTFParser 는 생성자에서 브라우저를 판별하려고 `navigator.userAgent.match`
  를 부른다. RN 에는 navigator 는 있어도 userAgent 가 없어서 거기서 죽는다
  (`Cannot read property 'match' of undefined`). 빈 문자열이면 된다.
*/
function shimUserAgent() {
  const nav = (globalThis as { navigator?: { userAgent?: string } }).navigator;
  if (!nav || typeof nav.userAgent === 'string') return;
  try {
    nav.userAgent = '';
  } catch {
    Object.defineProperty(nav, 'userAgent', { value: '', configurable: true });
  }
}

/** expo-gl 컨텍스트 위에 three 렌더러를 세운다. */
export function makeRenderer(gl: ExpoWebGLRenderingContext, w: number, h: number) {
  const canvas = {
    width: w,
    height: h,
    style: {},
    clientWidth: w,
    clientHeight: h,
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => proxy,
  };

  /*
    three 는 렌더러를 만들며 기본 프레임버퍼를 기억하려고
    `getParameter(FRAMEBUFFER_BINDING)` 을 부르는데 expo-gl 에 그게 없어 그
    자리에서 던진다. JSI 호스트 객체엔 대입이 안 먹으니 Proxy 로 가로챈다.
  */
  const FRAMEBUFFER_BINDING = 0x8ca6;
  const proxy = new Proxy(gl as unknown as Record<string, unknown>, {
    get(target, prop) {
      if (prop === 'getParameter') {
        return (pname: number) =>
          pname === FRAMEBUFFER_BINDING
            ? null
            : (target.getParameter as (p: number) => unknown)(pname);
      }
      const v = target[prop as string];
      // 호스트 함수는 원본에 묶어 줘야 한다 - 프록시를 this 로 받으면 죽는다
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  });

  /*
    three r163+ 는 `context instanceof WebGLRenderingContext` 면 던진다.
    expo-gl 의 컨텍스트가 그 클래스를 상속해서 걸리니, 만드는 동안만 전역을
    치워 검사를 통과시킨다.
  */
  const g = globalThis as unknown as { WebGLRenderingContext?: unknown };
  const keep = g.WebGLRenderingContext;
  g.WebGLRenderingContext = undefined;
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as unknown as HTMLCanvasElement,
    context: proxy as unknown as WebGLRenderingContext,
    /*
      antialias 를 켜면 three 가 멀티샘플 버퍼에 그린 뒤 옮겨 담는데,
      expo-gl 이 화면에 내보내는 버퍼와 어긋나 아무것도 안 나온다.
    */
    antialias: false,
    alpha: true,
  });
  g.WebGLRenderingContext = keep;

  renderer.setSize(w, h, false);
  renderer.setViewport(0, 0, w, h);
  return renderer;
}

export interface LoadedModel {
  gltf: GLTF;
  skin: THREE.DataTexture;
}

/**
 * GLB 하나에서 모델과 텍스처를 같이 꺼낸다.
 *
 * RN 에는 JPEG 을 풀 방법이 없다 - GLTFLoader 도 expo-three 도 결국 Blob 과
 * <img> 를 찾는데 둘 다 없다. 그래서 빌드할 때 픽셀로 풀어 GLB 버퍼 뒤에
 * 붙여 두고(`tools/shrink-glb.py --strip`) 여기서 그 자리를 그대로 올린다.
 * 파일을 따로 두지 않은 이유: `.rgba` 같은 낯선 확장자는 expo-asset 이
 * 다루다 죽는다.
 */
export async function loadModel(source: number): Promise<LoadedModel> {
  shimUserAgent();
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  const bytes = await new File(asset.localUri!).bytes();
  // 바이트 뭉치가 더 큰 버퍼의 일부일 수 있다. 딱 그만큼만 떼어 준다.
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  // GLB 는 [12바이트 머리][청크]* 다. 청크는 길이·종류·내용 순.
  const view = new DataView(buf);
  let at = 12;
  let json: Record<string, any> = {};
  let binAt = 0;
  while (at < buf.byteLength) {
    const len = view.getUint32(at, true);
    const kind = view.getUint32(at + 4, true);
    at += 8;
    if (kind === 0x4e4f534a) {
      json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, at, len)));
    } else {
      binAt = at;
    }
    at += len;
  }

  const mark = json.extras?.skin;
  const bv = json.bufferViews[mark.bufferView];
  const skin = new THREE.DataTexture(
    new Uint8Array(buf, binAt + bv.byteOffset, bv.byteLength),
    mark.width,
    mark.height,
    THREE.RGBAFormat,
  );
  skin.colorSpace = THREE.SRGBColorSpace;
  // glTF 의 UV 는 위아래가 안 뒤집힌 기준이다
  skin.flipY = false;
  skin.needsUpdate = true;

  return { gltf: await new GLTFLoader().parseAsync(buf as ArrayBuffer, ''), skin };
}

/**
 * 비율을 우리 캐릭터에 맞춘다.
 *
 * 이미지에서 복원한 모델은 몸통이 길쭉하고 머리가 작은 '작은 사람'으로
 * 나온다. 우리 캐릭터는 머리가 크고 몸이 둥근 치비라 그대로 쓰면 로비의
 * 아바타와 딴 캐릭터로 보인다.
 *
 * 뼈의 자리·크기만 고쳐서는 안 된다 - meshy 모션은 뼈마다 이동·회전·크기
 * 트랙을 전부 들고 있어서 매 프레임 원래 값으로 덮어쓴다. 쉬는 자세와
 * 모션 데이터를 **둘 다** 고쳐야 한다.
 *
 * @param torso 척추 마디 간격. 1 이면 그대로, 0.6 이면 몸통을 6할로
 * @param belly 몸통 굵기. 1.5 면 배가 1.5배 불룩해진다
 * @param head  머리 크기. 1 이면 그대로, 1.2 면 1.2배로
 */
export function reshape(
  model: THREE.Object3D,
  clips: THREE.AnimationClip[],
  { torso = 1, belly = 1, head = 1 }: { torso?: number; belly?: number; head?: number },
) {
  if (torso === 1 && belly === 1 && head === 1) return;
  const isSpine = (name: string) => /^spine/i.test(name);
  const isHead = (name: string) => /^head$/i.test(name);

  /*
    배는 아래쪽 척추에만 먹인다.

    뼈의 크기는 자식으로 곱해져 내려간다. 척추가 세 마디인데 세 마디 모두에
    1.48 을 먹였더니 머리에는 1.48³ = 3.2 배가 걸려 얼굴이 납작해졌다.
    그러니 **맨 아래 마디에서 불리고 맨 위 마디에서 되돌린다.** 그러면
    아래 두 마디(배와 가슴)만 굵어지고 목·머리·팔은 그대로다 - 아랫배가
    불룩한 모찌 모양이 된다.
  */
  const chain: THREE.Bone[] = [];
  model.traverse((o) => {
    if ((o as THREE.Bone).isBone && isSpine(o.name)) chain.push(o as THREE.Bone);
  });
  // 뼈의 position 은 부모 기준이라 그걸로는 순서를 못 매긴다. 조상 수로 센다.
  const depth = (b: THREE.Object3D) => {
    let n = 0;
    for (let p = b.parent; p; p = p.parent) if (isSpine(p.name)) n += 1;
    return n;
  };
  chain.sort((a, b) => depth(a) - depth(b));
  const wider = chain[0]?.name ?? '';
  const back = chain.length > 1 ? chain[chain.length - 1].name : '';

  // 쉬는 자세
  model.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    if (isSpine(o.name)) o.position.y *= torso;
    if (o.name === wider) {
      o.scale.x *= belly;
      o.scale.z *= belly;
    }
    if (o.name === back) {
      o.scale.x /= belly;
      o.scale.z /= belly;
    }
    if (isHead(o.name)) o.scale.multiplyScalar(head);
  });

  // 모션 데이터
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const [bone, prop] = track.name.split('.');
      // 값은 [x,y,z, x,y,z, ...] 로 늘어서 있다
      if (prop === 'position' && isSpine(bone)) {
        for (let i = 1; i < track.values.length; i += 3) track.values[i] *= torso;
      } else if (prop === 'scale') {
        // 값은 [x,y,z, x,y,z, ...] 로 늘어서 있다
        const [x, y, z] =
          bone === wider
            ? [belly, 1, belly]
            : bone === back
              ? [1 / belly, 1, 1 / belly]
              : isHead(bone)
                ? [head, head, head]
                : [1, 1, 1];
        if (x === 1 && y === 1 && z === 1) continue;
        for (let i = 0; i < track.values.length; i += 3) {
          track.values[i] *= x;
          track.values[i + 1] *= y;
          track.values[i + 2] *= z;
        }
      }
    }
  }
}

/**
 * 걷기 모션에는 '앞으로 나아가는' 이동이 같이 들어 있다 (루트 모션).
 * 그대로 틀면 캐릭터가 화면 밖으로 걸어 나간다 - 위치는 게임이 정한다.
 */
export function stripRootMotion(model: THREE.Object3D, clip: THREE.AnimationClip) {
  const root = (model.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh)?.skeleton
    ?.bones[0]?.name;
  if (root) clip.tracks = clip.tracks.filter((t) => t.name !== `${root}.position`);
}
