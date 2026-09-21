import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import { loadModel, makeRenderer, reshape, stripRootMotion } from './gl';
import { MODELS } from './models';

/**
 * 판 위의 3D 유닛들.
 *
 * **GLView 는 하나만 쓴다.** 유닛마다 하나씩 만들면 GL 컨텍스트가 열여섯
 * 개가 되어 못 버틴다. 한 장면에 다 넣고 위치만 각자 준다.
 *
 * 좌표는 판 픽셀 그대로다 - 배치는 이미 2D 쪽이 계산해 놨으니 그걸 그대로
 * 받아서 직교 카메라로 1:1 로 비춘다. 원근을 주면 가장자리 유닛이 기울어
 * 칸과 어긋나 보인다.
 */

export interface BoardUnit {
  key: number;
  defId: string;
  /** 판 왼쪽 위 기준 픽셀. 발이 닿을 자리 */
  left: number;
  top: number;
  /** 이 유닛이 차지할 높이(픽셀) */
  size: number;
  /**
   * 어느 쪽을 보는가 (라디안).
   *
   * 판을 내려다보는 화면이라 좌우만으로는 부족하다 - 위쪽을 가리키면
   * 등을 보여야 한다. 0 이 화면 아래(카메라 쪽), 0.5π 가 오른쪽,
   * π 가 위쪽, -0.5π 가 왼쪽이다. `Math.atan2(dx, dy)` 를 그대로 넣으면 된다.
   */
  turn?: number;
  /** 지금 틀 모션. 없으면 idle */
  motion?: Motion;
}

export type Motion = 'idle' | 'walk' | 'attack';

/** 주인공은 매 프레임 움직이므로 목록과 따로 받는다 */
const HERO_KEY = -1;

/**
 * 3D 를 다시 그리는 빈도.
 *
 * 판에서 제일 무거운 게 이 GLView 다 - 껐다 켜 보면 CPU 가 눈에 띄게 갈린다.
 * 치비 캐릭터의 숨쉬기·걷기는 60 으로 돌리나 30 으로 돌리나 눈에 거의 같은데,
 * 그리는 횟수를 반으로 줄이면 그만큼 덜 달아오른다.
 */
const MODEL_FPS = 30;

interface Puppet {
  mixer: THREE.AnimationMixer;
  acts: Partial<Record<Motion, THREE.AnimationAction>>;
  now: Motion;
}

interface Live {
  scene: THREE.Scene;
  mixers: Map<number, Puppet>;
  nodes: Map<number, THREE.Object3D>;
  /** defId 별로 한 번만 읽어 두고 복제해 쓴다 */
  protos: Map<string, { scene: THREE.Object3D; clips: Partial<Record<Motion, THREE.AnimationClip>> }>;
  want: BoardUnit[];
  /** 판 한 변의 절반. 화면 좌표를 카메라 좌표로 옮길 때 쓴다 */
  half: number;
}

export function BoardModels({
  size,
  units,
  hero,
}: {
  size: number;
  units: BoardUnit[];
  /** 주인공. 매 프레임 자리가 바뀌니 장면을 다시 맞추지 않고 위치만 옮긴다 */
  hero?: Omit<BoardUnit, 'key'>;
}) {
  const live = useRef<Live | null>(null);
  const raf = useRef(0);
  const latest = useRef(units);
  latest.current = units;
  const heroNow = useRef(hero);
  heroNow.current = hero;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // 목록이 바뀌면 장면을 맞춘다 (컨텍스트는 그대로 두고 내용만 갈아 끼운다)
  useEffect(() => {
    if (live.current) void sync(live.current, units, heroNow.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, hero?.defId]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const renderer = makeRenderer(gl, w, h);

    const scene = new THREE.Scene();
    /*
      직교 카메라를 판 픽셀에 그대로 맞춘다. 가운데가 0 이고 위가 +y 이니
      화면 좌표(y 가 아래로 증가)를 넣을 때 부호를 뒤집어 준다.
    */
    const camera = new THREE.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, -500, 500);
    camera.position.z = 100;

    const state: Live = {
      scene,
      mixers: new Map(),
      nodes: new Map(),
      protos: new Map(),
      want: [],
      half: size / 2,
    };
    live.current = state;
    await sync(state, latest.current, heroNow.current);

    let last = Date.now();
    let drew = 0;
    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      const now = Date.now();
      // 60 으로 오는 신호 중 절반만 그린다 (4ms 여유는 신호가 흔들리기 때문)
      if (now - drew < 1000 / MODEL_FPS - 4) return;
      drew = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      for (const p of state.mixers.values()) p.mixer.update(dt);

      // 주인공은 늘 움직인다. 장면을 다시 맞추지 않고 자리만 옮긴다.
      const h = heroNow.current;
      const hn = state.nodes.get(HERO_KEY);
      if (h && hn) {
        place(hn, h, state.half, false);
        /*
          고개는 **돌려서** 맞춘다.

          바로 꽂아 넣으면 손을 뗄 때 정면으로 툭 끊긴다. 남은 각도의 일부씩
          좁히면 빠르게 돌면서도 끝이 부드럽다.
        */
        const want = h.turn ?? 0;
        hn.rotation.y += shortest(want - hn.rotation.y) * Math.min(1, dt * 9);
        setMotion(state.mixers.get(HERO_KEY), h.motion ?? 'idle');
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      renderer.render(scene, camera);
      /*
        매 프레임 값을 한 번 받아 온다. expo-gl 은 GL 명령을 모아 두는데
        endFrameEXP 만으로는 안 넘어간다 - 이게 없으면 첫 프레임에서 화면이
        얼어붙는다. flush 와 finish 로도 해 봤지만 둘 다 안 됐다.
      */
      gl.getError();
      gl.endFrameEXP();
    };
    loop();
  };

  return (
    <View style={[styles.root, { width: size, height: size }]} pointerEvents="none">
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

/** 각도 차이를 -π~π 로 접는다 - 안 접으면 먼 쪽으로 한 바퀴 돈다 */
function shortest(d: number): number {
  return Math.atan2(Math.sin(d), Math.cos(d));
}

function place(node: THREE.Object3D, u: Omit<BoardUnit, 'key'>, half: number, snap = true) {
  node.position.set(u.left - half, half - u.top, 0);
  /*
    방향은 **돌려서** 준다. 좌우로 뒤집으면(scale.x = -1) 정면을 보는 모델은
    몸이 그대로인 채 지팡이와 꼬리만 반대로 가서, 왼쪽으로 걷는데 오른쪽을
    보는 것처럼 읽힌다. 평면 그림이던 시절의 방식이라 3D 에는 안 맞는다.
  */
  if (snap) node.rotation.y = u.turn ?? 0;
  node.scale.setScalar(u.size);
}

/**
 * 모션을 바꾼다. 딱 끊어 바꾸면 자세가 튀니 짧게 겹쳐 넘긴다.
 * 없는 모션을 달라고 하면 그냥 두는 게 낫다 - 멈춰 서는 것보다 낫다.
 */
function setMotion(p: Puppet | undefined, want: Motion) {
  if (!p || p.now === want) return;
  const next = p.acts[want];
  if (!next) return;
  p.acts[p.now]?.fadeOut(0.18);
  next.reset().fadeIn(0.18).play();
  p.now = want;
}

/** 장면을 목록에 맞춘다. 없던 건 넣고, 빠진 건 빼고, 남은 건 자리만 옮긴다. */
async function sync(s: Live, units: BoardUnit[], hero?: Omit<BoardUnit, 'key'>) {
  const all = hero ? [...units, { ...hero, key: HERO_KEY }] : units;
  s.want = all;
  units = all;
  const alive = new Set(all.map((u) => u.key));

  for (const [key, node] of s.nodes) {
    if (alive.has(key)) continue;
    s.scene.remove(node);
    s.nodes.delete(key);
    s.mixers.delete(key);
  }

  for (const u of units) {
    const set = MODELS[u.defId];
    if (!set) continue;

    let node = s.nodes.get(u.key);
    if (!node) {
      let proto = s.protos.get(u.defId);
      if (!proto) {
        const { gltf, skin } = await loadModel(set.idle);
        gltf.scene.traverse((o: THREE.Object3D) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) mesh.material = new THREE.MeshBasicMaterial({ map: skin });
        });
        const clips: Partial<Record<Motion, THREE.AnimationClip>> = {
          idle: pickClip(gltf.animations),
        };
        /*
          모션 파일마다 본체가 통째로 들어 있지만 뼈대는 전부 같다 (meshy 가
          같은 리그로 구워 준다). 그러니 몸은 idle 것 하나만 쓰고 나머지
          파일에서는 동작만 꺼내 쓴다 - 같은 메시를 서너 벌 들고 있을 이유가 없다.
        */
        for (const m of ['walk', 'attack'] as const) {
          const src = set[m];
          if (!src) continue;
          clips[m] = pickClip((await loadModel(src)).gltf.animations);
        }
        const list = Object.values(clips);
        for (const c of list) stripRootMotion(gltf.scene, c);
        reshape(gltf.scene, list, { torso: set.torso, belly: set.belly, head: set.head });
        proto = { scene: gltf.scene, clips };
        s.protos.set(u.defId, proto);
      }

      // 목록이 또 바뀌었을 수 있다 - 읽는 동안 사라진 유닛은 넣지 않는다
      if (!s.want.some((x) => x.key === u.key)) continue;

      node = cloneSkinned(proto.scene);
      /*
        원본 크기가 제각각이라 눈으로 맞추지 않고 경계 상자로 맞춘다.
        발밑이 0 에 오도록 내려서, 놓을 때 발 위치만 주면 되게 한다.
      */
      const box = new THREE.Box3().setFromObject(node);
      const span = box.getSize(new THREE.Vector3());
      const fix = new THREE.Group();
      node.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      node.scale.setScalar(1 / span.y);        // 높이를 1 로 맞춰 두면 뒤에서 픽셀만 곱하면 된다
      node.position.multiplyScalar(1 / span.y);
      fix.add(node);
      s.scene.add(fix);
      s.nodes.set(u.key, fix);

      const mixer = new THREE.AnimationMixer(node);
      const acts: Partial<Record<Motion, THREE.AnimationAction>> = {};
      for (const [m, clip] of Object.entries(proto.clips)) {
        acts[m as Motion] = mixer.clipAction(clip);
      }
      const start = u.motion ?? 'idle';
      acts[start]?.play();
      // 여럿이 같은 박자로 숨 쉬면 기계 같다. 시작 시점을 흩어 준다.
      mixer.setTime(Math.random() * (proto.clips[start]?.duration ?? 1));
      s.mixers.set(u.key, { mixer, acts, now: start });
      node = fix;
    }

    place(node, u, s.half);
    setMotion(s.mixers.get(u.key), u.motion ?? 'idle');
  }
}

/** 같은 이름으로 두 개가 오는데 짧은 쪽은 기본 자세 한 프레임이다 */
function pickClip(clips: THREE.AnimationClip[]): THREE.AnimationClip {
  return clips.reduce((a, b) => (b.duration > a.duration ? b : a));
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, top: 0, backgroundColor: 'transparent' },
});
