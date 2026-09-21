/** 유닛 · 적 · 스킬 · 스테이지 데이터. */

export interface UnitDef {
  id: string;
  name: string;
  emoji: string;
  /** 아군은 소환 식량 비용, 적은 스폰 예산에서 빠지는 위협도 */
  cost: number;
  /** 소환 쿨다운(초) */
  cd: number;
  hp: number;
  atk: number;
  atkSpeed: number;
  range: number;
  speed: number;
  role: string;
}

/** 아군 소환 유닛. 왼쪽부터 싼 순서로 배치된다. */
export const UNITS: UnitDef[] = [
  {
    id: 'mouse',
    name: '길냥이 신병',
    emoji: '🐭',
    cost: 20,
    cd: 1.4,
    hp: 85,
    atk: 15,
    atkSpeed: 1.4,
    range: 58,
    speed: 113,
    role: '싸고 빠른 근접',
  },
  {
    id: 'penguin',
    name: '철모 보초',
    emoji: '🐧',
    cost: 35,
    cd: 2.4,
    hp: 65,
    atk: 17,
    atkSpeed: 1.0,
    range: 254,
    speed: 81,
    role: '뒤에서 때리는 원거리',
  },
  {
    id: 'rhino',
    name: '후드 돌격병',
    emoji: '🦏',
    cost: 55,
    cd: 5,
    hp: 400,
    atk: 21,
    atkSpeed: 0.7,
    range: 67,
    speed: 67,
    role: '전선을 버티는 탱커',
  },
  {
    id: 'owl',
    name: '두건 저격수',
    emoji: '🦉',
    cost: 45,
    cd: 4,
    hp: 90,
    atk: 28,
    atkSpeed: 0.8,
    range: 218,
    speed: 81,
    role: '한 방이 무거운 원거리',
  },
  {
    id: 'dragon',
    name: '황금 헬멧 중화기',
    emoji: '🐲',
    cost: 90,
    cd: 13,
    hp: 320,
    atk: 58,
    atkSpeed: 0.9,
    range: 167,
    speed: 90,
    role: '비싸지만 판을 뒤집는다',
  },
];

/** 적 유닛. cost 는 스테이지 스폰 예산에서 차감되는 위협도다. */
export const ENEMIES: UnitDef[] = [
  {
    id: 'skeleton',
    name: '들개 좀비',
    emoji: '🐕',
    cost: 20,
    cd: 0,
    hp: 95,
    atk: 13,
    atkSpeed: 1.2,
    range: 58,
    speed: 84,
    role: '기본 근접',
  },
  {
    id: 'zombie',
    name: '모자 좀비',
    emoji: '🧢',
    cost: 26,
    cd: 0,
    hp: 210,
    atk: 19,
    atkSpeed: 0.7,
    range: 61,
    speed: 55,
    role: '느리고 튼튼',
  },
  {
    id: 'ghost',
    name: '빠른 놈',
    emoji: '💨',
    cost: 24,
    cd: 0,
    hp: 70,
    atk: 15,
    atkSpeed: 0.9,
    range: 239,
    speed: 78,
    role: '원거리',
  },
  {
    id: 'orc',
    name: '배낭 좀비',
    emoji: '🎒',
    cost: 48,
    cd: 0,
    hp: 360,
    atk: 32,
    atkSpeed: 0.8,
    range: 70,
    speed: 67,
    role: '전선을 밀어붙인다',
  },
  {
    id: 'lich',
    name: '방패 좀비',
    emoji: '🛡️',
    cost: 45,
    cd: 0,
    hp: 230,
    atk: 38,
    atkSpeed: 0.6,
    range: 283,
    speed: 58,
    role: '후방 고화력',
  },
];

const BY_ID = new Map<string, UnitDef>();
for (const d of [...UNITS, ...ENEMIES]) BY_ID.set(d.id, d);

export function unitDef(id: string): UnitDef {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`알 수 없는 유닛: ${id}`);
  return def;
}

// ------------------------------------------------------------------- 스킬

export interface SkillDef {
  id: string;
  name: string;
  emoji: string;
  mana: number;
  cd: number;
  /** 주인공 기준 앞쪽 사거리 */
  reach: number;
  /** 피해량 (heal 이면 회복 비율) */
  power: number;
  kind: 'damage' | 'heal';
  desc: string;
}

export const SKILLS: SkillDef[] = [
  {
    id: 'bolt',
    name: '공습 요청',
    emoji: '⚡',
    mana: 30,
    cd: 6,
    reach: 377,
    power: 65,
    kind: 'damage',
    desc: '앞쪽 적 전체에 폭격 피해',
  },
  {
    id: 'heal',
    name: '보급 상자',
    emoji: '✨',
    mana: 25,
    cd: 11,
    reach: 464,
    power: 0.3,
    kind: 'heal',
    desc: '주변 아군 체력 30% 회복',
  },
  {
    id: 'blast',
    name: '심판의 화염',
    emoji: '🔥',
    mana: 55,
    cd: 20,
    reach: 551,
    power: 170,
    kind: 'damage',
    desc: '앞쪽 적 전체에 큰 피해',
  },
];

export function skillDef(id: string): SkillDef {
  const def = SKILLS.find((s) => s.id === id);
  if (!def) throw new Error(`알 수 없는 스킬: ${id}`);
  return def;
}

// --------------------------------------------------------------- 스테이지

export interface WaveDef {
  /** 기준 시각으로부터 몇 초 뒤에 나오는가 */
  at: number;
  defId: string;
  count: number;
  /** 마리 사이 간격(초) */
  gap: number;
}

/** 이 시각(초)이 지나야 등장하는 적 */
export interface PoolEntry {
  id: string;
  from: number;
}

export interface StageDef {
  id: string;
  name: string;
  subtitle: string;
  /** 하늘 그라데이션 (위 -> 아래) */
  sky: readonly [string, string];
  ground: readonly [string, string];
  /** 배경 오브젝트 종류 (src/ui/art/scenery.tsx) */
  scenery: 'pine' | 'deadTree' | 'pillar' | 'iceSpike' | 'ruin';
  /** 배경 오브젝트 색 */
  sceneryColor: string;
  /** 먼 산 실루엣 색 */
  hillColor: string;
  /** 전경 풀 색 */
  grassColor: string;
  allyBaseHp: number;
  enemyBaseHp: number;

  /**
   * 적 병력은 유한하다.
   *
   * 무한히 밀려오게 두면 플레이어가 이길 방법이 없어 판이 교착에 빠진다
   * (초기 버전의 문제). 정해진 웨이브를 다 버텨내면 전장이 비고, 그때
   * 반격해서 적 기지를 부수는 게 이 게임의 승리 공식이다.
   */
  waveCount: number;
  /** 첫 웨이브의 위협 예산 */
  waveBudget: number;
  /** 웨이브마다 예산이 이 배로 커진다 */
  waveGrowth: number;
  /** 웨이브마다 적 능력치가 이만큼씩 오른다 (가산) */
  wavePower: number;
  /** 적 유닛 기본 체력/공격력 배율 */
  enemyPower: number;
  pool: PoolEntry[];

  /** 적 기지 절반 격파 시 터지는 특수 웨이브 */
  rage: WaveDef[];
  reward: number;
}

export const STAGES: StageDef[] = [
  {
    id: 's1',
    name: '무너진 교차로',
    subtitle: '들개 떼가 몰려온다',
    sky: ['#3d63a0', '#22406b'],
    ground: ['#5b8f4e', '#2f4a2a'],
    scenery: 'pine',
    sceneryColor: '#2f5c3a',
    hillColor: '#2b4a72',
    grassColor: '#3f7a33',
    allyBaseHp: 1600,
    enemyBaseHp: 1500,
    waveCount: 7,
    waveBudget: 46,
    waveGrowth: 1.16,
    wavePower: 0.07,
    enemyPower: 0.85,
    pool: [
      { id: 'skeleton', from: 0 },
      { id: 'ghost', from: 30 },
      { id: 'zombie', from: 55 },
    ],
    rage: [{ at: 0, defId: 'zombie', count: 3, gap: 0.6 }],
    reward: 120,
  },
  {
    id: 's2',
    name: '안개 낀 하역장',
    subtitle: '빠른 놈들이 뒤를 노린다',
    sky: ['#2c4a4a', '#152628'],
    ground: ['#3a4a3c', '#1e2a20'],
    scenery: 'deadTree',
    sceneryColor: '#2f4436',
    hillColor: '#1b3436',
    grassColor: '#395c3a',
    allyBaseHp: 1800,
    enemyBaseHp: 1800,
    waveCount: 7,
    waveBudget: 52,
    waveGrowth: 1.17,
    wavePower: 0.08,
    enemyPower: 0.95,
    pool: [
      { id: 'skeleton', from: 0 },
      { id: 'ghost', from: 12 },
      { id: 'zombie', from: 30 },
      { id: 'orc', from: 60 },
    ],
    rage: [
      { at: 0, defId: 'orc', count: 2, gap: 0.8 },
      { at: 1, defId: 'ghost', count: 2, gap: 0.6 },
    ],
    reward: 200,
  },
  {
    id: 's3',
    name: '폐창고 구역',
    subtitle: '무리가 전선을 민다',
    sky: ['#4a3355', '#1f1830'],
    ground: ['#4a3f34', '#26201b'],
    scenery: 'pillar',
    sceneryColor: '#4b3f52',
    hillColor: '#2e2340',
    grassColor: '#4a3b30',
    allyBaseHp: 2000,
    enemyBaseHp: 2000,
    waveCount: 8,
    waveBudget: 58,
    waveGrowth: 1.18,
    wavePower: 0.09,
    enemyPower: 1.05,
    pool: [
      { id: 'skeleton', from: 0 },
      { id: 'zombie', from: 10 },
      { id: 'ghost', from: 20 },
      { id: 'orc', from: 40 },
      { id: 'lich', from: 70 },
    ],
    rage: [
      { at: 0, defId: 'orc', count: 3, gap: 0.7 },
      { at: 1.5, defId: 'lich', count: 1, gap: 1 },
    ],
    reward: 320,
  },
  {
    id: 's4',
    name: '지하 주차장',
    subtitle: '방패 든 것들이 앞을 막는다',
    sky: ['#3a2a5e', '#171233'],
    ground: ['#3b3550', '#1d1a2b'],
    scenery: 'ruin',
    sceneryColor: '#3b2f52',
    hillColor: '#241b45',
    grassColor: '#3a2f4e',
    allyBaseHp: 2300,
    enemyBaseHp: 2600,
    waveCount: 9,
    waveBudget: 64,
    waveGrowth: 1.19,
    wavePower: 0.1,
    enemyPower: 1.15,
    pool: [
      { id: 'skeleton', from: 0 },
      { id: 'zombie', from: 0 },
      { id: 'ghost', from: 10 },
      { id: 'orc', from: 25 },
      { id: 'lich', from: 45 },
    ],
    rage: [
      { at: 0, defId: 'lich', count: 2, gap: 1.0 },
      { at: 1, defId: 'orc', count: 3, gap: 0.6 },
    ],
    reward: 480,
  },
  {
    id: 's5',
    name: '본사 정문',
    subtitle: '모든 것이 한꺼번에 온다',
    sky: ['#5a2a34', '#20121a'],
    ground: ['#4a3030', '#26191a'],
    scenery: 'deadTree',
    sceneryColor: '#4a2e34',
    hillColor: '#3a1d26',
    grassColor: '#5a3230',
    allyBaseHp: 2600,
    enemyBaseHp: 3200,
    waveCount: 10,
    waveBudget: 70,
    waveGrowth: 1.2,
    wavePower: 0.11,
    enemyPower: 1.3,
    pool: [
      { id: 'skeleton', from: 0 },
      { id: 'zombie', from: 0 },
      { id: 'ghost', from: 5 },
      { id: 'orc', from: 15 },
      { id: 'lich', from: 30 },
    ],
    rage: [
      { at: 0, defId: 'orc', count: 4, gap: 0.6 },
      { at: 2, defId: 'lich', count: 2, gap: 1.0 },
    ],
    reward: 700,
  },
];

export function stageDef(id: string): StageDef {
  const def = STAGES.find((s) => s.id === id);
  if (!def) throw new Error(`알 수 없는 스테이지: ${id}`);
  return def;
}

/** 지금 시각에 등장 가능한 적 목록 */
export function unlockedPool(stage: StageDef, time: number): string[] {
  return stage.pool.filter((p) => time >= p.from).map((p) => p.id);
}

/** n 번째(0-base) 웨이브의 위협 예산과 적 강화 배율 */
export function waveSpec(stage: StageDef, index: number): { budget: number; power: number } {
  return {
    budget: stage.waveBudget * Math.pow(stage.waveGrowth, index),
    power: stage.enemyPower * (1 + stage.wavePower * index),
  };
}
