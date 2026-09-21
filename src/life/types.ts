/**
 * 인생 키우기 - 한 판의 상태.
 *
 * 기획은 `docs/design.md` 에 있다.
 *
 * 한 판이 곧 한 인생이다. 태어날 때 집안을 뽑고, 챕터마다 일차가 흐르고,
 * 챕터 끝 관문에서 갈래가 갈린다. 죽거나 끝까지 가면 카드를 받고 다시 태어난다.
 */

/** 스탯 넷. 각각이 죽는 방식과 하나씩 연결된다 */
export interface Stats {
  /** 머리 - 0 이면 아래 갈래로 빠진다 */
  head: number;
  /** 체력 - 0 이면 과로사 */
  body: number;
  /** 멘탈 - 0 이면 은둔 */
  mind: number;
  /** 매력 - 0 이면 인맥 이벤트가 막힌다 */
  charm: number;
}

export type StatKey = keyof Stats;

/**
 * 한 번에 바뀌는 값.
 *
 * 스탯과 돈, 그리고 **기질 두 축**이 한 덩이로 움직인다. 기질은 화면에 숫자로
 * 안 보여 준다 - 보이면 최적해를 찾아 버리고, 그러면 "착하게 키웠는데
 * 날라리가 됐다" 가 안 나온다.
 */
export interface Delta {
  head?: number;
  body?: number;
  mind?: number;
  charm?: number;
  money?: number;
  /** 착함(-) ↔ 거침(+) */
  rough?: number;
  /** 성실(-) ↔ 요령(+) */
  slick?: number;
}

/** 하루에 고르는 것 */
export interface Action {
  id: string;
  name: string;
  /** 버튼 밑에 붙는 한 줄. 뭘 하는지만, 결과는 안 적는다 */
  hint: string;
  d: Delta;
  /** 고른 뒤 흐르는 글. 여럿이면 하나를 뽑는다 */
  lines: string[];
  /** 이 조건일 때만 목록에 뜬다. 기질이 갈래를 여는 자리다 */
  when?: (l: Life) => boolean;
}

/** 이벤트의 선택지 */
export interface Choice {
  label: string;
  d: Delta;
  line: string;
  /** 이 선택으로 죽는다 */
  kills?: string;
  /** 이 선택으로 사람을 만난다 */
  meets?: string;
}

/**
 * 끼어드는 일.
 *
 * 분노는 **구조에서** 오고 공감은 **사람에서** 온다. 둘을 반씩 섞는다.
 */
export interface Ev {
  id: string;
  /** 한 판에 한 번만. 동생이 두 번 생기면 안 된다 */
  once?: boolean;
  /** 어느 챕터에서 나오는가 */
  at: string[];
  /** 뽑히는 무게. 큰 쪽이 자주 나온다 */
  weight: number;
  when?: (l: Life) => boolean;
  text: string;
  /** 선택지가 없으면 그냥 벌어지는 일이다 */
  d?: Delta;
  choices?: Choice[];
  meets?: string;
}

/** 인생의 한 토막 */
export interface Chapter {
  id: string;
  name: string;
  /** 시작 나이 */
  from: number;
  /** 끝 나이 (포함). 마지막 일차가 이 나이다 */
  to: number;
  /** 며칠짜리인가. 일차는 챕터마다 새로 돈다 */
  days: number;
  /** 여기서 죽을 수 있는가. 유년기는 안 죽는다 */
  deadly: boolean;
  actions: Action[];
  /** 챕터 끝 관문. 갈래를 정한다 */
  gate: (l: Life) => { track: string; line: string };
}

/** 태어날 때 뽑는 집안 */
export interface Home {
  id: string;
  name: string;
  /** 뽑히는 무게 */
  weight: number;
  /** 좋은 집일수록 크다. 결과 화면에 별로 뜬다 */
  rank: number;
  d: Delta;
  line: string;
}

/** 죽었거나 끝났을 때 */
export interface Death {
  /** 결과 화면 제목 */
  name: string;
  /** 한 줄 평 */
  line: string;
  age: number;
}

/** 화면에 쌓이는 글 */
export interface Line {
  id: number;
  text: string;
  /** 말투를 다르게 찍는다 */
  tone: 'act' | 'ev' | 'good' | 'bad' | 'sys';
}

export interface Life {
  seed: number;
  age: number;
  /** `CHAPTERS` 의 번호 */
  chapter: number;
  /** 챕터 안의 일차 (1부터) */
  day: number;
  stats: Stats;
  money: number;
  /** 착함(-) ↔ 거침(+) */
  rough: number;
  /** 성실(-) ↔ 요령(+) */
  slick: number;
  home: string;
  /** 지금 갈래. 챕터 관문에서 갈린다 */
  track: string | null;
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
  /** 환생 카드에서 온 효과 */
  cards: string[];
}
