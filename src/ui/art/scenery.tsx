/** 배경 오브젝트. 원경/근경 패럴랙스 레이어에 뿌린다. */

import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

export type SceneryKind = 'pine' | 'deadTree' | 'pillar' | 'iceSpike' | 'ruin';

export interface SceneryProps {
  size?: number;
  color?: string;
}

/** 침엽수 */
function Pine({ size = 44, color = '#2f5c3a' }: SceneryProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="29" y="46" width="6" height="16" fill="#3d2c1e" />
      <Polygon points="32,4 48,26 16,26" fill={color} />
      <Polygon points="32,18 52,40 12,40" fill={color} />
      <Polygon points="32,32 56,52 8,52" fill={color} />
    </Svg>
  );
}

/** 마른 나무 */
function DeadTree({ size = 44, color = '#3a3040' }: SceneryProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d="M32 62 L32 24 M32 36 L18 20 M32 30 L46 16 M32 44 L20 36 M32 40 L44 32"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** 부러진 기둥 */
function Pillar({ size = 44, color = '#5a5468' }: SceneryProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Polygon points="22,62 22,18 30,10 42,14 42,62" fill={color} />
      <Rect x="16" y="56" width="34" height="7" fill={color} />
      <Path d="M26 22 L26 56 M34 20 L34 56" stroke="#00000033" strokeWidth={2} />
    </Svg>
  );
}

/** 얼음 기둥 */
function IceSpike({ size = 44, color = '#4c7fa8' }: SceneryProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Polygon points="32,4 44,62 20,62" fill={color} />
      <Polygon points="32,4 38,62 32,62" fill="#ffffff22" />
      <Polygon points="16,30 24,62 8,62" fill={color} opacity={0.8} />
    </Svg>
  );
}

/** 무너진 탑 */
function Ruin({ size = 44, color = '#4a3a44' }: SceneryProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Polygon points="18,62 18,20 26,12 34,20 34,62" fill={color} />
      <Polygon points="34,62 34,32 44,26 50,34 50,62" fill={color} opacity={0.85} />
      <Circle cx="26" cy="30" r="4" fill="#00000044" />
      <Circle cx="42" cy="42" r="3" fill="#00000044" />
    </Svg>
  );
}

const KINDS: Record<SceneryKind, React.FC<SceneryProps>> = {
  pine: Pine,
  deadTree: DeadTree,
  pillar: Pillar,
  iceSpike: IceSpike,
  ruin: Ruin,
};

export function SceneryArt({
  kind,
  size,
  color,
}: {
  kind: SceneryKind;
  size?: number;
  color?: string;
}) {
  const Cmp = KINDS[kind] ?? Pine;
  return <Cmp size={size} color={color} />;
}

/** 지평선을 채우는 먼 산 실루엣 */
export function Mountains({
  width,
  height = 60,
  color,
}: {
  width: number;
  height?: number;
  color: string;
}) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polygon
        points={`0,${height} 0,${height * 0.55} ${width * 0.12},${height * 0.12} ${
          width * 0.26
        },${height * 0.6} ${width * 0.38},${height * 0.3} ${width * 0.52},${height * 0.7} ${
          width * 0.64
        },${height * 0.2} ${width * 0.78},${height * 0.62} ${width * 0.9},${height * 0.28} ${width},${
          height * 0.6
        } ${width},${height}`}
        fill={color}
      />
    </Svg>
  );
}

/** 전경에 뿌리는 풀 수풀 — 카메라보다 빠르게 흘러 깊이감을 만든다 */
export function GrassTuft({ size = 26, color = '#3f6b35' }: SceneryProps) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 40 24">
      <Path
        d="M6 24 C6 14 10 8 12 2 C14 10 14 18 14 24 Z"
        fill={color}
      />
      <Path d="M16 24 C16 12 21 6 24 0 C25 10 24 18 24 24 Z" fill={color} opacity={0.85} />
      <Path d="M26 24 C26 16 30 11 33 6 C34 13 34 19 34 24 Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

/** 유닛 발밑 그림자 */
export function Shadow({ width = 26, color = 'rgba(0,0,0,0.35)' }: { width?: number; color?: string }) {
  return (
    <Svg width={width} height={width * 0.3} viewBox="0 0 30 9">
      <Ellipse cx="15" cy="4.5" rx="15" ry="4.5" fill={color} />
    </Svg>
  );
}
