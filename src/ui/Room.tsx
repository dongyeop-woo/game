import { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Text } from './Text';

/**
 * 방. 화면 전체에 깔린다.
 *
 * 장면째로 그린 그림을 쓴다 - 캐릭터를 따로 얹지 않는다. 얹으면 위치·크기·
 * 방향을 맞춰야 해서 계속 어긋났다.
 *
 * 구간마다 방이 다르다. 무명은 비 오는 새벽, 거미줄 낀 원룸에 컴퓨터 한 대.
 * 구독자가 붙을수록 방이 나아진다 - 이게 키우기의 눈에 보이는 성장이다.
 *
 * 카드를 누르면 `work` 가 오르고, 그러면 작업 장면 두 장이 번갈아 뜬다
 * (손이 키보드를 친다). 옛날 게임식 2프레임이라 픽셀이 안 깨지고 가볍다.
 * 끝나면 평소 장면으로 돌아온다.
 */

export type RoomArt = {
  /** 평소 장면. 없으면 작업 장면 첫 장을 가만히 보여 준다 */
  idle?: ImageSourcePropType;
  /** 작업 장면. 두 장이면 번갈아 뜬다 */
  work: ImageSourcePropType[];
};

export const ROOMS: Record<string, RoomArt> = {
  // 비 오는 새벽 원룸. zero-idle.png 가 들어오면 idle 에 건다
  zero: {
    work: [require('../../assets/room/zero-work-1.png'), require('../../assets/room/zero-work-2.png')],
  },
};

/** 작업 장면이 떠 있는 시간. 영상 하나 만드는 데 이 정도는 걸려 보여야 한다 */
const WORK_MS = 2400;
/** 손이 오르내리는 간격 */
const FRAME_MS = 260;

export function Room({ stage, work, w, h }: { stage: string; work: number; w: number; h: number }) {
  const art = ROOMS[stage] ?? ROOMS.zero;
  const [busy, setBusy] = useState(false);
  const [frame, setFrame] = useState(0);

  // 카드를 누르면 잠깐 작업 장면
  useEffect(() => {
    if (work === 0) return;
    setBusy(true);
    const t = setTimeout(() => setBusy(false), WORK_MS);
    return () => clearTimeout(t);
  }, [work]);

  // 작업 중엔 두 장을 번갈아
  useEffect(() => {
    if (!busy || art.work.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % art.work.length), FRAME_MS);
    return () => {
      clearInterval(t);
      setFrame(0);
    };
  }, [busy, art.work.length]);

  if (art.work.length === 0) return <Sketch w={w} h={h} />;

  // 그림을 전부 겹쳐 두고 보일 것만 켠다. 소스를 바꾸면 큰 그림은 한 박자 늦게 떠서 손이 안 움직여 보인다
  const showIdle = !busy && !!art.idle;
  return (
    <View style={{ width: w, height: h }} pointerEvents="none">
      {art.idle ? <Image source={art.idle} style={[s.layer, { opacity: showIdle ? 1 : 0 }]} resizeMode="cover" /> : null}
      {art.work.map((img, i) => (
        <Image
          key={i}
          source={img}
          style={[s.layer, { opacity: !showIdle && i === (busy ? frame : 0) ? 1 : 0 }]}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

/** 그림이 없는 구간의 자리 표시 */
function Sketch({ w, h }: { w: number; h: number }) {
  return (
    <View style={[s.sketch, { width: w, height: h }]}>
      <Text style={s.hint}>방 그림 자리</Text>
    </View>
  );
}

const s = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  sketch: { backgroundColor: '#2b2f40', alignItems: 'center', justifyContent: 'center' },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
});
