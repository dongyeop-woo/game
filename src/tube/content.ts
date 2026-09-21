import type { Concept, Ev, Quest, Run, Stage } from './types';

/**
 * 유튜버 키우기 - 글과 숫자.
 *
 * **이 파일이 곧 게임이다.** 시스템은 며칠이면 짜지만 여기가 안 웃기면
 * 그냥 엑셀이다.
 *
 * 규칙 하나: **분노는 구조에서, 공감은 사람에서.** 알고리즘·노란 딱지·
 * 저작권·협찬 사기가 분노 담당이고, 첫 구독자·고정 댓글·같이 하는 친구가
 * 공감 담당이다. 반씩 섞는다.
 *
 * 규칙 둘: **숨은 축은 숫자로 안 보여 준다.** 자극도와 대충함이 보이면
 * 최적해를 찾아 버리고, 그러면 "정직하게 하려다 어느새 사이버 렉카" 가
 * 안 나온다.
 */

// ---------------------------------------------------------------- 컨셉

/**
 * 시작할 때 뽑는다. 이게 첫 화면이고 **분노 담당**이다.
 *
 * 잘 터지는 컨셉이 드물어야 한다. 흔하면 분노가 안 생기고, 분노가 안
 * 생기면 결과 화면이 안 돌아다닌다.
 */
export const CONCEPTS: Concept[] = [
  {
    id: 'issue',
    name: '이슈 채널',
    weight: 5,
    rank: 5,
    d: { plan: 6, mind: -4, spice: 6 },
    line: '남 얘기로 시작한다. 제일 빨리 크고 제일 빨리 죽는 길이다.',
  },
  {
    id: 'mukbang',
    name: '먹방',
    weight: 12,
    rank: 4,
    d: { body: -3, edit: 2, plan: 2, money: -30 },
    line: '카메라 한 대와 위장 하나로 시작한다.',
  },
  {
    id: 'game',
    name: '게임 방송',
    weight: 22,
    rank: 3,
    d: { edit: 4, plan: 2, body: -2 },
    line: '하던 게임을 켜 놓고 마이크를 샀다. 경쟁자는 이십만 명이다.',
  },
  {
    id: 'vlog',
    name: '브이로그',
    weight: 24,
    rank: 2,
    d: { edit: 3, mind: 2 },
    line: '일상을 찍기로 했다. 문제는 일상이 별것 없다는 거다.',
  },
  {
    id: 'study',
    name: '공부 스트리밍',
    weight: 16,
    rank: 2,
    d: { plan: -2, mind: 4, body: 2 },
    line: '카메라를 켜 놓고 공부한다. 편집할 게 없다는 게 장점이다.',
  },
  {
    id: 'craft',
    name: '만들기 채널',
    weight: 14,
    rank: 3,
    d: { edit: 5, plan: 3, money: -50, lazy: -2 },
    line: '재료비가 먼저 나간다. 조회수는 나중에 나온다.',
  },
  {
    id: 'review',
    name: '리뷰 채널',
    weight: 7,
    rank: 4,
    d: { plan: 4, edit: 2, money: -80, spice: 2 },
    line: '살 돈으로 샀다. 협찬은 아직 안 들어온다.',
  },
];

// ---------------------------------------------------------------- 결

/**
 * 영상의 결. 매주 알고리즘이 이 중 하나를 민다.
 *
 * `hint` 는 쇼츠를 봤을 때 알림에 뜨는 글이다. 결 이름을 직접 말하지 않고
 * 피드에서 본 것을 말한다 - 그래야 알아낸 것 같은 맛이 난다.
 */
export const VIBES: { id: string; name: string; hint: string }[] = [
  { id: 'quality', name: '정성', hint: '피드에 편집 빡센 영상만 뜬다. 자막 하나하나 공들인 것들.' },
  { id: 'volume', name: '물량', hint: '같은 채널 영상이 하루에 세 개씩 뜬다. 알고리즘이 부지런한 놈을 밀어준다.' },
  { id: 'trend', name: '유행', hint: '다들 같은 밈을 하고 있다. 지금 안 타면 다음 주엔 늦는다.' },
  { id: 'spicy', name: '자극', hint: '썸네일이 죄다 빨갛다. "충격" 이 안 붙은 게 없다.' },
  { id: 'social', name: '소통', hint: '합방과 답글 영상이 줄줄이 뜬다. 혼자 하는 채널은 안 보인다.' },
];

// ---------------------------------------------------------------- 구간

export const STAGES: Stage[] = [
  {
    id: 'zero',
    name: '무명',
    from: 0,
    goal: 1000,
    days: 10,
    base: 7,
    actions: [
      {
        id: 'careful',
        name: '정성껏 만든다',
        hint: '편집에 이틀',
        d: { edit: 3, body: -3, lazy: -2 },
        reach: 1.1,
        vibe: 'quality',
        lines: [
          '컷 편집만 여섯 시간. 아무도 몰라줄 부분이다.',
          '자막 폰트를 열 번 바꿨다. 결국 처음 것으로 돌아왔다.',
          '새벽 네 시에 업로드를 눌렀다. 손이 떨렸다.',
        ],
      },
      {
        id: 'quick',
        name: '대충 빨리 올린다',
        hint: '양으로 승부',
        d: { edit: -1, body: -1, lazy: 3 },
        reach: 0.85,
        vibe: 'volume',
        lines: [
          '컷 편집 없이 통으로 올렸다. 십 분짜리가 됐다.',
          '썸네일은 캡처 그대로 썼다.',
          '제목을 고민하다 그냥 "1편" 으로 했다.',
        ],
      },
      {
        id: 'trend',
        name: '유행을 따라간다',
        hint: '늦으면 의미 없다',
        d: { plan: 2, mind: -1, spice: 2 },
        reach: 1.5,
        vibe: 'trend',
        lines: [
          '남들 다 하는 걸 했다. 조회수는 나왔다.',
          '유행 지난 밈을 썼다. 댓글이 지적했다.',
          '하루 늦었다. 이미 열 명이 같은 걸 올렸다.',
        ],
      },
      {
        id: 'bait',
        name: '자극적인 제목을 단다',
        hint: '"충격"',
        d: { plan: 1, mind: -2, spice: 5 },
        reach: 2.2,
        vibe: 'spicy',
        lines: [
          '내용과 상관없는 제목을 달았다. 조회수가 세 배 나왔다.',
          '썸네일에 빨간 원을 그렸다. 효과가 있었다.',
          '"아무도 모르는" 으로 시작했다. 사실 다들 안다.',
        ],
      },
      {
        id: 'study',
        name: '알고리즘을 공부한다',
        hint: '영상은 안 올라간다',
        d: { plan: 5, body: -2, lazy: -1 },
        reach: 0,
        lines: [
          '조회수 분석 탭만 두 시간 봤다. 아무것도 안 바뀌었다.',
          '잘되는 채널 열 개를 뜯어봤다. 공통점이 없었다.',
          '노출 클릭률이 2%. 썸네일 문제라는 걸 알았다.',
        ],
      },
      {
        id: 'rest',
        name: '쉰다',
        hint: '업로드는 없다',
        d: { body: 6, mind: 4, lazy: 1 },
        reach: 0,
        lines: [
          '하루 쉬었다. 구독자가 셋 줄었다.',
          '누워서 남의 영상만 봤다. 그게 제일 편했다.',
          '카메라를 안 켠 날이 얼마 만인지 세어 봤다.',
        ],
      },
      {
        id: 'shorts',
        name: '쇼츠를 본다',
        hint: '요즘 뭐가 뜨나',
        d: { mind: 1, body: -1 },
        reach: 0,
        lines: [
          '두 시간을 내렸다. 뭐가 뜨는지는 알았다.',
          '엄지가 저릴 때까지 넘겼다. 피드가 말해 주는 게 있었다.',
        ],
      },
    ],
  },
  {
    id: 'silver',
    name: '실버 버튼까지',
    from: 1000,
    goal: 100000,
    days: 14,
    base: 330,
    actions: [
      {
        id: 'series',
        name: '시리즈를 판다',
        hint: '다음 편을 기다리게',
        d: { plan: 4, edit: 2, body: -3, lazy: -2 },
        reach: 1.3,
        vibe: 'quality',
        lines: [
          '3부작으로 쪼갰다. 1편만 터졌다.',
          '다음 편 예고를 붙였다. 댓글이 기다린다고 했다.',
          '한 편 만드는 데 사흘. 주 1회가 한계다.',
        ],
      },
      {
        id: 'collab',
        name: '합방을 한다',
        hint: '남의 구독자를 빌린다',
        d: { mind: 2, body: -2, plan: 1 },
        reach: 1.8,
        vibe: 'social',
        lines: [
          '나보다 큰 채널과 찍었다. 유입이 확 들어왔다.',
          '상대가 편집을 맡았다. 내 분량은 삼 분이었다.',
          '합방 뒤 구독자가 늘었다. 절반은 다시 나갔다.',
        ],
      },
      {
        id: 'daily',
        name: '매일 올린다',
        hint: '알고리즘은 성실함을 좋아한다',
        d: { body: -6, mind: -3, edit: 1, lazy: 2 },
        reach: 1.2,
        vibe: 'volume',
        lines: [
          '삼십 일 연속 업로드. 영상 질은 내려갔다.',
          '새벽 두 시에 렌더링을 걸고 잤다.',
          '오늘 뭘 올릴지 정하는 데 네 시간을 썼다.',
        ],
      },
      {
        id: 'react',
        name: '남의 이슈를 다룬다',
        hint: '빠를수록 좋다',
        d: { plan: 2, mind: -3, spice: 6 },
        reach: 2.6,
        vibe: 'spicy',
        lines: [
          '사흘 만에 십만이 봤다. 댓글은 안 읽었다.',
          '사실 확인은 안 했다. 남들도 안 한다.',
          '당사자가 댓글을 달았다. 지웠다.',
        ],
      },
      {
        id: 'sponsor',
        name: '협찬을 받는다',
        hint: '유료 광고 포함',
        d: { money: 400, mind: -2, spice: 3 },
        reach: 0.8,
        when: (r) => r.subs >= 3000,
        lines: [
          '첫 협찬이 들어왔다. 대본이 같이 왔다.',
          '써 보지도 않고 좋다고 했다. 통장에 찍혔다.',
          '"내돈내산" 이라고 썼다. 거짓말이었다.',
        ],
      },
      {
        id: 'editor',
        name: '편집자를 쓴다',
        hint: '돈으로 시간을 산다',
        d: { money: -250, body: 5, edit: 2 },
        when: (r) => r.money >= 250,
        reach: 1.1,
        lines: [
          '편집을 맡기고 처음으로 여덟 시간을 잤다.',
          '내 색이 사라졌다는 댓글이 달렸다.',
          '수정 요청을 다섯 번 했다. 결국 내가 다시 했다.',
        ],
      },
      {
        id: 'rest2',
        name: '쉰다',
        hint: '업로드는 없다',
        d: { body: 8, mind: 5, lazy: 1 },
        reach: 0,
        lines: [
          '일주일 쉬었다. 돌아오니 조회수가 반토막이었다.',
          '"잠수 탔냐" 는 댓글이 백 개 달렸다.',
          '쉬는 동안에도 조회수를 새로고침했다.',
        ],
      },
      {
        id: 'shorts2',
        name: '쇼츠를 본다',
        hint: '요즘 뭐가 뜨나',
        d: { mind: 1, body: -1 },
        reach: 0,
        lines: [
          '경쟁 채널 열 개를 훑었다. 이번 주 답은 나와 있었다.',
          '피드가 한 방향으로 쏠려 있었다. 알고리즘이 뭘 원하는지 보였다.',
        ],
      },
    ],
  },
];

// -------------------------------------------------------------- 퀘스트

/**
 * 퀘스트 보상. **전부 임시값이다.** 밸런스는 만드는 사람이 정한다.
 */
const Q = { small: 100, mid: 300, big: 1000 };

/**
 * 순서대로 하나씩 뜬다. 앞의 여섯은 조작을 가르친다 - 카드 누르기, 쇼츠
 * 보기, 다시 뽑기, 주기 바꾸기. 그다음은 구독자 이정표다.
 */
export const QUESTS: Quest[] = [
  {
    id: 'upload1',
    text: '<오늘 올릴 영상>에서 영상 1편 올리기',
    tip: '카드를 누르면 올라갑니다. 하루에 3편까지.',
    need: 1,
    count: (r) => r.uploads,
    reward: Q.small,
  },
  {
    id: 'shorts1',
    text: '<쇼츠를 본다>로 이번 주 알고리즘 알아내기',
    tip: '알고리즘은 매주 바뀝니다. 맞는 영상은 유입이 뜁니다.',
    need: 1,
    count: (r) => (r.used.shorts ?? 0) + (r.used.shorts2 ?? 0),
    reward: Q.small,
  },
  {
    id: 'reroll1',
    text: '<아이디어 다시 뽑기> 한 번 써 보기',
    tip: '마음에 안 드는 패는 버려도 됩니다. 채널당 8번.',
    need: 1,
    count: (r) => 8 - r.rerolls,
    reward: Q.small,
  },
  {
    id: 'subs100',
    text: '구독자 100명',
    tip: '첫 100명이 제일 오래 걸립니다.',
    need: 100,
    count: (r) => r.subs,
    reward: Q.mid,
  },
  {
    id: 'payout1',
    text: '첫 정산 받기',
    tip: '닷새마다 애드센스가 들어옵니다. 기대는 하지 마세요.',
    need: 1,
    count: (r) => r.payouts,
    reward: Q.small,
  },
  {
    id: 'cadence1',
    text: '<주 3편 ▾>을 눌러 업로드 주기 바꿔 보기',
    tip: '물량이냐 완성도냐. 매주 다시 고민하는 겁니다.',
    need: 1,
    count: (r) => r.cadenceChanges,
    reward: Q.small,
  },
  {
    id: 'subs1k',
    text: '구독자 1,000명 - 실버 구간 진입',
    tip: '천 명이 넘으면 협찬 메일이 오기 시작합니다.',
    need: 1000,
    count: (r) => r.subs,
    reward: Q.mid,
  },
  {
    id: 'sponsor1',
    text: '첫 협찬 받기',
    tip: '유료 광고는 표시해야 합니다. 안 하면 나중에 값을 치릅니다.',
    need: 1,
    count: (r) => r.used.sponsor ?? 0,
    reward: Q.mid,
  },
  {
    id: 'subs10k',
    text: '구독자 1만명',
    tip: '여기서부터 알고리즘이 사람을 골라 밀어줍니다.',
    need: 10000,
    count: (r) => r.subs,
    reward: Q.big,
  },
  {
    id: 'subs100k',
    text: '구독자 10만명 - 실버 버튼',
    tip: '실버 버튼은 신청해야 옵니다. 저절로 안 옵니다.',
    need: 100000,
    count: (r) => r.subs,
    reward: Q.big,
  },
];

// -------------------------------------------------------------- 이벤트

export const EVENTS: Ev[] = [
  // ---- 무명
  {
    id: 'firstsub',
    once: true,
    at: ['zero'],
    weight: 12,
    when: (r) => r.subs >= 1,
    text: '첫 구독자가 생겼다. 누군지 끝까지 알 수 없었다.',
    d: { mind: 6 },
    meets: '첫 구독자',
  },
  {
    id: 'firstcomment',
    once: true,
    at: ['zero'],
    weight: 10,
    text: '첫 댓글이 달렸다. "잘 보고 갑니다"',
    d: { mind: 5, plan: 1 },
    meets: '고정 댓글러',
  },
  {
    id: 'mom',
    once: true,
    at: ['zero'],
    weight: 9,
    text: '엄마가 물었다. "그거 해서 돈은 되니?"',
    choices: [
      { label: '된다고 한다', d: { mind: -3, spice: 2 }, line: '아직 한 푼도 못 벌었다.' },
      { label: '아직이라고 한다', d: { mind: 2, lazy: -1 }, line: '엄마가 밥은 먹고 하라고 했다.' },
    ],
    meets: '엄마',
  },
  {
    id: 'zeroview',
    at: ['zero'],
    weight: 11,
    when: (r) => r.subs < 300,
    text: '이틀 걸려 만든 영상의 조회수가 7 이다. 그중 셋은 나다.',
    d: { mind: -4, plan: 1 },
  },
  {
    id: 'algo',
    at: ['zero', 'silver'],
    weight: 10,
    text: '알고리즘이 갑자기 아무 이유 없이 옛날 영상을 밀어 준다.',
    d: { subs: 220, mind: 3 },
  },
  {
    id: 'copyright',
    at: ['zero', 'silver'],
    weight: 9,
    text: '저작권 경고가 왔다. 배경음악 30초 때문이다.',
    choices: [
      { label: '영상을 내린다', d: { subs: -120, mind: -3, lazy: -1 }, line: '조회수 4만이 통째로 사라졌다.' },
      { label: '이의를 신청한다', d: { mind: -5, body: -2, plan: 2 }, line: '삼 주 뒤에 기각됐다.' },
    ],
  },
  {
    id: 'hater',
    at: ['zero', 'silver'],
    weight: 10,
    text: '악플이 달렸다. 읽지 말았어야 했다.',
    choices: [
      { label: '지운다', d: { mind: -1 }, line: '지워도 머릿속에는 남았다.' },
      { label: '답글을 단다', d: { mind: -5, spice: 3 }, line: '싸움이 됐다. 그게 또 조회수가 됐다.' },
      { label: '무시한다', d: { mind: 2, lazy: 1 }, line: '무시하는 데도 힘이 든다는 걸 알았다.' },
    ],
  },

  // ---- 실버 구간
  {
    id: 'yellow',
    at: ['silver'],
    weight: 11,
    text: '노란 딱지가 붙었다. 이유는 안 알려 준다.',
    d: { money: -200, mind: -4 },
  },
  {
    id: 'scam',
    at: ['silver'],
    weight: 9,
    when: (r) => r.subs >= 5000,
    text: '협찬 제안이 왔다. 선입금 없이 먼저 찍어 달라고 한다.',
    choices: [
      { label: '찍어 준다', d: { body: -4, mind: -5, money: -50 }, line: '영상은 올라갔고 연락은 끊겼다.' },
      { label: '거절한다', d: { mind: 1, lazy: -1 }, line: '나중에 사기였다는 폭로가 올라왔다.' },
    ],
  },
  {
    id: 'burnraid',
    at: ['silver'],
    weight: 9,
    when: (r) => r.spice >= 12,
    text: '예전에 올린 영상이 다시 파였다. 캡처가 돌고 있다.',
    choices: [
      {
        label: '사과문을 올린다',
        d: { subs: -4000, mind: -6, spice: -6 },
        line: '조회수는 사과문이 제일 잘 나왔다.',
      },
      {
        label: '버틴다',
        d: { mind: -8, spice: 4 },
        line: '삼 일 뒤 커뮤니티 메인에 올라갔다.',
        kills: 'canceled',
      },
    ],
  },
  {
    id: 'silverbtn',
    once: true,
    at: ['silver'],
    weight: 12,
    when: (r) => r.subs >= 90000,
    text: '실버 버튼 신청 메일이 왔다.',
    d: { mind: 8, plan: 2 },
  },
  {
    id: 'burnout',
    at: ['silver'],
    weight: 9,
    when: (r) => r.stats.body <= 12,
    text: '카메라를 켜는 게 무섭다. 오늘도 안 켰다.',
    choices: [
      { label: '억지로 켠다', d: { body: -6, mind: -3 }, line: '삼십 분 찍고 다 지웠다.' },
      { label: '한 주 쉰다', d: { body: 12, mind: 6, subs: -1500 }, line: '쉬는 동안 아무 일도 안 일어났다. 그게 무서웠다.' },
    ],
  },
  {
    id: 'friend',
    once: true,
    at: ['silver'],
    weight: 8,
    text: '같이 시작한 친구가 채널을 접는다고 한다.',
    choices: [
      { label: '말린다', d: { mind: -2, body: -1 }, line: '한 달 더 하다 결국 접었다.' },
      { label: '응원한다', d: { mind: 3, plan: 1 }, line: '친구가 장비를 다 넘겨 줬다.' },
    ],
    meets: '같이 시작한 친구',
  },
  {
    id: 'oldvid',
    at: ['silver'],
    weight: 7,
    text: '무명 때 올린 영상이 갑자기 터졌다. 얼굴이 화끈거린다.',
    d: { subs: 3000, mind: -2 },
  },
];
