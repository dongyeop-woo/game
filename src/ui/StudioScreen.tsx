import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CADENCES, analytics, cadenceOf, conceptOf, fmtSubs, rankOf, vibeOf } from '../tube/engine';
import type { Run, StatKey, Video } from '../tube/types';
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
type Tab = (typeof TABS)[number];

const STAT_NAME: Record<StatKey, string> = { plan: '기획', edit: '편집', body: '체력', mind: '멘탈' };

/** 조회수 같은 큰 수. 실제 스튜디오처럼 만·천 단위로 */
function fmt(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

export function StudioScreen({ run, onClose }: { run: Run; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('대시보드');
  const concept = conceptOf(run.concept);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.top}>
        <View style={s.brand}>
          <View style={s.brandMark}>
            <View style={s.brandPlay} />
          </View>
          <Text style={s.brandText}>스튜디오</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={s.close}>닫기</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {tab === '대시보드' ? <Dashboard run={run} /> : null}
        {tab === '콘텐츠' ? <Contents run={run} /> : null}
        {tab === '분석' ? <Analytics run={run} /> : null}
        {tab === '커뮤니티' ? <Community run={run} /> : null}
        {tab === '수익' ? <Revenue run={run} /> : null}
      </ScrollView>

      <View style={[s.tabs, { paddingBottom: insets.bottom + 6 }]}>
        {TABS.map((t) => (
          <Pressable key={t} style={s.tab} onPress={() => setTab(t)}>
            <View style={[s.tabIcon, tab === t && s.tabIconOn]} />
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
        <Text style={s.chName}>{concept.name}</Text>
        <Text style={s.chSubs}>{run.subs.toLocaleString()}</Text>
        <Text style={s.chSubsLabel}>총 구독자 수</Text>
      </View>
    </View>
  );
}

function Dashboard({ run }: { run: Run }) {
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
        <Card label="예상 수익" value={`${a.revenue.toLocaleString()}원`} />
      </View>
      <Text style={[s.h2, { marginTop: 22 }]}>최근 게시된 콘텐츠</Text>
      {recent.length === 0 ? (
        <Text style={s.empty}>아직 올린 영상이 없습니다.</Text>
      ) : (
        recent.map((v) => <VideoRow key={v.id} run={run} v={v} />)
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
            <Text style={s.upText}>↑</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** 영상 한 줄. 누르면 실제 스튜디오처럼 세부가 펼쳐진다 */
function VideoRow({ run, v }: { run: Run; v: Video }) {
  const [open, setOpen] = useState(false);
  const ago = run.age - v.day;
  const rank = rankOf(run, v);
  const rate = Math.min(99.9, 40 + v.gain / 12).toFixed(1);
  return (
    <View style={s.video}>
      <Pressable style={s.videoHead} onPress={() => setOpen((o) => !o)}>
        <View style={[s.thumb, v.vibe ? { backgroundColor: THUMB[v.vibe] } : null]} />
        <View style={{ flex: 1 }}>
          <Text style={s.vTitle} numberOfLines={1}>
            {v.title}
          </Text>
          <Text style={s.vSub}>{ago === 0 ? '오늘' : `${ago}일 전`}</Text>
        </View>
      </Pressable>
      <View style={s.vStats}>
        <Text style={s.vStat}>▥ {fmt(v.views)}</Text>
        <Text style={s.vStat}>👍 {fmt(v.likes)}</Text>
        <Text style={s.vStat}>💬 {v.comments}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={10}>
          <Text style={s.chev}>{open ? '⌃' : '⌄'}</Text>
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
          <Text style={s.detailFoot}>응답하지 않은 댓글 없음</Text>
        </View>
      ) : null}
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

function Contents({ run }: { run: Run }) {
  const all = [...run.videos].reverse();
  return (
    <>
      <Text style={s.h2}>콘텐츠 {all.length}개</Text>
      {all.length === 0 ? <Text style={s.empty}>아직 올린 영상이 없습니다.</Text> : all.map((v) => <VideoRow key={v.id} run={run} v={v} />)}
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

function Community({ run }: { run: Run }) {
  return (
    <>
      <Text style={s.h2}>만난 사람 {run.met.length}명</Text>
      {run.met.length === 0 ? (
        <Text style={s.empty}>아직 아무도 못 만났다.</Text>
      ) : (
        run.met.map((m) => (
          <View key={m} style={s.person}>
            <View style={s.personDot} />
            <Text style={s.rowVal}>{m}</Text>
          </View>
        ))
      )}
    </>
  );
}

function Revenue({ run }: { run: Run }) {
  const a = analytics(run);
  return (
    <>
      <Text style={s.h2}>수익 창출</Text>
      <View style={s.cards}>
        <Card label="잔고" value={`${run.money.toLocaleString()}원`} />
        <Card label="정산 횟수" value={String(run.payouts)} />
        <Card label="예상 수익(28일)" value={`${a.revenue.toLocaleString()}원`} />
        <Card label="노란 딱지" value={run.yellow > 0 ? `${run.yellow}일 남음` : '없음'} />
      </View>
      <Text style={s.para}>구독자 {fmtSubs(run.subs)} 기준. 닷새마다 정산된다.</Text>
    </>
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
  root: { flex: 1, backgroundColor: P.bg },
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
  person: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: P.line },
  personDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: P.soft },

  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: P.line, paddingTop: 8, backgroundColor: P.bg },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  tabIcon: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: P.faint },
  tabIconOn: { borderColor: P.ink, backgroundColor: P.ink },
  tabText: { color: P.faint, fontSize: 11 },
  tabTextOn: { color: P.ink },
});
