import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ArrowUpRightIcon } from '../../components/Icons';
import { loadGeo, regionsOf, type Region } from '../../lib/geo';
import { loadSosToday, saveSosToday } from '../../lib/storage';
import { useTimers } from '../../lib/hooks';
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

interface UserPin {
  count: number;
  stories: string[];
  label: string;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickWord = () => SHOUT_WORDS[Math.floor(Math.random() * SHOUT_WORDS.length)];

export function Home() {
  const navigate = useNavigate();
  const { after } = useTimers();

  const [sosCount, setSosCount] = useState(0);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [extra, setExtra] = useState<FeedCard[]>([]);
  const [userPins, setUserPins] = useState<Record<string, UserPin>>({});
  const [regionName, setRegionName] = useState('');
  const [pinId, setPinId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<number | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [presetRegion, setPresetRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  const nextId = useRef(900);

  // 오늘 SOS 카운트 복원 (날짜가 바뀌었으면 0)
  useEffect(() => setSosCount(loadSosToday()), []);

  // 지역 라벨 조회용 목록 (지도 팝업 · 모달 프리필)
  useEffect(() => {
    let alive = true;
    loadGeo().then((geo) => {
      if (alive && geo) setRegions(regionsOf(geo));
    });
    return () => {
      alive = false;
    };
  }, []);

  const addShout = useCallback(
    (shout: Shout) => {
      setShouts((prev) => [...prev, shout]);
      after(SHOUT_LIFETIME, () => setShouts((prev) => prev.filter((s) => s.id !== shout.id)));
    },
    [after],
  );

  // 남들의 비명 — 900~3500ms 랜덤 간격. 내 비명보다 작고 흐리다.
  // 연출일 뿐이라 TODAY 카운트는 건드리지 않는다. 카운트는 실제로 SOS를 누른 것만 센다.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = () => {
      if (cancelled) return;
      const left = Math.random() < 0.5;
      const shout: Shout = {
        id: 'a' + Math.random().toString(36).slice(2),
        text: pickWord(),
        x: `${(left ? rand(4, 34) : rand(64, 94)).toFixed(1)}%`,
        y: `${rand(10, 86).toFixed(1)}%`,
        size: `${rand(10, 13).toFixed(0)}px`,
        color: 'var(--shout-ambient)',
        op: 0.75,
      };
      addShout(shout);
      timer = setTimeout(loop, rand(900, 3500));
    };

    timer = setTimeout(loop, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addShout]);

  // 실시간 유입 시뮬레이션. 프로덕션에서는 소켓/폴링으로 대체한다.
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const p = INFLOW_POOL[i % INFLOW_POOL.length];
      i += 1;
      setExtra((prev) => [{ ...p, id: 100 + i, time: '방금' }, ...prev].slice(0, 8));
    }, INFLOW_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const pressSos = useCallback(() => {
    setSosCount((c) => {
      const next = c + 1;
      saveSosToday(next);
      return next;
    });
    const left = Math.random() < 0.5;
    addShout({
      id: Math.random().toString(36).slice(2),
      text: pickWord(),
      x: `${(left ? rand(10, 34) : rand(66, 90)).toFixed(1)}%`,
      y: `${rand(20, 74).toFixed(1)}%`,
      size: `${rand(12, 17).toFixed(0)}px`,
      color: 'var(--muted-3)',
      op: 1,
    });
  }, [addShout]);

  // 시드 핀 + 사용자가 등록한 핀 병합
  const pins = useMemo<(MapPin & { stories: string[] })[]>(() => {
    const merged = SEED_PINS.map((p) => {
      const u = userPins[p.geoName];
      return u
        ? { ...p, count: p.count + u.count, stories: [...u.stories, ...p.stories] }
        : { ...p };
    });
    for (const [geoName, u] of Object.entries(userPins)) {
      if (merged.some((p) => p.geoName === geoName)) continue;
      merged.push({
        id: 'u-' + geoName,
        name: u.label || geoName,
        geoName,
        count: u.count,
        size: Math.min(28, 13 + u.count * 3),
        stories: u.stories,
      });
    }
    return merged;
  }, [userPins]);

  const activePin = pins.find((p) => p.id === pinId) ?? null;
  const pinAtRegion = pins.find((p) => p.geoName === regionName) ?? null;
  const zoomName = activePin ? activePin.geoName : regionName;
  const regionLabel = regions.find((r) => r.name === regionName)?.label ?? regionName;
  /** 사연이 없는 구를 눌렀을 때만 "첫 번째로 울려보세요" 팝업 */
  const emptyRegionOpen = Boolean(regionName) && !activePin && !pinAtRegion;

  const cards = useMemo(() => [...extra, ...SEED_CARDS], [extra]);
  const activeCard = cards.find((c) => c.id === cardId) ?? null;

  const resetMap = useCallback(() => {
    setPinId(null);
    setRegionName('');
  }, []);

  const openWriteHere = () => {
    setPresetRegion(regions.find((r) => r.name === regionName) ?? null);
    setWriteOpen(true);
  };

  const openWrite = () => {
    setPresetRegion(null);
    setWriteOpen(true);
  };

  const handleSubmit = (v: WriteSubmission) => {
    nextId.current += 1;
    setExtra((prev) =>
      [
        {
          id: nextId.current,
          nick: v.nick,
          gu: v.gu,
          time: '방금',
          story: v.text,
          cheers: 0,
          forgets: 0,
        },
        ...prev,
      ].slice(0, 9),
    );

    if (v.geoName) {
      setUserPins((prev) => {
        const before = prev[v.geoName!] ?? { count: 0, stories: [], label: v.gu };
        return {
          ...prev,
          [v.geoName!]: {
            count: before.count + 1,
            stories: [v.text, ...before.stories].slice(0, 6),
            label: v.gu,
          },
        };
      });
    }
    setWriteOpen(false);
  };

  return (
    <div className="page">
      <Ticker />
      <div className="siren" aria-hidden="true" />

      <div className="container">
        <header className="homeHeader">
          <div className="homeHeader__brand">
            <Logo height={30} />
            <span className="livePill">
              <span className="dot" />
              LIVE
            </span>
          </div>
        </header>

        <SosHero todayCount={sosCount} shouts={shouts} onPress={pressSos} />

        <section className="board">
          <div className="board__map">
            <KoreaMap
              pins={pins}
              chaosIndex={CHAOS_INDEX}
              zoomName={zoomName}
              onPickRegion={(name) => {
                setRegionName(name);
                setPinId(null);
              }}
              onPickPin={(id) => {
                const pin = pins.find((p) => p.id === id);
                setPinId(id);
                setRegionName(pin ? pin.geoName : '');
              }}
              onReset={resetMap}
            >
              {activePin && (
                <div className="mapPopup">
                  <div className="mapPopup__head">
                    <span className="mapPopup__title">{activePin.name} 실시간 비상벨</span>
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
                </div>
              )}

              {emptyRegionOpen && (
                <div className="mapPopup">
                  <div className="mapPopup__head">
                    <span className="mapPopup__title">{regionLabel}</span>
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
              오후 2시, 사무실 과부하로 강남·여의도 멘탈 파괴자 급증 중
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

      <CardModal card={activeCard} onClose={() => setCardId(null)} />
      <WriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onSubmit={handleSubmit}
        presetRegion={presetRegion}
      />
    </div>
  );
}
