import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import './pagination.css';

interface PaginationProps {
  /** 1부터 시작하는 현재 페이지 */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** 한 화면에 목록이 둘 이상일 때 구분용 */
  label?: string;
}

/** 현재 페이지 앞뒤 span개와 양 끝만 남기고 나머지는 생략 부호로 접는다. */
function pageWindow(page: number, totalPages: number, span = 1): number[] {
  const picked = new Set<number>([1, totalPages]);
  for (let p = page - span; p <= page + span; p += 1) {
    if (p >= 1 && p <= totalPages) picked.add(p);
  }
  return [...picked].sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, onChange, label = '페이지' }: PaginationProps) {
  // 한 페이지뿐이면 보여줄 이유가 없다.
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next !== page) onChange(next);
  };

  const shown = pageWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        className="pagination__arrow"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeftIcon size={13} />
      </button>

      <ul className="pagination__list">
        {shown.map((p, i) => (
          <li key={p} className="pagination__item">
            {/* 앞 번호와 두 칸 이상 벌어지면 그 사이를 접었다는 표시를 끼운다. */}
            {i > 0 && p - shown[i - 1] > 1 && (
              <span className="pagination__gap" aria-hidden="true">
                …
              </span>
            )}
            <button
              type="button"
              className="pagination__page"
              aria-current={p === page ? 'page' : undefined}
              aria-label={`${p}페이지`}
              onClick={() => go(p)}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="pagination__arrow"
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRightIcon size={13} />
      </button>
    </nav>
  );
}
