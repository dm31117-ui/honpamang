import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** CSS 미디어쿼리를 JS에서 구독. SSR 없는 앱이지만 초기값은 안전하게 계산한다. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** 요소의 실제 렌더 크기를 추적 (지도 재투영용). */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const { clientWidth, clientHeight } = el;
      setSize((prev) =>
        prev.width === clientWidth && prev.height === clientHeight
          ? prev
          : { width: clientWidth, height: clientHeight },
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
}

/** 모달이 열려 있는 동안 배경 스크롤 잠금 + ESC 닫기. */
export function useModal(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;

    document.body.classList.add('is-locked');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.classList.remove('is-locked');
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

/**
 * 언마운트 시 자동 정리되는 타이머 모음.
 * 앰비언트 비명·피드 유입처럼 재귀 setTimeout이 많아 한 곳에 모아둔다.
 */
export function useTimers() {
  const ids = useRef(new Set<ReturnType<typeof setTimeout>>());

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);

  const clear = useCallback((id: ReturnType<typeof setTimeout>) => {
    clearTimeout(id);
    ids.current.delete(id);
  }, []);

  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);

  return { after, clear };
}

/** 스크롤을 맨 위로 (라우트 전환 시). */
export function useScrollTop(dep: unknown): void {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [dep]);
}
