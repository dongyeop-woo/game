/**
 * 유튜버 키우기 - 한 판의 상태.
 *
 * 기획은 `docs/design.md`.
 *
 * 한 판이 곧 채널 하나다. 컨셉을 뽑고, 구간마다 일차가 흐르고, 구간 끝
 * 관문에서 다음 구간으로 올라가거나 주저앉는다. 채널이 죽으면 남은 것을
 * 들고 부계정을 판다.
 */

/** 스탯 넷. 각각이 채널이 죽는 방식과 하나씩 연결된다 */
export interface Stats {
  /** 기획 - 낮으면 조회수가 안 나온다 */
  plan: number;
  /** 편집 - 낮으면 이탈률이 높다 */
  edit: number;
  /** 체력 - 0 이면 번아웃 */
  body: number;
  /** 멘탈 - 0 이면 악플에 무너진다 */
  mind: number;
}

export type StatKey = keyof Stats;

/**
 * 한 번에 바뀌는 값.
 *
 * 스탯·돈·구독자와 **숨은 두 축**이 한 덩이로 움직인다. 숨은 축은 화면에
 * 숫자로 안 보여 준다 - 보이면 최적해를 찾아 버리고, 그러면 "정직하게
 * 하려고 했는데 어느새 사이버 렉카가 돼 있었다" 가 안 나온다.
 */
export interface Delta {
  plan?: number;
  edit?: number;
  body?: number;
  mind?: number;
  money?: number;
  /** 구독자를 곧바로 더한다. 보통은 영상 성과로 저절로 붙는다 */
  subs?: number;
  /** 정직(-) ↔ 자극(+) */
  spice?: number;
  /** 성실(-) ↔ 대충(+) */
  lazy?: number;
}

/** 하루에 고르는 것 - 오늘 뭘 올릴까 */
export interface Action {
  id: string;
  name: string;
  /** 버튼 밑 한 줄. 뭘 하는지만, 결과는 안 적는다 */
  hint: string;
  d: Delta;
  /**
   * 조회수 배수. 1 이 보통이고 자극적인 것일수록 크다.
   *
   * 구독자는 이 배수와 스탯으로 **계산해서** 붙는다. 고정값으로 주면
   * 스탯을 올리는 의미가 없어진다.
   */
  reach?: number;
  /** 고른 뒤 흐르는 글. 여럿이면 하나를 뽑는다 */
  lines: string[];
  /** 이 조건일 때만 목록에 뜬다 */
  when?: (r: Run) => boolean;
}

/** 이벤트의 선택지 */
export interface Choice {
  label: string;
  d: Delta;
  line: string;
  /** 이 선택으로 채널이 끝난다 */
  kills?: string;
  /** 이 선택으로 사람을 만난다 */
  meets?: string;
}

/**
 * 끼어드는 일.
 *
 * 분노는 **구조에서** 온다 - 알고리즘, 노란 딱지, 저작권, 협찬 사기.
 * 공감은 **사람에서** 온다 - 첫 구독자, 고정 댓글, 같이 하는 친구.
 */
export interface Ev {
  id: string;
  /** 한 판에 한 번만 */
  once?: boolean;
  /** 어느 구간에서 나오는가 */
  at: string[];
  /** 뽑히는 무게 */
  weight: number;
  when?: (r: Run) => boolean;
  text: string;
  d?: Delta;
  choices?: Choice[];
  meets?: string;
}

/** 구독자 구간 하나 */
export interface Stage {
  id: string;
  name: string;
  /** 이 구간에 들어오는 구독자 수 */
  from: number;
  /** 다음 구간으로 올라가는 선 */
  goal: number;
  /** 며칠짜리인가. 일차는 구간마다 새로 돈다 */
  days: number;
  /** 영상 하나가 기본으로 데려오는 사람 수 */
  base: number;
  actions: Action[];
}

/** 채널이 끝났을 때 */
export interface Death {
  /** 결과 화면 제목 */
  name: string;
  /** 한 줄 평 */
  line: string;
  /** 끝났을 때 구독자 */
  subs: number;
}

/** 화면에 쌓이는 글 */
export interface Line {
  id: number;
  text: string;
  tone: 'act' | 'ev' | 'good' | 'bad' | 'sys';
}

export interface Run {
  seed: number;
  /** `STAGES` 의 번호 */
  stage: number;
  /** 구간 안의 일차 (1부터) */
  day: number;
  stats: Stats;
  /** 이 판의 주인공 숫자 */
  subs: number;
  money: number;
  /** 정직(-) ↔ 자극(+) */
  spice: number;
  /** 성실(-) ↔ 대충(+) */
  lazy: number;
  /** 시작 컨셉 */
  concept: string;
  /**
   * 업로드 주기 (`CADENCES` 의 id).
   *
   * 이 게임의 중심 맞바꿈이다. 물량으로 알고리즘을 두드릴지 한 편에 정성을
   * 쏟을지 - 실제로 채널을 하는 사람이 매주 다시 하는 고민이라 하루하루
   * 고르는 것보다 위에 둔다.
   */
  cadence: string;
  /** 노란 딱지가 남은 날. 0 보다 크면 정산이 4분의 1 로 깎인다 */
  yellow: number;
  /** 선을 넘어 경고받은 횟수. 세 번째에 고소가 온다 */
  warned: number;
  lines: Line[];
  nextLineId: number;
  /** 지금 답을 기다리는 이벤트 */
  pending: Ev | null;
  dead: Death | null;
  /** 만난 사람 (도감) */
  met: string[];
  /** 이미 나온 한 번짜리 이벤트 */
  seen: string[];
  /** 바로 앞에 찍은 글. 같은 줄이 연달아 나오는 걸 막는다 */
  lastLine: string;
  /** 부계정 카드에서 온 효과 */
  cards: string[];
}

/** 시작할 때 뽑는 컨셉 */
export interface Concept {
  id: string;
  name: string;
  weight: number;
  /** 잘 터지는 컨셉일수록 크다 */
  rank: number;
  d: Delta;
  line: string;
}
