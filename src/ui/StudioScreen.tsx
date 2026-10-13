import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import {
  CADENCES,
  MIN_PAYOUT,
  YPP_HOURS,
  YPP_REVIEW_DAYS,
  YPP_SUBS,
  YPP_VIEWS,
  analytics,
  applyYpp,
  block,
  cadenceOf,
  conceptOf,
  deleteComment,
  fmtSubs,
  fmtWon,
  hideComment,
  payIn,
  personOf,
  rankOf,
  recentComments,
  vibeOf,
  yppProgress,
} from '../tube/engine';
import type { Comment, Run, StatKey, Video } from '../tube/types';
import { Text } from './Text';

/**
 * 스튜디오 - 내 채널을 본다.
 *
 * 실제 유튜브 스튜디오 앱의 대시보드를 닮게 짰다. 채널 헤더, 지난 28일 분석
 * 네 칸, 최근 영상 목록(누르면 펼쳐진다), 아래 탭. 소재가 유튜브니 유튜브를
 * 닮는 게 자연스럽다 - 다만 로고나 이름은 안 쓴다.
 *
 * 숫자는 전부 `tube/engine.ts` 가 계산한다. 여기서는 읽기만 한다.
 */

const P = {
  bg: '#ffffff',
  soft: '#f3f4f6',
  line: '#e5e7eb',
  ink: '#111827',
  dim: '#6b7280',
  faint: '#9ca3af',
  red: '#ff0033',
  good: '#16a34a',
};

const TABS = ['대시보드', '콘텐츠', '분석', '커뮤니티', '수익'] as const;
/** 실제 스튜디오 앱 아래 탭과 같은 머티리얼 아이콘 */
const TAB_ICON: Record<(typeof TABS)[number], React.ComponentProps<typeof MaterialIcons>['name']> = {
  대시보드: 'dashboard',
  콘텐츠: 'video-library',
  분석: 'insights',
  커뮤니티: 'forum',
  수익: 'attach-money',
};
type Tab = (typeof TABS)[number];

const STAT_NAME: Record<StatKey, string> = { plan: '기획', edit: '편집', body: '체력', mind: '멘탈' };

/** 조회수 같은 큰 수. 실제 스튜디오처럼 만·천 단위로 */
function fmt(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

export function StudioScreen({ run, onRun, onClose }: { run: Run; onRun: (r: Run) => void; onClose: () => void }) {
  const win = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('대시보드');
  const concept = conceptOf(run.concept);

  return (
    <View style={[s.root, { maxHeight: win.height * 0.78 }]}>
      <View style={s.top}>
        <View style={s.brand}>
          <View style={s.brandMark}>
            <View style={s.brandPlay} />
          </View>
          <Text style={s.brandText}>스튜디오</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={P.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
        {tab === '대시보드' ? <Dashboard run={run} onRun={onRun} /> : null}
        {tab === '콘텐츠' ? <Contents run={run} onRun={onRun} /> : null}
        {tab === '분석' ? <Analytics run={run} /> : null}
        {tab === '커뮤니티' ? <Community run={run} onRun={onRun} /> : null}
        {tab === '수익' ? <Revenue run={run} onRun={onRun} /> : null}
      </ScrollView>

      <View style={s.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} style={s.tab} onPress={() => setTab(t)}>
            <MaterialIcons name={TAB_ICON[t]} size={24} color={tab === t ? P.ink : P.faint} />
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Header({ run }: { run: Run }) {
  const concept = conceptOf(run.concept);
  return (
    <View style={s.header}>
      <View style={s.avatar}>
        <Text style={s.avatarHint}>얼굴</Text>
      </View>
      <View>
        <Text style={s.chName}>{run.name}</Text>
        <Text style={s.chConcept}>{concept.name}</Text>
        <Text style={s.chSubs}>{run.subs.toLocaleString()}</Text>
        <Text style={s.chSubsLabel}>총 구독자 수</Text>
      </View>
    </View>
  );
}

function Dashboard({ run, onRun }: { run: Run; onRun: (r: Run) => void }) {
  const a = analytics(run);
  const recent = [...run.videos].reverse().slice(0, 3);
  return (
    <>
      <Header run={run} />
      <View style={s.rowHead}>
        <Text style={s.h2}>채널 분석</Text>
        <Text style={s.hSub}>지난 28일</Text>
      </View>
      <View style={s.cards}>
        <Card label="조회수" value={fmt(a.views)} up={a.views > 0} />
        <Card label="시청 시간(단위: 시간)" value={fmt(a.hours)} up={a.hours > 0} />
        <Card label="구독자 수" value={`+${fmt(a.subs)}`} />
        <Card label="예상 수익" value={run.ypp === 'on' ? fmtWon(a.revenue) : '-'} />
      </View>
      <Text style={[s.h2, { marginTop: 22 }]}>최근 게시된 콘텐츠</Text>
      {recent.length === 0 ? (
        <Text style={s.empty}>아직 올린 영상이 없습니다.</Text>
      ) : (
        recent.map((v) => <VideoRow key={v.id} run={run} v={v} onRun={onRun} />)
      )}
    </>
  );
}

function Card({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{label}</Text>
      <View style={s.cardRow}>
        <Text style={s.cardValue}>{value}</Text>
        {up ? (
          <View style={s.upDot}>
            <MaterialIcons name="arrow-upward" size={12} color="#fff" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * 영상 한 줄. 누르면 실제 스튜디오처럼 세부가 펼쳐진다.
 * 💬 를 누르면 그 영상의 댓글이 전부 나오고, 거기서 지우거나 숨기거나 차단한다.
 */
function VideoRow({ run, v, onRun }: { run: Run; v: Video; onRun: (r: Run) => void }) {
  const [open, setOpen] = useState(false);
  const [cmts, setCmts] = useState(false);
  const ago = run.age - v.day;
  const rank = rankOf(run, v);
  const rate = Math.min(99.9, 40 + v.gain / 12).toFixed(1);
  const shown = v.replies.filter((c) => !c.hidden);
  return (
    <View style={s.video}>
      <Pressable style={s.videoHead} onPress={() => setOpen((o) => !o)}>
        <View style={[s.thumb, v.vibe ? { backgroundColor: THUMB[v.vibe] } : null]} />
        <View style={{ flex: 1 }}>
          <Text style={s.vTitle} numberOfLines={1}>
            {v.title}
          </Text>
          <Text style={s.vSub}>{ago === 0 ? '오늘' : `${ago}일 전`}{v.settled ? '' : ' · 처리 중'}</Text>
        </View>
      </Pressable>
      <View style={s.vStats}>
        <View style={s.vStatRow}>
          <MaterialIcons name="visibility" size={18} color={P.ink} />
          <Text style={s.vStat}>{v.settled ? fmt(v.views) : '-'}</Text>
        </View>
        <View style={s.vStatRow}>
          <MaterialIcons name="thumb-up-off-alt" size={18} color={P.ink} />
          <Text style={s.vStat}>{v.settled ? fmt(v.likes) : '-'}</Text>
        </View>
        <Pressable onPress={() => setCmts((c) => !c)} hitSlop={8} disabled={!v.settled} style={s.vStatRow}>
          <MaterialCommunityIcons name="comment-outline" size={18} color={cmts ? P.red : P.ink} />
          <Text style={[s.vStat, cmts && { color: P.red }]}>{v.settled ? v.comments : '-'}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={10}>
          <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={24} color={P.dim} />
        </Pressable>
      </View>
      {open ? (
        <View style={s.detail}>
          <Row k="조회수 순위" v={`${rank}/${run.videos.length}`} />
          <Row k="조회수" v={fmt(v.views)} up />
          <Row k="평균 조회율" v={`${rate}%`} up />
          <Row k="좋아요" v={fmt(v.likes)} up />
          <View style={s.hr} />
          <Row k="댓글" v={String(v.comments)} />
          <Pressable onPress={() => setCmts(true)}>
            <Text style={s.detailFoot}>{shown.length === 0 ? '응답하지 않은 댓글 없음' : `댓글 ${shown.length}개 보기`}</Text>
          </Pressable>
        </View>
      ) : null}
      {cmts ? (
        <View style={s.cmtBox}>
          <Text style={s.cmtHead}>댓글 {shown.length}개{v.replies.length - shown.length > 0 ? ` · 숨김 ${v.replies.length - shown.length}` : ''}</Text>
          {shown.length === 0 ? <Text style={s.empty}>댓글이 없다.</Text> : null}
          {shown.map((c) => (
            <CommentRow
              key={c.id}
              c={c}
              onHide={() => onRun(hideComment(run, v.id, c.id))}
              onDelete={() => onRun(deleteComment(run, v.id, c.id))}
              onBlock={() => onRun(block(run, c.who))}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 댓글 한 줄과 세 버튼. 악플이면 버튼이 더 눈에 띈다 */
function CommentRow({ c, onHide, onDelete, onBlock }: { c: Comment; onHide: () => void; onDelete: () => void; onBlock: () => void }) {
  return (
    <View style={s.cmtRow}>
      <View style={[s.cmtDot, c.tone === 'bad' && { backgroundColor: '#fecaca' }, c.tone === 'good' && { backgroundColor: '#bbf7d0' }]}>
        <MaterialIcons name="person" size={14} color={P.dim} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cmtWho}>{c.who}</Text>
        <Text style={s.cmtText}>{c.text}</Text>
        <View style={s.cmtActs}>
          <Pressable onPress={onHide} hitSlop={6} style={s.cmtActRow}>
            <MaterialIcons name="visibility-off" size={15} color={P.dim} />
            <Text style={s.cmtAct}>숨김</Text>
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6} style={s.cmtActRow}>
            <MaterialIcons name="delete-outline" size={15} color={P.dim} />
            <Text style={s.cmtAct}>삭제</Text>
          </Pressable>
          <Pressable onPress={onBlock} hitSlop={6} style={s.cmtActRow}>
            <MaterialIcons name="block" size={15} color={c.tone === 'bad' ? P.red : P.dim} />
            <Text style={[s.cmtAct, c.tone === 'bad' && { color: P.red }]}>차단</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Row({ k, v, up }: { k: string; v: string; up?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{k}</Text>
      <Text style={s.rowVal}>{v}</Text>
      {up ? (
        <View style={s.upDot}>
          <Text style={s.upText}>↑</Text>
        </View>
      ) : null}
    </View>
  );
}

function Contents({ run, onRun }: { run: Run; onRun: (r: Run) => void }) {
  const all = [...run.videos].reverse();
  return (
    <>
      <Text style={s.h2}>콘텐츠 {all.length}개</Text>
      {all.length === 0 ? <Text style={s.empty}>아직 올린 영상이 없습니다.</Text> : all.map((v) => <VideoRow key={v.id} run={run} v={v} onRun={onRun} />)}
    </>
  );
}

function Analytics({ run }: { run: Run }) {
  const cad = cadenceOf(run);
  return (
    <>
      <Text style={s.h2}>내 실력</Text>
      {(Object.keys(STAT_NAME) as StatKey[]).map((k) => (
        <View key={k} style={s.statLine}>
          <Text style={s.rowKey}>{STAT_NAME[k]}</Text>
          <View style={s.statBg}>
            <View style={[s.statBar, { width: `${run.stats[k]}%` }]} />
          </View>
          <Text style={s.rowVal}>{run.stats[k]}</Text>
        </View>
      ))}
      <Text style={[s.h2, { marginTop: 22 }]}>업로드 주기</Text>
      {CADENCES.map((c) => (
        <Row key={c.id} k={`${c.name}  (편집 ${c.edit})`} v={c.id === cad.id ? '지금' : run.stats.edit >= c.edit ? '가능' : '잠김'} />
      ))}
      <Text style={[s.h2, { marginTop: 22 }]}>이번 주 알고리즘</Text>
      <Text style={s.para}>{run.trendKnown ? `${vibeOf(run.trend).name} - ${vibeOf(run.trend).hint}` : '아직 모른다. 쇼츠를 보면 알 수 있다.'}</Text>
    </>
  );
}

function Community({ run, onRun }: { run: Run; onRun: (r: Run) => void }) {
  const cmts = recentComments(run, 12);
  return (
    <>
      <Text style={s.h2}>만난 사람 {run.met.length}명</Text>
      {run.met.length === 0 ? (
        <Text style={s.empty}>아직 아무도 못 만났다.</Text>
      ) : (
        run.met.map((m) => {
          const p = personOf(m);
          return (
            <View key={m} style={s.person}>
              <View style={s.personDot}>
                <MaterialIcons name="person-outline" size={18} color={P.dim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowVal}>{p.name}</Text>
                {p.desc ? <Text style={s.personDesc}>{p.desc}</Text> : null}
              </View>
            </View>
          );
        })
      )}
      {run.blocked.length ? <Text style={s.para}>차단 {run.blocked.length}명: {run.blocked.join(', ')}</Text> : null}
      <Text style={[s.h2, { marginTop: 22 }]}>최근 댓글</Text>
      {cmts.length === 0 ? (
        <Text style={s.empty}>아직 댓글이 없다. 영상을 올리고 하루 자면 달린다.</Text>
      ) : (
        cmts.map((c) => (
          <View key={c.id} style={s.cmtRow}>
            <View style={[s.cmtDot, c.tone === 'bad' && { backgroundColor: '#fecaca' }, c.tone === 'good' && { backgroundColor: '#bbf7d0' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.cmtWho}>
                {c.who} <Text style={s.cmtOn}>· {c.title}</Text>
              </Text>
              <Text style={s.cmtText}>{c.text}</Text>
              <View style={s.cmtActs}>
                <Pressable onPress={() => onRun(hideComment(run, c.videoId, c.id))} hitSlop={6} style={s.cmtActRow}>
                  <MaterialIcons name="visibility-off" size={15} color={P.dim} />
                  <Text style={s.cmtAct}>숨김</Text>
                </Pressable>
                <Pressable onPress={() => onRun(deleteComment(run, c.videoId, c.id))} hitSlop={6} style={s.cmtActRow}>
                  <MaterialIcons name="delete-outline" size={15} color={P.dim} />
                  <Text style={s.cmtAct}>삭제</Text>
                </Pressable>
                <Pressable onPress={() => onRun(block(run, c.who))} hitSlop={6} style={s.cmtActRow}>
                  <MaterialIcons name="block" size={15} color={c.tone === 'bad' ? P.red : P.dim} />
                  <Text style={[s.cmtAct, c.tone === 'bad' && { color: P.red }]}>차단</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );
}

/**
 * 수익 탭. 실제 유튜브 파트너 프로그램 흐름 - 조건 → 신청 → 사흘 검토 →
 * 승인 → 21일 지급(최소 지급액 넘을 때만).
 */
function Revenue({ run, onRun }: { run: Run; onRun: (r: Run) => void }) {
  const a = analytics(run);
  const p = yppProgress(run);
  const left = run.ypp === 'applied' ? Math.max(0, YPP_REVIEW_DAYS - (run.age - run.yppAt)) : 0;
  return (
    <>
      <Text style={s.h2}>수익 창출</Text>
      {run.ypp === 'on' ? (
        <>
          <View style={s.cards}>
            <Card label="애드센스 잔액" value={fmtWon(Math.floor(run.earned))} />
            <Card label="다음 지급" value={`${payIn(run.age)}일 뒤`} />
            <Card label="예상 수익(28일)" value={fmtWon(a.revenue)} />
            <Card label="노란 딱지" value={run.yellow > 0 ? `${run.yellow}일 남음` : '없음'} />
          </View>
          <Text style={s.para}>
            매달 21일, 잔액이 {fmtWon(MIN_PAYOUT)}을 넘으면 들어온다. 안 넘으면 다음 달로 넘어간다. 지금까지 {run.payouts}번 받았다.
          </Text>
        </>
      ) : run.ypp === 'applied' ? (
        <>
          <View style={s.ypp}>
            <Text style={s.yppTitle}>검토 중</Text>
            <Text style={s.para}>신청했다. 승인까지 {left}일 남았다. 그동안 올린 영상은 돈이 안 된다.</Text>
          </View>
        </>
      ) : (
        <>
          <View style={s.ypp}>
            <Text style={s.yppTitle}>{run.ypp === 'eligible' ? '신청할 수 있다' : '아직 조건이 안 됐다'}</Text>
            <Progress label="구독자" now={p.subs} need={YPP_SUBS} />
            <Progress label="시청 시간 (90일)" now={p.hours} need={YPP_HOURS} unit="시간" />
            <Text style={s.yppOr}>또는</Text>
            <Progress label="조회수 (90일)" now={p.views} need={YPP_VIEWS} />
          </View>
          {run.ypp === 'eligible' ? (
            <Pressable style={s.yppBtn} onPress={() => onRun(applyYpp(run))}>
              <Text style={s.yppBtnText}>수익 창출 신청</Text>
            </Pressable>
          ) : (
            <Text style={s.para}>조건을 채우면 여기서 신청한다. 승인까지 사흘, 그 뒤부터 조회수가 돈이 된다.</Text>
          )}
        </>
      )}
      <Text style={[s.h2, { marginTop: 22 }]}>잔고</Text>
      <View style={s.cards}>
        <Card label="잔고" value={fmtWon(run.money)} />
        <Card label="정산 횟수" value={String(run.payouts)} />
      </View>
    </>
  );
}

function Progress({ label, now, need, unit = '' }: { label: string; now: number; need: number; unit?: string }) {
  const pct = Math.min(100, (now / need) * 100);
  return (
    <View style={s.prog}>
      <View style={s.progHead}>
        <Text style={s.rowKey}>{label}</Text>
        <Text style={[s.rowVal, now >= need && { color: P.good }]}>
          {need < 100000 ? now.toLocaleString() : fmt(now)}
          {unit} / {need < 100000 ? need.toLocaleString() : fmt(need)}
          {unit}
        </Text>
      </View>
      <View style={s.statBg}>
        <View style={[s.statBar, { width: `${pct}%` }, now >= need && { backgroundColor: P.good }]} />
      </View>
    </View>
  );
}

/** 결마다 썸네일 색. 본 화면의 카드 색과 같은 계열 */
const THUMB: Record<string, string> = {
  quality: '#1d4ed8',
  volume: '#6b7280',
  trend: '#7c3aed',
  spicy: '#dc2626',
  social: '#db2777',
};

const s = StyleSheet.create({
  /* 가운데 창. 학습 창과 같은 자리에 뜬다 */
  root: { backgroundColor: P.bg, borderRadius: 22, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 26, height: 18, borderRadius: 6, backgroundColor: P.red, alignItems: 'center', justifyContent: 'center' },
  brandPlay: { width: 0, height: 0, borderLeftWidth: 7, borderTopWidth: 4.5, borderBottomWidth: 4.5, borderLeftColor: '#fff', borderTopColor: 'transparent', borderBottomColor: 'transparent', marginLeft: 2 },
  brandText: { color: P.ink, fontSize: 21 },
  close: { color: P.dim, fontSize: 14 },

  body: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: P.soft, alignItems: 'center', justifyContent: 'center' },
  avatarHint: { color: P.faint, fontSize: 12 },
  chName: { color: P.ink, fontSize: 18 },
  chConcept: { color: P.dim, fontSize: 12 },
  chSubs: { color: P.ink, fontSize: 34, lineHeight: 40 },
  chSubsLabel: { color: P.dim, fontSize: 13 },

  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 },
  h2: { color: P.ink, fontSize: 20, marginBottom: 10 },
  hSub: { color: P.dim, fontSize: 13 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47.5%', backgroundColor: P.soft, borderRadius: 16, padding: 16, gap: 8 },
  cardLabel: { color: P.dim, fontSize: 13 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardValue: { color: P.ink, fontSize: 24 },
  upDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: P.good, alignItems: 'center', justifyContent: 'center' },
  upText: { color: '#fff', fontSize: 11, lineHeight: 13 },
  empty: { color: P.faint, fontSize: 13, paddingVertical: 12 },

  video: { backgroundColor: P.bg, borderRadius: 16, borderWidth: 1, borderColor: P.line, padding: 14, marginBottom: 10 },
  videoHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 54, height: 72, borderRadius: 8, backgroundColor: '#374151' },
  vTitle: { color: P.ink, fontSize: 16 },
  vSub: { color: P.dim, fontSize: 13, marginTop: 2 },
  vStats: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: P.line },
  vStatRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vStat: { color: P.ink, fontSize: 15 },
  chev: { color: P.dim, fontSize: 18 },
  detail: { marginTop: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  rowKey: { color: P.ink, fontSize: 15, flex: 1 },
  rowVal: { color: P.ink, fontSize: 15 },
  hr: { height: 1, backgroundColor: P.line, marginVertical: 6 },
  detailFoot: { color: P.dim, fontSize: 13, paddingBottom: 4 },

  statLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  statBg: { flex: 3, height: 6, borderRadius: 999, backgroundColor: P.line, overflow: 'hidden' },
  statBar: { height: 6, borderRadius: 999, backgroundColor: P.red },
  para: { color: P.dim, fontSize: 14, lineHeight: 21 },
  ypp: { backgroundColor: P.soft, borderRadius: 16, padding: 14, gap: 8 },
  yppTitle: { color: P.ink, fontSize: 16, marginBottom: 2 },
  yppOr: { color: P.faint, fontSize: 12, textAlign: 'center' },
  yppBtn: { backgroundColor: P.red, borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  yppBtnText: { color: '#fff', fontSize: 15 },
  prog: { gap: 5 },
  progHead: { flexDirection: 'row', alignItems: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: P.line },
  personDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: P.soft, alignItems: 'center', justifyContent: 'center' },
  personDesc: { color: P.dim, fontSize: 12, lineHeight: 17, marginTop: 2 },
  cmt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  cmtRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: P.line },
  cmtDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: P.soft, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  cmtWho: { color: P.dim, fontSize: 12 },
  cmtOn: { color: P.faint, fontSize: 11 },
  cmtText: { color: P.ink, fontSize: 14, flex: 1 },
  cmtBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: P.line },
  cmtHead: { color: P.dim, fontSize: 12, marginBottom: 4 },
  cmtActs: { flexDirection: 'row', gap: 14, marginTop: 4 },
  cmtActRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cmtAct: { color: P.dim, fontSize: 12 },

  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: P.line, paddingTop: 8, paddingBottom: 10, backgroundColor: P.bg },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabIcon: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: P.faint },
  tabIconOn: { borderColor: P.ink, backgroundColor: P.ink },
  tabText: { color: P.faint, fontSize: 11 },
  tabTextOn: { color: P.ink },
});
