import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Text } from './Text';

/**
 * 아래 메뉴 밑에 붙는 미니 플레이어. 유튜브 미니플레이어 톤 - 어두운 띠에
 * 썸네일 · 제목 · 아티스트 · 다음 곡 · 재생.
 *
 * 곡은 `TRACKS` 의 mp3 링크를 그대로 튼다. 지금은 테스트용 무료 재즈 (Kevin
 * MacLeod, CC BY - 배포하면 크레딧이 필요하다). 배포 때는 수노로 만든 곡의
 * 링크나 `require('../../assets/music/xxx.mp3')` 로 바꾼다.
 *
 * 한 곡이 끝나면 다음 곡으로 넘어가고, 마지막 곡 다음은 첫 곡이다.
 */

export type Track = { title: string; artist: string; url: string };

export const TRACKS: Track[] = [
  { title: 'Bossa Antigua', artist: 'Kevin MacLeod', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bossa%20Antigua.mp3' },
  { title: 'Backbay Lounge', artist: 'Kevin MacLeod', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Backbay%20Lounge.mp3' },
  { title: 'Bass Walker', artist: 'Kevin MacLeod', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bass%20Walker.mp3' },
  { title: 'Deuces', artist: 'Kevin MacLeod', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Deuces.mp3' },
];

export function MusicBar() {
  const [i, setI] = useState(0);
  const track = TRACKS[i];
  const player = useAudioPlayer(track.url);
  const status = useAudioPlayerStatus(player);

  // 앱을 켜면 바로 튼다. 무음 스위치가 켜져 있어도 나오게. 백그라운드까지는 안 튼다
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true })
      .catch(() => {})
      .finally(() => player.play());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 곡이 바뀌면 갈아 끼우고, 듣던 중이었으면 이어서 튼다
  useEffect(() => {
    player.replace(track.url);
    if (status.playing) player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    if (status.didJustFinish) setI((n) => (n + 1) % TRACKS.length);
  }, [status.didJustFinish]);

  const toggle = () => (status.playing ? player.pause() : player.play());
  const next = () => setI((n) => (n + 1) % TRACKS.length);

  return (
    <View style={s.bar}>
      <Pressable style={s.text} onPress={next}>
        <Text style={s.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={s.artist} numberOfLines={1}>
          {artistLine(track, status.playing, status.isBuffering)}
        </Text>
      </Pressable>
      <Pressable onPress={next} hitSlop={10} style={s.btn}>
        <MaterialIcons name="skip-next" size={26} color="#ffffff" />
      </Pressable>
      <Pressable onPress={toggle} hitSlop={10} style={s.btn}>
        <MaterialIcons name={status.playing ? 'pause' : 'play-arrow'} size={30} color="#ffffff" />
      </Pressable>
    </View>
  );
}

function artistLine(t: Track, playing: boolean, buffering: boolean) {
  if (buffering && playing) return `${t.artist} · 불러오는 중`;
  return t.artist;
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    backgroundColor: '#212121',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: { flex: 1, gap: 1 },
  title: { color: '#ffffff', fontSize: 14 },
  artist: { color: '#aaaaaa', fontSize: 12 },
  btn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  play: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },
  pause: { flexDirection: 'row', gap: 4 },
  pauseBar: { width: 4, height: 16, backgroundColor: '#ffffff', borderRadius: 1 },
  nextTri: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },
  nextBar: { width: 2.5, height: 12, backgroundColor: '#ffffff', marginLeft: 1 },
});
