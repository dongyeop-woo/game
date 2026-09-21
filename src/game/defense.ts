/**
 * 그리드 랜덤 디펜스.
 *
 * 판은 3x3 아홉 칸이다. 적은 위에서 세 레인을 타고 내려오고, 유닛은 자기 칸에
 * 가만히 서서 사거리 안의 적을 자동으로 때린다. 플레이어가 하는 일은 셋뿐이다:
 *
 *   뽑는다 (골드 -> 일반 유닛 무작위, 빈 칸에 들어간다)
 *   합친다 (같은 유닛 3개 -> 한 등급 위 무작위 1개)
 *   버틴다 (웨이브를 다 막으면 승리, 성문이 뚫리면 패배)
 *
 * UI 를 전혀 모르는 순수 로직이다. 화면 없이 시뮬레이터로 돌려 밸런스를 본다.
 *
 * 판을 배열로 둔 이유: 나중에 협동/PVP 에서 판이 둘 이상이 된다. 지금은
 * boards[0] 하나만 쓰지만 모델은 미리 열어 둔다.
 */

import { TIER_ORDER } from './avatars';
import type { Tier } from './progress';
import {
  COMBINE_COUNT,
  STAR_MAX_UNIT,
  STAR_NEED,
  upgradeOf,
  dps as unitDps,
  rollCost,
  rollUnit,
  rosterOfTier,
  unitPriceOf,
  sellValue,
  starMul,
  unitDef,
} from './roster';

// ------------------------------------------------------------------ 상수

/** 판 크기 - 3x3. 가운데(4번 칸)는 영웅 자리라 유닛이 못 선다. */
export const COLS = 3;
export const ROWS = 3;
export const CELLS = COLS * ROWS;
/** 아바타가 처음 서는 자리 - 판 한가운데 */
export const HERO_POS = { x: COLS / 2, y: ROWS / 2 };

/**
 * 아바타가 걷는 속도 (칸/초).
 *
 * 판이 3칸이니 끝에서 끝까지 약 2.5초다. 즉시 순간이동시키면 어디로 갔는지
 * 눈이 못 따라가고, 더 느리면 짚은 곳에 닿기 전에 웨이브가 지나간다.
 */
export const HERO_SPEED = 1.2;

/** 아바타가 걸어 다닐 수 있는 영역 - 판 안쪽에서 가장자리 여유만 남긴다 */
export const PLACE_PAD = 0.34;

/**
 * 유닛이 서는 자리 - 판 테두리를 두르는 16칸.
 *
 * 자유 배치였다가 칸으로 돌아왔다. 이유가 있다.
 *
 * 적은 판을 두르는 고리를 돈다. 그러니 **가장자리가 원래 유닛 자리**고
 * 가운데는 사거리가 남아돌아도 닿을 적이 없다 - 자유 배치라고 해 놓고
 * 실제로는 쓸 만한 자리가 테두리뿐이었다. 그럴 바엔 칸으로 못박는 편이
 * 낫다. 고르는 게 '몇 픽셀'이 아니라 '어느 변을 두껍게 할까'가 된다.
 *
 * 한 칸에 한 마리다. 그래서 이 배열의 길이가 곧 판의 상한이다.
 *
 * 자리를 잡는 법: 판을 6x6 으로 나눠 **테두리 줄에서 모서리를 뺀** 칸을 쓴다.
 * 그러면 위·아래·좌·우 줄마다 정확히 4칸, 모두 16칸이 된다.
 *
 * 두 번 고쳤다. 처음엔 '네 변에 4칸씩'을 따로 깔았는데 모서리에서 위 줄의
 * 끝과 옆 줄의 끝이 0.06칸 거리로 겹쳐 한 칸처럼 보였다. 그래서 5x5 테두리로
 * 바꿨더니 이번엔 모서리가 위 줄과 옆 줄에 동시에 속해 한 줄이 5칸으로
 * 보였다. 모서리를 아예 비우면 둘 다 안 생긴다.
 */
const SLOT_GRID = 6;

export const SLOTS: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  const sx = COLS / SLOT_GRID;
  const sy = ROWS / SLOT_GRID;
  const last = SLOT_GRID - 1;
  for (let j = 0; j < SLOT_GRID; j += 1) {
    for (let i = 0; i < SLOT_GRID; i += 1) {
      const edge = i === 0 || j === 0 || i === last || j === last;
      // 모서리는 비운다 - 두 줄에 동시에 속해 줄마다 한 칸씩 더 보인다
      const corner = (i === 0 || i === last) && (j === 0 || j === last);
      if (!edge || corner) continue;
      out.push({ x: (i + 0.5) * sx, y: (j + 0.5) * sy });
    }
  }
  return out;
})();

/** 짚은 자리에서 가장 가까운 칸 */
export function nearestSlot(x: number, y: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < SLOTS.length; i += 1) {
    const d = (SLOTS[i].x - x) ** 2 + (SLOTS[i].y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** 그 칸에 선 유닛 (없으면 null) */
export function unitAtSlot(b: DefBoard, slot: number): DefUnit | null {
  return b.units.find((u) => u.slot === slot) ?? null;
}

/**
 * 칸이 아니라 **총 마릿수**가 제약이다.
 *
 * 처음엔 '한 칸에 한 마리'로 두고 칸 수를 늘려 봤는데, 재료를 쌓을 자리가
 * 없어 판이 굳었다. 한 칸에 여러 마리가 겹쳐 서게 하고 총량으로 막으면
 * 조합 재료를 넉넉히 들고 있을 수 있다. 칸당 인원 제한은 없다 - 원하면
 * 여덟 칸 중 한 칸에 전부 몰아 세워도 된다.
 *
 * 16 이었는데 판이 너무 빨리 굳었다. 라운드마다 몇 마리씩만 들어오는데
 * 상한이 낮으니 금방 차서 '자리가 없다'가 뜨고, 조합 재료를 모아 둘 여유도
 * 없었다. 늘려서 판을 굴릴 공간을 준다.
 */
/**
 * 판에 동시에 세울 수 있는 수 = 칸 수(`SLOTS`).
 *
 * 예전엔 상한이 30 하나뿐이었다. 그런데 마당은 3칸짜리라 30마리가 서면
 * 서로 겹쳐서 어디 놓든 다 닿는다 - 사거리가 의미를 잃고, 배치가 결정이
 * 아니라 형식이 된다.
 *
 * 그래서 수를 묶었다. 칸이 꽉 차면 더 살 수 없다.
 *
 * 숫자는 밸런스라 나중에 맞춘다. 지금은 틀만.
 */
export const FIELD_MAX = 16;

/** 판 + 카드를 합친 전체 상한 */
export const UNIT_MAX = 30;

/**
 * 적이 도는 트랙.
 *
 * 위에서 아래로 흐르는 레인으로 시작했는데, 그러면 판 가장자리 유닛만 일하고
 * 안쪽은 논다. 판을 **둘러싼 루프**로 두면 어느 칸에 세우든 사거리가 닿는
 * 방향이 달라져서 배치가 의미를 갖는다. 적은 위쪽 가운데에서 나와 시계방향으로
 * 한 바퀴 돌고, 다 돌면 성문을 깎는다.
 *
 * 좌표 단위는 '칸'이다. 판은 (0,0)~(3,3), 트랙은 그 바깥 0.8칸.
 */
/**
 * 판 바깥으로 트랙이 얼마나 나가는가 (칸).
 *
 * 0.8 이었는데 0.5 로 줄였다. 경기장을 그림 한 장으로 그리게 되면서, 화가가
 * 맞춰 그릴 수 있는 비율이어야 했다 - 0.8 이면 길 한가운데가 판 가장자리에서
 * 6.6% 지점이라 띠가 테두리에 딱 붙어 그리기가 어렵다.
 *
 * 0.5 + 길 폭 1.0 이면 판 전체가 5칸이 되어, 바깥 20% 가 길이고 안쪽 60% 가
 * 마당인 깔끔한 비율이 된다. 한 바퀴 도는 시간(LAP_SECONDS)은 고정이라
 * 트랙이 짧아져도 밸런스는 그대로다.
 */
export const TRACK_MARGIN = 0.5;
const TX0 = -TRACK_MARGIN;
const TY0 = -TRACK_MARGIN;
const TX1 = COLS + TRACK_MARGIN;
const TY1 = ROWS + TRACK_MARGIN;
const TW = TX1 - TX0;
const TH = TY1 - TY0;
const PERIM = 2 * (TW + TH);

/**
 * 진행도 t(0~1) 를 트랙 위 좌표(칸 단위)로.
 *
 * **왼쪽 위 모서리에서 나와 왼쪽 변을 내려가며** 반시계로 돈다.
 *
 * 처음엔 위쪽 변 가운데(12시)였는데 성문 바로 아래라 문에 가려 첫 몇 걸음이
 * 안 보였다. 한 칸 옆(11시)으로 옮겼더니 이번엔 길이 둥글게 꺾이는 자리라
 * 비스듬히 나타났다. 모서리 끝에서 시작하면 나오는 자리가 한 점으로 딱
 * 정해지고, 첫 걸음부터 곧게 내려간다.
 */
export function pathPoint(t: number): { x: number; y: number } {
  let d = (((t % 1) + 1) % 1) * PERIM;
  if (d < TH) return { x: TX0, y: TY0 + d }; //   왼쪽 변을 내려간다
  d -= TH;
  if (d < TW) return { x: TX0 + d, y: TY1 }; //   아래를 건넌다
  d -= TW;
  if (d < TH) return { x: TX1, y: TY1 - d }; //   오른쪽 변을 올라간다
  d -= TH;
  return { x: TX1 - d, y: TY0 }; //               위쪽 변을 되짚어 온다
}

/** 칸 번호를 판 위 좌표(칸 단위, 칸 중심)로 */
export function cellPoint(cell: number): { x: number; y: number } {
  return { x: (cell % COLS) + 0.5, y: Math.floor(cell / COLS) + 0.5 };
}

/** 고정 스텝 - 프레임이 흔들려도 판정이 일정해야 한다 */
export const STEP_SEC = 1 / 30;

/** 적이 트랙을 한 바퀴 도는 기본 시간(초) */
export const LAP_SECONDS = 17;

/** 성문 내구도 */
/**
 * 성문 내구도.
 *
 * 20 이었는데 두 배로 올렸다. 못 잡은 적이 사라지지 않고 한 바퀴마다 다시
 * 때리게 바꾼 뒤로, 몇 마리만 남아도 두세 바퀴에 끝나 버렸다.
 */
export const LIFE_MAX = 40;

/** 감속에 걸린 적의 속도 배율과 지속 시간 */
export const SLOW_MUL = 0.55;
export const SLOW_SEC = 1.6;

/**
 * 기절 시간.
 *
 * 감속과 다른 건 **완전히 멈춘다**는 것이다. 그래서 짧아야 한다 - 길면
 * 기절 유닛 둘만 세워도 적이 영영 못 온다.
 */
export const STUN_SEC = 0.5;

// ------------------------------------------------------------------ 모델

export interface DefUnit {
  id: number;
  defId: string;
  /** 최고 등급에서만 오른다 (1~3). 아래 등급은 항상 1. */
  star: number;
  /** 서 있는 칸 (`SLOTS` 의 번호). 한 칸에 한 마리다. */
  slot: number;
  /** 판 위 위치(칸 단위) - `SLOTS[slot]` 을 그대로 옮겨 둔 것 */
  x: number;
  y: number;
  /** 다음 공격까지 남은 초 */
  cooldown: number;
  /** 공격 모션 잔여(초) - 연출용 */
  swing: number;
  /**
   * 보고 선 쪽 (-1 이면 왼쪽). 쏠 때마다 표적 쪽으로 돈다.
   *
   * 처음에는 배치된 칸으로만 정했는데 - 왼쪽 열이면 왼쪽 - 적이 반대편에
   * 있으면 등을 보인 채로 쐈다. 한 발 쏠 때 한 번만 바꾸니 흔들리지 않는다.
   */
  face?: -1 | 1;
  /**
   * 표적이 얼마나 위아래에 있는가 (라디안, 양수면 아래).
   *
   * 좌우 반전만으로는 대각선을 못 본다. 그리는 쪽이 이 각만큼 몸을 기울인다
   * (`aimLean`). 그림이 옆모습 한 장뿐이라 쓰는 흉내다.
   */
  aim?: number;
}

export interface DefEnemy {
  id: number;
  defId: string;
  /** 보스는 크게 그리고 이름을 띄운다 */
  boss: boolean;
  /** 트랙 진행도 0 ~ 1. 1 이면 한 바퀴 다 돌아 성문을 깎는다. */
  t: number;
  hp: number;
  maxHp: number;
  /** 초당 진행도 */
  speed: number;
  /** 남은 감속 시간 */
  slow: number;
  /** 남은 기절 시간 - 0 보다 크면 아예 안 움직인다 */
  stun: number;
  /** 피격 연출 잔여(초) */
  flash: number;
  /** 뚫렸을 때 깎는 성문 내구도 */
  damage: number;
  /** 처치 보상 */
  bounty: number;
}

export type EffectKind = 'hit' | 'slow' | 'splash' | 'combine' | 'leak' | 'shot' | 'die';

/**
 * 화면 연출용. 게임 판정에는 영향을 주지 않는다.
 *
 * 이게 없으면 유닛이 공격해도 화면에 아무 일도 안 일어나 보인다.
 * `shot` 은 유닛에서 적으로 날아가는 선, `hit` 은 떠오르는 피해 숫자다.
 */
export interface DefEffect {
  id: number;
  kind: EffectKind;
  /** 트랙 위 위치 (0~1) */
  t: number;
  value: number;
  /** 어디서 나갔는가 (null = 없음) */
  from: { x: number; y: number } | null;
  /** 누가 쐈는가 - 유닛마다 다른 공격을 그리려면 이게 필요하다 */
  by?: string;
  life: number;
  maxLife: number;
}

/** 한 사람의 판 */
/**
 * 웨이브마다 뜨는 제안.
 *
 * 무엇이 뜨는지는 못 고른다 - 랜덤 디펜스니까. 고르는 건 '살지 말지'다.
 */
export type OfferSlot = { kind: 'unit'; id: string } | { kind: 'gold'; amount: number };

export interface DefOffer {
  wave: number;
  /** 석 장. 대개 전부 유닛이고, 가끔 한 장이 골드다 */
  slots: OfferSlot[];
  /** 이미 가져간 자리 */
  bought: boolean[];
}

export interface DefBoard {
  units: DefUnit[];
  gold: number;
  /**
   * 이번 판에 다시 굴린 총 횟수.
   *
   * 예전엔 유닛을 살 때도 같이 올렸는데, '굴린 값'을 정하는 데 쓰이면서
   * 사기만 해도 값이 오르는 꼴이었다. 이제 굴림만 센다.
   */
  rolls: number;
  /** 이번 웨이브에 다시 굴린 횟수 (웨이브가 넘어가면 0 으로 돌아간다) */
  rerolls: number;
}

export type DefPhase = 'playing' | 'win' | 'lose';

export interface DefWorld {
  stageId: string;
  phase: DefPhase;
  time: number;

  boards: DefBoard[];

  wave: number;
  waveTotal: number;
  /** 다음 웨이브까지 남은 초 */
  nextWaveIn: number;
  /** 아직 안 나온 적 (시각, 종류, 레인) */
  pending: { at: number; defId: string; boss: boolean }[];

  enemies: DefEnemy[];
  effects: DefEffect[];
  nextId: number;

  life: number;
  kills: number;
  /** 이번 판에 조합으로 처음 만든 유닛 - 끝나면 도감에 등록한다 */
  discovered: string[];
  /** 지금 웨이브의 적 체력 배율. startWave 가 정하고 spawn 이 쓴다. */
  hpMul: number;


  /**
   * 성문이 뚫려도 지지 않는 판.
   *
   * 튜토리얼이 그렇다. 배치도 조합도 아직 안 익힌 사람이 4웨이브에서
   * 쫓겨나면 배울 기회 자체가 없다 - 튜토리얼은 끝까지 가 보는 게 목적이지
   * 시험이 아니다. 적이 새는 건 그대로 보여 주되(흔들림·연출) 성문은 깎지
   * 않는다. 깎아서 1 로 붙잡아 두면 게이지가 계속 빨간 채라 고장 난 것처럼
   * 보인다.
   */
  safe: boolean;

  /**
   * 이번 웨이브에 뜬 제안 - 석 장.
   *
   * 웨이브가 바뀔 때마다 새로 깔린다. 유닛은 골드를 내고 사고, 가끔 섞이는
   * 골드 카드는 눌러서 받는다.
   *
   * 골드 카드를 **늘** 주지는 않는다. 적을 잡으면 이미 골드가 들어오니까
   * (`bountyOf`) 매번 주면 수입이 두 겹이 되고 '잘 막으면 돈이 는다'가
   * 흐려진다. 가끔 섞여야 '이번엔 유닛 대신 돈'이라는 선택이 생긴다.
   */
  offer: DefOffer | null;


  /** 아바타가 지금 서 있는 자리 (칸 단위) */
  hero: { x: number; y: number };
  /** 걸어가는 목표. 도착하면 null 로 돌아간다. */
  heroTo: { x: number; y: number } | null;
}

/** 한 스텝에서 일어난 일 - 소리/진동/흔들림 트리거용 */
export interface DefEvents {
  leaked: boolean;
  waveStarted: boolean;
  /** 이번 라운드에 지급된 유닛 (waveStarted 일 때만 찬다) */
  granted: string[];
  /** 이번 스텝에 들어온 골드 - 화면에 '+n' 을 띄우려면 얼마가 들어왔는지 알아야 한다 */
  gold: number;
  finished: DefPhase | null;
}

// ------------------------------------------------------------------ 적

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  /**
   * 얼마나 단단한가. 절대 체력이 아니라 배율이다.
   *
   * 적 종류마다 고정 체력을 주면 후반에 '강한 종류 x 웨이브 배율'이 이중으로
   * 곱해져 손도 못 대고 무너진다(실제로 그랬다). 실제 체력은 웨이브 곡선
   * 하나가 정하고, 종류는 이 배율로 단단함과 마릿수만 바꾼다 -
   * **단단한 적은 그만큼 적게 나온다.**
   */
  bulk: number;
  /** 기본 속도 배율 (1 = LANE_SECONDS 에 도착) */
  speed: number;
  /**
   * 성문을 지나칠 때 깎는 목숨.
   *
   * **덩치에 맞춰야 한다.** 마릿수가 `1/bulk` 이라 한 마리가 1 씩 깎으면
   * 작은 적일수록 웨이브당 성문 피해가 커진다. 유령은 덩치 0.5 에 피해 1
   * 이어서 방패의 네 배였고, 그래서 3 스테이지가 4·5 스테이지보다 어려웠다.
   *
   * 그걸 올림으로 맞췄더니 이번엔 배낭(3/2.4 = 1.25)가 방패(4/4 = 1.0)보다
   * 세져서 4 스테이지가 5 스테이지보다 어려워졌다. 지금은 들개만 빼고
   * 다 1.25 로 맞춰 뒀다 - 들개은 1.43 이지만 첫 스테이지 전용이라 둔다.
   */
  damage: number;
}

export const ENEMY_DEFS: EnemyDef[] = [
  { id: 'skeleton', emoji: '🐕', name: '들개 모자', bulk: 0.7, speed: 1, damage: 1 },
  // 유령은 '떼'가 아니라 '빠른 놈'이다 - 덩치를 0.5 에서 올려 마릿수를 줄였다
  { id: 'ghost', emoji: '💨', name: '빠른 놈', bulk: 0.8, speed: 1.5, damage: 1 },
  { id: 'zombie', emoji: '🧢', name: '모자 모자', bulk: 1.6, speed: 0.72, damage: 2 },
  { id: 'orc', emoji: '🎒', name: '배낭 모자', bulk: 2.4, speed: 0.85, damage: 3 },
  { id: 'lich', emoji: '🛡️', name: '방패 모자', bulk: 4, speed: 0.6, damage: 5 },
];

/**
 * 1웨이브에서 '단단함 1' 짜리 적 한 마리의 체력.
 *
 * 45 에서 올렸다. 성장률(`WAVE_HP_GROWTH`)을 낮추면서 후반 체력이 크게 줄었는데,
 * 기본값까지 그대로 두면 앞 스테이지가 성문 한 칸 안 깎이고 끝났다. 압박을
 * 마지막 몇 웨이브에 몰지 않고 판 전체에 고르게 펴려는 짝이다.
 */
export const WAVE_HP_BASE = 60;
/**
 * 웨이브 하나가 다 풀리면 들어오는 골드 (단단함 1 기준).
 *
 * 마릿수가 `1/bulk` 이므로 **현상금은 덩치에 정비례해야** 웨이브당 수입이
 * 일정하다. 전에는 `10*bulk + 4` 라 상수항 4 가 마릿수만큼 불어났고, 작은
 * 적이 나오는 스테이지가 큰 적이 나오는 스테이지보다 1.5 배를 벌었다.
 * 방패만 나오는 본사 정문이 유독 가난해서(시뮬레이터 DPS 7900 vs 13000)
 * 마지막 스테이지가 실력이 아니라 수입 때문에 막혀 있었다.
 *
 * 15 에서 13 으로 낮췄다 - 전체 수입을 줄인 이유는 `WAVE_REWARD_PER` 참고.
 */
export const BOUNTY_PER_BULK = 13;

/** 처치 보상 - 단단할수록 많이 준다 */
export function bountyOf(def: EnemyDef): number {
  return Math.round(BOUNTY_PER_BULK * def.bulk);
}

export function enemyDef(id: string): EnemyDef {
  return ENEMY_DEFS.find((e) => e.id === id) ?? ENEMY_DEFS[0];
}

// --------------------------------------------------------------- 웨이브

/** 웨이브 사이 간격(초) */
export const WAVE_GAP = 16;

/**
 * 보스 웨이브.
 *
 * 마지막에만 보스를 두면 판이 밋밋하다. 몇 웨이브마다 한 번씩 '이번엔 다르다'는
 * 신호가 있어야 긴장이 생기고, 보스를 잡으면 큰 골드가 들어와 다음 판을 굴린다.
 * 보스 웨이브는 잡몹을 절반으로 줄이고 대신 큰 놈 하나를 보낸다.
 */
/**
 * 보스가 나오는 주기.
 *
 * 4 였는데 10 으로 늘렸다. 판이 50 웨이브로 길어지면서 4마다 나오면 보스가
 * 열두 번이 되어 '보스'라는 말이 닳는다. 10 이면 다섯 번, 한 번이 사건이다.
 */
export const BOSS_EVERY = 10;
export const BOSS_HP_MUL = 7;
export const BOSS_FINAL_HP_MUL = 12;
export const BOSS_BOUNTY_MUL = 5;

export function isBossWave(wave: number, total: number): boolean {
  return wave > 0 && (wave === total || wave % BOSS_EVERY === 0);
}
/**
 * 웨이브를 넘길 때마다 적 체력에 곱해지는 값.
 *
 * 이 값이 조합으로 오르는 DPS 곡선과 맞아야 한다. 1.22 로 뒀더니 후반
 * 스테이지에서 체력이 DPS 를 앞질러 손도 못 대고 무너졌다.
 *
 * 1.1 에서 1.074 로 낮췄다. 후반 DPS 는 열여섯 칸과 신화 별에서 **천장에
 * 닿기** 때문에, 1.1 이면 승패가 '천장이 50 웨이브 체력을 넘느냐' 하나로
 * 갈렸다(시뮬레이터에서 1.09 -> 1.08 사이에 승률이 0% -> 100% 로 뒤집혔다).
 * 대신 기본 체력을 올려 초중반에도 압박이 있게 했다.
 */
export const WAVE_HP_GROWTH = 1.076;

/**
 * 첫 네 웨이브의 체력 배율 (1, 2, 3, 4 웨이브). 5 웨이브부터는 1 이다.
 *
 * 시작 카드 석 장만 놓고도 **첫 웨이브는 다 잡혀야** 한다. 판의 칸이 전부
 * 테두리라 사거리 1.7 짜리 일반은 바퀴의 짧은 구간에서만 때릴 수 있어서,
 * 배율 없이는 다섯 스테이지 모두 첫 웨이브를 한 번도 못 비웠다(시작 카드만
 * 놓고 판마다 400 번 - 1 스테이지는 16 초 동안 일곱 마리 중 0.3 마리를 잡았다).
 * 0.2 로 두면 첫 웨이브를 98~100%, 둘째 웨이브를 93~100% 비운다.
 *
 * 다섯째부터는 원래 체력이다 - 그쯤이면 리롤, 상점, 조합으로 판을 키워야
 * 넘길 수 있어야 한다.
 */
export const EARLY_HP_RAMP: number[] = [0.2, 0.38, 0.55, 0.75];

export function earlyHpMul(wave: number): number {
  return EARLY_HP_RAMP[wave - 1] ?? 1;
}
/** 웨이브 클리어 보상 (웨이브가 갈수록 커진다) */
export const WAVE_REWARD = 30;
/**
 * 웨이브마다 보상에 붙는 값.
 *
 * 16 에서 12 로 낮췄다. 16 이면 한 판 수입이 4 만 골드라 상점에서 영웅을
 * 서른에서 쉰 번 샀고, 첫 신화가 50 웨이브 중 14 웨이브에 나왔다 - 사다리
 * 꼭대기를 초반에 찍고 나머지는 별만 올리는 판이었다. (리롤로 돈을 벌던
 * 구멍을 막으면서 올렸던 값인데, 상점 값을 올린 지금은 이만큼 필요 없다.)
 */
export const WAVE_REWARD_PER = 12;
/**
 * 라운드마다 받는 유닛 수.
 *
 * 예전엔 '가진 골드를 전부 유닛으로' 였는데, 시작 골드 110 이면 1라운드에
 * 12마리가 쏟아졌다. 설 수 있는 칸이 여덟(가운데는 아바타) 뿐이라 판이 첫
 * 라운드에 꽉 차고, 그 뒤로는 조합 말고 할 게 없어진다. 랜덤 디펜스의 맛은
 * 한 줌씩 받아 조금씩 굴리는 데 있지 한 번에 쏟는 데 있지 않다.
 *
 * 그래서 수를 작게 고정했다. 유닛 카드는 '지금 당장 세진다', 골드 카드는
 * '조합할 돈을 쌓는다' - 둘이 겹치지 않아야 고를 이유가 생긴다.
 */
/**
 * 유닛 한 장의 값.
 *
 * 골드가 조합 비용으로만 쓰이던 걸 되돌린다 - 이제 매 웨이브 '유닛을 살까
 * 골드를 모을까'가 저울에 오른다. 숫자는 밸런스라 나중에 맞춘다.
 */
export const UNIT_PRICE = 30;

/** 제안에 까는 유닛 장수 */
export const OFFER_UNITS = 3;

/**
 * 상점의 등급 칸.
 *
 * 카드와 **역할이 다르다.** 카드는 일반 석 장을 싸게 깔아 주는 자리고,
 * 상점은 골드를 위 등급으로 **바로** 바꾸는 자리다. 카드로는 아무리 굴려도
 * 일반만 나오니 위로 가려면 셋을 모아 합쳐야 했는데, 그러면 열여섯 칸이
 * 계속 일반으로 차서 후반에 판이 막혔다.
 *
 * 신화는 없다. 하나뿐인 최고 등급까지 돈으로 사지면 사다리 꼭대기가 의미를
 * 잃는다 - 신화는 **합쳐야만** 나온다.
 */
export const SHOP_TIERS = ['common', 'rare', 'epic', 'legend'] as const;

/**
 * 등급 칸의 값.
 *
 * **조합으로 만드는 값보다 조금 비싸다.** 조합에는 수수료가 붙어서
 * (`COMBINE_COST`) 일반 30 으로 시작하면 희귀 115, 영웅 405, 전설 1395 가 든다.
 * 상점은 셋을 모을 때까지 기다리지 않고, 판에 한 칸만 쓰고 바로 사는 값이다.
 *
 * 전에는 30 의 3 배씩(90 / 270 / 810)이었는데 수수료를 빼먹고 맞춘 값이라,
 * 실제로는 조합보다 30% 가까이 쌌다. 그래서 상점만 누르는 쪽이 늘 이겼고
 * 한 판에 영웅을 서른 번 넘게 샀다.
 */
export const SHOP_PRICE: Record<(typeof SHOP_TIERS)[number], number> = {
  common: UNIT_PRICE,
  rare: 130,
  epic: 460,
  legend: 1500,
};

export function shopPrice(tier: Tier): number {
  return SHOP_PRICE[tier as (typeof SHOP_TIERS)[number]] ?? unitPriceOf(tier, UNIT_PRICE);
}

/** 시작 골드 - 첫 웨이브 전에 판을 어느 정도 채울 만큼 */
export const START_GOLD = 110;

export interface StageDef {
  id: string;
  name: string;
  /** 출정 화면 카드에 쓰는 한 줄 */
  subtitle: string;
  /** 카드 썸네일 하늘색 (위 -> 아래) */
  sky: readonly [string, string];
  /** 배경 오브젝트 (src/ui/art/scenery.tsx) */
  scenery: 'pine' | 'deadTree' | 'pillar' | 'iceSpike' | 'ruin';
  sceneryColor: string;
  waves: number;
  /**
   * 나오는 적 종류. **반드시 약한 것부터** 적는다 - 웨이브가 갈수록 뒤쪽으로
   * 옮겨 간다. 강한 적을 앞에 두면 1웨이브부터 손도 못 대고 무너진다.
   */
  pool: string[];
  /** 적 수 = base + wave * per */
  countBase: number;
  countPer: number;
  /** 스테이지 기본 체력 배율. 웨이브 성장(x1.17)과 곱해진다. */
  power: number;
  /** 클리어 보상 골드 (전투 밖) */
  reward: number;
}

/**
 * 한 판의 최대 웨이브.
 *
 * 스테이지마다 8~16 으로 달랐는데 전부 50 으로 맞췄다. 끝이 보이면 '몇 개
 * 남았다'를 세는 놀이가 되는데, 이 게임은 **얼마나 버티나**를 보는 판이다.
 * 그래서 화면에도 총수를 안 적는다 (`WAVE 3 / 50` 이 아니라 `WAVE 3`).
 */
export const WAVE_MAX = 50;

export const DEF_STAGES: StageDef[] = [
  /*
    스테이지마다 **따로** 맞춘 값이다 - 공식 하나로 묶지 않는다.

    적 풀이 달라서(유령은 빠르고, 방패는 뭉쳐 온다) 파워를 등차로 올리면
    3 스테이지가 4 스테이지보다 어렵게 뒤집히곤 했다. 그리고 파워는 1 웨이브부터
    곱해지니, 뒤 스테이지를 파워로만 어렵게 만들면 **초반 몰살**이 났다(한때
    본사 정문 패배의 63% 가 10 웨이브 안이었다). 그래서 초반 마릿수(countBase)는
    3~4 로 낮게 두고, 난이도는 주로 후반 마릿수(countPer)로 낸다.

    첫 네 웨이브는 `EARLY_HP_RAMP` 와 짝이다. 여기서 파워나 초반 마릿수를 올리면
    시작 카드 석 장으로 첫 웨이브를 못 비우는 판이 다시 생긴다 - 지하 주차장을
    파워 1.7 / 초반 4 로 조였을 때 1 웨이브 체력이 59% 늘어 20% 가 못 비웠다.
    값을 바꾸면 tools/defsim.ts 의 승률과 함께 첫 웨이브도 확인할 것.
  */
  { id: 's1', name: '무너진 교차로', subtitle: '들개 떼가 몰려온다', sky: ['#3d63a0', '#22406b'] as const, scenery: 'pine', sceneryColor: '#2f5c3a', waves: WAVE_MAX, pool: ['skeleton'], countBase: 3, countPer: 1.1, power: 1.0, reward: 120 },
  { id: 's2', name: '안개 낀 하역장', subtitle: '빠른 놈들이 뒤를 노린다', sky: ['#3a5a7a', '#1f3450'] as const, scenery: 'deadTree', sceneryColor: '#2b4a4a', waves: WAVE_MAX, pool: ['skeleton', 'ghost'], countBase: 3, countPer: 1.3, power: 0.9, reward: 200 },
  { id: 's3', name: '폐창고 구역', subtitle: '무리가 전선을 민다', sky: ['#5a3f6e', '#2a1c40'] as const, scenery: 'pillar', sceneryColor: '#4a3a5c', waves: WAVE_MAX, pool: ['skeleton', 'zombie', 'ghost'], countBase: 4, countPer: 1.3, power: 0.9, reward: 320 },
  { id: 's4', name: '지하 주차장', subtitle: '배낭을 멘 것들이 쏟아진다', sky: ['#2f4a5c', '#16283a'] as const, scenery: 'iceSpike', sceneryColor: '#4a6b80', waves: WAVE_MAX, pool: ['skeleton', 'ghost', 'zombie', 'orc'], countBase: 3, countPer: 0.72, power: 1.5, reward: 480 },
  { id: 's5', name: '본사 정문', subtitle: '마지막 문이 열린다', sky: ['#5c2f3a', '#2a1420'] as const, scenery: 'ruin', sceneryColor: '#6b4a3a', waves: WAVE_MAX, pool: ['skeleton', 'zombie', 'orc', 'lich'], countBase: 3, countPer: 0.94, power: 1.35, reward: 700 },
];

export function defStage(id: string): StageDef {
  return DEF_STAGES.find((s) => s.id === id) ?? DEF_STAGES[0];
}

// ------------------------------------------------------------- 전장 생성

export function createDefWorld(stageId: string, safe = false): DefWorld {
  const stage = defStage(stageId);
  const w: DefWorld = {
    stageId,
    phase: 'playing',
    time: 0,
    boards: [
      {
        units: [],
        gold: START_GOLD,
        rolls: 0,
        rerolls: 0,
      },
    ],
    wave: 0,
    waveTotal: stage.waves,
    nextWaveIn: 5,
    pending: [],
    enemies: [],
    effects: [],
    nextId: 1,
    life: LIFE_MAX,
    kills: 0,
    discovered: [],
    hpMul: stage.power,
    safe,
    offer: null,
    hero: { ...HERO_POS },
    heroTo: null,
  };
  /*
    첫 제안은 시작하자마자 깐다.

    전에는 웨이브가 시작할 때만 깔아서, 판에 들어서고 첫 5초 동안 살 게
    없었다. 튜토리얼에서는 더 나빴다 - 안내가 '카드를 끌어다 놓으세요'인데
    그 사이 판을 멈춰 두니 웨이브가 안 와서 카드가 영영 안 떴다.
  */
  w.offer = rollOffer(w);
  return w;
}

// ------------------------------------------------------------------ 조회

export const row = (cell: number) => Math.floor(cell / COLS);
export const col = (cell: number) => cell % COLS;

/** 더 세울 수 있는 마릿수 */
/** 판에 더 세울 수 있는 수 */
export function fieldFree(b: DefBoard): number {
  return Math.max(0, FIELD_MAX - b.units.length);
}

/** 판 + 카드를 합쳐 더 받을 수 있는 수 */
export function freeSlots(b: DefBoard): number {
  return Math.max(0, UNIT_MAX - b.units.length);
}

/**
 * 아바타를 그 지점으로 걸어가게 한다.
 *
 * 순간이동이 아니라 목표만 찍는다 - 실제로 옮기는 건 stepDef 다. 그래야
 * 손가락을 끌면 아바타가 그 방향으로 따라오는 것처럼 보인다.
 *
 * 유닛은 밀어내지 않는다. 유닛은 테두리 칸에 서고 아바타는 가운데를 도니
 * 웬만하면 안 겹치고, 겹쳐도 잠깐이다.
 */
export function moveHero(w: DefWorld, x: number, y: number): void {
  w.heroTo = {
    x: Math.min(Math.max(x, PLACE_PAD), COLS - PLACE_PAD),
    y: Math.min(Math.max(y, PLACE_PAD), ROWS - PLACE_PAD),
  };
}

export function nextRollCost(b: DefBoard): number {
  return rollCost(b.rerolls);
}

/**
 * 제안을 통째로 다시 굴린다.
 *
 * 골드를 유닛으로 바꾸는 **두 번째 길**이다. 카드가 웨이브마다 석 장뿐이라
 * 돈이 남아도 더 살 수가 없었고, 그게 중반부터 판이 막히는 진짜 이유였다
 * (시뮬레이터에서 석 장을 다섯 장으로 늘리자 DPS 가 두 배 넘게 뛰었다).
 *
 * 안 산 자리만 바꿔 봤는데, 정작 굴리고 싶은 때는 **석 장을 다 사고 난
 * 뒤**였다. 그때는 바꿀 자리가 없어 아무 일도 안 일어났다. 그래서 통째로
 * 새로 깐다 - 산 유닛은 이미 판에 서 있으니 없어지지 않는다.
 */
export function rerollOffer(w: DefWorld, boardIndex = 0, rnd = Math.random): boolean {
  const b = w.boards[boardIndex];
  if (!w.offer) return false;
  const cost = nextRollCost(b);
  if (b.gold < cost) return false;

  b.gold -= cost;
  b.rolls += 1;
  b.rerolls += 1;
  /*
    다시 굴릴 때는 **골드 카드를 안 섞는다.**

    섞었더니 리롤이 돈을 버는 짓이 됐다. 골드 카드 값은 웨이브를 따라
    오르는데(30 + 8x웨이브) 굴림 값은 11~30 이라, 30 웨이브쯤이면 한 번
    굴릴 때마다 기댓값이 +60 골드였다. 그래서 시뮬레이터가 50 웨이브 동안
    325 번을 굴리고, 정작 상점에는 쓸 돈이 없었다.

    굴려서 얻는 건 **유닛**이어야 한다. 돈은 웨이브마다 한 번만 뜬다.
  */
  w.offer = rollOffer(w, rnd, false);
  return true;
}

/** 지금 합칠 수 있는 등급들 (같은 등급 3개 이상 + 위 등급이 있는 것) */
/**
 * 조합 비용 - 재료 등급 기준.
 *
 * 골드가 죽은 자원이었다. 지급 마릿수를 정하는 데만 쓰이는데 그건 360 골드면
 * 천장에 닿아서, 중반부터는 골드 카드를 고를 이유가 없었다. 조합에 쓰게 하면
 * 골드가 끝까지 의미를 갖는다 - 게다가 골드는 지급 마릿수도 정하니, 조합에
 * 쓰면 다음 라운드에 덜 받는다. 별도 장치 없이 '지금 등급을 올릴까,
 * 머릿수를 유지할까'가 성립한다.
 *
 * 위로 갈수록 비싸다. 조합은 상위 등급으로 가는 **유일한 통로**라 아래쪽을
 * 비싸게 매기면 길이 막힌다.
 *
 * 위 두 칸(영웅 -> 전설 180, 전설 -> 신화 500)을 크게 올렸다. 20/45/90/160 일
 * 때는 첫 전설이 7 웨이브, 첫 신화가 14 웨이브에 나와서 50 웨이브 중 앞의
 * 3 할 만에 사다리 꼭대기에 닿았다. 지금은 전설 11, 신화 33 웨이브쯤이다
 * (tools/defsim.ts 를 DEFSIM_ECON=1 로 돌리면 나온다).
 */
export const COMBINE_COST: Record<Tier, number> = {
  common: 25,
  rare: 60,
  epic: 180,
  legend: 500,
  mythic: 0, // 신화는 조합 결과라 재료가 될 일이 없다
};

export function combineCost(tier: Tier): number {
  return COMBINE_COST[tier] ?? 0;
}

/** 지금 눌렀을 때 나갈 골드 - 버튼에 적어 줘야 누르기 전에 안다 */
export function combinePlanCost(b: DefBoard): number {
  const count: Record<string, number> = {};
  for (const u of b.units) {
    const t = unitDef(u.defId).tier;
    count[t] = (count[t] ?? 0) + 1;
  }
  let total = 0;
  for (const tier of combinableTiers(b)) {
    total += combineCost(tier) * Math.floor((count[tier] ?? 0) / COMBINE_COUNT);
  }
  return total;
}

/**
 * 이 등급에서 재료로 쓰일 유닛들.
 *
 * 약한 것부터 소모한다 - 애써 키운 유닛을 재료로 쓰면 손해다.
 * 미리보기와 실제 조합이 어긋나면 안 되니 둘이 이 함수를 같이 쓴다.
 */
export function pickForCombine(b: DefBoard, tier: Tier): DefUnit[] {
  return b.units
    .filter((u) => unitDef(u.defId).tier === tier)
    .sort((a, c) => unitDps(unitDef(a.defId)) - unitDps(unitDef(c.defId)))
    .slice(0, COMBINE_COUNT);
}

/** 지금 누르면 무엇이 무엇으로 합쳐지는지 - 카드에 그대로 보여 준다 */
export function combinePlan(b: DefBoard): { tier: Tier; units: DefUnit[]; cost: number }[] {
  const out: { tier: Tier; units: DefUnit[]; cost: number }[] = [];
  for (const tier of combinableTiers(b)) {
    const units = pickForCombine(b, tier);
    if (units.length < COMBINE_COUNT) continue;
    out.push({ tier, units, cost: combineCost(tier) });
  }
  return out;
}

/** 별을 올릴 짝 - 없으면 빈 배열 */
export function starUpPair(b: DefBoard): DefUnit[] {
  const groups: Record<string, DefUnit[]> = {};
  for (const u of b.units) {
    if (unitDef(u.defId).tier !== 'mythic' || u.star >= STAR_MAX_UNIT) continue;
    (groups[`${u.defId}:${u.star}`] ??= []).push(u);
  }
  for (const list of Object.values(groups)) {
    if (list.length >= STAR_NEED) return list.slice(0, STAR_NEED);
  }
  return [];
}

/** 최고 등급끼리 별을 올릴 거리가 있는가 - 등급 조합이 없어도 이게 남을 수 있다 */
export function starUpReady(b: DefBoard): boolean {
  const count: Record<string, number> = {};
  for (const u of b.units) {
    if (unitDef(u.defId).tier !== 'mythic' || u.star >= STAR_MAX_UNIT) continue;
    const key = `${u.defId}:${u.star}`;
    count[key] = (count[key] ?? 0) + 1;
  }
  return Object.values(count).some((n) => n >= STAR_NEED);
}

export function combinableTiers(b: DefBoard): Tier[] {
  const count: Record<string, number> = {};
  for (const u of b.units) {
    const t = unitDef(u.defId).tier;
    count[t] = (count[t] ?? 0) + 1;
  }
  return TIER_ORDER.filter((t) => t !== 'mythic' && (count[t] ?? 0) >= COMBINE_COUNT);
}

/** 판 전체 dps - 화면에 보여 주면 성장이 눈에 보인다 */
export function boardDps(b: DefBoard): number {
  return b.units.reduce((s, u) => s + unitDps(unitDef(u.defId), u.star), 0);
}

// ------------------------------------------------------------------ 액션

/** 골드 카드가 섞일 확률 - 웨이브가 처음 깔릴 때만 굴린다 */
const GOLD_CARD_CHANCE = 0.3;

/**
 * 골드 카드가 주는 금액.
 *
 * 유닛 한 장을 포기하고 받는 것이니 유닛 값보다는 확실히 커야 하고, 그렇다고
 * 사냥 수입을 덮으면 안 된다.
 *
 * 전에는 `WAVE_REWARD_PER` 를 그대로 빌려 썼는데, 그 값을 8 에서 16 으로 올리자
 * 골드 카드도 같이 불어나서 수입이 모르는 사이 커졌다. 따로 떼어 둔다.
 */
export const GOLD_CARD_BASE = 30;
export const GOLD_CARD_PER = 10;
export function offerGold(wave: number): number {
  return GOLD_CARD_BASE + GOLD_CARD_PER * Math.max(1, wave);
}

/**
 * 이 카드를 사는 데 드는 골드.
 *
 * 등급 카드가 생기면서 값이 한 가지가 아니게 됐다. 카드를 보는 쪽(UI)과
 * 사는 쪽(`buyAndPlace`)이 서로 다르게 계산하면 "살 수 있어 보이는데 안
 * 사지는" 카드가 나오므로 여기 하나로 묶는다.
 */
export function offerPrice(slot: OfferSlot): number {
  return slot.kind === 'unit' ? unitPriceOf(unitDef(slot.id).tier, UNIT_PRICE) : 0;
}

/**
 * 이번 웨이브의 제안을 깐다.
 *
 * 유닛은 서로 다른 종류로 뽑는다 - 일반 등급이 다섯 종뿐이라 그냥 뽑으면
 * 셋 중 둘이 같은 게 자주 나오고, 그러면 고를 게 사실상 둘로 줄어든다.
 *
 * 첫 웨이브에는 골드 카드를 안 섞는다. 처음 까는 판은 유닛 셋으로 시작해야
 * 배치를 익힐 수 있다 (튜토리얼도 석 장을 놓으라고 시킨다).
 */
export function rollOffer(w: DefWorld, rnd = Math.random, allowGold = true): DefOffer {
  const ids: string[] = [];
  for (let i = 0; i < OFFER_UNITS; i += 1) {
    let id: string | null = null;
    for (let tries = 0; tries < 12 && id === null; tries += 1) {
      const cand = rollUnit(rnd).id;
      if (!ids.includes(cand)) id = cand;
    }
    if (id === null) break;
    ids.push(id);
  }

  const slots: OfferSlot[] = ids.map((id) => ({ kind: 'unit', id }));
  if (allowGold && w.wave >= 2 && slots.length === OFFER_UNITS && rnd() < GOLD_CARD_CHANCE) {
    slots[Math.floor(rnd() * slots.length)] = { kind: 'gold', amount: offerGold(w.wave) };
  }
  return { wave: w.wave, slots, bought: slots.map(() => false) };
}

/** 골드 카드를 받는다. 유닛과 달리 끌지 않고 누르면 된다. */
export function takeGold(w: DefWorld, index: number, boardIndex = 0): number {
  const o = w.offer;
  if (!o || index < 0 || index >= o.slots.length || o.bought[index]) return 0;
  const slot = o.slots[index];
  if (slot.kind !== 'gold') return 0;
  o.bought[index] = true;
  w.boards[boardIndex].gold += slot.amount;
  return slot.amount;
}

/**
 * 제안의 유닛을 사서 짚은 자리에 세운다.
 *
 * 사는 것과 놓는 것을 한 동작으로 묶는다. 전에는 눌러서 사고(카드로 들어감)
 * 다시 끌어서 놓는 두 단계였는데, 그러면 손이 두 번 가고 그 사이에 '카드'
 * 라는 중간 상태를 화면에 계속 보여 줘야 했다. 끌어다 놓는 그 순간에 사면
 * 중간 상태가 아예 없어진다.
 *
 * 못 사는 경우: 이미 샀거나, 골드가 모자라거나, 판에 빈 칸이 없다.
 */
export function buyAndPlace(
  w: DefWorld,
  index: number,
  x: number,
  y: number,
  boardIndex = 0,
): DefUnit | null {
  const o = w.offer;
  if (!o || index < 0 || index >= o.slots.length || o.bought[index]) return null;
  const slot0 = o.slots[index];
  if (slot0.kind !== 'unit') return null;
  const b = w.boards[boardIndex];
  const price = offerPrice(slot0);
  if (b.gold < price) return null;
  if (fieldFree(b) === 0) return null;

  /*
    짚은 칸에만 놓는다.

    전에는 그 칸이 차 있으면 남은 빈 칸 아무 데나 보냈다. 그러면 손은
    분명히 여기를 짚었는데 유닛은 저쪽에 서 있어서, 놓을 때마다 판을 다시
    훑어야 했다. 차 있으면 **아무 일도 안 일어나는 게** 낫다 - 골드도 안
    나가고 카드도 그대로 남으니 다시 놓으면 된다.
  */
  const slot = nearestSlot(x, y);
  if (slot < 0 || unitAtSlot(b, slot)) return null;

  b.gold -= price;
  o.bought[index] = true;
  const u: DefUnit = {
    id: w.nextId++,
    defId: slot0.id,
    star: 1,
    slot,
    x: SLOTS[slot].x,
    y: SLOTS[slot].y,
    cooldown: 0,
    swing: 0,
  };
  b.units.push(u);
  return u;
}

/**
 * 상점에서 한 마리 소환한다.
 *
 * **등급은 고르고, 누가 나올지는 운이다.** 어느 칸에 설지도 운이다 - 빈 칸
 * 아무 데나 세운다. 카드처럼 끌어다 놓게 하지 않는 건, 상점은 연달아 누르는
 * 자리이기 때문이다. 자리가 마음에 안 들면 끌어서 옮기면 된다(`moveUnit`).
 *
 * 못 뽑는 경우: 골드가 모자라거나, 판에 빈 칸이 없다.
 */
export function summon(
  w: DefWorld,
  tier: Tier,
  boardIndex = 0,
  rnd: () => number = Math.random,
): DefUnit | null {
  const b = w.boards[boardIndex];
  const price = shopPrice(tier);
  if (b.gold < price) return null;

  const open: number[] = [];
  for (let i = 0; i < SLOTS.length; i += 1) if (!unitAtSlot(b, i)) open.push(i);
  if (open.length === 0) return null;

  const pool = rosterOfTier(tier);
  if (pool.length === 0) return null;

  b.gold -= price;
  const slot = open[Math.floor(rnd() * open.length) % open.length];
  const u: DefUnit = {
    id: w.nextId++,
    defId: pool[Math.floor(rnd() * pool.length) % pool.length].id,
    star: 1,
    slot,
    x: SLOTS[slot].x,
    y: SLOTS[slot].y,
    cooldown: 0,
    swing: 0,
  };
  b.units.push(u);
  return u;
}

/**
 * 유닛을 다른 칸으로 옮긴다.
 *
 * 자동 배치는 '가장 한산한 칸'에 꽂을 뿐이라 사거리를 고려하지 못한다.
 * 어느 칸에 서느냐로 닿는 범위가 달라지는 게 이 판의 핵심이니, 플레이어가
 * 직접 옮길 수 있어야 한다. 칸당 인원 제한은 없다.
 */
export function moveUnit(w: DefWorld, unitId: number, x: number, y: number, boardIndex = 0): boolean {
  const b = w.boards[boardIndex];
  const u = b.units.find((v) => v.id === unitId);
  if (!u) return false;

  const slot = nearestSlot(x, y);
  if (slot === u.slot) return false;

  // 이미 누가 서 있으면 자리를 바꾼다 - 밀어내는 것보다 예상하기 쉽다
  const other = unitAtSlot(b, slot);
  if (other) {
    other.slot = u.slot;
    other.x = SLOTS[u.slot].x;
    other.y = SLOTS[u.slot].y;
  }
  u.slot = slot;
  u.x = SLOTS[slot].x;
  u.y = SLOTS[slot].y;
  return true;
}

/** 라운드 보상으로 무엇을 받을지 */

function placeUnit(
  w: DefWorld,
  b: DefBoard,
  defId: string,
  rnd: () => number,
): DefUnit | null {
  if (fieldFree(b) === 0) return null;

  const def = unitDef(defId);
  /*
    빈 칸에 세운다.

    한쪽 변에만 몰리면 반대편이 비니, 빈 칸 중에서 무작위로 고른다.
    마음에 안 들면 끌어서 옮기면 된다.
  */
  const open: number[] = [];
  for (let i = 0; i < SLOTS.length; i += 1) if (!unitAtSlot(b, i)) open.push(i);
  if (open.length === 0) return null;
  const slot = open[Math.floor(rnd() * open.length) % open.length];

  const unit: DefUnit = {
    id: w.nextId++,
    defId: def.id,
    star: 1,
    slot,
    x: SLOTS[slot].x,
    y: SLOTS[slot].y,
    cooldown: 0,
    swing: 0,
  };
  b.units.push(unit);
  return unit;
}

/**
 * 합칠 수 있는 것을 한 번에 다 합친다.
 *
 * 조합을 유닛 하나씩 고르게 하면 손이 너무 많이 간다. 버튼 하나로 몰아서
 * 처리하고, 대신 결과를 돌려줘서 화면이 연출할 수 있게 한다.
 */
/**
 * 한 등급만 합친다. 조합 카드 한 장이 이걸 부른다.
 *
 * 카드가 여러 장일 때 아무 장이나 눌러도 전부 합쳐지면, 무엇을 누른 건지
 * 알 수 없다. 누른 묶음만 합쳐져야 한다.
 */
export function combineTier(
  w: DefWorld,
  tier: Tier,
  boardIndex = 0,
): { from: Tier; to: string } | null {
  const b = w.boards[boardIndex];
  // 약한 것부터 소모한다. 애써 키운 유닛을 재료로 쓰면 손해다.
  // 골드가 모자라면 아무것도 안 한다 - 되는 것만 합친다
  const cost = combineCost(tier);
  if (b.gold < cost) return null;

  const picked = pickForCombine(b, tier);
  if (picked.length < COMBINE_COUNT) return null;

  // 무엇이 나오는지는 자리를 물려받을 유닛이 정한다 - 무작위가 아니다
  const result = upgradeOf(picked[0].defId);
  if (!result) return null;

  b.gold -= cost;

  // 첫 번째 자리를 물려받고 나머지는 사라진다
  const keep = picked[0];
  const gone = new Set(picked.slice(1).map((u) => u.id));
  b.units = b.units.filter((u) => !gone.has(u.id));
  keep.defId = result.id;
  keep.star = 1;
  keep.cooldown = 0;

  if (!w.discovered.includes(result.id)) w.discovered.push(result.id);
  pushEffect(w, 'combine', 1, 0);
  return { from: tier, to: result.id };
}

/** 별 조합 한 번. 조합 카드의 ★ 장이 이걸 부른다. */
export function starUpNow(w: DefWorld, boardIndex = 0): boolean {
  return starUpOnce(w, w.boards[boardIndex]);
}

export function combineAll(w: DefWorld, boardIndex = 0): { from: Tier; to: string }[] {
  const b = w.boards[boardIndex];
  const made: { from: Tier; to: string }[] = [];

  // 한 번 합치면 또 합쳐질 수 있다 - 더 없을 때까지 돈다
  for (;;) {
    // 등급 조합이 없어도 별 조합이 남아 있을 수 있다 - 여기서 빠져나가면 안 된다
    let did = false;

    for (const tier of combinableTiers(b)) {
      const one = combineTier(w, tier, boardIndex);
      if (!one) continue;
      made.push(one);
      did = true;
    }

    // 등급 조합이 더 없으면 최고 등급끼리 별을 올린다
    if (!did) did = starUpOnce(w, b);
    if (!did) break;
  }
  return made;
}

/** 최고 등급 유닛 중 같은 것 2개를 합쳐 별을 올린다. 한 번만. */
function starUpOnce(w: DefWorld, b: DefBoard): boolean {
  const groups: Record<string, DefUnit[]> = {};
  for (const u of b.units) {
    if (unitDef(u.defId).tier !== 'mythic' || u.star >= STAR_MAX_UNIT) continue;
    const key = `${u.defId}:${u.star}`;
    (groups[key] ??= []).push(u);
  }
  for (const list of Object.values(groups)) {
    if (list.length < STAR_NEED) continue;
    const keep = list[0];
    const gone = new Set(list.slice(1, STAR_NEED).map((u) => u.id));
    b.units = b.units.filter((u) => !gone.has(u.id));
    keep.star += 1;
    keep.cooldown = 0;
    pushEffect(w, 'combine', 1, 0);
    return true;
  }
  return false;
}

/**
 * 유닛을 판다.
 *
 * 이게 없으면 칸이 꽉 차고 합칠 것도 없을 때 게임이 완전히 멈춘다.
 * 돌려받는 골드로 다시 뽑아 판을 굴린다.
 */
export function sellUnit(w: DefWorld, unitId: number, boardIndex = 0): number {
  const b = w.boards[boardIndex];
  const i = b.units.findIndex((u) => u.id === unitId);
  if (i < 0) return 0;
  const gold = sellValue(b.units[i].defId);
  b.units.splice(i, 1);
  b.gold += gold;
  return gold;
}

/** 공격 연출이 남는 시간 - 등급이 높을수록 길게 */
const SHOT_LIFE: Record<Tier, number> = {
  common: 0.26,
  rare: 0.3,
  epic: 0.36,
  legend: 0.44,
  mythic: 0.55,
};

// ------------------------------------------------------------------ 진행

function pushEffect(
  w: DefWorld,
  kind: EffectKind,
  t: number,
  value: number,
  from: { x: number; y: number } | null = null,
  life = 0.45,
  by?: string,
) {
  w.effects.push({ id: w.nextId++, kind, t, value, from, by, life, maxLife: life });
  // 연출이 무한히 쌓이지 않게 자른다
  if (w.effects.length > 80) w.effects.splice(0, w.effects.length - 80);
}

/** 다음 웨이브를 예약한다 */
/**
 * 연습판에 한 번에 살아 있을 수 있는 적 수.
 *
 * 연습판은 성문이 안 깎여서 못 잡은 적이 안 사라진다(그러길 바랐다). 그런데
 * 상한이 없으면 45웨이브쯤에 900마리가 걸어 다녀서 폰이 달아오른다.
 */
const PRACTICE_ALIVE_MAX = 120;

function startWave(w: DefWorld) {
  const stage = defStage(w.stageId);
  w.wave += 1;
  w.hpMul = stage.power * Math.pow(WAVE_HP_GROWTH, w.wave - 1);

  // 뒤 웨이브일수록 뒤쪽 종류가 나온다
  /*
    적 종류는 **처음 스무 웨이브** 안에 다 나온다.

    총 웨이브로 나누면(50) 마지막 종류가 40웨이브쯤에나 나온다 - 거기까지
    가는 사람이 드물어서 만들어 둔 적을 아무도 못 본다.
  */
  const idx = Math.min(
    stage.pool.length - 1,
    Math.floor(((w.wave - 1) / 20) * stage.pool.length),
  );
  const def = enemyDef(stage.pool[idx]);
  const boss = isBossWave(w.wave, w.waveTotal);

  // 단단한 적은 그만큼 적게 - 웨이브 총 체력이 곡선 하나로 유지된다
  let count = Math.max(2, Math.round((stage.countBase + stage.countPer * w.wave) / def.bulk));
  // 보스 웨이브는 잡몹을 줄이고 큰 놈 하나를 얹는다
  if (boss) count = Math.max(1, Math.round(count * 0.5));

  for (let i = 0; i < count; i += 1) {
    w.pending.push({ at: w.time + i * 0.6, defId: def.id, boss: false });
  }
  if (boss) {
    w.pending.push({ at: w.time + count * 0.6 + 1.6, defId: def.id, boss: true });
  }
  w.nextWaveIn = WAVE_GAP;
}

function spawn(w: DefWorld, defId: string, boss: boolean) {
  const def = enemyDef(defId);
  const final = w.wave === w.waveTotal;
  const mul = boss ? (final ? BOSS_FINAL_HP_MUL : BOSS_HP_MUL) : 1;
  const hp = Math.round(WAVE_HP_BASE * w.hpMul * def.bulk * mul * earlyHpMul(w.wave));
  w.enemies.push({
    id: w.nextId++,
    defId,
    boss,
    t: 0,
    hp,
    maxHp: hp,
    // 보스는 느리게 걸어야 때릴 시간이 난다
    speed: (def.speed * (boss ? 0.7 : 1)) / LAP_SECONDS,
    slow: 0,
    stun: 0,
    flash: 0,
    damage: def.damage * (boss ? 4 : 1),
    bounty: Math.round(bountyOf(def) * (boss ? BOSS_BOUNTY_MUL : 1)),
  });
}

/** 두 점 사이 거리 (칸 단위) */
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 사거리 안에서 가장 앞선 적. focus 면 체력이 가장 많은 적.
 *
 * 트랙이 판을 둘러싸므로 판정은 레인이 아니라 **선 자리에서 적까지의 거리**다.
 * 같은 유닛이라도 어디에 서느냐에 따라 닿는 범위가 달라진다.
 */
function pickTarget(w: DefWorld, u: DefUnit): DefEnemy | null {
  const def = unitDef(u.defId);
  const from = { x: u.x, y: u.y };
  let best: DefEnemy | null = null;
  for (const e of w.enemies) {
    if (dist(from, pathPoint(e.t)) > def.range) continue;
    if (!best) {
      best = e;
      continue;
    }
    if (def.trait === 'focus' ? e.hp > best.hp : e.t > best.t) best = e;
  }
  return best;
}

/** 맞은 표시가 남는 시간(초). 그리는 쪽에서 이 값으로 세기를 잰다 */
export const HIT_FLASH = 0.12;

function damage(w: DefWorld, e: DefEnemy, amount: number, trait: string | null) {
  e.hp -= amount;
  e.flash = HIT_FLASH;
  if (trait === 'slow') e.slow = SLOW_SEC;
  if (trait === 'stun') e.stun = STUN_SEC;
  pushEffect(w, trait === 'slow' ? 'slow' : 'hit', e.t, Math.round(amount), null, 0.5);
}

/** 고정 스텝 한 번. dt 는 STEP_SEC 을 넘기지 않는다. */
export function stepDef(w: DefWorld, dt: number): DefEvents {
  const ev: DefEvents = { leaked: false, waveStarted: false, granted: [], gold: 0, finished: null };
  if (w.phase !== 'playing') return ev;

  w.time += dt;

  // ------------------------------------------------------------- 웨이브
  w.nextWaveIn -= dt;
  if (w.wave < w.waveTotal && w.nextWaveIn <= 0) {
    // 지난 웨이브를 넘긴 값으로 보상을 준다 (첫 웨이브는 없다)
    if (w.wave > 0) {
      const pay = WAVE_REWARD + WAVE_REWARD_PER * w.wave;
      w.boards[0].gold += pay;
      ev.gold += pay;
    }
    startWave(w);
    /*
      라운드 보상은 묻지 않는다.

      전에는 '유닛 3 / 골드' 카드를 화면 한가운데에 띄워 고르게 했다. 그런데
      적이 실시간으로 걸어오는 게임에서 판을 가리는 창이 매 라운드 뜨는 건
      그 자체가 방해다 - 고르는 동안 배치도 조합도 손이 안 간다. 게다가
      골드는 웨이브를 넘길 때마다 어차피 들어온다.

      그래서 유닛은 자동으로 카드에 채운다. 고를 게 없으면 창도 필요 없다.
    */
    /*
      1웨이브 것은 판에 들어설 때 이미 깔아 뒀다(`createDefWorld`).

      여기서 다시 뽑으면 미리 보고 고르던 카드가 시작하는 순간 갈린다 -
      '미리 배치한다'는 게 성립하지 않는다. 2웨이브부터 새로 깐다.
    */
    if (w.wave > 1) w.offer = rollOffer(w);
    w.boards[0].rerolls = 0;
    ev.waveStarted = true;
  }

  // ------------------------------------------------------------- 아바타
  if (w.heroTo) {
    const dx = w.heroTo.x - w.hero.x;
    const dy = w.heroTo.y - w.hero.y;
    const d = Math.hypot(dx, dy);
    const step = HERO_SPEED * dt;
    if (d <= step) {
      w.hero.x = w.heroTo.x;
      w.hero.y = w.heroTo.y;
      w.heroTo = null;
    } else {
      w.hero.x += (dx / d) * step;
      w.hero.y += (dy / d) * step;
    }
  }

  // --------------------------------------------------------------- 스폰
  /*
    연습판에 적이 너무 많으면 **새로 내보내지 않는다.**

    이미 나온 적은 그대로 둔다 - 한 바퀴 돈 적이 사라지지 않는 건 연습판의
    약속이다. 대신 수가 줄 때까지 다음 놈들을 안 내보낸다. 밀린 몫은 버린다.
    안 버리면 한숨 돌린 순간 쌓인 게 한꺼번에 쏟아진다.
  */
  const jammed = w.safe && w.enemies.length >= PRACTICE_ALIVE_MAX;
  for (let i = w.pending.length - 1; i >= 0; i -= 1) {
    if (w.pending[i].at > w.time) continue;
    if (!jammed) spawn(w, w.pending[i].defId, w.pending[i].boss);
    w.pending.splice(i, 1);
  }

  // --------------------------------------------------------------- 공격
  const b = w.boards[0];
  for (const u of b.units) {
    const def = unitDef(u.defId);
    u.cooldown -= dt;
    u.swing = Math.max(0, u.swing - dt);
    if (u.cooldown > 0) continue;

    const shot = pickTarget(w, u);
    if (!shot) continue;

    const atk = def.atk * starMul(u.star);
    /*
      남은 시간을 **더한다.** 새로 채우면 넘친 만큼이 매번 버려진다.

      한 스텝이 1/30초라 공속이 빠를수록 이 손실이 커진다 - 초당 0.8대면 1%,
      초당 4대면 7% 다. 공속을 올리면 그만큼 초당 피해가 줄어드는 셈이라,
      숫자로는 같은 DPS 인데 실제로는 약해진다.
    */
    const period = 1 / def.atkSpeed;
    u.cooldown = u.cooldown > -period ? u.cooldown + period : period;
    u.swing = 0.14;
    /*
      공격 연출.

      누가 때렸는지(`by`)를 같이 넘긴다 - 유닛마다 그리는 모양이 다르고,
      등급이 높을수록 크고 오래 남는다. 오래 남는 쪽이 세 보인다.
    */
    // 표적 쪽으로 몸을 돌리고, 위아래로 겨눈 각도도 적어 둔다
    const aimAt = pathPoint(shot.t);
    u.face = aimAt.x < u.x ? -1 : 1;
    u.aim = Math.atan2(aimAt.y - u.y, Math.abs(aimAt.x - u.x));
    /*
      `value` 에 보는 쪽을 실어 보낸다.

      연출은 이펙트만 보고 그리는데, 총이 몸에 붙어 있어서 총구 자리를 잡으려면
      쏜 유닛이 어느 쪽을 봤는지가 필요하다. 쏘기 연출은 `value` 를 안 쓴다.
    */
    pushEffect(w, 'shot', shot.t, u.face, { x: u.x, y: u.y }, SHOT_LIFE[def.tier], def.id);
    damage(w, shot, atk, def.trait);

    if (def.trait === 'splash') {
      // 같은 레인에서 바로 뒤에 오는 적에게 절반
      const behind = w.enemies
        .filter((e) => e !== shot && e.t < shot.t && shot.t - e.t < 0.06)
        .sort((a, c) => c.t - a.t)[0];
      if (behind) damage(w, behind, atk * 0.5, 'splash');
    }
  }

  // --------------------------------------------------------------- 이동
  for (let i = w.enemies.length - 1; i >= 0; i -= 1) {
    const e = w.enemies[i];
    e.flash = Math.max(0, e.flash - dt);

    if (e.hp <= 0) {
      b.gold += e.bounty;
      ev.gold += e.bounty;
      w.kills += 1;
      /*
        죽은 자리를 남긴다.

        예전에는 목록에서 빠지는 게 전부라 적이 그냥 사라졌다. 때리는 맛이 제일
        크게 죽는 자리가 여기였다. 무엇이 어디서 죽었는지(`by` 에 종류, `value`
        에 보스 여부)를 넘겨 주면 그리는 쪽이 몸이 부풀었다 흩어지게 그린다.
      */
      pushEffect(w, 'die', e.t, e.boss ? 1 : 0, null, 0.3, e.defId);
      w.enemies.splice(i, 1);
      continue;
    }

    e.slow = Math.max(0, e.slow - dt);

    /*
      기절한 적은 아예 안 나아간다.

      감속은 곱셈이라 '느려진다'지만 기절은 그 자리에 선다 - 둘을 같은
      값으로 섞으면 어느 쪽인지 안 보인다.
    */
    if (e.stun > 0) {
      e.stun = Math.max(0, e.stun - dt);
    } else {
      e.t += e.speed * (e.slow > 0 ? SLOW_MUL : 1) * dt;
    }

    if (e.t >= 1) {
      /*
        한 바퀴를 돌면 성문을 때리고 **다시 돈다.**

        전에는 여기서 사라졌다. 그러면 못 잡은 적은 없던 일이 되어, 판이
        약해도 웨이브가 지나가면 화면이 깨끗해졌다 - 밀리고 있다는 게
        눈에 안 보였다. 남아서 계속 돌면 판이 얼마나 밀렸는지가 그대로
        보이고, 늦게라도 잡으면 그만큼 만회가 된다.
      */
      if (!w.safe) w.life -= e.damage;
      ev.leaked = true;
      pushEffect(w, 'leak', 1, e.damage);
      e.t -= 1;
    }
  }

  // --------------------------------------------------------------- 연출
  for (let i = w.effects.length - 1; i >= 0; i -= 1) {
    w.effects[i].life -= dt;
    if (w.effects[i].life <= 0) w.effects.splice(i, 1);
  }

  // --------------------------------------------------------------- 승패
  if (w.life <= 0 && !w.safe) {
    w.phase = 'lose';
    ev.finished = 'lose';
  } else if (w.wave >= w.waveTotal && w.pending.length === 0 && w.enemies.length === 0) {
    w.phase = 'win';
    ev.finished = 'win';
  }

  return ev;
}

/** 남은 성문 내구도 비율 - 별 등급 판정에 쓴다 */
export function lifeRatio(w: DefWorld): number {
  return Math.max(0, w.life) / LIFE_MAX;
}
