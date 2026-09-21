import type { Chapter, Ev, Home, Life } from './types';

/**
 * 인생 키우기 - 글과 숫자.
 *
 * **이 파일이 곧 게임이다.** 시스템은 며칠이면 짜지만 여기가 안 웃기면
 * 그냥 엑셀이다.
 *
 * 규칙 하나: **분노는 구조에서, 공감은 사람에서.** 집값·학원비·사수는
 * 분노 담당이고, 친구·부모·짝꿍은 공감 담당이다. 반씩 섞는다.
 *
 * 규칙 둘: **기질은 숫자로 안 보여 준다.** 보이면 최적해를 찾아 버리고,
 * 그러면 "착하게 키웠는데 날라리가 됐다" 가 안 나온다.
 */

// ------------------------------------------------------------------ 집안

/**
 * 태어나는 순간 뽑는다. 이게 첫 화면이고 **분노 담당**이다.
 *
 * 좋은 집이 드물어야 한다. 흔하면 분노가 안 생기고, 분노가 안 생기면
 * 결과 화면이 안 돌아다닌다.
 */
export const HOMES: Home[] = [
  {
    id: 'chaebol',
    name: '재벌 2세',
    weight: 0.3,
    rank: 5,
    d: { money: 9999, charm: 8, mind: -4, head: 2 },
    line: '눈을 뜨니 창밖에 한강이 흐른다.',
  },
  {
    id: 'rich',
    name: '사장님 댁',
    weight: 4,
    rank: 4,
    d: { money: 300, charm: 4, head: 2 },
    line: '아버지가 명함을 준다. 읽을 줄은 모른다.',
  },
  {
    id: 'dual',
    name: '맞벌이 집',
    weight: 22,
    rank: 3,
    d: { money: 80, head: 2, mind: -2, charm: -1 },
    line: '집에 아무도 없다. 밥상에 랩이 씌워져 있다.',
  },
  {
    id: 'plain',
    name: '평범한 집',
    weight: 36,
    rank: 3,
    d: { money: 60 },
    line: '특별할 것 없는 집이다. 그게 특별한 건지는 아직 모른다.',
  },
  {
    id: 'single',
    name: '한부모 가정',
    weight: 18,
    rank: 2,
    d: { money: 30, mind: 3, body: 2, charm: -1 },
    line: '엄마가 둘 몫을 한다. 그게 두 배로 힘든 일인 줄은 모른다.',
  },
  {
    id: 'debt',
    name: '빚 있는 집',
    weight: 15,
    rank: 1,
    d: { money: -20, mind: -3, rough: 2, body: 1 },
    line: '밤마다 누가 문을 두드린다. 아빠는 불을 끄고 조용히 하라고 한다.',
  },
  {
    id: 'orphan',
    name: '보육원',
    weight: 4.7,
    rank: 1,
    d: { money: 10, mind: 5, charm: -3, rough: 3, body: 2 },
    line: '이름을 누가 지어 줬는지 아무도 모른다.',
  },
];

// ------------------------------------------------------------------ 갈래

export const TRACKS: Record<string, string> = {
  good: '모범생',
  wild: '날라리',
  otaku: '덕후',
  plain: '그냥 애',
};

// ---------------------------------------------------------------- 챕터

export const CHAPTERS: Chapter[] = [
  {
    id: 'baby',
    name: '유년기',
    from: 0,
    to: 7,
    days: 8,
    /*
      여기서는 안 죽는다.

      태어나자마자 죽으면 카드도 못 받고 화만 난다. 유년기는 **기질을 만드는
      칸**이지 시험하는 칸이 아니다.
    */
    deadly: false,
    actions: [
      {
        id: 'playground',
        name: '놀이터에 간다',
        hint: '미끄럼틀은 거꾸로 올라가는 맛이다',
        d: { body: 3, charm: 2, head: -1 },
        lines: [
          '모래를 한 움큼 먹었다. 맛은 없었다.',
          '그네를 서서 탔다. 아무도 안 말렸다.',
          '미끄럼틀을 거꾸로 올라가다 미끄러졌다.',
        ],
      },
      {
        id: 'book',
        name: '그림책을 본다',
        hint: '글자는 아직 그림이다',
        d: { head: 3, charm: -1, mind: 1 },
        lines: [
          '같은 장을 마흔 번 봤다. 공룡이 좋다.',
          '글자는 모르지만 어디서 넘겨야 하는지는 안다.',
          '엄마가 읽어 주던 부분을 혼자 중얼거렸다.',
        ],
      },
      {
        id: 'tantrum',
        name: '떼를 쓴다',
        hint: '마트 바닥은 눕기 좋다',
        d: { money: 12, rough: 2, charm: -1, mind: 1 },
        lines: [
          '마트 바닥에 누웠다. 십 분 만에 장난감을 얻었다.',
          '울면 된다는 걸 배웠다. 이건 오래 간다.',
          '숨을 참고 얼굴이 빨개질 때까지 버텼다. 이겼다.',
        ],
      },
      {
        id: 'errand',
        name: '심부름을 한다',
        hint: '두부 한 모',
        d: { mind: 2, rough: -2, charm: 1 },
        lines: [
          '두부를 사 왔다. 거스름돈도 다 가져왔다.',
          '주인 아저씨가 사탕을 하나 더 줬다.',
          '가는 길을 세 번 확인했다. 안 잃어버렸다.',
        ],
      },
      {
        id: 'friend',
        name: '어린이집 친구와 논다',
        hint: '이름은 아직 모른다',
        d: { charm: 3, head: -1, mind: 1 },
        lines: [
          '이름도 모르는 애랑 하루 종일 붙어 다녔다.',
          '블록을 나눠 줬다. 그게 친구가 되는 방법이었다.',
          '같이 혼났다. 그게 더 친해지는 방법이었다.',
        ],
      },
      {
        id: 'alone',
        name: '혼자 논다',
        hint: '장난감을 줄 세운다',
        d: { head: 2, mind: 1, charm: -2, slick: 1 },
        lines: [
          '자동차를 색깔 순으로 줄 세웠다. 누가 건드리면 화가 난다.',
          '혼자가 편하다는 걸 여기서 배운다.',
          '말없이 세 시간을 놀았다. 어른들이 순하다고 했다.',
        ],
      },
    ],
    gate: (l) => {
      if (l.rough >= 4) return { track: 'plain', line: '기가 세다는 말을 자주 듣는 아이가 됐다.' };
      if (l.rough <= -3) return { track: 'plain', line: '착하다는 말을 자주 듣는 아이가 됐다.' };
      return { track: 'plain', line: '여덟 살이 됐다. 가방이 몸보다 크다.' };
    },
  },
  {
    id: 'grade',
    name: '초등학교',
    from: 8,
    to: 13,
    days: 10,
    deadly: true,
    actions: [
      {
        id: 'homework',
        name: '숙제를 한다',
        hint: '일기는 지어낸다',
        d: { head: 4, mind: -2, slick: 1 },
        lines: [
          '일기를 사흘 치 몰아서 썼다. 날씨는 다 맑음이었다.',
          '받아쓰기 100점. 냉장고에 붙었다.',
          '숙제를 다 하고 나니 할 게 없었다.',
        ],
      },
      {
        id: 'academy',
        name: '학원에 간다',
        hint: '끝나면 또 다른 학원',
        d: { head: 6, mind: -3, money: -15, body: -1 },
        lines: [
          '학원 끝나고 또 학원. 가방이 두 개다.',
          '셔틀버스에서 잤다. 그게 유일한 휴식이었다.',
          '선생님이 잘한다고 했다. 엄마가 하나 더 등록했다.',
        ],
      },
      {
        id: 'play',
        name: '친구들과 논다',
        hint: '해 질 때까지',
        d: { charm: 4, head: -1, body: 2, mind: 2 },
        lines: [
          '가로등 켜질 때까지 놀았다. 혼났지만 안 억울했다.',
          '문방구 앞에서 뽑기를 했다. 셋 다 꽝이었다.',
          '누가 먼저 집에 가나 버티다 둘 다 늦었다.',
        ],
      },
      {
        id: 'soccer',
        name: '운동장에서 뛴다',
        hint: '무릎은 늘 까져 있다',
        d: { body: 5, charm: 2, head: -2 },
        lines: [
          '무릎이 까졌다. 침을 발랐다.',
          '골을 넣었다. 자책골이었다.',
          '해가 질 때까지 뛰었다. 다리가 안 움직였다.',
        ],
      },
      {
        id: 'game',
        name: '게임을 한다',
        hint: '"30분만"',
        d: { mind: 4, head: -2, slick: 2, body: -2 },
        lines: [
          '"30분만" 이라고 했다. 세 시간이 지났다.',
          '엄마 오는 소리에 전원을 뽑았다. 다시 켜지는 데 오래 걸렸다.',
          'PC방 요금을 아끼려고 걸어서 갔다.',
        ],
      },
      {
        id: 'draw',
        name: '만화를 그린다',
        hint: '공책 뒷장이 작업실이다',
        d: { head: 2, mind: 3, charm: -2, slick: -1 },
        lines: [
          '공책 뒷장을 다 채웠다. 아무한테도 안 보여 줬다.',
          '주인공 이름만 열 번 바꿨다.',
          '그림은 늘었는데 숙제는 안 늘었다.',
        ],
      },
      {
        id: 'crew',
        name: '형들을 따라다닌다',
        hint: '담배 냄새가 난다',
        d: { rough: 5, charm: 3, mind: -2, head: -2, body: 1 },
        when: (l) => l.rough >= 3,
        lines: [
          '형들이 오락실 자리를 비켜 줬다. 어깨가 올라갔다.',
          '심부름을 했다. 잔돈은 가지라고 했다.',
          '담배 냄새가 옷에 뱄다. 엄마가 물었지만 아니라고 했다.',
        ],
      },
    ],
    gate: (l) => {
      if (l.rough >= 9) return { track: 'wild', line: '선생님이 부모님을 부르는 횟수가 늘었다.' };
      if (l.stats.head >= 26 && l.rough <= 2) return { track: 'good', line: '반장을 두 번 했다.' };
      if (l.stats.charm <= 11 && l.stats.mind >= 16) return { track: 'otaku', line: '쉬는 시간에 늘 뭔가를 그리고 있었다.' };
      return { track: 'plain', line: '눈에 띄지 않는 아이로 졸업했다.' };
    },
  },
];

// ---------------------------------------------------------------- 이벤트

export const EVENTS: Ev[] = [
  // ---- 유년기
  {
    id: 'grandma',
    once: true,
    at: ['baby'],
    weight: 10,
    text: '할머니가 손에 뭔가를 꼭 쥐여 준다. 꼬깃한 천 원짜리다.',
    d: { money: 5, mind: 3 },
    meets: '할머니',
  },
  {
    id: 'kindergarten',
    once: true,
    at: ['baby'],
    weight: 9,
    text: '어린이집에서 재롱잔치를 한다. 맨 뒷줄이다.',
    choices: [
      { label: '열심히 춘다', d: { charm: 3, mind: 1 }, line: '박자는 하나도 안 맞았지만 제일 크게 움직였다.' },
      { label: '가만히 서 있는다', d: { mind: -2, head: 1 }, line: '영상에 남았다. 스무 해 뒤에 놀림거리가 된다.' },
    ],
  },
  {
    id: 'brokentoy',
    at: ['baby'],
    weight: 8,
    text: '아끼던 장난감이 부러졌다. 붙일 수가 없다.',
    choices: [
      { label: '운다', d: { mind: -2, charm: 1 }, line: '한 시간을 울었다. 아무것도 안 바뀌었다.' },
      { label: '테이프를 붙인다', d: { head: 2, slick: 1 }, line: '삐뚤빼뚤하지만 다시 굴러갔다.' },
    ],
  },
  {
    id: 'lostmom',
    once: true,
    at: ['baby'],
    weight: 7,
    text: '마트에서 엄마를 놓쳤다.',
    choices: [
      { label: '제자리에 선다', d: { mind: 3, rough: -2 }, line: '오 분 만에 엄마가 왔다. 잘했다고 했다.' },
      { label: '찾아다닌다', d: { body: 2, rough: 2, mind: -3 }, line: '삼십 분을 헤맸다. 방송까지 나왔다.' },
    ],
  },
  {
    id: 'sibling',
    once: true,
    at: ['baby', 'grade'],
    weight: 6,
    text: '동생이 생겼다. 관심이 절반으로 줄었다.',
    d: { mind: -3, charm: 2, rough: 1 },
    meets: '동생',
  },

  // ---- 초등
  {
    id: 'deskmate',
    once: true,
    at: ['grade'],
    weight: 10,
    text: '짝꿍이 바뀌었다. 책상에 금을 그어 놨다.',
    choices: [
      { label: '지운다', d: { charm: 3, rough: -1 }, line: '지웠더니 같이 웃었다. 그날부터 친해졌다.' },
      { label: '나도 긋는다', d: { rough: 3, charm: -1 }, line: '일 년 내내 말을 안 했다.' },
    ],
    meets: '짝꿍',
  },
  {
    id: 'fieldtrip',
    at: ['grade'],
    weight: 9,
    text: '소풍날이다. 김밥 도시락을 연다.',
    when: (l) => l.money >= 20,
    d: { mind: 4, charm: 2 },
  },
  {
    id: 'nolunch',
    at: ['grade'],
    weight: 9,
    when: (l) => l.money < 20,
    text: '소풍날인데 도시락이 없다. 수돗가에서 물을 마셨다.',
    choices: [
      { label: '괜찮다고 한다', d: { mind: -4, rough: 3 }, line: '배고픈 건 하루면 지나간다. 창피한 건 안 지나간다.' },
      { label: '친구에게 얻어먹는다', d: { charm: 3, mind: -1 }, line: '친구가 반을 덜어 줬다. 아무 말도 안 했다.' },
    ],
  },
  {
    id: 'bully',
    at: ['grade'],
    weight: 9,
    text: '덩치 큰 애가 돈을 달라고 한다.',
    choices: [
      { label: '준다', d: { money: -20, mind: -4, rough: -1 }, line: '그날부터 매주 왔다.' },
      { label: '거절한다', d: { body: -5, rough: 4, charm: 2 }, line: '맞았다. 대신 다시는 안 왔다.' },
      { label: '선생님께 말한다', d: { mind: 2, charm: -3, rough: -2 }, line: '해결은 됐다. 고자질쟁이가 됐다.' },
    ],
  },
  {
    id: 'exam',
    at: ['grade'],
    weight: 8,
    text: '받아쓰기 시험지를 받았다. 60점이다.',
    choices: [
      { label: '보여 준다', d: { mind: -3, rough: -2, head: 2 }, line: '혼났다. 대신 그날 같이 공부했다.' },
      { label: '숨긴다', d: { slick: 3, mind: -1 }, line: '가방 깊숙이 넣었다. 삼 주 뒤에 들켰다.' },
      { label: '점수를 고친다', d: { slick: 5, rough: 2, mind: -2 }, line: '6을 8로 고쳤다. 필체가 달랐다.' },
    ],
  },
  {
    id: 'papercall',
    at: ['grade'],
    weight: 7,
    text: '학원비 고지서가 식탁에 올라와 있다. 부모님이 한참 본다.',
    d: { mind: -3, money: -10, head: 1 },
  },
  {
    id: 'dadlate',
    at: ['grade'],
    weight: 7,
    text: '아빠가 오늘도 늦는다. 혼자 라면을 끓였다.',
    d: { body: -1, mind: -2, head: 1, slick: 1 },
  },
  {
    id: 'pocket',
    at: ['grade'],
    weight: 7,
    text: '세뱃돈이 들어왔다. 엄마가 "맡아 준다" 고 한다.',
    choices: [
      { label: '맡긴다', d: { money: 5, rough: -2, mind: 1 }, line: '그 돈은 다시 볼 수 없었다.' },
      { label: '숨긴다', d: { money: 40, slick: 3, rough: 2 }, line: '책장 뒤에 숨겼다. 이 년 뒤에 찾았다.' },
    ],
  },
  {
    id: 'pcroom',
    at: ['grade'],
    weight: 7,
    when: (l) => l.slick >= 3,
    text: '친구가 PC방에 가자고 한다. 학원 시간이다.',
    choices: [
      { label: '간다', d: { mind: 5, head: -3, slick: 4, rough: 2, money: -10 }, line: '세 시간이 삼십 분 같았다. 학원에서 전화가 왔다.' },
      { label: '학원에 간다', d: { head: 4, mind: -3, rough: -1 }, line: '창밖을 보는 시간이 길었다.' },
    ],
  },
  {
    id: 'crosswalk',
    at: ['grade'],
    weight: 5,
    when: (l) => l.rough >= 6,
    text: '신호가 바뀌기 직전이다. 친구가 먼저 뛴다.',
    choices: [
      {
        label: '따라 뛴다',
        d: { rough: 3, body: -4 },
        line: '차가 급정거했다. 운전자가 창문을 내리고 소리쳤다.',
        kills: 'traffic',
      },
      { label: '기다린다', d: { rough: -2, mind: 1 }, line: '친구가 건너편에서 손짓했다. 삼십 초였다.' },
    ],
  },
  {
    id: 'teacher',
    once: true,
    at: ['grade'],
    weight: 6,
    text: '담임 선생님이 조용히 부른다. "요즘 무슨 일 있니?"',
    choices: [
      { label: '없다고 한다', d: { mind: -2, slick: 2 }, line: '선생님은 더 묻지 않았다.' },
      { label: '말한다', d: { mind: 5, charm: 2, rough: -2 }, line: '별말은 없었다. 그냥 들어 줬다.' },
    ],
    meets: '담임 선생님',
  },
];
