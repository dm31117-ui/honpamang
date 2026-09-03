import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  loadGeo,
  project,
  regionsOf,
  searchRegions,
  type Bounds,
  type GeoJson,
  type MapProjection,
  type Region,
} from '../../lib/geo';
import { useElementSize } from '../../lib/hooks';
import { MinusIcon, PlusIcon, SearchIcon } from '../../components/Icons';
import './map.css';

/** 확대 배율 한계. 지역 크기에 맞춰 잡되 이 범위를 벗어나지 않는다. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 14;
/** 확대 시 지역 경계와 지도 테두리 사이 여백(px). */
const FIT_PAD = 56;
/** 이 거리를 넘겨 끌면 클릭이 아니라 이동으로 본다. */
const DRAG_SLOP = 4;
/** 시드 핀 크기가 잡혀 있는 기준 지도 폭. 좁은 화면에선 이 비율로 줄인다. */
const BASE_WIDTH = 753;
/** 전국 보기에서 라벨을 달아줄 상위 핀 수. 나머지는 점만 찍힌다. */
const LABELLED_PINS = 8;

export interface MapPin {
  id: string;
  /** 지역 식별자 겸 표기 라벨 "{시도} {구·군}" */
  region: string;
  count: number;
  size: number;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

const RESET_VIEW: View = { scale: 1, x: 0, y: 0 };

/** 이동 범위 제한 — 확대해도 지도가 화면 밖으로 완전히 빠지지 않게 한다. */
function clampView(view: View, width: number, height: number): View {
  if (view.scale <= 1) return RESET_VIEW;
  return {
    scale: view.scale,
    x: Math.min(0, Math.max(width - width * view.scale, view.x)),
    y: Math.min(0, Math.max(height - height * view.scale, view.y)),
  };
}

/** 지역 경계 상자를 화면 가운데에 꽉 차게 담는 뷰. */
function fitBounds(b: Bounds, width: number, height: number): View {
  const bw = Math.max(b[2] - b[0], 1);
  const bh = Math.max(b[3] - b[1], 1);
  const scale = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, Math.min((width - FIT_PAD) / bw, (height - FIT_PAD) / bh)),
  );
  const cx = (b[0] + b[2]) / 2;
  const cy = (b[1] + b[3]) / 2;
  return clampView({ scale, x: width / 2 - cx * scale, y: height / 2 - cy * scale }, width, height);
}

/** 한 점을 고정한 채 배율만 바꾼다 (휠 확대 · 버튼 확대). */
function zoomAt(view: View, scale: number, px: number, py: number): View {
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
  const k = next / view.scale;
  return { scale: next, x: px - (px - view.x) * k, y: py - (py - view.y) * k };
}

interface KoreaMapProps {
  pins: MapPin[];
  chaosIndex: number;
  /** 선택된 지역 라벨 ('' = 전국 보기) */
  selected: string;
  /** 방금 SOS가 울린 지역 라벨들 — 핀이 잠깐 번쩍인다. */
  pulsed: string[];
  onPickRegion: (region: string) => void;
  onPickPin: (id: string) => void;
  onReset: () => void;
  /** 하단 팝업 레이어 */
  children?: ReactNode;
}

export function KoreaMap({
  pins,
  chaosIndex,
  selected,
  pulsed,
  onPickRegion,
  onPickPin,
  onReset,
  children,
}: KoreaMapProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [geo, setGeo] = useState<GeoJson | null>(null);
  const [view, setView] = useState<View>(RESET_VIEW);
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGeo().then((g) => {
      if (alive) setGeo(g);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 컨테이너 크기가 바뀔 때마다 재투영 — 반응형 리사이즈와 방향 전환을 함께 커버한다.
  const projection = useMemo<MapProjection | null>(
    () => (geo && size.width > 0 && size.height > 0 ? project(geo, size.width, size.height) : null),
    [geo, size.width, size.height],
  );

  const regions = useMemo(() => (geo ? regionsOf(geo) : []), [geo]);
  const results = useMemo(() => searchRegions(regions, query, 6), [regions, query]);

  // 선택이 바뀌면 그 지역을 화면에 담고, 해제되면 전국 보기로 돌아간다.
  useEffect(() => {
    if (!projection) return;
    if (!selected) {
      setView(RESET_VIEW);
      return;
    }
    const b = projection.bounds[selected];
    if (b) setView(fitBounds(b, projection.width, projection.height));
  }, [selected, projection]);

  /** 지역별 비상벨 수 — 진할수록 많이 울린 곳. */
  const heat = useMemo(() => {
    const map: Record<string, number> = {};
    let max = 0;
    for (const p of pins) {
      map[p.region] = (map[p.region] ?? 0) + p.count;
      if (map[p.region] > max) max = map[p.region];
    }
    return { map, max };
  }, [pins]);

  const fillOf = useCallback(
    (label: string) => {
      if (label === selected) return 'rgba(255,78,43,0.28)';
      const count = heat.map[label];
      if (!count || heat.max === 0) return 'rgba(0,0,0,0.025)';
      // 상위 몇 곳만 새빨개지지 않도록 제곱근으로 눌러준다.
      const t = Math.sqrt(count / heat.max);
      return `rgba(255,78,43,${(0.07 + t * 0.42).toFixed(3)})`;
    },
    [heat, selected],
  );

  /** 전국 보기에서 라벨을 붙일 핀 집합. 확대 중이면 전부 붙인다. */
  const labelled = useMemo(() => {
    if (view.scale > 1) return null;
    return new Set(
      [...pins]
        .sort((a, b) => b.count - a.count)
        .slice(0, LABELLED_PINS)
        .map((p) => p.id),
    );
  }, [pins, view.scale]);

  // ---------- 끌어서 이동 ----------
  const viewport = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; from: View; moved: boolean } | null>(
    null,
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (view.scale <= 1 || e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: view, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    d.moved = true;
    setView(clampView({ ...d.from, x: d.from.x + dx, y: d.from.y + dy }, size.width, size.height));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    // 이동 직후의 click 이벤트는 지역 선택으로 새지 않게 한 번 삼킨다.
    if (d.moved) e.currentTarget.dataset.suppressClick = '1';
    drag.current = null;
  };

  const swallowedClick = (el: HTMLElement) => {
    if (el.dataset.suppressClick !== '1') return false;
    delete el.dataset.suppressClick;
    return true;
  };

  // ---------- 휠 확대 ----------
  // React는 루트에 wheel을 passive로 붙여서 preventDefault가 먹지 않는다.
  // 페이지 스크롤을 확실히 막으려면 네이티브로 직접 걸어야 한다.
  const live = useRef({ view, width: size.width, height: size.height });
  live.current = { view, width: size.width, height: size.height };

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const { view: v, width, height } = live.current;
      // 전국 보기에서 아래로 굴리는 건 페이지 스크롤로 넘긴다.
      if (v.scale <= 1 && e.deltaY > 0) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const next = zoomAt(
        v,
        v.scale * (e.deltaY < 0 ? 1.18 : 1 / 1.18),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
      setView(next.scale <= 1 ? RESET_VIEW : clampView(next, width, height));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const stepZoom = (factor: number) => {
    const next = zoomAt(view, view.scale * factor, size.width / 2, size.height / 2);
    setView(next.scale <= 1 ? RESET_VIEW : clampView(next, size.width, size.height));
  };

  const pickRegion = (region: Region) => {
    setQuery('');
    setSearchOpen(false);
    onPickRegion(region.label);
  };

  const pulsing = useMemo(() => new Set(pulsed), [pulsed]);
  const zoomed = view.scale > 1;
  const inv = 1 / view.scale;
  const pinScale = Math.min(1, Math.max(0.6, size.width / BASE_WIDTH));

  return (
    <div className="map" ref={ref}>
      <div className="map__decor" aria-hidden="true">
        <span className="map__ring map__ring--lg" />
        <span className="map__ring map__ring--md" />
        <span className="map__ring map__ring--sm" />
        <span className="map__radar" />
      </div>

      <div
        className="map__viewport"
        ref={viewport}
        data-zoomed={zoomed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={(e) => {
          // 빈 바다를 누르면 선택 해제.
          if (swallowedClick(e.currentTarget)) return;
          if (e.target === e.currentTarget) onReset();
        }}
      >
        <div
          className="map__stage"
          style={{
            transform: `translate(${view.x.toFixed(1)}px, ${view.y.toFixed(1)}px) scale(${view.scale.toFixed(3)})`,
          }}
          data-dragging={drag.current !== null}
        >
          {projection && (
            <svg
              className="map__svg"
              width="100%"
              height="100%"
              viewBox={projection.viewBox}
              preserveAspectRatio="none"
              role="img"
              aria-label="전국 시·군·구 비상벨 지도"
            >
              {projection.paths.map((p) => (
                <path
                  key={p.label}
                  d={p.d}
                  fill={fillOf(p.label)}
                  stroke={p.label === selected ? 'var(--accent)' : 'rgba(0,0,0,0.12)'}
                  strokeWidth={p.label === selected ? 1.5 : 1}
                  vectorEffect="non-scaling-stroke"
                  className="map__path"
                  onClick={() => onPickRegion(p.label)}
                  onPointerEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (!rect) return;
                    setHover({
                      label: p.label,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onPointerLeave={() => setHover((h) => (h?.label === p.label ? null : h))}
                >
                  <title>{`${p.label} 비상벨 ${heat.map[p.label] ?? 0}건`}</title>
                </path>
              ))}
            </svg>
          )}

          {projection &&
            pins.map((pin) => {
              const c = projection.centers[pin.region];
              if (!c) return null;
              const dot = Math.max(10, Math.round(pin.size * pinScale));
              const showLabel = !labelled || labelled.has(pin.id) || pin.region === selected;
              return (
                <button
                  key={pin.id}
                  type="button"
                  className="mapPin"
                  data-bare={!showLabel}
                  data-pulse={pulsing.has(pin.region)}
                  style={{
                    left: `${c[0].toFixed(0)}px`,
                    top: `${c[1].toFixed(0)}px`,
                    ['--pin-scale' as string]: inv.toFixed(3),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickPin(pin.id);
                  }}
                  aria-label={`${pin.region} 비상벨 ${pin.count}건`}
                >
                  <span className="mapPin__inner">
                    <span className="mapPin__dot" style={{ width: dot, height: dot }}>
                      <span className="mapPin__ripple" />
                      <span className="mapPin__core" />
                    </span>
                    {showLabel && (
                      <span className="mapPin__label">
                        {pin.region} <span className="mapPin__count">{pin.count}</span>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
        </div>

        {hover && !zoomed && (
          <span
            className="map__tip"
            style={{ left: `${hover.x}px`, top: `${hover.y}px` }}
            aria-hidden="true"
          >
            {hover.label}
            <b>{heat.map[hover.label] ?? 0}</b>
          </span>
        )}
      </div>

      <div className="map__hud">
        {zoomed ? (
          <button type="button" className="map__chip" onClick={onReset}>
            <MinusIcon />
            전국 보기
          </button>
        ) : (
          <span className="map__chip map__chip--quiet">
            <span className="dot" />
            전국 스캔 중 · 구/군 단위
          </span>
        )}

        <div className="map__find" data-open={searchOpen}>
          <button
            type="button"
            className="map__chip map__chip--icon"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
            aria-label="지역 찾기"
          >
            <SearchIcon />
          </button>
          {searchOpen && (
            <div className="map__findBox">
              <input
                className="map__findInput"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) pickRegion(results[0]);
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
                placeholder="지역 찾기 (예: 마포)"
                aria-label="지역 찾기"
              />
              {results.length > 0 && (
                <div className="map__findList">
                  {results.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      className="map__findItem"
                      onClick={() => pickRegion(r)}
                    >
                      {r.label}
                      <span>{heat.map[r.label] ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="map__index">
        <span className="map__indexLabel">혼파망 지수</span>
        <span className="map__indexValue">{chaosIndex.toFixed(1)}%</span>
        <span className="map__indexTag">위험</span>
      </div>

      <div className="map__zoom">
        <button
          type="button"
          onClick={() => stepZoom(1.6)}
          aria-label="확대"
          disabled={view.scale >= MAX_ZOOM}
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          onClick={() => stepZoom(1 / 1.6)}
          aria-label="축소"
          disabled={!zoomed}
        >
          <MinusIcon />
        </button>
      </div>

      <div className="map__legend" aria-hidden="true">
        <span>비상벨 밀집도</span>
        <i className="map__legendBar" />
        <span>많음</span>
      </div>

      {children}
    </div>
  );
}
