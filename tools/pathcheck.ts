/** 적이 도는 길이 어디서 시작해 어느 쪽으로 가는지 눈으로 본다 (개발 도구) */
import { COLS, ROWS, pathPoint } from '../src/game/defense';

const W = 27;
const H = 15;
const grid = Array.from({ length: H }, () => Array(W).fill(' '));
for (let i = 0; i <= 40; i += 1) {
  const p = pathPoint(i / 40);
  const cx = Math.round(((p.x + 0.5) / (COLS + 1)) * (W - 1));
  const cy = Math.round(((p.y + 0.5) / (ROWS + 1)) * (H - 1));
  grid[Math.max(0, Math.min(H - 1, cy))][Math.max(0, Math.min(W - 1, cx))] =
    i === 0 ? 'S' : String(Math.floor(i / 4) % 10);
}
console.log(grid.map((r) => r.join('')).join('\n'));
console.log('\nS 가 나오는 자리, 숫자가 커지는 쪽이 가는 방향');
