import { useEffect, useMemo, type ReactNode } from 'react';
import { useState } from 'react';
import { loadGeo, project, type GeoJson } from '../../lib/geo';
import { useElementSize } from '../../lib/hooks';
import { MinusIcon } from '../../components/Icons';
import './map.css';

/** 구 클릭 시 확대 배율. 핀·선 굵기는 1/ZOOM으로 역보정해 화면상 크기를 유지한다. */
const ZOOM = 6.5;
/** 시드 핀 크기가 잡혀 있는 기준 지도 폭. 좁은 화면에선 이 비율로 줄인다. */
const BASE_WIDTH = 753;

export interface MapPin {
  id: string;
  name: string;
  geoName: string;
  count: number;
  size: number;
}

interface KoreaMapProps {
  pins: MapPin[];
  chaosIndex: number;
  /** 확대 중인 구·군 GeoJSON 이름 ('' = 전국 보기) */
  zoomName: string;
  onPickRegion: (name: string) => void;
  onPickPin: (id: string) => void;
  onReset: () => void;
  /** 하단 팝업 레이어 */
  children?: ReactNode;
}

export function KoreaMap({
  pins,
  chaosIndex,
  zoomName,
  onPickRegion,
  onPickPin,
  onReset,
  children,
}: KoreaMapProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const [geo, setGeo] = useState<GeoJson | null>(null);

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
  const projection = useMemo(
    () => (geo && size.width > 0 && size.height > 0 ? project(geo, size.width, size.height) : null),
    [geo, size.width, size.height],
  );

  const zoomed = Boolean(zoomName);
  const center = projection && zoomName ? projection.centers[zoomName] : undefined;
  const inv = zoomed ? 1 / ZOOM : 1;
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
        className="map__stage"
        style={{
          transform: center ? `scale(${ZOOM})` : 'scale(1)',
          transformOrigin: center
            ? `${center[0].toFixed(0)}px ${center[1].toFixed(0)}px`
            : '50% 50%',
        }}
      >
        {projection && (
          <svg
            className="map__svg"
            width="100%"
            height="100%"
            viewBox={projection.viewBox}
            preserveAspectRatio="none"
            role="img"
            aria-label="전국 시·군·구 지도"
          >
            {projection.paths.map((p) => (
              <path
                key={p.name + p.sido}
                d={p.d}
                fill={p.name === zoomName ? 'rgba(255,78,43,0.14)' : 'rgba(0,0,0,0.025)'}
                stroke="rgba(0,0,0,0.12)"
                strokeWidth={zoomed ? 1 / ZOOM : 1}
                vectorEffect="non-scaling-stroke"
                className="map__path"
                onClick={() => onPickRegion(p.name)}
              />
            ))}
          </svg>
        )}

        {projection &&
          pins.map((pin) => {
            const c = projection.centers[pin.geoName];
            if (!c) return null;
            const size = Math.max(10, Math.round(pin.size * pinScale));
            return (
              <button
                key={pin.id}
                type="button"
                className="mapPin"
                style={{
                  left: `${c[0].toFixed(0)}px`,
                  top: `${c[1].toFixed(0)}px`,
                  ['--pin-scale' as string]: inv.toFixed(3),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPickPin(pin.id);
                }}
                aria-label={`${pin.name} 비상벨 ${pin.count}건`}
              >
                <span className="mapPin__inner">
                  <span className="mapPin__dot" style={{ width: size, height: size }}>
                    <span className="mapPin__ripple" />
                    <span className="mapPin__core" />
                  </span>
                  <span className="mapPin__label">
                    {pin.name} <span className="mapPin__count">{pin.count}</span>
                  </span>
                </span>
              </button>
            );
          })}
      </div>

      {/* 확대 상태에서는 같은 자리를 "전국 보기" 버튼이 쓴다. */}
      {!zoomed && (
        <div className="map__scan">
          <span className="dot" />
          전국 스캔 중 · 구/군 단위
        </div>
      )}

      <div className="map__index">
        <span className="map__indexLabel">혼파망 지수</span>
        <span className="map__indexValue">{chaosIndex.toFixed(1)}%</span>
        <span className="map__indexTag">위험</span>
      </div>

      {zoomed && (
        <button type="button" className="map__reset" onClick={onReset}>
          <MinusIcon />
          전국 보기
        </button>
      )}

      {children}
    </div>
  );
}
