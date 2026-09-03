/**
 * 전국 시·군·구 GeoJSON (229개) 로딩 + equirectangular 투영.
 *
 * 메인/전당 두 화면이 같은 데이터를 쓰므로 모듈 레벨에서 한 번만 받아
 * 프라미스를 캐시한다. 실패하면 조용히 null — 지도는 배경 장식만 남고
 * 지역 검색은 빈 결과가 된다.
 *
 * 지역의 식별자는 구·군 이름이 아니라 `"{시도} {구·군}"` 라벨이다.
 * 중구·서구·북구·강서구처럼 이름이 겹치는 구가 7곳까지 있어서, 이름만으로는
 * 서울 중구의 핀이 울산 중구에 찍힌다. 라벨은 시도 안에서 유일하다.
 */

const GEO_URL =
  'https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2013/json/skorea_municipalities_geo_simple.json';

type Ring = [number, number][];

export interface GeoFeature {
  type: 'Feature';
  properties: { name: string; code: string | number };
  geometry:
    { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
}

export interface GeoJson {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface Region {
  /** GeoJSON 원본 구·군 이름 (예: 해운대구) */
  name: string;
  /** 시도 (예: 부산) */
  sido: string;
  /** 화면 표기 겸 식별자인 "{시도} {구·군}" — 전국에서 유일하다. */
  label: string;
}

export interface ProjectedPath {
  /** 지역 식별자 (= Region.label) */
  label: string;
  name: string;
  sido: string;
  d: string;
}

/** 화면 좌표 기준 지역 경계 상자 [x0, y0, x1, y1]. */
export type Bounds = [number, number, number, number];

export interface MapProjection {
  paths: ProjectedPath[];
  /** 지역 라벨 → 화면 좌표 중심 [x, y] */
  centers: Record<string, [number, number]>;
  /** 지역 라벨 → 화면 좌표 경계 상자 (확대 배율 계산용) */
  bounds: Record<string, Bounds>;
  viewBox: string;
  width: number;
  height: number;
}

const SIDO: Record<string, string> = {
  '11': '서울',
  '21': '부산',
  '22': '대구',
  '23': '인천',
  '24': '광주',
  '25': '대전',
  '26': '울산',
  '29': '세종',
  '31': '경기',
  '32': '강원',
  '33': '충북',
  '34': '충남',
  '35': '전북',
  '36': '전남',
  '37': '경북',
  '38': '경남',
  '39': '제주',
};

export function sidoOf(code: string | number): string {
  return SIDO[String(code).slice(0, 2)] ?? '';
}

/** 시도 + 구·군 이름을 지역 식별자 하나로. */
export function labelOf(sido: string, name: string): string {
  return sido ? `${sido} ${name}` : name;
}

function labelOfFeature(f: GeoFeature): string {
  return labelOf(sidoOf(f.properties.code), f.properties.name);
}

let cache: Promise<GeoJson | null> | null = null;

export function loadGeo(): Promise<GeoJson | null> {
  if (!cache) {
    cache = fetch(GEO_URL)
      .then((r) => (r.ok ? (r.json() as Promise<GeoJson>) : null))
      .catch(() => null);
  }
  return cache;
}

function ringsOf(f: GeoFeature): Ring[] {
  return f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat();
}

/** 지역 검색용 목록. 가나다순 정렬. */
export function regionsOf(geo: GeoJson): Region[] {
  return geo.features
    .map((f) => {
      const sido = sidoOf(f.properties.code);
      return { name: f.properties.name, sido, label: labelOf(sido, f.properties.name) };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'));
}

/**
 * 컨테이너 크기(px)에 맞춘 equirectangular 투영.
 * 위도에 cos(중위도) 보정을 넣어 한반도가 옆으로 눌리지 않게 한다.
 */
export function project(geo: GeoJson, width: number, height: number, pad = 34): MapProjection {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const f of geo.features) {
    for (const ring of ringsOf(f)) {
      for (const c of ring) {
        if (c[0] < minLon) minLon = c[0];
        if (c[0] > maxLon) maxLon = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[1] > maxLat) maxLat = c[1];
      }
    }
  }

  const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLon - minLon) * cos;
  const spanY = maxLat - minLat;
  const k = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const ox = (width - spanX * k) / 2;
  const oy = (height - spanY * k) / 2;
  const px = (c: [number, number]): [number, number] => [
    ox + (c[0] - minLon) * cos * k,
    oy + (maxLat - c[1]) * k,
  ];

  const paths: ProjectedPath[] = [];
  const centers: Record<string, [number, number]> = {};
  const bounds: Record<string, Bounds> = {};

  for (const f of geo.features) {
    const rings = ringsOf(f);
    const label = labelOfFeature(f);

    paths.push({
      label,
      name: f.properties.name,
      sido: sidoOf(f.properties.code),
      d: rings
        .map(
          (r) =>
            'M' +
            r
              .map((c) =>
                px(c)
                  .map((n) => n.toFixed(1))
                  .join(','),
              )
              .join('L') +
            'Z',
        )
        .join(''),
    });

    // 경계 상자는 모든 링에서, 중심은 가장 큰 링에서. 섬이 딸린 시·군은
    // 본토 폴리곤이 가장 크므로 핀이 앞바다에 찍히지 않는다.
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    let widest = rings[0];

    for (const ring of rings) {
      if (ring.length > widest.length) widest = ring;
      for (const c of ring) {
        const p = px(c);
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
    }

    let sx = 0;
    let sy = 0;
    for (const c of widest) {
      const p = px(c);
      sx += p[0];
      sy += p[1];
    }

    centers[label] = [sx / widest.length, sy / widest.length];
    bounds[label] = [x0, y0, x1, y1];
  }

  return { paths, centers, bounds, viewBox: `0 0 ${width} ${height}`, width, height };
}

/** 검색어로 지역 상위 n개 매칭. 앞에서부터 일치하는 지역을 먼저 보여준다. */
export function searchRegions(regions: Region[], query: string, limit = 7): Region[] {
  const q = query.trim();
  if (!q) return [];
  const hit = regions.filter((r) => r.label.includes(q) || r.name.includes(q));
  return hit
    .sort((a, b) => {
      const rank = (r: Region) => (r.name.startsWith(q) ? 0 : r.label.startsWith(q) ? 1 : 2);
      return rank(a) - rank(b) || a.label.localeCompare(b.label, 'ko');
    })
    .slice(0, limit);
}
