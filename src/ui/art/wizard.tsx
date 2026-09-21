import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

/**
 * 마법 학교 캐릭터.
 *
 * 특정 작품의 캐릭터를 베끼지 않고 '마법 학교 학생' 이라는 일반적인 인상만 쓴다
 * (뾰족 모자 · 둥근 안경 · 로브 · 목도리 · 지팡이).
 * 나머지 아트와 같은 규칙: viewBox 0 0 64 64, 발밑이 y=60, 오른쪽을 본다.
 */

const OL = '#181324';
const SW = 2.3;
const line = { stroke: OL, strokeWidth: SW, strokeLinejoin: 'round' as const };
const cap = { ...line, strokeLinecap: 'round' as const };

export interface ArtProps {
  size?: number;
}

/**
 * 정면을 보는 마법사 — 정비 화면 가운데에 세운다.
 *
 * 세로 배치(64 단위 기준):
 *   모자 2~23 / 머리 22~42 / 로브 40~60
 * 모자 끝이 y<0 으로 나가면 잘리므로 반드시 박스 안에 넣는다.
 */
export function WizardArt({ size = 120 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* 로브 */}
      <Path d="M32 39 C22 42 15 52 13 61 L51 61 C49 52 42 42 32 39 Z" fill="#3b2f77" {...line} />
      <Path d="M32 41 C27 44 24 52 23 61 L41 61 C40 52 37 44 32 41 Z" fill="#4b3d93" />

      {/* 팔과 지팡이 */}
      <Path d="M42 46 L57 33" {...cap} stroke="#8a6134" strokeWidth={3.2} />
      <Circle cx="58" cy="31" r="6.5" fill="#ffe9a8" opacity={0.22} />
      <Circle cx="58" cy="31" r="3.2" fill="#fff2c4" {...line} strokeWidth={1.4} />
      <Ellipse cx="42" cy="47" rx="4" ry="3.4" fill="#f6d4b0" {...line} strokeWidth={1.8} />

      {/* 목도리 — 학교 색 */}
      <Path d="M21 40 L43 40 L43 45 L21 45 Z" fill="#b03a3a" {...line} strokeWidth={1.8} />
      <Path d="M23 44 L20 58 L26 58 L27 44 Z" fill="#b03a3a" {...line} strokeWidth={1.8} />
      <Path d="M23 42 L41 42" stroke="#e8c352" strokeWidth={1.8} />
      <Path d="M21 50 L25 50" stroke="#e8c352" strokeWidth={1.8} />

      {/* 머리 */}
      <Circle cx="32" cy="32" r="10.5" fill="#f6d4b0" {...line} />
      {/* 앞머리 */}
      <Path d="M22 29 C23 20 41 20 42 29 C39 24 36 23 32 25 C28 23 25 24 22 29 Z" fill="#3a2a1e" {...line} strokeWidth={1.6} />
      {/* 둥근 안경 */}
      <Circle cx="27.8" cy="33" r="4.2" fill="#dff0ff" opacity={0.75} />
      <Circle cx="36.2" cy="33" r="4.2" fill="#dff0ff" opacity={0.75} />
      <Circle cx="27.8" cy="33" r="4.2" fill="none" stroke={OL} strokeWidth={1.7} />
      <Circle cx="36.2" cy="33" r="4.2" fill="none" stroke={OL} strokeWidth={1.7} />
      <Path d="M32 33 L32.3 33" stroke={OL} strokeWidth={1.7} />
      <Circle cx="28.1" cy="33.3" r="1.7" fill={OL} />
      <Circle cx="35.9" cy="33.3" r="1.7" fill={OL} />
      {/* 입 */}
      <Path d="M29.5 38.5 Q32 40.5 34.5 38.5" fill="none" {...cap} strokeWidth={1.7} />

      {/* 뾰족 모자 — 끝이 박스 안에 들어오게 */}
      <Path d="M32 2 C35 9 39 16 44 20 L20 20 C25 16 29 9 32 2 Z" fill="#2e2560" {...line} />
      <Path d="M13 20 L51 20 L51 24 L13 24 Z" fill="#241c52" {...line} />
      <Path d="M25 15 L39 15" stroke="#e8c352" strokeWidth={1.8} />
      <Polygon
        points="32,5 33.2,8.6 37,8.6 33.9,10.9 35.1,14.5 32,12.3 28.9,14.5 30.1,10.9 27,8.6 30.8,8.6"
        fill="#e8c352"
      />
    </Svg>
  );
}

/** 캐릭터 뒤에 까는 마법진 */
export function MagicCircle({ size = 200, color = '#e8c352' }: { size?: number; color?: string }) {
  const runes = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    return { x: 50 + 40 * Math.cos(a), y: 50 + 40 * Math.sin(a) };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth={0.8} opacity={0.5} />
      <Circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth={1.6} opacity={0.7} />
      <Circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth={0.7} opacity={0.4} />
      <Polygon
        points="50,12 83,68 17,68"
        fill="none"
        stroke={color}
        strokeWidth={0.9}
        opacity={0.45}
      />
      <Polygon
        points="50,88 17,32 83,32"
        fill="none"
        stroke={color}
        strokeWidth={0.9}
        opacity={0.45}
      />
      {runes.map((r, i) => (
        <Rect
          key={i}
          x={r.x - 1.6}
          y={r.y - 1.6}
          width={3.2}
          height={3.2}
          fill={color}
          opacity={i % 3 === 0 ? 0.9 : 0.45}
          transform={`rotate(45 ${r.x} ${r.y})`}
        />
      ))}
    </Svg>
  );
}
