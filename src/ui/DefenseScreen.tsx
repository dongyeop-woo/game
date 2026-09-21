import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Modal,
  PanResponder,
  type PanResponderInstance,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Text } from './Text';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMeta } from '../game/GameContext';
import { avatarDef } from '../game/avatars';
import {
  COLS,
  LIFE_MAX,
  ROWS,
  STEP_SEC,
  START_GOLD,
  TRACK_MARGIN,
  fieldFree,
  WAVE_GAP,
  combinePlan,
  combineTier,
  starUpNow,
  combinePlanCost,
  starUpPair,
  createDefWorld,
  defStage,
  BOSS_EVERY,
  isBossWave,
  moveUnit,
  moveHero,
  nearestSlot,
  buyAndPlace,
  offerPrice,
  takeGold,
  SHOP_TIERS,
  shopPrice,
  summon,
  rerollOffer,
  nextRollCost,
  lifeRatio,
  pathPoint,
  SLOTS,
  unitAtSlot,
  sellUnit,
  stepDef,
  type DefBoard,
  type DefUnit,
  type DefWorld,
} from '../game/defense';
import { fmt } from '../game/format';
import { ArenaBackdrop, ArenaBoard, ArenaShadow, arenaArtFor } from './art/arena';
import { MagicCircle } from './art/wizard';
import { GUIDE, TutorialBubble } from './Tutorial';
import { BoardModels, type Motion } from './art/BoardModels';
import { attackOf, leanOf } from './art/attacks';
import { BattleCanvas } from './art/BattleCanvas';
import { artFor, rigFor } from './art/characters';
import { SpriteArt, SpriteStill } from './art/sprite';
import { photoFor } from './art/photos';
import { RigArt } from './art/rig';
import { avatarSpriteFor, spriteFor } from './art/sprites';
import { buzz, setHapticsOn } from './haptics';
import { MODELS } from './art/models';
import {
  COMBINE_COUNT,
  ROSTER,
  upgradeOf,
  dps as unitDps,
  sellValue,
  starMul,
  unitDef,
  type RosterUnit,
} from '../game/roster';
import { TIERS, type Tier } from '../game/progress';
import { TIER_ORDER } from '../game/avatars';
import { AvatarArt } from './art/avatar';
import { CoinIcon, MenuIcon, type IconName } from './art/icons';
import { Button, Frame, Toggle } from './components';
import { C, G, RARITY_G, inkShadow, numeric, shadow } from './theme';

/**
 * 그리드 랜덤 디펜스 전투 화면.
 *
 * 판(3x3)을 트랙이 둘러싸고 적이 그 위를 시계방향으로 돈다. 가운데 칸에는
 * 로비에서 쓰던 아바타가 서고, 나머지 여덟 칸에 유닛이 **여러 마리씩 겹쳐**
 * 선다. 어느 칸에 서느냐에 따라 사거리가 닿는 범위가 달라진다.
 *
 * 게임 로직은 defense.ts 가 전부 갖고 있다. 이 파일은 World 를 읽어 그리고
 * 버튼을 눌러 액션을 부를 뿐이다.
 *
 * 좌표는 전부 '칸 단위'로 계산해서 픽셀로 바꾼다(`toPx`). 그래야 화면 크기가
 * 달라져도 유닛과 트랙이 어긋나지 않는다.
 */

const MAX_STEPS_PER_FRAME = 5;
/**
 * 살 수 있는 카드를 두르는 오로라 색.
 *
 * 청록 → 파랑 → 보라. 단색 파랑은 너무 찐해서 카드보다 테두리가 먼저
 * 보였다. 채도를 낮추고 색을 흘리면 '끌 수 있다'는 신호만 남는다.
 */
const AURORA = ['rgba(126,226,206,0.72)', 'rgba(112,168,235,0.6)', 'rgba(168,138,240,0.7)'] as const;

/**
 * 영웅 이상은 테두리까지 등급색으로 간다.
 *
 * 카드 바탕은 원래 등급색이었지만, 테두리가 전부 같은 오로라라 **뜬 순간**은
 * 다 똑같아 보였다. 전설 한 장이 300 골드 넘게 하는데 그게 눈에 안 띄면
 * 그냥 넘겨 버린다. 일반·희귀는 그대로 둔다 - 늘 뜨는 것까지 빛나면
 * 빛나는 게 아무 뜻이 없다.
 */
const TIER_RING: Partial<Record<Tier, readonly [string, string, string]>> = {
  epic: ['#d9b4ff', '#a56ee0', '#6f36b5'],
  legend: ['#ffe9a8', '#f0c44d', '#c48a12'],
  mythic: ['#ffc7e8', '#ff8fd0', '#b02a9a'],
};

/** 채팅에 남기는 지난 줄 수. 판을 가리면 안 되니 세 줄까지만. */
const CHAT_KEEP = 3;

/** 골드 '+n' 이 떠 있는 시간(밀리초) */
const GAIN_LIFE = 900;

/**
 * 목표 프레임.
 *
 * 화면에 '현재 / 설정'으로 띄우니, 실제 렌더 간격도 반드시 이 값에서
 * 뽑아 써야 한다 - 둘이 갈리면 표시가 거짓말이 된다.
 */
const RENDER_FPS = 60;

/**
 * 화면 나머지를 다시 그리는 빈도.
 *
 * 움직이는 것 - 적·공격 연출·피해 숫자 - 은 캔버스가 따로 60 으로 그린다
 * (`art/BattleCanvas.tsx`). 남은 건 골드·웨이브 막대·카드 줄처럼 초에 몇 번
 * 바뀌는 값들이라 60번씩 맞춰 볼 이유가 없다. 절반으로 줄인 만큼 JS 가 논다.
 */
const UI_FPS = 30;

/** 하단 영역 높이 - 상점 줄 위 끝부터 화면 아래 끝까지 (보유 유닛 한 줄 기준) */
const BOTTOM_PANEL_H = 222;
/** 판 아래 조합 카드 한 장의 높이 */
const COMBINE_CARD_H = 68;

type ChatLine = { id: number; who: 'me' | 'sys'; text: string; tag?: string };
/** 트랙 길(적이 걷는 띠)의 폭 - 칸 단위 */
const ROAD = 1;
/**
 * 화면이 차지하는 칸 수.
 * 판(3) + 좌우 트랙 마진(0.8x2) + 길 폭의 절반씩(0.35x2).
 * 경로가 길 한가운데를 지나야 적이 띠 위를 걷는 것처럼 보인다.
 */
const SPAN = COLS + TRACK_MARGIN * 2 + ROAD;
/** 칸 좌표 -> 화면 좌표로 옮길 때 더하는 값 */
const ORIGIN = TRACK_MARGIN + ROAD / 2;

export function DefenseScreen({
  stageId,
  mode,
  onExit,
}: {
  stageId: string;
  /** 채팅은 PVP 에서만 뜬다 - 혼자 하는 판에 대화창이 있을 이유가 없다 */
  mode: 'tutorial' | 'normal' | 'pvp';
  onExit: () => void;
}) {
  const { meta, setHaptics, finishBattle, discoverUnits } = useMeta();
  const showFps = meta.showFps;
  /*
    진동은 설정 한 곳에서만 끈다.

    울리는 자리마다 설정을 물어보면 빠뜨리는 데가 생긴다. 여기서 한 번 알려 둔다.
  */
  useEffect(() => setHapticsOn(meta.haptics), [meta.haptics]);
  const stage = useMemo(() => defStage(stageId), [stageId]);
  const avatar = useMemo(() => avatarDef(meta.avatar), [meta.avatar]);

  // 튜토리얼은 지지 않는다 - 배우러 온 판에서 쫓겨나면 배울 게 없다
  /*
    판은 **한 번만** 만든다.

    useRef 안에 바로 적어 두면 화면을 다시 그릴 때마다 판을 새로 만든다 -
    쓰이지도 않고 버려지지만 배열과 첫 제안까지 만드느라, 초당 서른 번씩
    쓰레기가 쌓인다.
  */
  const worldRef = useRef<DefWorld>(null as unknown as DefWorld);
  if (!worldRef.current) worldRef.current = createDefWorld(stageId, mode === 'tutorial');
  const [, setTick] = useState(0);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  /*
    고른 유닛 **종류**.

    전에는 판의 유닛을 짚으면 그 한 마리가 골라져서, 옮기려고 끌 때마다
    팔기 창이 같이 떴다 - 옮기는 손과 파는 손이 섞였다. 지금은 아래
    '보유 유닛' 줄을 눌러야만 열린다. 옮기기는 판에서, 팔기는 목록에서.
  */
  const [picked, setPicked] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  /*
    골드가 들어올 때 뜨는 '+n'.

    피해 숫자는 뜨는데 수입은 안 보여서, 적을 잡아 얼마를 벌었는지가 오른쪽
    위 숫자가 슬쩍 바뀌는 것으로만 나타났다. 번 순간에 그 자리에서 보여야
    '잘 막으면 돈이 는다'가 몸에 남는다.

    상태가 아니라 ref 에 쌓는다 - 이 화면은 어차피 매 프레임 다시 그리니
    setState 를 부르면 렌더만 한 번 더 돌 뿐이다.
  */
  const gains = useRef<{ id: number; amount: number; at: number }[]>([]);
  const goldBox = useRef<{ x: number; y: number; h: number } | null>(null);
  const goldChip = useRef<View>(null);
  const [showTable, setShowTable] = useState(false);
  /** 실제로 나오는 프레임 - 초에 한 번만 갱신한다 */
  const [fps, setFps] = useState(0);

  /*
    튜토리얼 안내.

    연습판에서만 뜬다. 한 걸음씩 '무엇을 하는 게임인지'를 알려 주는데,
    글을 읽게 시키는 대신 **직접 해 보면 저절로 넘어가게** 한다 - 손이 먼저
    나가는 사람은 안내를 읽을 새도 없이 지나가고, 읽고 싶은 사람은 말풍선을
    눌러 넘긴다.
  */
  const [step, setStep] = useState(0);
  /*
    시키는 걸음에서는 판을 멈춘다.

    루프는 effect 안에서 도는데 거기까지 값을 들고 갈 수가 없어 ref 로 넘긴다.
  */
  const pausedRef = useRef(false);
  pausedRef.current = mode === 'tutorial' && (GUIDE[step]?.pause ?? false);

  /*
    튜토리얼에서는 시키는 것 하나만 되게 한다.

    판 전체를 열어 두면 처음 하는 사람이 시키지도 않은 걸 건드리다 길을
    잃는다. PanResponder 는 한 번 만들어 두고 계속 쓰니 ref 로 읽는다.
  */
  const allowRef = useRef<'card' | 'board' | 'none' | 'all'>('all');
  allowRef.current =
    mode === 'tutorial' && step < GUIDE.length ? (GUIDE[step].allow ?? 'none') : 'all';
  const lets = (what: 'card' | 'board') =>
    allowRef.current === 'all' || allowRef.current === what;

  /*
    전투 중 대화.

    원랜디는 같은 방 사람들과 떠들면서 하는 게임이라 채팅이 화면의 일부다.
    다만 우리는 아직 서버가 없어서 남의 말은 오지 않는다 - 그래서 비어 있는
    상자만 두는 대신, 판이 알려 주는 말(웨이브 시작, 정문 피해)을 같은 줄에
    흘려 보낸다. 그러면 최소한 살아 있는 창이 된다.

    지난 줄을 몇 개나 남길지: 판을 가리면 안 되니 세 줄. 그 위는 버린다.
  */
  /*
    전투가 끝났는지, 그리고 끝났을 때 부를 것들.

    루프 안에서 쓰는데 매 렌더 새로 만들어지는 함수라, ref 에 담아 최신 것을
    가리키게 한다. 결과는 두 번 처리되면 보상이 두 번 들어가니 ref 로 막는다.
  */
  const resultRef = useRef<'win' | 'lose' | null>(null);
  const finishRef = useRef({ finishBattle, discoverUnits });
  finishRef.current = { finishBattle, discoverUnits };

  const chatOn = mode === 'pvp';
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');
  const chatId = useRef(1);
  /**
   * 한 줄 추가.
   *
   * `tag` 가 같은 줄이 바로 앞에 있으면 덮어쓴다. 정문은 적 한 마리마다
   * 뚫리니 그냥 쌓으면 "정문이 뚫렸다"가 세 줄을 다 잡아먹고 대화가 밀린다.
   */
  const pushLine = (who: 'me' | 'sys', text: string, tag?: string) =>
    setChat((c) => {
      const last = c[c.length - 1];
      if (tag && last && last.tag === tag) {
        return [...c.slice(0, -1), { ...last, text }];
      }
      return [...c, { id: chatId.current++, who, text, tag }].slice(-CHAT_KEEP);
    });

  /*
    키보드가 올라오면 입력칸이 그 밑에 깔린다.

    화면 전체를 줄이면(behavior="padding") 판 크기가 폭으로 정해져 있어 넘친다.
    그래서 아래 덩어리만 필요한 만큼 밀어 올린다 - 얼마나 밀지는 눈대중이
    아니라 입력칸을 실제로 재서 정한다.
  */
  const chatRowRef = useRef<View>(null);
  const [lift, setLift] = useState(0);

  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const boardPx = Math.min(screenW - 20, 420);
  /** 경기장 그림에 판이 그려져 있으면 코드는 판을 안 그린다 */
  const painted = arenaArtFor(stageId) != null;
  const cell = boardPx / SPAN;
  /*
    판의 세로 자리.

    남는 공간의 가운데가 아니라 화면에서 잰 고정값이다 - 아래 줄 높이가
    바뀌어도 판과 배경이 움직이지 않아야 한다. 0.36 은 눈으로 맞춘 값으로,
    위쪽 HUD 와 아래 줄 사이에 판이 가운데쯤 오는 지점이다.
  */
  /*
    단, 판 아래 줄(정문·골드 칩 + 조합 카드)이 **하단 영역에 먹히면 판을 올린다.**

    그 줄은 판 바로 아래 고정 자리에 뜨는데, 하단 영역에 상점 줄이 들어오면서
    짧은 화면(17 Pro, 874pt)에서는 조합 카드가 상점의 전설 칸을 덮었다. 긴 화면
    (16 Pro Max, 956pt)은 5pt 남아서 괜찮았다.

    치수는 두 기기 실제 화면에서 쟀다 - 하단 영역(상점 줄 위 끝부터 화면 끝까지)
    약 222pt, 조합 카드 약 68pt. 하단 줄을 바꾸면 이 두 값도 같이 봐야 한다.
    화면 크기만으로 정해지는 값이라 판이 게임 중에 움직이지는 않는다.
  */
  const arenaTop = Math.min(
    (screenH - insets.top - boardPx) * 0.36,
    screenH - insets.top - BOTTOM_PANEL_H - (boardPx + 10 + COMBINE_CARD_H + 6),
  );
  const toPx = (p: { x: number; y: number }) => ({
    left: (p.x + ORIGIN) * cell,
    top: (p.y + ORIGIN) * cell,
  });

  /*
    끌어서 옮기기.

    탭은 '고르기'로 남겨 둔다 - 한 칸에 여러 마리가 겹쳐 서기 때문에 눌러서
    차례로 넘기는 동작이 따로 필요하다. 옮기는 건 끌기로 한다.

    좌표는 화면(page) 기준으로 받아 판의 좌상단을 빼서 쓴다. nativeEvent 의
    locationX 는 '터치를 받은 뷰' 기준이라 칸 Pressable 위에서는 칸 안에서의
    좌표가 나와 버린다 - 판 전체에서의 위치가 필요하니 쓰면 안 된다.
  */
  const arenaRef = useRef<View>(null);
  const arenaAt = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);

  /** 배경 그림의 마당을 판에 맞추려면 판이 화면 어디에 있는지 알아야 한다 */
  const [boardTop, setBoardTop] = useState<number | null>(null);

  const measureArena = () => {
    arenaRef.current?.measureInWindow((x, y) => {
      arenaAt.current = { x, y };
      setBoardTop((prev) => (prev != null && Math.abs(prev - y) < 0.5 ? prev : y));
    });
  };

  /** 화면 좌표(판 기준 px) -> 판 좌표(칸 단위) */
  const boardAt = (x: number, y: number) => ({ x: x / cell - ORIGIN, y: y / cell - ORIGIN });

  /** 그 지점에서 가장 가까운 유닛 - 겹쳐 서 있으면 맨 위(나중에 그려진 것)를 집는다 */
  const unitNear = (x: number, y: number) => {
    const p = boardAt(x, y);
    const units = worldRef.current.boards[0].units;
    let best: (typeof units)[number] | null = null;
    let bestD = 0.45; // 이보다 멀면 빈 곳을 짚은 것으로 본다
    for (const u of units) {
      const d = Math.hypot(u.x - p.x, u.y - p.y);
      if (d <= bestD) {
        bestD = d;
        best = u;
      }
    }
    return best;
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        // 판 전체가 하나의 터치 영역이다 - 탭은 고르기, 끌면 옮기기
        onStartShouldSetPanResponder: () => lets('board'),
        onPanResponderGrant: (_evt, g) => {
          const u = unitNear(g.x0 - arenaAt.current.x, g.y0 - arenaAt.current.y);
          dragRef.current = u ? { id: u.id, moved: false } : null;
          // 유닛이 아니라 빈 곳을 짚었다 - 아바타를 그리로 보낸다
          if (!u) {
            const p = boardAt(g.x0 - arenaAt.current.x, g.y0 - arenaAt.current.y);
            moveHero(worldRef.current, p.x, p.y);
            bump();
          }
        },
        onPanResponderMove: (_evt, g) => {
          const held = dragRef.current;
          // 빈 곳을 끌고 있으면 아바타가 손가락을 따라온다
          if (!held) {
            const p = boardAt(g.moveX - arenaAt.current.x, g.moveY - arenaAt.current.y);
            moveHero(worldRef.current, p.x, p.y);
            return;
          }
          // 손가락이 조금이라도 움직여야 끌기로 친다 (탭과 구별)
          if (!held.moved && Math.abs(g.dx) + Math.abs(g.dy) < 8) return;
          held.moved = true;
          setDrag({
            id: held.id,
            x: g.moveX - arenaAt.current.x,
            y: g.moveY - arenaAt.current.y,
          });
        },
        onPanResponderRelease: (_evt, g) => {
          const held = dragRef.current;
          dragRef.current = null;
          setDrag(null);
          if (held?.moved) {
            const p = boardAt(g.moveX - arenaAt.current.x, g.moveY - arenaAt.current.y);
            moveUnit(worldRef.current, held.id, p.x, p.y);
            buzz('place');
            bump();
            return;
          }
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
          setDrag(null);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cell],
  );

  /*
    카드를 판으로 끌어다 놓기.

    판 위의 드래그(유닛 옮기기)와 겹치지 않게, 카드마다 따로 응답기를 만든다.
    좌표는 화면(page) 기준으로 받아 판의 좌상단을 빼서 칸 좌표로 바꾼다 -
    판 안에서 손을 뗐을 때만 놓는다. 밖이면 아무 일도 안 일어난다(취소).
  */
  const [card, setCard] = useState<{ index: number; x: number; y: number } | null>(null);
  const cardRef = useRef<number | null>(null);

  const cardPan = useMemo(() => {
    const cache = new Map<number, ReturnType<typeof PanResponder.create>>();
    return (index: number) => {
      const hit = cache.get(index);
      if (hit) return hit;
      const r = PanResponder.create({
        onStartShouldSetPanResponder: () => lets('card'),
        onMoveShouldSetPanResponder: () => lets('card'),
        onPanResponderGrant: (_e, g) => {
          cardRef.current = index;
          setCard({ index, x: g.x0, y: g.y0 });
        },
        onPanResponderMove: (_e, g) => {
          if (cardRef.current != null) setCard({ index, x: g.moveX, y: g.moveY });
        },
        onPanResponderRelease: (_e, g) => {
          cardRef.current = null;
          setCard(null);
          const p = boardAt(g.moveX - arenaAt.current.x, g.moveY - arenaAt.current.y);
          // 판 밖에서 놓으면 아무 일도 안 일어난다 - 골드도 안 나간다
          if (p.x < -0.6 || p.y < -0.6 || p.x > COLS + 0.6 || p.y > ROWS + 0.6) return;
          buyAndPlace(worldRef.current, index, p.x, p.y);
          buzz('place');
          bump();
        },
        onPanResponderTerminate: () => {
          cardRef.current = null;
          setCard(null);
        },
      });
      cache.set(index, r);
      return r;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell]);

  useEffect(() => {
    if (!chatOn) return;
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      const kbTop = screenH - e.endCoordinates.height;
      // 밀기 전에 잰다 - 밀고 나서 재면 이미 옮겨진 자리가 나온다
      chatRowRef.current?.measureInWindow((_x, y, _w, h) => {
        setLift(Math.max(0, y + h + 10 - kbTop));
      });
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => setLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [chatOn, screenH]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    pushLine('me', t);
    setDraft('');
  };

  /*
    공격 몸짓 - 유닛 id 마다 '몸짓 시작' 함수를 걸어 두고, 게임 루프가 새 공격을 보면 부른다.
    유닛 층을 다시 그리지 않고 네이티브 애니메이션만 돌리려고 이렇게 나눴다.
  */
  const lunges = useRef(new Map<number, ((dx: number, dy: number) => void)[]>());
  const lastShot = useRef(0);
  /** 지금까지 잡은 수 - 늘어난 만큼이 아니라 '늘었는가'만 본다 */
  const killed = useRef(0);

  /*
    화면 흔들림.

    **타격마다 흔들면 멀미가 난다.** 정문이 깎이거나 보스가 나올 때처럼 드물고
    무거운 순간에만 한 번 친다. 네이티브 애니메이션이라 JS 는 시키고 손을 뗀다.
  */
  const shake = useRef(new Animated.Value(0)).current;
  const kick = useRef((power: number) => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, {
        toValue: power,
        duration: 45,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -power * 0.6,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }).current;
  /*
    한 유닛에 **둘 이상이 붙는다.**

    몸을 움직이는 쪽(`UnitMotion`)과 구운 그림을 공격 동작으로 바꾸는 쪽
    (`SpriteArt`)이 같은 순간을 듣는다. 하나만 담아 두면 나중에 붙은 쪽이
    앞엣것을 밀어낸다.
  */
  const registerLunge = useRef((id: number, fn: (dx: number, dy: number) => void) => {
    const list = lunges.current.get(id) ?? [];
    list.push(fn);
    lunges.current.set(id, list);
    return () => {
      const cur = lunges.current.get(id);
      if (!cur) return;
      const at = cur.indexOf(fn);
      if (at >= 0) cur.splice(at, 1);
      if (cur.length === 0) lunges.current.delete(id);
    };
  }).current;

  /*
    적·공격 연출·피해 숫자를 그리는 캔버스 (`art/BattleCanvas.tsx`).

    화면 전체를 다시 그리지 않고 게임 루프가 프레임마다 직접 부른다. 캔버스가
    그릴 준비(그림·글꼴)를 마치면 그리기 함수를 여기에 걸어 둔다.
  */
  const drawBattle = useRef<((w: DefWorld) => void) | null>(null);
  const registerCanvas = useRef((fn: (w: DefWorld) => void) => {
    drawBattle.current = fn;
    return () => {
      if (drawBattle.current === fn) drawBattle.current = null;
    };
  }).current;

  // ------------------------------------------------------------ 게임 루프
  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    let acc = 0;
    let lastRender = 0;
    let lastUi = 0;
    /** 이 시각까지는 판을 멈춘다 (잡는 순간의 '툭' 하는 멈춤) */
    let freezeUntil = 0;
    let drawn = 0;
    let fpsAt = Date.now();

    const loop = () => {
      const now = Date.now();
      acc += (now - last) / 1000;
      last = now;

      // 멈춘 동안 시간이 쌓이면 풀리는 순간 몇 프레임이 한꺼번에 튄다
      if (pausedRef.current) acc = 0;
      /*
        잡는 순간 0.045초만 판을 세운다.

        멈췄다 풀리는 그 틈이 '맞았다'를 만든다 - 격투 게임이 쓰는 수법이다.
        매번 걸면 게임이 끊기니, 연달아 잡아도 0.35초에 한 번만 건다.
      */
      if (now < freezeUntil) acc = 0;

      let steps = 0;
      while (acc >= STEP_SEC && steps < MAX_STEPS_PER_FRAME) {
        const ev = stepDef(worldRef.current, STEP_SEC);
        acc -= STEP_SEC;
        steps += 1;
        // 채팅 줄에 흘려 보내는 판 소식. 자주 뜨면 대화를 밀어내니 둘만 남긴다.
        if (ev.gold > 0) {
          gains.current.push({ id: worldRef.current.nextId++, amount: ev.gold, at: now });
          // 쌓아 두면 옛것까지 그리려 든다 - 화면에 뜰 만큼만 남긴다
          if (gains.current.length > 8) gains.current.splice(0, gains.current.length - 8);
        }
        if (chatOn && ev.waveStarted) {
          const n = worldRef.current.wave;
          pushLine('sys', `웨이브 ${n} 시작`);
        }
        if (chatOn && ev.leaked) {
          pushLine('sys', `정문 ${Math.max(0, worldRef.current.life)} / ${LIFE_MAX}`, 'gate');
        }
        if (ev.leaked) {
          buzz('gate');
          kick(0.7);
        }
        if (ev.waveStarted && isBossWave(worldRef.current.wave, worldRef.current.waveTotal)) {
          buzz('boss');
          kick(1);
        }

        if ((ev.finished === 'win' || ev.finished === 'lose') && !resultRef.current) {
          const done = ev.finished;
          resultRef.current = done;
          buzz(done === 'win' ? 'win' : 'lose');
          const w2 = worldRef.current;
          // 이번 판에 조합으로 처음 만든 유닛을 도감에 등록한다
          if (w2.discovered.length > 0) finishRef.current.discoverUnits(w2.discovered);
          /*
            연습판(튜토리얼)은 기록에 안 남긴다.

            지지 않게 만들었으니 반드시 이긴다 - 그대로 두면 튜토리얼만 돌려서
            스테이지를 전부 깨고 보상도 무한히 받는다. 배운 유닛은 도감에
            남기고, 클리어와 골드는 안 준다.
          */
          if (!w2.safe) finishRef.current.finishBattle(stageId, done === 'win', lifeRatio(w2));
          setResult(done);
        }
      }
      if (acc > STEP_SEC * MAX_STEPS_PER_FRAME) acc = 0;

      // 이번 프레임에 새로 나간 공격 - 이펙트는 id 순으로 쌓이니 뒤에서부터 본다
      {
        const wl = worldRef.current;
        let seen = lastShot.current;
        for (let i = wl.effects.length - 1; i >= 0; i -= 1) {
          const fx = wl.effects[i];
          if (fx.id <= lastShot.current) break;
          seen = Math.max(seen, fx.id);
          if (fx.kind !== 'shot' || !fx.from) continue;
          const from = fx.from;
          const u = wl.boards[0].units.find((v) => v.x === from.x && v.y === from.y);
          if (!u) continue;
          const p = pathPoint(fx.t);
          for (const fn of lunges.current.get(u.id) ?? []) fn(p.x - u.x, p.y - u.y);
        }
        // 때릴 때마다 짧게 울린다. 여러 유닛이 같은 프레임에 쳐도 한 번이다
        if (seen > lastShot.current) buzz('hit');
        lastShot.current = seen;
        if (wl.kills > killed.current) {
          killed.current = wl.kills;
          buzz('kill');
          if (now - freezeUntil > 350) freezeUntil = now + 45;
        }
      }

      /*
        여유를 4ms 준다.

        rAF 도 16.67ms 간격으로 오는데 문턱을 딱 16.67 로 두면, 흔들림 때문에
        절반 가까이가 '아직 이르다'로 걸려 그냥 버려진다 - 60 을 목표로 했는데
        실제로는 40 이 나왔다. 조금 일찍 그리는 편이 낫다.
      */
      if (now - lastRender >= 1000 / RENDER_FPS - 4) {
        lastRender = now;
        drawn += 1;
        drawBattle.current?.(worldRef.current);
      }
      // 움직이지 않는 나머지 화면은 절반만 그린다
      if (now - lastUi >= 1000 / UI_FPS - 4) {
        lastUi = now;
        setTick((t) => t + 1);
      }
      if (now - fpsAt >= 1000) {
        setFps(Math.round((drawn * 1000) / (now - fpsAt)));
        drawn = 0;
        fpsAt = now;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, chatOn]);

  const w = worldRef.current;
  const board = w.boards[0];

  /** 어느 칸이 찼는지 - 이게 그대로면 빈 칸 표시를 다시 만들 이유가 없다 */
  const taken = board.units
    .map((u) => u.slot)
    .sort((a, b) => a - b)
    .join(',');

  /*
    판에 선 유닛은 **움직이지 않는다.**

    칸에 고정되기 때문에, 누가 어디에 섰는지가 그대로면 다시 그릴 이유가
    없다. 그런데 화면을 통째로 다시 그리다 보니 매 프레임 유닛 열여섯의
    그라데이션과 SVG 가 같이 딸려 갔다 - 이게 렉의 가장 큰 몫이었다.
    움직이는 건 적뿐이다.
  */
  /*
    유닛 층을 다시 짤 이유가 생겼는지 알리는 글자.

    `face` 가 들어 있다 - 쏠 때마다 몸이 도니까. 대신 아래 `BoardUnitArt` 의
    속성을 전부 고정해 뒀다 (`unitId` + 붙박이 `register`). 안 그러면 한 마리가
    돌 때마다 열여섯 마리가 통째로 다시 그려진다.
  */
  const unitSig = board.units
    .map((u) => `${u.id}:${u.slot}:${u.defId}:${u.star}:${u.face ?? 0}:${(u.aim ?? 0).toFixed(2)}`)
    .join('|');

  /*
    3D 모델이 있는 유닛은 여기서 그리지 않는다.

    GLView 를 유닛마다 하나씩 만들면 GL 컨텍스트가 열여섯 개가 되어 못
    버틴다. 판 전체에 한 장 깔고 그 안에 모아 그린다 (`BoardModels`).
  */
  const boardModels = useMemo(
    () =>
      board.units
        .filter((u) => MODELS[u.defId])
        .map((u) => {
          const px = toPx({ x: u.x, y: u.y });
          return {
            key: u.id,
            defId: u.defId,
            left: px.left,
            // 칸 가운데에 발이 닿게. 타일은 가운데 정렬이지만 모델은 발이 기준이다.
            top: px.top + cell * 0.13,
            size: cell * 0.56,
          };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unitSig, cell],
  );

  /*
    주인공도 같은 레이어에 태운다.

    매 프레임 자리가 바뀌니 memo 를 걸지 않는다 - BoardModels 쪽에서
    장면을 다시 맞추지 않고 위치만 옮긴다.
  */
  /*
    끌고 있는 동안 아바타가 그쪽을 본다.

    카드를 판으로 옮기는 내내 아바타는 정면만 보고 있어서, 판 위에서 아무
    일도 안 일어나는 것처럼 느껴졌다. 고개를 돌려 주면 '여기에 놓는구나'가
    손끝과 이어진다.

    걷는 중에는 걷는 쪽이 이긴다 - 몸이 가는 방향과 보는 방향이 어긋나면
    더 어색하다.
  */
  const lastTurn = useRef(0);
  const pointer = card
    ? boardAt(card.x - arenaAt.current.x, card.y - arenaAt.current.y)
    : drag
      ? boardAt(drag.x, drag.y)
      : null;
  /*
    볼 곳을 하나로 정한다 - 걸어가는 곳이 먼저, 없으면 끌고 있는 곳.

    판을 내려다보는 화면이라 좌우만으로는 부족하다. 위를 가리키면 등을
    보여야 하니 각도로 넘긴다 (`atan2(dx, dy)`, 화면 아래가 0).
  */
  const aim = w.heroTo ?? pointer;
  const dx = aim ? aim.x - w.hero.x : 0;
  const dy = aim ? aim.y - w.hero.y : 0;
  /*
    볼 곳이 없어지면 **마지막으로 보던 쪽 그대로** 둔다.

    0 으로 되돌렸더니 카드를 놓는 순간, 걸음을 멈추는 순간마다 몸이 정면으로
    휙 돌아왔다. 사람은 하던 쪽을 보고 있다가 다음 일이 생겨야 돌아본다.
  */
  if (Math.hypot(dx, dy) > 0.06) lastTurn.current = Math.atan2(dx, dy);
  const turn = lastTurn.current;

  const heroSprite = avatarSpriteFor(avatar.id);
  const heroModel = !heroSprite && MODELS[avatar.id]
    ? {
        defId: avatar.id,
        left: toPx(w.hero).left,
        top: toPx(w.hero).top + cell * 0.16,
        size: cell * 0.72,
        turn,
        motion: (w.heroTo ? 'walk' : 'idle') as Motion,
      }
    : undefined;

  const unitLayer = useMemo(
    () =>
      board.units.map((u) => {
        const def = unitDef(u.defId);
        const solid = !MODELS[u.defId];
        const px = toPx({ x: u.x, y: u.y });
        const size = cell * 0.56;
        const held = drag?.id === u.id;
        return (
          <View
            key={u.id}
            pointerEvents="none"
            style={[
              styles.unit,
              {
                left: px.left - size / 2,
                top: px.top - size / 2,
                width: size,
                height: size,
                opacity: held ? 0.25 : 1,
              },
              picked === u.defId && styles.unitOn,
            ]}
          >
            {solid ? (
              <UnitMotion
                id={u.id}
                kind={attackOf(u.defId).kind}
                cell={cell}
                register={registerLunge}
                enabled={!spriteFor(u.defId) && !rigFor(u.defId)}
              >
                <BoardUnitArt
                  def={def}
                  size={size}
                  on={picked === u.defId}
                  /*
                    쏠 때마다 표적 쪽으로 돈다.

                    아직 한 발도 안 쐈으면 배치된 칸으로 정한다 - 판 가운데를
                    등지고 서야 트랙을 보는 자세가 된다.
                  */
                  facing={u.face ?? (u.x < (COLS - 1) / 2 ? -1 : 1)}
                  aim={u.aim ?? 0}
                  unitId={u.id}
                  register={registerLunge}
                />
              </UnitMotion>
            ) : null}
            {u.star > 1 ? <Text style={styles.unitStar}>{'★'.repeat(u.star)}</Text> : null}
          </View>
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unitSig, picked, drag?.id, cell],
  );

  /*
    빈 칸 표시는 **카드를 끌 때만** 띄운다.

    늘 띄워 두면 흰 네모 열여섯 개가 판을 덮어 그림이 안 보인다. 어디에
    놓을 수 있는지는 놓으려는 순간에만 궁금하다. 덤으로 평소 프레임에서
    View 열여섯 개가 빠진다.
  */
  const slotMarks = useMemo(
    () =>
      SLOTS.map((sp, i) => {
        if (taken.split(',').includes(String(i))) return null;
        const px = toPx(sp);
        const r = cell * 0.44;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={[
              styles.slotMark,
              {
                left: px.left - r / 2,
                top: px.top - r / 2,
                width: r,
                height: r,
                borderRadius: r * 0.24,
              },
            ]}
          />
        );
      }),
    [taken, cell],
  );

  /**
   * 판에 선 유닛을 종류별로 센 목록.
   *
   * 등급 순, 같은 등급 안에서는 공격력 순. 조합에 쓸 만큼 모인 것부터
   * 눈에 들어와야 하니 세 마리 이상은 따로 표시한다.
   */
  const ownedRow = useMemo(() => {
    /*
      비어 있어도 줄은 남긴다.

      한 마리도 없을 때 통째로 빼 버리면 첫 유닛을 놓는 순간 아래 줄이
      전부 밀려 내려간다 - 손이 카드를 다시 찾아야 한다. 자리는 늘 같아야 한다.
    */
    const count = new Map<string, number>();
    for (const u of board.units) count.set(u.defId, (count.get(u.defId) ?? 0) + 1);
    const list = [...count.entries()]
      .map(([id, n]) => ({ def: unitDef(id), n }))
      .sort((a, b) => {
        const t = TIER_ORDER.indexOf(a.def.tier) - TIER_ORDER.indexOf(b.def.tier);
        return t !== 0 ? t : unitDps(a.def) - unitDps(b.def);
      });
    return (
      <View style={styles.ownedRow}>
        {list.map(({ def, n }) => (
          <Pressable
            key={def.id}
            // 튜토리얼에서는 시키는 것만 만지게 한다
            onPress={() => {
              if (allowRef.current !== 'all') return;
              setPicked((cur) => (cur === def.id ? null : def.id));
            }}
            style={[
              styles.ownedChip,
              n >= COMBINE_COUNT && styles.ownedChipReady,
              picked === def.id && styles.ownedChipOn,
            ]}
          >
            <TrayArt def={def} size={24} />
            <Text style={[styles.ownedNum, n >= COMBINE_COUNT && { color: C.gold }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitSig, picked]);

  /** 배경에 넘길 판 사각형 - 매 프레임 새 객체를 만들면 배경 memo 가 안 먹는다 */
  const boardRect = useMemo(
    () => (boardTop != null ? { x: (screenW - boardPx) / 2, y: boardTop, size: boardPx } : null),
    [boardTop, screenW, boardPx],
  );
  const offer = w.offer;
  const rerollCost = nextRollCost(board);

  /* 팔 때는 별이 낮은 것부터 - 애써 키운 것을 먼저 내보내면 안 된다 */
  const pickedUnit =
    picked !== null
      ? (board.units
          .filter((u) => u.defId === picked)
          .sort((a, b) => a.star - b.star)[0] ?? null)
      : null;

  const bump = () => setTick((t) => t + 1);

  /*
    해 보면 저절로 넘어간다.

    0: 유닛을 하나 놓으면 / 2: 아바타를 움직이면 / 4: 골드를 벌면.
    1 과 3 은 '보고 아는' 내용이라 눌러서만 넘어간다.
  */
  /*
    세 장을 다 놓아야 다음으로 간다.

    한 장만 놓고 넘어가게 했더니 '한 번 해 봤다'로 끝나서, 판을 어떻게
    채우는지는 안 익혔다. 처음 웨이브를 넘기려면 셋은 놓아야 한다.
  */
  const placed = offer != null && offer.bought.every(Boolean);
  const heroMoved = w.heroTo != null;
  const earned = board.gold > START_GOLD;
  /* 상점에서 뽑든 카드를 다시 굴리든, 한 번 해 보면 넘어간다 */
  const shopped = board.rolls > 0 || board.units.length > 3;
  useEffect(() => {
    if (mode !== 'tutorial') return;
    if (step === 0 && placed) setStep(1);
    else if (step === 2 && heroMoved) setStep(3);
    else if (step === 3 && earned) setStep(4);
    else if (step === 4 && shopped) setStep(5);
  }, [mode, step, placed, heroMoved, earned, shopped]);
  const doSell = () => {
    if (!pickedUnit) return;
    sellUnit(worldRef.current, pickedUnit.id);
    // 같은 종류가 더 남아 있으면 열어 둔다 - 여러 마리를 잇따라 팔 수 있게
    if (board.units.filter((u) => u.defId === picked).length <= 1) setPicked(null);
    bump();
  };

  /*
    위·아래 줄은 매 프레임 다시 그릴 이유가 없다.

    판은 적이 움직이니 프레임마다 그려야 하지만, 웨이브 숫자·체력·골드는
    초에 몇 번 바뀔 뿐이다. 그런데 한 컴포넌트라 판을 그릴 때마다 같이
    딸려 그려졌다 - 그게 버벅임의 큰 몫이었다.

    보여 주는 값이 그대로면 만들어 둔 것을 다시 쓴다. 그래서 렌더는
    60fps 로 올리고, 실제로 다시 그리는 건 판뿐이다.
  */
  /*
    웨이브 막대는 부모가 매 프레임 그린다.

    Animated + useNativeDriver 로 넘겨 봤는데 이 화면에서는 네이티브로 안
    붙었다 - 재 보니 값이 리액트가 커밋할 때(초에 한 번)만 반영돼서 막대가
    초 단위로 툭툭 끊겼다. 적은 매 프레임 잘 움직이니, 같은 방식으로
    되돌린다. width 가 아니라 scaleX 라 레이아웃은 안 건드린다.

    대신 옆에 붙는 글자·버튼은 값이 바뀔 때만 그린다.
  */
  const waveRatio = Math.max(0, Math.min(1, 1 - w.nextWaveIn / WAVE_GAP));

  /*
    조합 카드.

    누를 게 없을 때 버튼이 자리를 지키고 있으면 눈만 붙잡는다. 합칠 거리가
    생겼을 때만 프레임 표시 밑에 조그맣게 뜬다 - 손이 닿는 아래쪽이 아니라
    위쪽이라, 싸우다 실수로 누를 일이 없다.
  */
  const waveBarText = useMemo(
    () => (
      <>
        <Text style={styles.waveBarText}>
          {`다음 웨이브 ${Math.max(0, Math.ceil(w.nextWaveIn))}초` +
            (isBossWave(w.wave + 1, w.waveTotal) ? '  ·  보스 등장' : '')}
        </Text>

        {/*
          조합표는 '무엇이 무엇으로 합쳐지는가'를 들춰 보는 참고용이라,
          싸우는 손이 닿는 아래쪽 버튼 줄에 있을 이유가 없다. 위로 올려
          아래는 실제로 누르는 '조합'만 남긴다.
        */}
        <Pressable style={styles.tableBtn} onPress={() => setShowTable(true)}>
          <Text style={styles.tableBtnText}>조합표</Text>
        </Pressable>
        {/* 실제 / 목표 프레임 - 만드는 동안 보려고 띄우는 것이라 설정에서 끌 수 있다 */}
        {showFps ? (
          <Text style={[styles.fpsText, fps < RENDER_FPS - 8 && { color: C.orange }]}>
            {fps} / {RENDER_FPS} fps
          </Text>
        ) : null}
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w.wave, w.waveTotal, Math.ceil(w.nextWaveIn), fps, showFps],
  );

  const plans = combinePlan(board);
  const starPair = starUpPair(board);
  const planCost = combinePlanCost(board);
  // 골드가 모자란 등급은 건너뛰므로, 하나라도 낼 수 있으면 누를 값어치가 있다
  const canPay = starPair.length > 0 || plans.some((p) => board.gold >= p.cost);
  // 튜토리얼에서는 시키는 것만 만지게 한다
  const guiding = mode === 'tutorial' && step < GUIDE.length;
  const combineSig =
    plans.map((p) => `${p.tier}:${p.units.map((u) => u.defId).join('+')}`).join('|') +
    `#${starPair.map((u) => u.defId).join('+')}|${planCost}|${canPay}|${guiding}`;

  /*
    정문·골드는 판 아래 한 줄에 **가로로** 둔다.

    오른쪽 위에 세로로 쌓아 뒀더니 정문 그림 위에 판 두 개가 겹쳐 하늘을
    가렸다. 판 아래 줄은 원래 조합 카드만 있어 왼쪽이 비어 있었으니, 거기에
    나란히 놓으면 화면 위쪽이 그림만 남는다.

    값이 바뀔 때만 다시 그린다 - 이 줄은 매 프레임 그리는 자리에 얹힌다.
  */
  const statChips = useMemo(
    () => (
      <View style={styles.chipRow}>
        {/* 연습판은 정문이 안 깎이니 숫자 대신 그렇게 적는다 */}
        <Chip
          icon="gate"
          value={w.safe ? '연습' : `${Math.max(0, w.life)}`}
          color={w.safe ? C.green : '#8fe8a0'}
        />
        {/* '+n' 을 이 칩 왼쪽에 띄우려면 칩이 화면 어디인지 알아야 한다 */}
        <View
          ref={goldChip}
          onLayout={() =>
            goldChip.current?.measureInWindow((x, y, _w, h) => {
              goldBox.current = { x, y, h };
            })
          }
        >
          <Chip icon="coin" value={fmt(board.gold)} color={C.gold} />
        </View>
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w.life, w.safe, board.gold],
  );

  const combineCard = useMemo(
    () => {
      const rows: { units: DefUnit[]; cost: number; tier: Tier | null }[] = [
        ...plans.map((p) => ({ units: p.units, cost: p.cost, tier: p.tier })),
        ...(starPair.length ? [{ units: starPair, cost: 0, tier: null }] : []),
      ];
      if (guiding || rows.length === 0) return null;
      /*
        조합거리 하나에 카드 하나다. 한 카드에 몰아 넣으면 무엇과 무엇이
        합쳐지는지가 안 읽힌다. 세 장까지만 자리를 주고 더 있으면 옆으로
        밀어 본다 - 판을 덮으면 안 되니 폭을 못 박아 둔다.
      */
      return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.combineWrap}
            contentContainerStyle={styles.combineList}
          >
            {rows.map((row) => {
              const pay = board.gold >= row.cost;
              return (
                <Pressable
                  key={row.tier ?? 'star'}
                  style={[styles.combineCard, !pay && styles.combineCardOff]}
                  onPress={() => {
                    // 누른 묶음만 합친다
                    if (row.tier) {
                      combineTier(worldRef.current, row.tier);
                      buzz('combine');
                    }
                    else starUpNow(worldRef.current);
                    bump();
                  }}
                >
                  {/*
                    완성될 카드를 크게 맨 위에.

                    무엇이 나오는지는 정해져 있다 - **자리를 물려받을 유닛**
                    (재료 중 가장 약한 것)이 결정한다. 어느 셋이 없어지는지가
                    아래에 보이니, 결과도 그 자리에서 알 수 있다.
                  */}
                  {/* UnitTile 은 부모를 채우는 구조다 - 상자에 담아 크기를 못 박는다 */}
                  <View style={styles.combineOut}>
                    {row.tier ? (
                      <UnitTile def={upgradeOf(row.units[0].defId)!} size={30} />
                    ) : (
                      <>
                        <UnitTile def={unitDef(row.units[0].defId)} size={30} />
                        <Text style={styles.combineUp}>★</Text>
                      </>
                    )}
                  </View>

                  <Text style={[styles.combineCost, !pay && { color: 'rgba(255,255,255,0.35)' }]}>
                    {row.tier ? row.cost : '★'}
                  </Text>

                  {/* 소모될 카드 */}
                  <View style={styles.combineRow}>
                    {row.units.map((u) => (
                      <TrayArt key={u.id} def={unitDef(u.defId)} size={14} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [combineSig],
  );

  const hudView = useMemo(
    () => (
      <>
        {/* --------------------------------------------------------- 상단 HUD */}
        <View style={styles.hud}>
          {/* 가운데를 차지하는 자리만 남긴다 - 실제 칩은 아래에 절대배치로 띄운다 */}
          <View style={{ flex: 1 }} />

          {/*
            설정.

            'X' 하나로 두면 누르는 순간 판이 끝난다 - 한창 하는 중에 손이
            스치면 되돌릴 수 없다. 톱니바퀴를 눌러 열고 거기서 나가게 한다.
          */}
          <Pressable onPress={() => setMenu(true)} style={styles.gear}>
            <MenuIcon name="settings" size={19} color={C.textDim} />
          </Pressable>

          {/*
            웨이브 칩은 화면 한가운데여야 한다.

            줄 안에서 flex 로 가운데를 잡으면 왼쪽(닫기 버튼)과 오른쪽(체력·골드)
            너비가 달라서 그 사이의 가운데에 놓인다 - 화면 기준으로는 20pt 쯤
            왼쪽으로 밀린다. 줄에서 빼내 절대배치로 띄운다.
          */}
          <View style={styles.waveChip} pointerEvents="none">
            <LinearGradient colors={G.banner} style={styles.waveChipFill}>
              <Text style={styles.waveLabel}>WAVE</Text>
              {/*
                총 웨이브는 안 적는다.

                'WAVE 3 / 50' 으로 두면 남은 개수를 세는 놀이가 된다. 끝을
                모르면 매 웨이브가 '한 번 더 버틴다'가 되고, 그게 이 판이
                주려는 긴장이다.
              */}
              <Text style={styles.waveNum}>{Math.max(1, w.wave)}</Text>
              {isBossWave(Math.max(1, w.wave), w.waveTotal) ? (
                <Text style={styles.bossTag}>BOSS</Text>
              ) : null}
            </LinearGradient>
          </View>
        </View>

      </>
    ),
    // 초 단위로만 바뀌는 값들 - 웨이브 막대는 0.1초로 끊어 10번만 갱신한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w.wave, w.waveTotal, w.life, w.safe, board.gold, Math.ceil(w.nextWaveIn), fps],
  );

  /** 아래 줄도 같은 이유로 값이 바뀔 때만 다시 만든다 */
  const bottomView = useMemo(
    () => (
      <>
        {/* --------------------------------------------------------- 조작 바 */}
        <View style={[styles.bottom, lift > 0 && { transform: [{ translateY: -lift }] }]}>
          {chatOn ? (
            <>
              {/* 지난 줄 - 판을 가리지 않게 배경 없이 글자만 얹는다 */}
              <View style={styles.chatLog}>
                {chat.map((m) => (
                  <Text
                    key={m.id}
                    style={[styles.chatLine, m.who === 'sys' && styles.chatSys]}
                    numberOfLines={1}
                  >
                    {m.who === 'me' ? `나: ${m.text}` : m.text}
                  </Text>
                ))}
              </View>

              <View ref={chatRowRef} style={styles.chatRow}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={send}
                  placeholder="메시지"
                  placeholderTextColor={C.textFaint}
                  style={styles.chatInput}
                  returnKeyType="send"
                  // 보내고 나서도 키보드를 열어 둔다 - 한 마디마다 다시 열면 못 쓴다
                  submitBehavior="submit"
                  maxLength={60}
                />
                <Pressable
                  onPress={send}
                  style={({ pressed }) => [styles.chatSend, pressed && { opacity: 0.6 }]}
                >
                  <Text style={styles.chatSendText}>보내기</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {/*
            아래 줄의 순서.

            판에 가까운 쪽이 '살 것', 손에 가까운 쪽이 '가진 것'이다.

              살 카드  ->  보유 유닛

            살 카드를 위로 올린 이유: 카드는 **판으로 끌어 올리는** 것이라
            판에 가까울수록 손이 짧게 간다. 보유 유닛은 세어 보는 목록이라
            멀어도 된다.

            가운데 있던 '판 n/16 · 공격력 n' 줄은 없앴다 - 아래 주석 참고.

            정문 게이지는 뺐다 - 오른쪽 위 방패 숫자와 같은 말을 두 번 하고
            있었다. 대신 연습판이라는 건 그 방패 자리에서 알린다.
          */}
          {/*
            상점 - 등급 칸 넷.

            카드와 **역할이 다르다.** 카드는 일반 석 장을 싸게 깔아 주고,
            상점은 골드를 위 등급으로 바로 바꾼다. 누르면 빈 칸에 그 등급
            아무나 한 마리가 선다 - 자리가 마음에 안 들면 끌어서 옮기면 된다.

            카드 줄 **위**에 둔다. 둘 다 '사는 곳'이지만 상점은 눌러서 바로
            서고 카드는 끌어다 놓는 것이라, 줄을 나눠야 손이 헷갈리지 않는다.
          */}
          <View style={styles.shopRow}>
            {SHOP_TIERS.map((tier) => (
              <ShopSlot
                key={tier}
                tier={tier}
                price={shopPrice(tier)}
                poor={board.gold < shopPrice(tier) || fieldFree(board) === 0 || !lets('card')}
                onPress={() => {
                  if (!lets('card')) return;
                  if (summon(worldRef.current, tier)) {
                    buzz('place');
                    bump();
                  }
                }}
              />
            ))}
          </View>

          {/*
            이번 웨이브의 제안 - 유닛 3장.

            무엇이 뜨는지는 못 고른다(랜덤 디펜스). 고르는 건 '살지 말지'다.
            산 자리는 어둡게 눌러 두 번 사지 않게 한다. 골드는 적을 잡아서 번다.
          */}
          {offer ? (
            <View style={styles.offerRow}>
              {offer.slots.map((slot, i) =>
                slot.kind === 'gold' ? (
                  <GoldCard
                    key={`${offer.wave}-${i}`}
                    amount={slot.amount}
                    taken={offer.bought[i]}
                    onPress={() => {
                      if (allowRef.current !== 'all') return;
                      takeGold(worldRef.current, i);
                      bump();
                    }}
                  />
                ) : (
                  <OfferCard
                    key={`${offer.wave}-${i}`}
                    def={unitDef(slot.id)}
                    bought={offer.bought[i]}
                    price={offerPrice(slot)}
                    poor={board.gold < offerPrice(slot) || fieldFree(board) === 0}
                    pan={cardPan(i)}
                    lead={mode === 'tutorial' && step === 0 && !offer.bought[i]}
                  />
                ),
              )}

              {/*
                다시 굴리기.

                카드가 웨이브마다 석 장뿐이라, 돈이 남아도 더 살 수가 없었다.
                그게 중반부터 판이 막히는 진짜 이유였다 - 시뮬레이터에서 이
                버튼 하나를 붙이자 다섯 스테이지 평균 도달 웨이브가 26 에서
                50 으로 올랐다. 값은 같은 웨이브 안에서 굴릴수록 오르고
                (11/15/19...) 웨이브가 넘어가면 다시 싸진다.
              */}
              <RerollButton
                cost={rerollCost}
                /* 튜토리얼에선 시키는 것만 - 굴릴 수 없으면 그렇게 보여야 한다 */
                poor={board.gold < rerollCost || !lets('card')}
                onPress={() => {
                  if (!lets('card')) return;
                  if (rerollOffer(worldRef.current)) bump();
                }}
              />
            </View>
          ) : null}

          {/*
            판 칸 수와 공격력 표시는 뺐다.

            공격력이 숫자로 보이면 '몇이 되면 이 웨이브를 넘긴다'가 금방
            드러나서, 판을 보는 대신 숫자를 맞추는 놀이가 된다.
            칸이 찼는지는 놓아 보면 알고, 세기가 늘었는지는 적이 녹는
            속도로 느끼면 된다.
          */}
          {/*
            판에 선 유닛을 종류별로.

            조합은 같은 등급 세 개를 모아야 하는데, 판만 봐서는 무엇이 몇
            마리인지 세어야 알 수 있었다 - 열여섯 칸에 흩어져 있으니 눈으로
            세기 어렵다. 세 마리가 모인 종류는 테두리를 금색으로 띄워 준다.
          */}
          {ownedRow}


          {pickedUnit ? <UnitDetail unit={pickedUnit} /> : null}

          {pickedUnit ? (
            <View style={styles.bar}>
              <Button
                label={`팔기  💰 ${sellValue(pickedUnit.defId)}`}
                tone="red"
                onPress={doSell}
                style={{ flex: 1 }}
              />
              <View style={{ width: 8 }} />
              <Button
                label="닫기"
                tone="plain"
                onPress={() => setPicked(null)}
                style={{ flex: 1 }}
              />
            </View>
          ) : null}
        </View>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chatOn,
      chat,
      draft,
      lift,
      unitSig,
      step,
      board.gold,
      w.offer,
      w.offer?.bought.join(),
      rerollCost,
      w.life,
      w.safe,
      picked,
      pickedUnit,
      cell,
    ],
  );
  return (
    <View style={styles.root}>
      <ArenaBackdrop
        stage={stage}
        width={screenW}
        height={screenH}
        inset={insets.top}
        board={boardRect}
      />

      {hudView}

      {/*
        골드 '+n' - 오른쪽 위 골드 칩 왼쪽에서 떠오른다.

        칩 자리는 창 좌표로 재 오는데 이 화면은 노치만큼 내려와 있으니 그만큼
        빼야 한다. 매 프레임 다시 그리는 자리라 Animated 없이 값을 직접 민다.
      */}
      {goldBox.current
        ? gains.current.map((g) => {
            const k = (Date.now() - g.at) / GAIN_LIFE;
            if (k >= 1) return null;
            return (
              <Text
                key={g.id}
                pointerEvents="none"
                style={[
                  styles.goldGain,
                  {
                    opacity: 1 - k * k,
                    transform: [
                      { translateX: goldBox.current!.x - insets.left - 58 },
                      {
                        translateY:
                          goldBox.current!.y - insets.top + goldBox.current!.h / 2 - 9 - k * 16,
                      },
                    ],
                  },
                ]}
              >
                +{fmt(g.amount)}
              </Text>
            );
          })
        : null}

      {/* 다음 웨이브까지 */}
      <View style={styles.waveBarWrap}>
        {/* 막대만 매 프레임 - 적과 같은 방식이다 */}
        <View style={styles.waveBar}>
          <View style={[styles.waveBarFill, { transform: [{ scaleX: waveRatio }] }]} />
        </View>
        {waveBarText}
      </View>

      {/*
        조합 카드는 **판 아래**에 둔다.

        프레임 표시 밑(판 위쪽)에 뒀더니 정문에서 나온 적이 그 자리를 지나서
        가려 버렸다. 판 아래는 적이 절대 안 가는 자리다.
      */}
      <View style={[styles.underBoard, { top: arenaTop + boardPx + 10 }]} pointerEvents="box-none">
        {statChips}
        {combineCard}
      </View>

      {/*
        판은 흐름에서 빼서 고정된 자리에 둔다.

        전에는 `flex: 1` 로 남는 공간 가운데에 놓았다. 그러면 아래 줄이
        한 칸이라도 늘 때마다(살 카드가 뜨거나, 보유 유닛 줄이 생기거나)
        판이 그만큼 위로 밀리고, 배경은 판에 맞춰 앉으니 **화면 전체가
        같이 움직인다.** 아래에서 무슨 일이 일어나든 판은 제자리여야 한다.
      */}
      <View style={styles.arenaSpacer} pointerEvents="none" />
      <Animated.View
        style={[
          styles.arenaWrap,
          {
            top: arenaTop,
            transform: [
              { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] }) },
              { translateY: shake.interpolate({ inputRange: [-1, 1], outputRange: [5, -5] }) },
            ],
          },
        ]}
      >
      <View
        ref={arenaRef}
        onLayout={measureArena}
        style={[styles.arena, { width: boardPx, height: boardPx }]}
        {...pan.panHandlers}
      >
        {/*
          판은 경기장 그림 안에 이미 그려져 있다. 그림이 없는 스테이지에서만
          코드로 그린다 - 둘 다 그리면 길이 두 겹으로 겹친다.
        */}
        {painted ? null : (
          <>
            {/* 판이 땅에 놓여 있다는 신호 - 카드처럼 떠 보이면 안 된다 */}
            <ArenaShadow width={boardPx} />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <ArenaBoard size={boardPx} road={ROAD * cell} radius={cell * 1.1} />
            </View>
          </>
        )}

        {/* 아바타가 선 자리 - 홈 화면과 같은 마법진 언어 */}
        {(() => {
          const px = toPx(w.hero);
          const r = cell * 1.6;
          return (
            <View
              style={{ position: 'absolute', left: px.left - r / 2, top: px.top - r / 2, opacity: 0.22 }}
              pointerEvents="none"
            >
              <MagicCircle size={r} color={C.gold} />
            </View>
          );
        })()}

        {/*
          유닛이 서는 칸.

          비어 있는 칸만 그린다 - 유닛이 선 칸은 유닛 자체가 표시다.
          자리가 어디인지 안 보이면 카드를 어디로 끌어야 할지 알 수 없다.
        */}
        {card ? slotMarks : null}

        {/* 유닛을 끌 때 갈 칸 - 이미 누가 있으면 자리를 바꾼다 */}
        {drag
          ? (() => {
              const at = boardAt(drag.x, drag.y);
              const i = nearestSlot(at.x, at.y);
              const px = toPx(SLOTS[i]);
              const r = cell * 0.56;
              const taken = unitAtSlot(board, i);
              return (
                <View
                  pointerEvents="none"
                  style={[
                    styles.dropHint,
                    taken != null && styles.dropSwap,
                    { left: px.left - r / 2, top: px.top - r / 2, width: r, height: r, borderRadius: 9 },
                  ]}
                />
              );
            })()
          : null}

        {/*
          카드가 놓일 자리 - 손을 떼기 전에 어디에 설지 보여 준다.

          이미 누가 서 있는 칸이면 붉게 띄운다. 놓아도 아무 일이 안 일어나니
          떼기 전에 알려 줘야 한다.
        */}
        {card
          ? (() => {
              const at = boardAt(card.x - arenaAt.current.x, card.y - arenaAt.current.y);
              const i = nearestSlot(at.x, at.y);
              const px = toPx(SLOTS[i]);
              const busy = unitAtSlot(board, i) != null;
              const size = cell * 0.56;
              return (
                <View
                  pointerEvents="none"
                  style={[
                    styles.dropHint,
                    {
                      left: px.left - size / 2,
                      top: px.top - size / 2,
                      width: size,
                      height: size,
                      borderRadius: 9,
                    },
                    busy && styles.dropBusy,
                  ]}
                />
              );
            })()
          : null}

        {/* 아바타가 가는 자리 - 없으면 어디를 짚었는지 손가락을 떼는 순간 사라진다 */}
        {w.heroTo ? (() => {
          const px = toPx(w.heroTo);
          const r = cell * 0.36;
          return (
            <View
              pointerEvents="none"
              style={[
                styles.heroMark,
                { left: px.left - r / 2, top: px.top - r / 2, width: r, height: r, borderRadius: r / 2 },
              ]}
            />
          );
        })() : null}

        {/* 아바타. 이 원 안에는 유닛이 못 선다. */}
        {(() => {
          const px = toPx(w.hero);
          // 유닛보다 조금 크기만 하면 된다. 예전엔 1.05 라 혼자 두 배였다.
          const size = cell * 0.78;
          // 가는 쪽을 본다 - 왼쪽으로 갈 때만 좌우를 뒤집는다
          const facing = w.heroTo && w.heroTo.x < w.hero.x - 0.02 ? -1 : 1;
          return (
            <View
              pointerEvents="none"
              style={[
                styles.heroSlot,
                { left: px.left - size / 2, top: px.top - size / 2, width: size, height: size },
              ]}
            >
              {/*
                발밑 그림자 - 마법진 위에 떠 있는 것처럼 보이지 않게.

                둥근 사각형으로 두면 검은 판때기로 보인다. 원을 눌러 타원으로
                만들어야 바닥에 깔린 그늘로 읽힌다.
              */}
              <View
                style={{
                  position: 'absolute',
                  bottom: size * 0.06,
                  width: size * 0.4,
                  height: size * 0.4,
                  borderRadius: size * 0.2,
                  backgroundColor: 'rgba(0,0,0,0.34)',
                  transform: [{ scaleY: 0.26 }],
                }}
              />
              {/*
                주인공.

                구운 시트가 있으면 그걸 돌린다 - 가만히 선 그림이면 부대원은
                숨 쉬는데 대장만 얼어 있다. 3D 모델이 있으면 판 레이어가
                그린다 (`heroModel`).
              */}
              {heroSprite ? (
                <View style={{ transform: [{ scaleX: facing }] }}>
                  <SpriteArt set={heroSprite} size={size * 1.08} />
                </View>
              ) : MODELS[avatar.id] ? null : (
                <View style={{ transform: [{ scaleX: facing }] }}>
                  <AvatarArt def={avatar} size={size} />
                </View>
              )}
            </View>
          );
        })()}

        {/*
          유닛.

          예전엔 3x3 칸에 꽂아 넣었는데, 칸이 아홉이라 배치가 사실상 아홉 자리
          중 고르기였다. 격자를 걷어내고 판 어디에나 세울 수 있게 했다 - 사거리가
          연속으로 달라지니 몇 픽셀 옮기는 것도 의미가 생긴다.
        */}
        {boardModels.length > 0 || heroModel ? (
          <BoardModels size={boardPx} units={boardModels} hero={heroModel} />
        ) : null}
        {unitLayer}

        {/*
          적 · 공격 연출 · 피해 숫자.

          캔버스 한 장이 다 그린다 (`art/BattleCanvas.tsx`). View 로 그리던 때는
          적이 쌓이면 View 가 수백 개가 되어 프레임이 무너지고 폰이 달아올랐다.
          유닛 위, 끌고 있는 유닛 아래에 둔다.
        */}
        <BattleCanvas size={boardPx} cell={cell} origin={ORIGIN} register={registerCanvas} />

        {/* 끌고 있는 유닛 - 손가락을 따라다닌다 */}
        {drag
          ? (() => {
              const u = board.units.find((x) => x.id === drag.id);
              if (!u) return null;
              const def = unitDef(u.defId);
              const size = cell * 0.62;
              return (
                <View
                  pointerEvents="none"
                  style={[
                    styles.unit,
                    {
                      left: drag.x - size / 2,
                      top: drag.y - size / 2,
                      width: size,
                      height: size,
                      marginLeft: 0,
                      marginTop: 0,
                      zIndex: 60,
                      opacity: 0.92,
                    },
                  ]}
                >
                  {/* 끄는 동안에도 판에 설 모습 그대로 - 타일을 씌우면 놓는 순간 달라진다 */}
                  <BoardUnitArt def={def} size={size} on={false} />
                </View>
              );
            })()
          : null}
      </View>
      </Animated.View>

      {bottomView}

      {/*
        끌고 있는 카드.

        손가락 아래에 그려야 어디를 짚었는지 안다. 화면(page) 좌표로 오는데
        이 화면은 노치만큼 아래에서 시작하니 그만큼 빼 준다.
      */}
      {card && offer?.slots[card.index]?.kind === 'unit'
        ? (() => {
            const size = cell * 0.62;
            return (
              <View
                pointerEvents="none"
                style={[
                  styles.unit,
                  {
                    left: card.x - size / 2,
                    top: card.y - insets.top - size * 1.2,
                    width: size,
                    height: size,
                    zIndex: 80,
                    opacity: 0.95,
                  },
                ]}
              >
                {/* 카드에서 끌어낸 순간부터 판에 설 모습으로 보여 준다 */}
                {/* 끄는 도중 제안이 바뀔 수 있다(두 손가락) - 그때는 위에서 걸러진다 */}
                <BoardUnitArt
                  def={unitDef((offer!.slots[card.index] as { id: string }).id)}
                  size={size}
                  on={false}
                />
              </View>
            );
          })()
        : null}

      {mode === 'tutorial' && step < GUIDE.length ? (
        <TutorialBubble
          step={GUIDE[step]}
          anchorX={boardTop != null ? (screenW - boardPx) / 2 + toPx(w.hero).left : null}
          anchorY={boardTop != null ? arenaTop + toPx(w.hero).top - cell * 0.6 : null}
          screenW={screenW}
          onNext={() => setStep(step + 1)}
        />
      ) : null}

      <CombineTable visible={showTable} onClose={() => setShowTable(false)} />

      {/* 설정 - 싸우는 중에 바로 끄고 싶은 것만 둔다 */}
      <Modal
        visible={menu}
        transparent
        animationType="fade"
        onRequestClose={() => setMenu(false)}
      >
        <Pressable style={styles.tableOverlay} onPress={() => setMenu(false)}>
          <Frame tone="deep" style={styles.menuBox}>
            <Text style={styles.tableTitle}>설정</Text>
            <Toggle
              label="진동"
              note="때릴 때마다 짧게, 잡거나 정문이 깎이면 조금 세게"
              on={meta.haptics}
              onPress={() => setHaptics(!meta.haptics)}
            />
            <View style={{ height: 12 }} />
            <Button label="판 나가기" tone="red" onPress={onExit} />
            <View style={{ height: 8 }} />
            <Button label="계속하기" tone="plain" onPress={() => setMenu(false)} />
          </Frame>
        </Pressable>
      </Modal>

      {result ? (
        <ResultOverlay won={result === 'win'} world={w} reward={stage.reward} onExit={onExit} />
      ) : null}
    </View>
  );
}

/**
 * 고른 유닛의 상세.
 *
 * 어떤 유닛이 어디까지 때리는지 모르면 배치가 감이 안 온다. 사거리와 특수 효과를
 * 글로 보여 준다.
 */
function UnitDetail({ unit }: { unit: DefUnit }) {
  const def = unitDef(unit.defId);
  const tier = TIERS.find((x) => x.id === def.tier);
  const rangeLabel = def.range >= 4 ? '판 전체' : def.range >= 2.5 ? '중거리' : '근접';
  const traitLabel =
    def.trait === 'slow'
      ? '맞은 적이 느려짐'
      : def.trait === 'splash'
        ? '뒤따르는 적도 함께 타격'
        : def.trait === 'focus'
          ? '가장 단단한 적을 노림'
          : '단일 공격';

  return (
    <View style={styles.detail}>
      <LinearGradient colors={RARITY_G[def.tier]} style={styles.detailArt}>
        <Text style={{ fontSize: 26 }}>{def.emoji}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <View style={styles.detailHead}>
          <Text style={[styles.detailTier, { color: RARITY_G[def.tier][0] }]}>
            {tier?.label}
          </Text>
          <Text style={styles.detailName}>{def.name}</Text>
          {unit.star > 1 ? <Text style={styles.detailStar}>{'★'.repeat(unit.star)}</Text> : null}
        </View>
        <Text style={styles.detailStats}>
          공격 {fmt(Math.round(def.atk * starMul(unit.star)))} × {def.atkSpeed.toFixed(2)}/초
          {'  =  '}
          <Text style={styles.detailDps}>{fmt(Math.round(unitDps(def, unit.star)))} DPS</Text>
        </Text>
        <Text style={styles.detailStats}>
          사거리 {rangeLabel}   |   {traitLabel}
        </Text>
      </View>
    </View>
  );
}

/**
 * 조합표.
 *
 * 규칙 자체는 한 줄이지만(같은 등급 3개 -> 위 등급 하나), 어느 등급에 뭐가 있고
 * 뭐가 나올 수 있는지를 모르면 모을 이유가 안 생긴다.
 */
function CombineTable({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { height } = useWindowDimensions();
  // Frame 안쪽은 flex 가 안 서므로 스크롤 높이를 직접 잡는다
  const listH = Math.round(height * 0.62);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.tableOverlay}>
        <Frame tone="deep" style={styles.tableBox}>
          <Text style={styles.tableTitle}>조합표</Text>
          <Text style={styles.tableRule}>
            같은 등급 {COMBINE_COUNT}개를 모으면{'\n'}한 등급 위 유닛 하나가 됩니다
            {'\n'}
            <Text style={styles.tableNote}>
              무엇이 될지는 정해져 있다 - 가장 약한 재료가 자리를 물려받는다{'\n'}
              숫자는 초당 피해 = 공격력 x 공격속도
            </Text>
          </Text>

          <ScrollView
            style={{ alignSelf: 'stretch', maxHeight: listH }}
            contentContainerStyle={{ paddingBottom: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {TIERS.map((tier, i) => {
              const list = ROSTER.filter((u) => u.tier === tier.id);
              const next = TIERS[i + 1];
              return (
                <View key={tier.id} style={styles.tierBlock}>
                  <View style={styles.tierHead}>
                    <View style={[styles.tableTierTag, { backgroundColor: RARITY_G[tier.id][0] }]}>
                      <Text style={styles.tableTierText}>{tier.label}</Text>
                    </View>
                    <Text style={styles.tierCount}>{list.length}종</Text>
                    <View style={{ flex: 1 }} />
                    {next ? (
                      <Text style={styles.tierNext}>
                        {COMBINE_COUNT}개 모으면 {next.label}
                      </Text>
                    ) : (
                      <Text style={styles.tierNext}>최고 등급</Text>
                    )}
                  </View>

                  <View style={styles.tierGrid}>
                    {list.map((u) => (
                      <View key={u.id} style={styles.tUnit}>
                        <LinearGradient colors={RARITY_G[u.tier]} style={styles.tUnitArt}>
                          <Text style={{ fontSize: 24 }}>{u.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.tUnitName} numberOfLines={2}>
                          {u.name}
                        </Text>
                        <Text style={styles.tUnitDps}>
                          {fmt(Math.round(unitDps(u)))}
                          <Text style={styles.tUnitDpsUnit}> DPS</Text>
                        </Text>
                        {/* 이 유닛을 남기고 합치면 무엇이 되는가 */}
                        {upgradeOf(u.id) ? (
                          <Text style={styles.tUnitTo} numberOfLines={1}>
                            → {upgradeOf(u.id)!.name}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>

                  {next ? <View style={styles.tableArrow} /> : null}
                </View>
              );
            })}
          </ScrollView>

          <Button
            label="닫기"
            tone="gold"
            onPress={onClose}
            style={{ alignSelf: 'stretch', marginTop: 10 }}
          />
        </Frame>
      </View>
    </Modal>
  );
}

/** HUD 오른쪽 작은 정보 칩 */
/**
 * 정문·골드 표시.
 *
 * 이모지를 쓰다가 바꿨다. 🛡 과 💰 는 OS 가 그린 3D 스티커라 손으로 그린
 * 판 위에 올려 두면 혼자 다른 게임에서 온 것처럼 보인다. 홈 화면 메뉴와
 * 같은 선 아이콘을 쓰면 한 세트로 읽힌다.
 */
function Chip({ icon, value, color }: { icon: IconName; value: string; color: string }) {
  return (
    <View style={styles.chip}>
      <MenuIcon name={icon} size={15} color={color} />
      <Text style={[styles.chipText, { color }]}>{value}</Text>
    </View>
  );
}

// ----------------------------------------------------------------- 결과

function ResultOverlay({
  won,
  world,
  reward,
  onExit,
}: {
  won: boolean;
  world: DefWorld;
  reward: number;
  onExit: () => void;
}) {
  const ratio = lifeRatio(world);
  const stars = won ? (ratio >= 0.9 ? 3 : ratio >= 0.5 ? 2 : 1) : 0;
  return (
    <View style={styles.overlay}>
      <Frame tone={won ? 'hot' : 'deep'} style={styles.resultBox}>
        <Text style={styles.resultTitle}>{won ? '방어 성공!' : '정문이 뚫렸다'}</Text>
        <Text style={styles.resultStars}>
          {'★'.repeat(stars)}
          <Text style={{ color: 'rgba(255,255,255,0.22)' }}>{'★'.repeat(3 - stars)}</Text>
        </Text>
        <Text style={styles.resultLine}>
          웨이브 {world.wave}   처치 {world.kills}
        </Text>
        <Text style={styles.resultLine}>
          정문 {Math.max(0, world.life)} / {LIFE_MAX}   보상 💰{' '}
          {won ? reward : Math.floor(reward * 0.2)}
        </Text>
        {world.discovered.length > 0 ? (
          <Text style={styles.resultFound}>
            도감 {world.discovered.length}종 발견:{' '}
            {world.discovered.map((id) => unitDef(id).name).join(', ')}
          </Text>
        ) : null}
        <Button
          label="나가기"
          tone="gold"
          onPress={onExit}
          style={{ alignSelf: 'stretch', marginTop: 12 }}
        />
      </Frame>
    </View>
  );
}

/**
 * '이 카드를 위로 끌어라' 신호.
 *
 * 글로 적어 두어도 처음 하는 사람은 카드를 누를 생각부터 한다 - 끌어야
 * 한다는 건 보여 줘야 안다. 카드 위로 화살표 세 개가 차례로 올라가면
 * 방향과 동작이 한 번에 읽힌다.
 *
 * 네이티브 드라이버로 돌린다. 튜토리얼 1걸음에서는 판이 멈춰 있어
 * 자바스크립트 쪽 렌더가 안 도는데, 그래도 이건 움직여야 한다.
 */
function DragHint({ t }: { t: Animated.Value }) {
  return (
    <View style={styles.dragHint} pointerEvents="none">
      {/* 손가락이 올라가는 길 - 화살표가 지나갈 자리를 옅게 깔아 둔다 */}
      <View style={styles.dragTrail} />
      {[0, 1, 2].map((i) => {
        // 위쪽 화살표부터 차례로 밝아진다 - 올라가는 방향으로 읽힌다
        const at = 0.24 * (2 - i);
        return (
          <Animated.Text
            key={i}
            style={[
              styles.dragArrow,
              {
                opacity: t.interpolate({
                  inputRange: [0, at, at + 0.16, at + 0.42, 1],
                  outputRange: [0.14, 1, 1, 0.14, 0.14],
                }),
              },
            ]}
          >
            ▲
          </Animated.Text>
        );
      })}
    </View>
  );
}

/**
 * 살 수 있는 유닛 한 장.
 *
 * 로비의 모드 카드와 같은 언어로 만든다 - 납작한 색면 하나로는 배경 위에
 * 스티커처럼 얹혀 보이기 때문이다. 네 겹이다.
 *
 *   1) 등급 그라데이션 - 위가 밝고 아래로 어두워진다
 *   2) 위쪽 베벨 - 유리처럼 빛을 한 줄 얹는다
 *   3) 아래쪽 그늘막 - 값이 얹힐 자리를 어둡게 깔아 준다
 *   4) 안쪽 밝은 테두리 - 두꺼운 바깥선 안에 머리카락 선을 하나 더
 *
 * 그림은 카드 위로 살짝 넘치게 둔다. 액자 안에 갇히면 작아 보인다 - 모드
 * 카드에서 캐릭터를 밖으로 내보낸 것과 같은 이유다.
 */
/**
 * 상점의 등급 칸 하나.
 *
 * 카드보다 **낮고 좁게** 만든다. 둘 다 '사는 곳'이라 같은 크기로 두면 넉 장
 * 더 깔린 줄로 보이는데, 실제로는 동작이 다르다(눌러서 바로 서느냐, 끌어다
 * 놓느냐). 키가 다르면 줄이 둘이라는 게 먼저 읽힌다.
 *
 * 유닛 그림은 안 넣는다. **누가 나올지 모르는 게 이 칸의 뜻**이라, 한 마리를
 * 그려 두면 그게 나온다는 약속처럼 읽힌다. 대신 등급 이름과 값을 적는다.
 */
const ShopSlot = React.memo(function ShopSlot({
  tier,
  price,
  poor,
  onPress,
}: {
  tier: Tier;
  price: number;
  poor: boolean;
  onPress: () => void;
}) {
  const label = TIERS.find((x) => x.id === tier)?.label ?? tier;

  return (
    <Pressable style={styles.shopSlot} onPress={poor ? undefined : onPress} hitSlop={4}>
      {/* 살 수 없으면 흐리게 - 카드와 같은 말이다 */}
      <LinearGradient
        colors={TIER_RING[tier] ?? AURORA}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.shopRing, poor && styles.offerPoor]}
      >
        <View style={styles.shopCard}>
          <LinearGradient colors={RARITY_G[tier]} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)'] as const}
            style={styles.shopBevel}
            pointerEvents="none"
          />
          <View style={styles.shopInner} pointerEvents="none" />
          <View style={styles.shopFace} pointerEvents="none">
            <Text style={styles.shopTier}>{label}</Text>
            <View style={styles.shopCostRow}>
              <CoinIcon size={11} />
              <Text style={styles.shopCost}>{price}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

/**
 * 골드 카드.
 *
 * 유닛 카드와 같은 틀을 쓰되 색만 금색이다 - 틀이 다르면 '다른 줄에서 온
 * 것'처럼 보인다. 다른 점은 **끌지 않고 누른다**는 것뿐이라, 값 대신
 * '받기'라고 적어 그 차이를 글로 알린다.
 */
const GoldCard = React.memo(function GoldCard({
  amount,
  taken,
  onPress,
}: {
  amount: number;
  taken: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.offerSlot} onPress={taken ? undefined : onPress}>
      <LinearGradient
        colors={AURORA}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.offerRing, taken && styles.offerDone]}
      >
        <View style={styles.offerCard}>
          <LinearGradient colors={G.gold} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)'] as const}
            style={styles.offerBevel}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(8,6,20,0)', 'rgba(8,6,20,0.78)'] as const}
            style={styles.offerScrim}
            pointerEvents="none"
          />
          <View style={styles.offerInner} pointerEvents="none" />
          <Text style={styles.offerCost}>{taken ? '완료' : '받기'}</Text>
        </View>
      </LinearGradient>

      {taken ? null : (
        <View style={styles.offerArt} pointerEvents="none">
          <CoinIcon size={54} />
          <Text style={styles.goldAmount}>+{amount}</Text>
        </View>
      )}
    </Pressable>
  );
});

/**
 * 제안을 통째로 다시 까는 버튼.
 *
 * 카드 오른쪽에 붙여 세운다. 카드보다 좁고 같은 높이라, 넉 장째 카드로
 * 착각하지 않으면서 '이 줄에 속한 것'으로는 읽힌다.
 */
const RerollButton = React.memo(function RerollButton({
  cost,
  poor,
  onPress,
}: {
  cost: number;
  poor: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.rerollSlot} onPress={poor ? undefined : onPress} hitSlop={6}>
      <LinearGradient
        colors={AURORA}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.rerollRing, poor && styles.offerPoor]}
      >
        <View style={styles.rerollCard}>
          <LinearGradient colors={G.hot} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)'] as const}
            style={styles.offerBevel}
            pointerEvents="none"
          />
          <View style={styles.offerInner} pointerEvents="none" />
          <View style={styles.rerollFace} pointerEvents="none">
            <MenuIcon name="reroll" size={21} color={C.text} />
            <View style={styles.rerollCostRow}>
              <CoinIcon size={11} />
              <Text style={styles.rerollCost}>{cost}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const OfferCard = React.memo(function OfferCard({
  def,
  bought,
  price,
  poor,
  pan,
  lead,
}: {
  def: RosterUnit;
  bought: boolean;
  price: number;
  /** 골드가 모자라거나 판이 꽉 차서 지금은 못 산다 */
  poor: boolean;
  pan: PanResponderInstance;
  /** 튜토리얼에서 본보기로 움직여 보이는 한 장 */
  lead?: boolean;
}) {
  const off = bought || poor;

  /*
    가리키는 동안 카드가 화살표를 따라 올라갔다 내려온다.

    화살표만 있으면 '위'라는 건 알아도 무엇을 위로 보내라는 건지가 한 번 더
    생각해야 나온다. 카드가 같이 움직이면 '이 카드를 저리로'가 한 몸으로 읽힌다.
    같은 값 하나로 돌려 둘의 박자가 어긋나지 않게 한다.
  */
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!lead) {
      t.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [lead, t]);

  const rise = t.interpolate({
    inputRange: [0, 0.1, 0.55, 0.78, 1],
    outputRange: [0, 0, -18, 0, 0],
  });

  return (
    <View {...(off ? {} : pan.panHandlers)}>
      {(() => (
        <View style={styles.offerSlot}>
          {lead ? <DragHint t={t} /> : null}

          <Animated.View style={lead ? { transform: [{ translateY: rise }] } : null}>
            {/*
              오로라 테두리.

              단색 파랑 한 겹은 너무 찐해서 카드보다 테두리가 먼저 보였다.
              청록에서 보라로 흐르게 하고 채도를 낮추면, 끌 수 있다는 신호는
              남으면서 눈을 잡아채지 않는다. 테두리를 그리는 대신 그라데이션
              판을 깔고 그 위에 카드를 얹는다 - RN 은 테두리에 그라데이션을
              못 준다.
            */}
            {/*
              살 수 없으면 흐리게 눌러 둔다 - 골드가 모자랄 때와 판이 꽉 찼을 때.

              한때 테두리를 빨갛게 바꿨는데, 판 아래가 온통 빨간 경고로 차서
              시끄러웠다. 산 카드(완료)와 같은 말투로 꺼 두는 쪽이 조용하다.
            */}
            <LinearGradient
              colors={TIER_RING[def.tier] ?? AURORA}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.offerRing, poor && styles.offerPoor, bought && styles.offerDone]}
            >
              <View style={styles.offerCard}>
                <LinearGradient colors={RARITY_G[def.tier]} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)'] as const}
                  style={styles.offerBevel}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['rgba(8,6,20,0)', 'rgba(8,6,20,0.78)'] as const}
                  style={styles.offerScrim}
                  pointerEvents="none"
                />
                <View style={styles.offerInner} pointerEvents="none" />
                <Text style={styles.offerCost}>{bought ? '완료' : price}</Text>
              </View>
            </LinearGradient>

            {/* 그림은 카드 위로 넘친다 - 그래서 카드 바깥에 따로 얹는다 */}
            {bought ? null : (
              <View style={styles.offerArt} pointerEvents="none">
                <TrayArt def={def} size={68} />
              </View>
            )}
          </Animated.View>
        </View>
      ))()}
    </View>
  );
});

/*
  아래 세 컴포넌트는 memo 로 감싼다.

  전투 화면은 초당 30번 다시 그린다. 유닛 16 + 적 여럿이 각각 SVG 를 물고
  있어서, 감싸지 않으면 그 SVG 트리가 매 프레임 통째로 다시 만들어진다 -
  실제로 그것 때문에 렉이 걸렸다. 위치는 부모 View 가 들고 있으니, 그림
  자체는 종류와 크기가 그대로면 다시 그릴 이유가 없다.
*/

/**
 * 판에 선 유닛 한 칸.
 *
 * 등급 그라데이션만 깔았더니 납작한 색종이였다. 위쪽 광택 한 줄과 아래 어둠을
 * 겹치면 같은 그라데이션이 '깎인 말'처럼 보인다 - 다른 화면의 Slot 과 같은 수법.
 */
const UnitTile = React.memo(function UnitTile({ def, size }: { def: RosterUnit; size: number }) {
  const Art = artFor(def.id);
  const sprite = spriteFor(def.id);
  const photo = photoFor(def.id);
  return (
    <LinearGradient colors={RARITY_G[def.tier]} style={styles.unitFill}>
      <View style={styles.unitGloss} pointerEvents="none" />
      {/* 판 위와 같은 그림이라야 같은 유닛으로 읽힌다 */}
      {sprite ? (
        <SpriteStill set={sprite} size={size * 0.92} />
      ) : photo ? (
        <Image
          source={photo}
          style={{ width: size * 0.86, height: size * 0.86 }}
          resizeMode="contain"
        />
      ) : Art ? (
        <Art size={size * 0.82} />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{def.emoji}</Text>
      )}
    </LinearGradient>
  );
});

/**
 * 판에 선 유닛.
 *
 * 등급 그라데이션 타일을 씌우고 있었는데, 판에 열여섯 개가 깔리면 그림보다
 * 네모가 먼저 보여서 경기장이 서류철처럼 됐다. 등급은 아래 보유 목록과 살
 * 카드에서 이미 색으로 보이니, 판에서는 **캐릭터만** 세운다.
 *
 * 대신 발밑 그늘을 깐다 - 배경이 비치면 떠 있는 것처럼 보인다.
 */
/** 대상 쪽으로 몸을 던지는 공격 - 나머지(화살, 약병, 고리, 빔, 숨결, 별)는 쏘는 쪽이다 */
const MELEE_KINDS = new Set(['slash', 'shock']);

/**
 * 공격할 때의 몸짓.
 *
 * 근접은 대상 쪽으로 툭 튀어나갔다 돌아오고, 쏘는 유닛은 반동으로 살짝 뒤로 밀린다.
 * 서 있기만 하면 이펙트가 어디서 나갔는지 눈으로 이어지지 않았다.
 *
 * 유닛 층은 매 프레임 다시 그리지 않는다 - 그래서 몸짓은 리렌더 없이 네이티브
 * 드라이버로만 돌린다. 공격 간격(0.4초~)보다 짧게(0.2초) 끝나서 연달아 쳐도 겹치지 않는다.
 */
const UnitMotion = React.memo(function UnitMotion({
  id,
  kind,
  cell,
  register,
  enabled = true,
  children,
}: {
  id: number;
  kind: string;
  cell: number;
  register: (id: number, fn: (dx: number, dy: number) => void) => () => void;
  /**
   * 제 동작을 가진 유닛(`sprites.ts`, `rig.tsx`)은 꺼 둔다.
   *
   * 저쪽이 이미 반동으로 튀고 몸을 싣는다. 여기서 또 밀면 두 번 움직여서
   * 어느 쪽도 제대로 안 보인다 - 사람이 그린 동작 위에 코드가 미는 것을
   * 얹으면 특히 싸구려로 보인다.
   */
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;
  /** 쏘는 순간 몸을 젖히는 각도. -1 ~ 1 을 각도로 편다 */
  const tilt = useRef(new Animated.Value(0)).current;

  useEffect(
    () =>
      register(id, (dx, dy) => {
        if (!enabled) return;
        const len = Math.hypot(dx, dy) || 1;
        const melee = MELEE_KINDS.has(kind);
        /*
          근접은 **앞으로** 파고들고, 원거리는 **뒤로** 밀린다.

          활·지팡이는 쏘는 순간 반동으로 몸이 젖혀진다. 뒤로 조금 밀리면서
          표적 반대쪽으로 기울었다 돌아오면, 가만히 선 그림도 쏜 것으로 읽힌다.
        */
        const d = cell * (melee ? 0.16 : -0.13);
        const out = melee ? 70 : 60;
        const back = melee ? 130 : 170;
        const go = (v: Animated.Value, to: number, rest: number) =>
          Animated.sequence([
            Animated.timing(v, { toValue: to, duration: out, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: rest, duration: back, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]);
        Animated.parallel([
          go(tx, (dx / len) * d, 0),
          go(ty, (dy / len) * d, 0),
          go(sc, melee ? 1.1 : 1.05, 1),
          // 표적이 오른쪽이면 왼쪽으로 젖힌다
          go(tilt, melee ? 0 : (dx >= 0 ? -1 : 1), 0),
        ]).start();
      }),
    [id, kind, cell, register, enabled, tx, ty, sc, tilt],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: 'center',
          justifyContent: 'center',
          transform: [
            { translateX: tx },
            { translateY: ty },
            { rotate: tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] }) },
            { scale: sc },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

const BoardUnitArt = React.memo(function BoardUnitArt({
  def,
  size,
  on,
  facing = 1,
  aim = 0,
  unitId,
  register,
}: {
  def: RosterUnit;
  size: number;
  on: boolean;
  /** -1 이면 좌우를 뒤집는다 */
  facing?: 1 | -1;
  /** 표적이 얼마나 위아래에 있는가(라디안). 그만큼 몸을 기울여 겨눈다 */
  aim?: number;
  /**
   * 때리는 순간을 듣기 위한 둘.
   *
   * 함수 하나로 받지 않는다 - 부모가 `(fn) => register(u.id, fn)` 를 넘기면
   * 그릴 때마다 새 함수라 memo 가 매번 깨진다. 유닛이 쏠 때마다 몸을 도니
   * 유닛 층이 자주 다시 짜이는데, 그때 열여섯 마리가 통째로 다시 그려진다.
   */
  unitId?: number;
  register?: (id: number, fn: () => void) => () => void;
}) {
  const onShot = React.useCallback(
    (fn: () => void) => (register && unitId !== undefined ? register(unitId, fn) : () => {}),
    [register, unitId],
  );
  /*
    겨눈 각도.

    쏠 때 그 각으로 빠르게 들었다가, 한동안 물고 있다가 천천히 수평으로
    돌아온다. 무는 시간을 쏘는 간격보다 길게 잡아야 연사 중에 몸이 오르락
    내리락하지 않는다 - 쏘는 동안은 겨눈 채로 있고, 멈추면 내려온다.

    값은 네이티브 애니메이션으로 돈다. 유닛이 열여섯이어도 JS 는 쏠 때 한 번만
    말하고 손을 뗀다.
  */
  const tilt = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const to = (facing * leanOf(aim) * 180) / Math.PI;
    const hold = Math.max(420, 1400 / def.atkSpeed);
    const anim = Animated.sequence([
      Animated.timing(tilt, { toValue: to, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(hold),
      Animated.timing(tilt, { toValue: 0, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [aim, facing, def.atkSpeed, tilt]);
  const Art = artFor(def.id);
  const sprite = spriteFor(def.id);
  const rig = rigFor(def.id);
  const photo = photoFor(def.id);
  return (
    <>
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.04,
          width: size * (on ? 0.62 : 0.5),
          height: size * (on ? 0.2 : 0.16),
          borderRadius: size * 0.31,
          backgroundColor: on ? 'rgba(232,195,82,0.55)' : 'rgba(0,0,0,0.34)',
        }}
      />
      {/*
        배치한 쪽을 본다.

        그림은 전부 오른쪽을 보고 서 있다. 판 왼쪽에 세운 유닛까지 오른쪽을 보면
        제 뒤를 지나는 적에게 등을 보이는 꼴이라, 왼쪽 자리면 좌우를 뒤집는다.
      */}
      {/*
        겨눈 만큼 몸을 기울인다.

        **뒤집기 바깥에서** 돌려야 한다. 안에서 돌리면 각도까지 같이 뒤집혀
        위를 겨눌 때 아래로 눕는다. 그림자는 이 바깥에 있어 안 따라 돈다 -
        발밑 그림자가 같이 기울면 땅에서 뜬 것처럼 보인다.
      */}
      <Animated.View
        style={{
          transform: [
            { rotate: tilt.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) },
          ],
        }}
      >
      <View style={facing === -1 ? { transform: [{ scaleX: -1 }] } : undefined}>
        {sprite ? (
          /*
            구운 동작 시트가 제일 먼저다.

            사람이 그린 그림이고 동작이 들어 있다. 아래 `rig`/`Art` 는 내가
            좌표로 그린 것이라, 그림이 있는 유닛은 무조건 그림을 쓴다.

            배율 1.08 은 **다른 유닛과 키를 맞춘 값이다.** 구운 그림은 캐릭터가
            칸의 86% 만 차지하는데 SVG 는 94% 를 쓴다.

            쏘는 시간은 다음 타격까지의 간격을 넘기면 안 된다 - 넘기면 아직
            쏘는 중에 다음 발이 나가서 동작 앞부분만 반복된다.
          */
          <SpriteArt set={sprite} size={size * 1.08} register={onShot} period={1000 / def.atkSpeed} />
        ) : rig ? (
          /*
            조각내 관절을 움직이는 유닛. 그림이 없는 유닛의 대비책이다.
          */
          <RigArt spec={rig} size={size} register={onShot} period={1000 / def.atkSpeed} />
        ) : photo ? (
          /*
            여백을 잘라 둔 그림이라 상자 높이에 맞추면 키가 얼추 맞는다. 조금
            키우고 아래로 내려서 발이 그림자 위에 오게 한다.
          */
          <Image
            source={photo}
            style={{ width: size * 1.15, height: size * 1.15, marginTop: size * 0.08 }}
            resizeMode="contain"
          />
        ) : Art ? (
          <Art size={size} />
        ) : (
          <Text style={{ fontSize: size * 0.78 }}>{def.emoji}</Text>
        )}
      </View>
      </Animated.View>
    </>
  );
});

/** 트레이 칸의 작은 그림. 판 위와 같은 그림이라야 같은 유닛으로 읽힌다. */
const TrayArt = React.memo(function TrayArt({ def, size }: { def: RosterUnit; size: number }) {
  const sprite = spriteFor(def.id);
  if (sprite) {
    return <SpriteStill set={sprite} size={size} />;
  }
  const photo = photoFor(def.id);
  if (photo) {
    return <Image source={photo} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  const Art = artFor(def.id);
  return Art ? <Art size={size} /> : <Text style={{ fontSize: size * 0.72 }}>{def.emoji}</Text>;
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },

  hud: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  gear: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.panelDeep,
    borderWidth: 2,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(0.35, 5, 2),
  },

  waveChip: { position: 'absolute', left: 0, right: 0, top: 8, alignItems: 'center' },
  waveChipFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: C.outline,
    ...shadow(0.4, 6, 3),
  },
  waveLabel: { color: '#f0d9ff', fontSize: 10, letterSpacing: 1 },
  waveNum: { color: '#fff', fontSize: 17, ...inkShadow, ...numeric },
  bossTag: {
    color: '#2a1f10',
    backgroundColor: '#ffb03c',
    fontSize: 9,
    borderRadius: 5,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,7,26,0.55)',
    borderWidth: 2,
    borderColor: C.outline,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    /*
      폭을 내용에 맞춘다.

      74 로 못 박고 오른쪽 정렬을 했더니 아이콘 왼쪽에 빈 자리가 남았다.
      오른쪽 위에 세로로 쌓여 있을 때는 두 줄의 끝을 맞추려고 그랬던 건데,
      이제 왼쪽부터 나란히 놓으니 맞출 끝이 없다.
    */
  },
  chipText: { fontSize: 14, ...numeric, ...inkShadow },

  waveBarWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    marginTop: 8,
    /*
      이 줄은 높이가 막대와 글자만큼뿐인데, 조합표 버튼과 프레임 표시는
      그 아래로 삐져나온다. 판이 JSX 에서 뒤에 오니 그냥 두면 판에 덮인다.
    */
    zIndex: 10,
  },
  waveBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(10,7,26,0.45)',
    overflow: 'hidden',
  },
  waveBarFill: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    transformOrigin: 'left center',
  },
  waveBarText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textAlign: 'center', marginTop: 3 },
  tableBtn: {
    position: 'absolute',
    right: 14,
    top: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(10,8,26,0.45)',
  },
  tableBtnText: { color: 'rgba(255,255,255,0.72)', fontSize: 10.5 },
  /*
    합칠 거리가 있을 때만 뜨는 카드 줄 - 프레임 표시 바로 밑.

    폭을 카드 세 장으로 못 박는다. 늘어나게 두면 판을 덮는다.
  */
  /** 판 아래 한 줄 - 왼쪽 끝에 정문·골드, 오른쪽 끝에 조합 카드 */
  underBoard: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // 세 장까지만 자리를 준다 - 늘어나게 두면 판을 덮는다
  combineWrap: { width: 3 * 62 + 2 * 5, flexGrow: 0 },
  combineList: { gap: 5, justifyContent: 'flex-end', flexGrow: 1 },
  combineCard: {
    width: 62,
    paddingVertical: 4,
    gap: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,220,140,0.55)',
    backgroundColor: 'rgba(10,8,26,0.62)',
    alignItems: 'center',
  },
  combineCardOff: { borderColor: 'rgba(255,255,255,0.22)', opacity: 0.6 },
  combineRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  combineOut: {
    width: 30,
    height: 30,
    borderRadius: 7,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  combineUp: {
    position: 'absolute',
    right: 1,
    bottom: 0,
    color: C.gold,
    fontSize: 12,
    ...inkShadow,
  },
  combineCost: { color: C.gold, fontSize: 10, ...numeric },
  /** 골드가 들어올 때 칩 왼쪽에서 떠오르는 숫자 */
  goldGain: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 52,
    textAlign: 'right',
    color: C.gold,
    fontSize: 13,
    zIndex: 20,
    ...inkShadow,
    ...numeric,
  },
  fpsText: {
    position: 'absolute',
    right: 16,
    top: 36,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    ...numeric,
  },

  shot: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ffe9a8',
    transformOrigin: 'left center',
  },

  /** 아래 줄이 늘어도 판이 안 밀리게, 자리만 차지하는 빈 칸 */
  arenaSpacer: { flex: 1 },
  arenaWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  arena: {},
  heroSlot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  /** 이미 누가 서 있는 칸 - 놓아도 안 들어간다 */
  dropBusy: { borderColor: 'rgba(255,120,110,0.9)', backgroundColor: 'rgba(255,90,80,0.16)' },
  dropHint: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(232,195,82,0.85)',
    backgroundColor: 'rgba(232,195,82,0.18)',
  },
  /** 이미 누가 선 칸 - 바꿔치기라는 걸 색으로 알린다 */
  dropSwap: { borderColor: 'rgba(122,182,255,0.9)', backgroundColor: 'rgba(122,182,255,0.2)' },
  slotMark: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroMark: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(232,195,82,0.6)',
    backgroundColor: 'rgba(232,195,82,0.12)',
  },
  unit: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  unitFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(0.5, 6, 3),
  },
  // 위 절반만 덮는 흰 막 - 빛이 위에서 든다는 신호
  unitGloss: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    height: '42%',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  unitOn: { transform: [{ scale: 1.12 }] },
  unitStar: { position: 'absolute', bottom: -7, color: C.gold, fontSize: 8 },


  bottom: { alignSelf: 'stretch', paddingHorizontal: 12, paddingBottom: 14 },
  chatLog: { minHeight: 54, justifyContent: 'flex-end', marginBottom: 5 },
  chatLine: { color: C.text, fontSize: 12, lineHeight: 18, ...inkShadow },
  chatSys: { color: C.textFaint },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  chatInput: {
    flex: 1,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(6,4,18,0.62)',
    color: C.text,
    fontSize: 13,
  },
  chatSend: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(232,195,82,0.45)',
    backgroundColor: 'rgba(6,4,18,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendText: { color: C.gold, fontSize: 12, lineHeight: 18 },


  /*
    상점 줄 - 카드 줄 바로 위.

    카드보다 낮게(46 vs 88) 둔다. 같은 키로 두면 넉 장이 더 깔린 줄로
    보이는데, 동작이 다른 줄이라 구분돼야 한다.
  */
  shopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 2,
  },
  shopSlot: { width: 68 },
  shopRing: { width: 68, borderRadius: 12, padding: 2, ...shadow(0.5, 8, 4) },
  shopCard: {
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopBevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 24 },
  shopInner: {
    ...StyleSheet.absoluteFill,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  shopFace: { alignItems: 'center', gap: 1 },
  shopTier: { color: C.text, fontSize: 12, lineHeight: 16, ...inkShadow },
  shopCostRow: { flexDirection: 'row', alignItems: 'center', gap: 2.5 },
  shopCost: { color: C.text, fontSize: 11, lineHeight: 15, ...inkShadow, ...numeric },

  offerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    // 그림이 카드 위로 넘치니 그만큼 자리를 비워 둔다
    paddingTop: 14,
    marginBottom: 8,
  },
  /** 카드 + 그 위로 넘치는 그림을 함께 담는 자리 */
  offerSlot: { width: 78, alignItems: 'center' },
  /** 다시 굴리기 - 카드 높이에 맞춘 좁은 기둥 */
  rerollSlot: { width: 46 },
  rerollRing: { width: 46, borderRadius: 15, padding: 2.5, ...shadow(0.6, 12, 6) },
  rerollCard: {
    height: 88,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerollFace: { alignItems: 'center', gap: 7 },
  rerollCostRow: { flexDirection: 'row', alignItems: 'center', gap: 2.5 },
  rerollCost: { color: C.text, fontSize: 12, lineHeight: 16, ...inkShadow, ...numeric },
  dragHint: { position: 'absolute', top: -66, alignItems: 'center' },
  /** 화살표가 지나가는 길 - 방향이 한 줄로 보인다 */
  dragTrail: {
    position: 'absolute',
    top: 4,
    width: 2,
    height: 52,
    borderRadius: 1,
    backgroundColor: 'rgba(90,168,232,0.22)',
  },
  dragArrow: { color: '#5aa8e8', fontSize: 15, lineHeight: 16, ...inkShadow },
  /** 오로라 테두리 - 그라데이션 판을 깔고 그 위에 카드를 얹는다 */
  offerRing: {
    width: 78,
    borderRadius: 15,
    padding: 2.5,
    ...shadow(0.6, 12, 6),
  },
  offerCard: {
    height: 88,
    borderRadius: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 7,
  },
  offerBevel: { position: 'absolute', top: 0, left: 0, right: 0, height: 46 },
  offerScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  /** 두꺼운 바깥선 안쪽에 머리카락 선을 하나 더 - 두께가 생긴다 */
  offerInner: {
    ...StyleSheet.absoluteFill,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  /** 이미 산 자리 - 두 번 사지 않게 눌러 둔다 */
  offerDone: { opacity: 0.28 },
  /** 살 수 없는 자리 - 산 자리(0.28)보다는 덜 꺼서 둘이 구분된다 */
  offerPoor: { opacity: 0.55 },
  offerCost: { color: C.text, fontSize: 14, lineHeight: 20, ...inkShadow, ...numeric },
  /*
    그림이 카드 위쪽 3분의 2를 채운다.

    작게 넣었더니 카드 가운데가 텅 비어 '빈 액자에 스티커 하나'로 보였다.
    캐릭터가 카드를 채우고 위로 조금 넘쳐야 카드가 꽉 차 보인다.
  */
  offerArt: { position: 'absolute', top: -12, alignItems: 'center' },
  goldAmount: { color: C.gold, fontSize: 15, marginTop: -2, ...inkShadow, ...numeric },

  ownedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    // 비어 있어도 높이를 잡아 둔다 - 첫 유닛을 놓을 때 아래가 안 밀린다
    minHeight: 32,
    marginBottom: 7,
  },
  ownedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 3,
    paddingRight: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(6,4,18,0.5)',
  },
  /** 세 마리가 모였다 - 조합할 수 있다는 신호 */
  ownedChipOn: { borderColor: C.gold, backgroundColor: 'rgba(232,195,82,0.3)' },
  ownedChipReady: { borderColor: C.gold, backgroundColor: 'rgba(232,195,82,0.14)' },
  ownedNum: { color: C.textDim, fontSize: 11, lineHeight: 16, ...numeric },

  bar: { flexDirection: 'row' },

  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
    padding: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(10,7,26,0.5)',
    borderWidth: 2,
    borderColor: C.outline,
  },
  detailArt: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailTier: { fontSize: 10.5 },
  detailName: { color: C.text, fontSize: 14, ...inkShadow },
  detailStar: { color: C.gold, fontSize: 10 },
  detailStats: { color: C.textDim, fontSize: 11, marginTop: 2, ...numeric },
  detailDps: { color: C.gold, fontSize: 12 },

  tableOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,4,18,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  tableBox: { width: '100%', maxWidth: 420 },
  menuBox: { width: '100%', maxWidth: 280 },
  tableTitle: { color: C.text, fontSize: 20, textAlign: 'center', ...inkShadow },
  tableNote: { color: C.textFaint, fontSize: 10 },
  tableRule: {
    color: C.gold,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 10,
    lineHeight: 16,
  },
  tierBlock: { alignItems: 'center', marginBottom: 6 },
  tierHead: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 7,
    marginBottom: 6,
  },
  tierCount: { color: C.textFaint, fontSize: 10.5 },
  tierNext: { color: C.gold, fontSize: 10.5 },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 6,
  },
  tUnit: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  tUnitArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tUnitName: {
    color: C.text,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 12,
  },
  tUnitDps: { color: C.gold, fontSize: 9.5, marginTop: 1, ...numeric },
  tUnitTo: { color: C.gold, fontSize: 9, marginTop: 1 },
  tUnitDpsUnit: { color: 'rgba(232,195,82,0.6)', fontSize: 7.5 },
  tableTierTag: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.outline,
  },
  tableTierText: { color: '#1a1030', fontSize: 11 },
  // ↓ 는 이 폰트에서 빈 글리프라 삼각형을 직접 그린다
  tableArrow: {
    width: 0,
    height: 0,
    marginTop: 5,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.goldDeep,
  },


  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6,4,18,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resultBox: { width: '100%', maxWidth: 340 },
  resultTitle: { color: C.text, fontSize: 20, textAlign: 'center', ...inkShadow },
  resultStars: { color: C.gold, fontSize: 26, textAlign: 'center', marginVertical: 6 },
  resultLine: { color: C.textDim, fontSize: 12.5, textAlign: 'center', marginTop: 3, ...numeric },
  resultFound: { color: C.gold, fontSize: 11.5, marginTop: 8, textAlign: 'center', lineHeight: 17 },
});
