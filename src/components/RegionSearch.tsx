import { useEffect, useMemo, useState } from 'react';
import { loadGeo, regionsOf, searchRegions, type Region } from '../lib/geo';

interface RegionSearchProps {
  /** 인풋에 보이는 값 */
  query: string;
  onQueryChange: (value: string) => void;
  /** 목록에서 지역을 고르면 호출 */
  onPick: (region: Region) => void;
  /** 이미 확정된 지역이면 드롭다운을 닫아둔다 */
  picked: boolean;
  placeholder: string;
  label?: string;
  id: string;
}

/**
 * GeoJSON 229개 시·군·구 부분일치 검색.
 * 메인 상황작성 모달과 박물관 등록 모달이 공유한다.
 */
export function RegionSearch({
  query,
  onQueryChange,
  onPick,
  picked,
  placeholder,
  label = '지역 (시 + 구/군)',
  id,
}: RegionSearchProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    loadGeo().then((geo) => {
      if (alive && geo) setRegions(regionsOf(geo));
    });
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(
    () => (picked ? [] : searchRegions(regions, query)),
    [regions, query, picked],
  );

  useEffect(() => setActive(0), [query]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onPick(results[active]);
    }
  };

  return (
    <div className="field regionField">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={`${id}-list`}
      />
      {results.length > 0 && (
        <div className="regionMenu" id={`${id}-list`} role="listbox">
          {results.map((r, i) => (
            <button
              key={r.label}
              type="button"
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              className="regionMenu__item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
