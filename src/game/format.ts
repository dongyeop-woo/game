const UNITS = ['', 'K', 'M', 'B', 'T'];

/** 1234 -> "1.2K". 이 게임의 수치는 방치형만큼 커지지 않아 단순하게 둔다. */
export function fmt(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  const n = Math.max(0, Math.round(value));
  if (n < 1000) return String(n);
  const tier = Math.min(Math.floor(Math.log10(n) / 3), UNITS.length - 1);
  const scaled = n / Math.pow(1000, tier);
  return (scaled < 10 ? scaled.toFixed(1) : Math.round(scaled).toString()) + UNITS[tier];
}

/** 92.4 -> "1:32" */
export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
