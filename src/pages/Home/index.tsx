import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ArrowUpRightIcon } from '../../components/Icons';
import { useTimers } from '../../lib/hooks';
import { relativeTime } from '../../lib/time';
import { loadProfile } from '../../lib/storage';
import { useLiveBoard, type PressEvent } from '../../lib/useLiveBoard';
import type { LivePost, ReactionKind } from '../../lib/live';
import { INFLOW_POOL, SEED_CARDS, SEED_PINS, SHOUT_WORDS, type FeedCard } from '../../data/home';
import { Ticker } from './Ticker';
import { SosHero, type Shout } from './SosHero';
import { KoreaMap, type MapPin } from './KoreaMap';
import { Feed } from './Feed';
import { CardModal } from './CardModal';
import { WriteModal, type WriteSubmission } from './WriteModal';
import './home.css';
import './writeModal.css';

const CHAOS_INDEX = 98.4;
const HIGHLIGHT_NEWEST = true;
const SHOUT_LIFETIME = 3300;
const INFLOW_INTERVAL = 7000;
/** 상대 시각("7분 전") 갱신 주기. */
const CLOCK_INTERVAL = 30_000;
/** 프레스가 지나간 지역 핀이 번쩍이는 시간. */
const PULSE_LIFETIME = 1400;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickWord = () => SHOUT_WORDS[Math.floor(Math.random() * SHOUT_WORDS.length)];
const isSeed = (id: string) => id.startsWith('seed-');

/** 비상벨 수 → 핀 지름(px). 상위 지역만 거대해지지 않게 제곱근으로 누른다. */
const pinSize = (count: number) => Math.min(30, Math.round(10 + Math.sqrt(count) * 1.6));

export function Home() {
  const navigate = useNavigate();
  const { after } = useTimers();

  const [shouts, setShouts] = useState<Shout[]>([]);
  const [selected, setSelected] = useState('');
  const [cardId, setCardId] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [presetRegion, setPresetRegion] = useState<string>('');
  const [now, setNow] = useState(() => Date.now());
  /** 방금 누군가 SOS를 누른 지역들 — 해당 핀이 잠깐 번쩍인다. */
  const [pulsed, setPulsed] = useState<string[]>([]);
  /** 백엔드가 없을 때만 쓰는 로컬 피드 (시드 유입 시뮬레이션 + 내가 쓴 글). */
  const [localPosts, setLocalPosts] = useState<LivePost[]>([]);

  const nextLocalId = useRef(0);

  const addShout = useCallback(
    (shout: Shout) => {
      setShouts((prev) => [...prev, shout]);
      after(SHOUT_LIFETIME, () => setShouts((prev) => prev.filter((s) => s.id !== shout.id)));
    },
    [after],
  );

  /** 누군가 SOS를 눌렀다. 내 비명은 크고 진하게, 남의 비명은 작고 흐리게. */
  const onPress = useCallback(
    ({ mine, region }: PressEvent) => {
      if (region) {
        setPulsed((prev) => [...prev, region]);
        after(PULSE_LIFETIME, () =>
          setPulsed((prev) => {
            const i = prev.indexOf(region);
            return i < 0 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
          }),
        );
      }
      const left = Math.random() < 0.5;
      addShout({
        id: Math.random().toString(36).slice(2),
        text: pickWord(),
        x: `${(left ? rand(mine ? 10 : 4, mine ? 34 : 34) : rand(mine ? 66 : 64, mine ? 90 : 94)).toFixed(1)}%`,
        y: `${rand(mine ? 20 : 10, mine ? 74 : 86).toFixed(1)}%`,
        size: `${rand(mine ? 12 : 10, mine ? 17 : 13).toFixed(0)}px`,
        color: mine ? 'var(--muted-3)' : 'var(--shout-ambient)',
        op: mine ? 1 : 0.75,
      });
    },
    [addShout, after],
  );

  const live = useLiveBoard({ onPress });
  const posts = live.enabled ? live.posts : localPosts;

  // 상대 시각은 흐르는 값이라 주기적으로 다시 계산한다.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // 배경 비명 — 900~3500ms 랜덤 간격의 연출. 실시간이 붙어 있으면 진짜 비명이
  // 올라오므로 간격을 늘려 실제 프레스가 묻히지 않게 한다.
  // 어느 쪽이든 TODAY 카운트는 건드리지 않는다.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const [lo, hi] = live.enabled ? [2600, 7000] : [900, 3500];

    const loop = () => {
      if (cancelled) return;
      const left = Math.random() < 0.5;
      addShout({
        id: 'a' + Math.random().toString(36).slice(2),
        text: pickWord(),
        x: `${(left ? rand(4, 34) : rand(64, 94)).toFixed(1)}%`,
        y: `${rand(10, 86).toFixed(1)}%`,
        size: `${rand(10, 13).toFixed(0)}px`,
        color: 'var(--shout-ambient)',
        op: 0.75,
      });
      timer = setTimeout(loop, rand(lo, hi));
    };

    timer = setTimeout(loop, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addShout, live.enabled]);

  // 백엔드가 없을 때만 도는 유입 시뮬레이션. 붙어 있으면 진짜 글이 들어온다.
  useEffect(() => {
    if (live.enabled) return;
    let i = 0;
    const id = setInterval(() => {
      const p = INFLOW_POOL[i % INFLOW_POOL.length];
      i += 1;
      setLocalPosts((prev) =>
        [
          {
            id: `sim-${i}`,
            nick: p.nick,
            region: p.gu,
            story: p.story,
            cheers: p.cheers,
            forgets: p.forgets,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 12),
      );
    }, INFLOW_INTERVAL);
    return () => clearInterval(id);
  }, [live.enabled]);

  // 시드 핀 + 모두가 올린 글을 지역 라벨로 합친다.
  const pins = useMemo<(MapPin & { stories: string[] })[]>(() => {
    const merged = new Map<string, { count: number; stories: string[] }>();
    for (const p of SEED_PINS) merged.set(p.region, { count: p.count, stories: [...p.stories] });
    for (const post of posts) {
      const before = merged.get(post.region) ?? { count: 0, stories: [] };
      merged.set(post.region, {
        count: before.count + 1,
        stories: [post.story, ...before.stories],
      });
    }
    return [...merged].map(([region, v]) => ({
      id: `r-${region}`,
      region,
      count: v.count,
      size: pinSize(v.count),
      stories: v.stories.slice(0, 8),
    }));
  }, [posts]);

  const cards = useMemo<FeedCard[]>(
    () => [
      ...posts.map((p) => ({
        id: p.id,
        nick: p.nick,
        gu: p.region,
        time: relativeTime(p.createdAt, now),
        story: p.story,
        cheers: p.cheers,
        forgets: p.forgets,
        createdAt: p.createdAt,
      })),
      ...SEED_CARDS,
    ],
    [posts, now],
  );

  const activePin = pins.find((p) => p.region === selected) ?? null;
  const activeCard = cards.find((c) => c.id === cardId) ?? null;
  /** 사연이 없는 구를 눌렀을 때만 "첫 번째로 울려보세요" 팝업 */
  const emptyRegionOpen = Boolean(selected) && !activePin;

  /** 캡션은 실제로 가장 시끄러운 두 지역을 따라간다. */
  const hotspots = useMemo(
    () =>
      [...pins]
        .sort((a, b) => b.count - a.count)
        .slice(0, 2)
        .map((p) => p.region),
    [pins],
  );

  const resetMap = useCallback(() => setSelected(''), []);

  const openWriteHere = () => {
    setPresetRegion(selected);
    setWriteOpen(true);
  };

  const openWrite = () => {
    setPresetRegion('');
    setWriteOpen(true);
  };

  const handleSubmit = async (v: WriteSubmission) => {
    setWriteOpen(false);
    const region = v.gu || '전국';
    if (live.enabled) {
      await live.publish({ nick: v.nick, region, story: v.text });
      return;
    }
    nextLocalId.current += 1;
    setLocalPosts((prev) =>
      [
        {
          id: `local-${nextLocalId.current}`,
          nick: v.nick,
          region,
          story: v.text,
          cheers: 0,
          forgets: 0,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 12),
    );
  };

  const handleReact = (kind: ReactionKind) => {
    if (activeCard && !isSeed(activeCard.id)) live.react(activeCard.id, kind);
  };

  return (
    <div className="page">
      {/* 실시간 수치는 실제로 연결됐을 때만 — 끊긴 채 "0건 가동 중"을 흘리지 않는다. */}
      <Ticker
        lead={
          live.connected ? `전국 비상벨 ${live.sosToday.toLocaleString()}건 가동 중!` : undefined
        }
      />
      <div className="siren" aria-hidden="true" />

      <div className="container">
        <header className="homeHeader">
          <div className="homeHeader__brand">
            <Logo height={30} />
            <span className="livePill" data-off={live.enabled && !live.connected}>
              <span className="dot" />
              LIVE
              {live.online > 1 && <b className="livePill__count">{live.online}명 접속</b>}
            </span>
          </div>
        </header>

        <SosHero
          todayCount={live.sosToday}
          shouts={shouts}
          onPress={() => live.press(loadProfile()?.gu ?? null)}
          global={live.enabled}
        />

        <section className="board">
          <div className="board__map">
            <KoreaMap
              pins={pins}
              chaosIndex={CHAOS_INDEX}
              selected={selected}
              pulsed={pulsed}
              onPickRegion={setSelected}
              onPickPin={(id) => {
                const pin = pins.find((p) => p.id === id);
                setSelected(pin ? pin.region : '');
              }}
              onReset={resetMap}
            >
              {activePin && (
                <div className="mapPopup">
                  <div className="mapPopup__head">
                    <span className="mapPopup__title">{activePin.region} 실시간 비상벨</span>
                    <button
                      type="button"
                      className="mapPopup__close"
                      onClick={resetMap}
                      aria-label="닫기"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mapPopup__list">
                    {activePin.stories.map((s, i) => (
                      <div key={`${s}-${i}`} className="mapPopup__story">
                        <span className="mapPopup__bullet">·</span> {s}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mapPopup__cta" onClick={openWriteHere}>
                    여기 상황 쓰기
                  </button>
                </div>
              )}

              {emptyRegionOpen && (
                <div className="mapPopup">
                  <div className="mapPopup__head">
                    <span className="mapPopup__title">{selected}</span>
                    <button
                      type="button"
                      className="mapPopup__close"
                      onClick={resetMap}
                      aria-label="닫기"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mapPopup__empty">
                    아직 이 지역 비상벨이 없습니다. 첫 번째로 울려보세요.
                  </p>
                  <button type="button" className="mapPopup__cta" onClick={openWriteHere}>
                    여기 상황 쓰기
                  </button>
                </div>
              )}
            </KoreaMap>
            <p className="board__caption">
              {hotspots.length === 2
                ? `지금 ${hotspots[0]}·${hotspots[1]} 비상벨이 가장 시끄럽습니다`
                : '전국 비상벨을 수신하는 중입니다'}
            </p>
          </div>

          <Feed
            cards={cards}
            highlightNewest={HIGHLIGHT_NEWEST}
            onOpenCard={setCardId}
            onWrite={openWrite}
          />
        </section>

        <section className="shortcuts">
          <button
            type="button"
            className="shortcut shortcut--dark"
            onClick={() => navigate('/museum')}
          >
            <span className="shortcut__row">
              <span className="shortcut__text">
                <span className="shortcut__title">역대급 대참사만 모아둔 전당</span>
                <span className="shortcut__sub">명예의 전당 · 등급 자동 지정 · 바로 등록</span>
              </span>
              <span className="shortcut__badge shortcut__badge--accent">
                <ArrowUpRightIcon />
              </span>
            </span>
          </button>

          <button
            type="button"
            className="shortcut shortcut--light"
            onClick={() => navigate('/playground')}
          >
            <span className="shortcut__row">
              <span className="shortcut__text">
                <span className="shortcut__title">내 인생 혼파망 테스트</span>
                <span className="shortcut__sub">6문항 · 3분이면 결과가 나옵니다</span>
              </span>
              <span className="shortcut__badge shortcut__badge--ink">
                <ArrowUpRightIcon />
              </span>
            </span>
          </button>
        </section>
      </div>

      <CardModal card={activeCard} onClose={() => setCardId(null)} onReact={handleReact} />
      <WriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmit={handleSubmit}
        presetRegion={presetRegion}
      />
    </div>
  );
}
