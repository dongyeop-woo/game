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
  /** 올라간 영상의 제목. 스튜디오의 최근 영상 목록에 뜬다. 없으면 행동 이름 */
  titles?: string[];
  /**
   * 이 영상의 결 (`VIBES` 의 id). 이번 주 알고리즘이 미는 결이면 유입이 뛴다.
   *
   * 결이 없는 카드(쉬기·공부)는 알고리즘과 상관없다.
   */
  vibe?: string;
}

/**
 * 손에 든 카드 한 장.
 *
 * 행동은 고정 메뉴가 아니라 **뽑아서 받는 패**다. 뽑을 때 구독자 이득을
 * 미리 굴려 둔다 - 그래야 카드에 "+230" 이 박히고, 두 장을 비교할 수 있고,
 * 새로고침이 의미를 가진다.
 */
export interface Dealt {
  key: number;
  action: Action;
  /** 이 카드를 쓰면 붙는 구독자. 뽑을 때 정해진다 */
  gain: number;
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
  /** 잘된 끝인가. 결과 카드 색이 갈린다 */
  good?: boolean;
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
  /** 노란 딱지가 남은 날. 0 보다 크면 정산이 4분의 1 로 깎인다 */
  yellow: number;
  /** 선을 넘어 경고받은 횟수. 세 번째에 고소가 온다 */
  warned: number;
  /**
   * 이번 주 알고리즘이 미는 결 (`VIBES` 의 id). 매주 바뀐다.
   *
   * 숫자로 안 보여 준다. 카드에 박힌 구독자 수가 유독 큰 걸 보고 알아채거나,
   * 쇼츠를 보는 카드로 알아낸다 - 실제로 피드를 보며 감을 잡는 것처럼.
   */
  trend: string;
  /** 이번 주 알고리즘을 알아냈는가 */
  trendKnown: boolean;
  /** 오늘 남은 행동 수 */
  ticks: number;
  /** 손에 든 카드 */
  hand: Dealt[];
  /** 남은 새로고침 */
  rerolls: number;
  nextKey: number;
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
  /** 올린 영상 수. 퀘스트가 읽는다 */
  uploads: number;
  /** 행동별로 쓴 횟수. 퀘스트가 읽는다 */
  used: Record<string, number>;
  /** 정산받은 횟수 */
  payouts: number;
  /** 깬 퀘스트. 채널을 새로 파도 남는다 - 배운 걸 또 시키면 짜증난다 */
  questDone: string[];
  /** 채널을 판 뒤 며칠째인가. 구간이 바뀌어도 이어진다 */
  age: number;
  /** 마지막으로 정산한 날 (age). 이 뒤에 올린 영상의 수익이 다음 21일에 들어온다 */
  paidUpTo: number;
  /** 올린 영상들. 최근 것이 뒤에 */
  videos: Video[];
  /** 채널 이름. 시작할 때 짓는다 */
  name: string;
  /** 산 물건 (한 번짜리) */
  gear: string[];
  /** 산 물건으로 쌓인 조회수 배수 */
  reachMul: number;
  /** 다음 영상 한 편에만 붙는 배수. 쓰면 1 로 돌아간다 */
  boost: number;
  /** 아직 안 본 주간 결산 */
  report: Report | null;
  /** 아직 안 본 알림 창. 앞에서부터 하나씩 */
  notices: Notice[];
  /** 이번 주 집계용 */
  week: { videos: number; views: number; subs: number; hits: number; n: number };
  /** 자극도 경고를 변호사로 지운 횟수 */
  cooled: number;
  /** 어떻게 끝났는지의 분기 id. 결과 카드가 읽는다 */
  endingId?: string;
  /** 차단한 닉네임. 다시는 댓글을 못 단다 */
  blocked: string[];
  nextCid: number;
  /**
   * 수익 창출 단계. 실제 유튜브처럼 - 조건을 채우면 신청할 수 있고, 신청하면
   * 일주일 뒤 승인되고, 그때부터 조회수가 돈이 된다.
   */
  ypp: 'none' | 'eligible' | 'applied' | 'on';
  /** 신청한 날 (age) */
  yppAt: number;
  /** 아직 안 받은 애드센스 잔액. 21일에 최소 지급액을 넘으면 들어온다 */
  earned: number;
}

/**
 * 올라간 영상 하나. 스튜디오 화면이 읽는다.
 *
 * 올린 날엔 숫자가 없다. **다음 날 아침에 결과가 온다** - 올리고 자고
 * 일어나서 보는 게 이 직업이다. 카드에 박힌 숫자는 예상이고, 아침 숫자는
 * 운과 알고리즘이 섞인 실제다.
 */
export interface Video {
  id: number;
  title: string;
  /** 올린 날 (채널을 판 뒤 며칠째인가) */
  day: number;
  /** 카드에 박혀 있던 예상 구독자 */
  expect: number;
  /** 실제로 붙은 구독자. 결과가 오기 전엔 0 */
  gain: number;
  views: number;
  likes: number;
  comments: number;
  vibe?: string;
  /** 결과가 왔는가 */
  settled: boolean;
  /** 이 영상에 달린 댓글 */
  replies: Comment[];
}

/** 댓글 하나. 공감의 절반은 여기서 온다 */
export interface Comment {
  id: number;
  /** 닉네임 */
  who: string;
  text: string;
  tone: 'good' | 'bad' | 'meh';
  /** 숨김 처리했다. 남아 있지만 안 보인다 */
  hidden?: boolean;
}

/**
 * 알림 창 하나. 아침(어제 결과·댓글·정산)과 퀘스트 완료가 여기로 온다.
 * 피드에 흘려보내면 못 보고 지나가서 - 창으로 세우고 확인을 받는다.
 */
export interface Notice {
  id: number;
  title: string;
  sub?: string;
  lines: Line[];
}

/** 주간 결산. 월요일 아침에 한 장 */
export interface Report {
  week: number;
  videos: number;
  views: number;
  subs: number;
  /** 지난주 알고리즘이 민 결의 이름. 지나고 나서야 알려 준다 */
  trendWas: string;
  /** 그 결에 맞춘 영상이 몇 편이었나 */
  hits: number;
}

/** 상점 물건 */
export interface Item {
  id: string;
  name: string;
  desc: string;
  price: number;
  /** 한 번 사면 끝. 안 그러면 몇 번이고 산다 */
  once?: boolean;
  /** 사면 바로 */
  d?: Delta;
  /** 조회수 영구 배수 */
  reach?: number;
  /** 다음 영상 한 편만 배수 */
  boost?: number;
  /** 자극도를 깎는다 (변호사) */
  cool?: number;
  when?: (r: Run) => boolean;
}

/** 도감에 실리는 사람 */
export interface Person {
  name: string;
  desc: string;
}

/**
 * 퀘스트 하나.
 *
 * 한 번에 하나씩 순서대로 뜬다. 앞의 몇 개는 조작을 가르치고, 그다음은
 * 구독자 이정표다. `count` 가 판 상태에서 진행을 읽어 온다 - 따로 세지 않는다.
 */
export interface Quest {
  id: string;
  /** 진행 줄에 뜨는 글. 화면 위치는 <꺾쇠> 로 적는다 */
  text: string;
  /** 💡 말풍선에 뜨는 안내 */
  /** 안내 말풍선. 없으면 말풍선을 안 띄운다 */
  tip?: string;
  need: number;
  count: (r: Run) => number;
  /** 깼을 때 받는 돈 */
  reward: number;
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
