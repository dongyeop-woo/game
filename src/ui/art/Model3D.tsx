import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { loadModel, makeRenderer, reshape, stripRootMotion } from './gl';

/**
 * GLB 한 개를 크게 띄운다. 새 모델을 넣고 확인할 때 쓴다.
 *
 * 판 위의 유닛들은 이걸 여러 개 쓰지 않는다 - GL 컨텍스트가 유닛 수만큼
 * 생겨 못 버틴다. 그쪽은 `BoardModels.tsx` 가 한 장면에 모아서 그린다.
 */
export function Model3D({
  source,
  size,
  shape,
  /** 상자 높이의 몇 할을 채울지 */
  fill = 0.92,
  /** 천천히 도는 각속도(라디안/초). 0 이면 정면 고정 */
  spin = 0,
}: {
  source: number;
  size: number;
  /** 비율 보정 - 판 위와 같게 보이려면 같은 값을 줘야 한다 */
  shape?: { torso?: number; belly?: number; head?: number };
  fill?: number;
  spin?: number;
}) {
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const renderer = makeRenderer(gl, w, h);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);

    const { gltf, skin } = await loadModel(source);
    const model = gltf.scene;

    /*
      meshy 의 재질은 조명을 미리 구워 넣은 것이라 빛을 다시 계산할 필요가
      없다. 조명 없는 재질이 제일 싸고, 구운 그림이 그대로 나오니 색도 맞는다.
    */
    model.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = new THREE.MeshBasicMaterial({ map: skin });
    });

    // 모델 크기가 제각각이라 눈으로 맞추지 않고 경계 상자로 맞춘다
    const box = new THREE.Box3().setFromObject(model);
    const span = box.getSize(new THREE.Vector3());
    model.position.x -= (box.min.x + box.max.x) / 2;
    model.position.z -= (box.min.z + box.max.z) / 2;
    model.position.y -= box.min.y;

    const turn = new THREE.Group();
    turn.add(model);
    scene.add(turn);

    const dist = span.y / fill / 2 / Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(0, span.y * 0.5, dist);
    camera.lookAt(0, span.y * 0.5, 0);

    const mixer = new THREE.AnimationMixer(model);
    // 같은 이름으로 두 개가 오는데 짧은 쪽은 기본 자세 한 프레임이다
    const clip = gltf.animations.reduce((a: THREE.AnimationClip, b: THREE.AnimationClip) =>
      b.duration > a.duration ? b : a,
    );
    stripRootMotion(model, clip);
    if (shape) reshape(model, [clip], shape);
    mixer.clipAction(clip).play();

    let last = Date.now();
    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      mixer.update(dt);
      if (spin) turn.rotation.y += dt * spin;

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
    <View style={[styles.root, { width: size, height: size }]}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: 'transparent' },
});
