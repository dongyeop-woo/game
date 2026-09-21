/**
 * 전장 모델.
 *
 * 전장은 x축 한 줄이다. 아군 기지가 왼쪽(x 작음), 적 기지가 오른쪽(x 큼)에 있고
 * 모든 유닛은 자기 진영 반대 방향으로 전진한다. 기지와 주인공도 전부 같은
 * Entity 로 표현해서 전투 규칙을 한 벌만 두면 되게 했다.
 */

export type Team = 'ally' | 'enemy';
export type EntityKind = 'unit' | 'hero' | 'base';

export interface Entity {
  id: number;
  team: Team;
  kind: EntityKind;
  /** UNITS / ENEMIES 의 키. 기지는 'base'. */
  defId: string;
  name: string;
  emoji: string;

  /** 전장 좌표 (px). 왼쪽이 0. */
  x: number;
  /** 전열 번호 (0 ~ LANES-1). 같은 열끼리만 서로 길을 막는다 */
  lane: number;

  hp: number;
  maxHp: number;
  atk: number;
  /** 초당 공격 횟수 */
  atkSpeed: number;
  /** 이 거리 안에 적이 들어오면 멈추고 때린다 */
  range: number;
  /** px/초 */
  speed: number;

  /** 다음 공격까지 남은 시간(초) */
  cooldown: number;
  /** 피격 연출용 잔여 시간(초) */
  hitFlash: number;
  /** 공격 모션 잔여 시간(초) */
  swing: number;
}

export type EffectKind = 'damage' | 'heal' | 'slash' | 'bolt' | 'blast';

/** 화면 연출용. 게임 판정에는 영향을 주지 않는다. */
export interface Effect {
  id: number;
  kind: EffectKind;
  x: number;
  lane: number;
  value: number;
  /** 남은 수명(초) */
  life: number;
  maxLife: number;
  team: Team;
}

export type Phase = 'ready' | 'playing' | 'win' | 'lose';

export interface World {
  stageId: string;
  phase: Phase;
  /** 전투 경과 시간(초) */
  time: number;
  /** 영구 업그레이드에서 계산한 배율 (heroAtk, unitHp, ...) */
  mods: Record<string, number>;
  /** 지금 스폰되는 적에게 적용할 체력/공격력 배율 (웨이브마다 오른다) */
  enemyPower: number;

  entities: Entity[];
  allyBaseId: number;
  enemyBaseId: number;
  /**
   * 팔라독. 플레이어가 조작하지 않는다 — 알아서 앞으로 걸어간다.
   * 쓰러지면 그 자리에서 스테이지 실패다. 플레이어(소환사)의 일은
   * 앞에 유닛을 세워 이 녀석을 살려서 적 기지까지 데려가는 것.
   */
  heroId: number | null;

  food: number;
  foodMax: number;
  foodRegen: number;
  mana: number;
  manaMax: number;
  manaRegen: number;

  /** 유닛별 소환 쿨다운 잔여(초) */
  summonCd: Record<string, number>;
  /** 스킬별 쿨다운 잔여(초) */
  skillCd: Record<string, number>;

  /** 난이도 배율 (1 = 기본). 적 능력치에 곱해진다. */
  threatMul: number;
  /** 지금까지 내보낸 웨이브 수 */
  waveNo: number;
  /** 마지막 웨이브를 내보낸 시각 */
  lastWaveAt: number;
  /** 모든 웨이브를 다 내보냈는지 — UI 가 '반격하라'를 띄운다 */
  wavesDone: boolean;
  /** 적 기지 절반 격파 시 한 번 터지는 특수 웨이브를 이미 썼는지 */
  rageDone: boolean;
  /** 예약된 스폰 (오프닝/특수 웨이브가 여러 마리를 간격 두고 뱉는다) */
  pending: { at: number; defId: string }[];

  effects: Effect[];
  nextId: number;

  /** 졌다면 왜 졌는지 */
  loseReason: 'hero' | null;
  /** 이번 판 팔라독 최저 체력 비율 — 클리어 별 등급 판정에 쓴다 */
  heroMinHp: number;

  /** 이번 판 통계 */
  kills: number;
  summoned: number;
}

/** 한 스텝에서 일어난 사건 — 사운드/햅틱/화면 흔들림 트리거용 */
export interface StepEvents {
  heroDied: boolean;
  heroHurt: boolean;
  baseHit: boolean;
  rageWave: boolean;
  finished: Phase | null;
}

/** 하루 단위로 초기화되는 진행 상황 */
export interface DailyState {
  /** 'YYYY-MM-DD' — 날짜가 바뀌면 통째로 리셋한다 */
  day: string;
  kills: number;
  stageClears: number;
  /** 오늘 유닛을 조합한 횟수 */
  combines: number;
  sweeps: number;
  /** 수령한 미션 id */
  claimed: string[];
  /** 오늘 출석 보상을 받았는가 */
  attended: boolean;
  /** 오늘 광고로 받은 보상 id */
  adsUsed: string[];
}

/** 스테이지 밖에서 유지되는 성장치 전부 */
/**
 * 우편함에 들어오는 편지 한 통.
 *
 * 보상은 골드만 준다. 유닛이나 아바타까지 보내려면 받을 때 무엇을 주는지
 * 갈래가 늘어나는데, 지금은 줄 것이 골드뿐이라 갈래를 만들 이유가 없다.
 */
export interface MailItem {
  id: string;
  title: string;
  body: string;
  gold: number;
  /** 받은 시각 - 목록을 최신순으로 세울 때 쓴다 */
  at: number;
  claimed: boolean;
}

export interface MetaProgress {
  version: number;
  gold: number;
  clearedStages: string[];
  /** 스테이지별 별 등급 (0~3) */
  stageStars: Record<string, number>;
  /** 조합으로 발견해 도감이 열린 유닛 defId */
  unlockedUnits: string[];
  /** 아바타별 보유 장수. 키가 곧 보유 목록이고, 장수가 별 등급을 정한다. */
  avatarCopies: Record<string, number>;
  /** 지금 로비에 세워 둔 아바타 id */
  avatar: string;
  /** 지금까지 소환한 횟수 - 확률 안내에 쓴다 */
  summons: number;
  /** 출석 연속 일수 */
  attendStreak: number;
  daily: DailyState;
  /**
   * 플레이어 이름. 아바타 이름과는 다른 것이다 - 아바타는 갈아 끼우는
   * 겉모습이고, 이건 나를 가리킨다.
   */
  nickname: string;
  /** 마지막으로 앱을 본 시각 — 오프라인 보상 계산용 */
  lastSeen: number;

  /**
   * 모드 해금 진행도.
   *
   * 처음 켠 사람에게 세 모드를 다 열어 주면 무엇부터 할지 모른다. 튜토리얼을
   * 먼저 하게 하고, 한 판 해 보면 일반이, 일반을 한 번이라도 끝내면 PVP 가 열린다.
   */
  tutorialDone: boolean;
  /** 일반 모드를 끝낸 횟수 (이기든 지든 센다) */
  normalRuns: number;

  /** 우편함 - 최신이 앞이다 */
  mail: MailItem[];
  /** 전투 중 프레임 표시. 만드는 동안 보려고 켜 둔 것이라 끌 수 있어야 한다 */
  showFps: boolean;
  /** 진동. 잡을 때·성문이 깎일 때처럼 드문 순간에만 울린다 */
  haptics: boolean;
}
