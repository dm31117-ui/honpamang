import { useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { CloseIcon, PlusIcon, SearchIcon } from '../../components/Icons';
import { useMediaQuery } from '../../lib/hooks';
import {
  GRADE_TABS,
  HALL_TABS,
  SEED_ITEMS,
  gradeOf,
  gradeStyle,
  totalOf,
  type Grade,
  type Hall,
  type MuseumItem,
} from '../../data/museum';
import { MuseumDetail } from './MuseumDetail';
import { SubmitModal, type MuseumSubmission } from './SubmitModal';
import './museum.css';
import '../Home/writeModal.css';

export function Museum() {
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState<'전체' | Grade>('전체');
  const [hall, setHall] = useState<'전체' | Hall>('전체');
  const [selId, setSelId] = useState(1);
  const [added, setAdded] = useState<MuseumItem[]>([]);
  const [bumps, setBumps] = useState<Record<string, number>>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const nextId = useRef(1001);
  // 상세를 옆에 세울 자리가 없으면 바텀시트로 띄운다.
  const isCompact = useMediaQuery('(max-width: 900px)');

  const all = useMemo(
    () =>
      [...added, ...SEED_ITEMS].map((it) => {
        const tot = totalOf(it);
        return { ...it, tot, grade: gradeOf(tot) };
      }),
    [added],
  );

  const championId = useMemo(() => [...all].sort((a, b) => b.tot - a.tot)[0]?.id, [all]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return all.filter(
      (it) =>
        (grade === '전체' || it.grade === grade) &&
        (hall === '전체' || it.cat === hall) &&
        (!q || it.title.includes(q) || it.nick.includes(q) || it.gu.includes(q)),
    );
  }, [all, grade, hall, query]);

  const selected = all.find((it) => it.id === selId) ?? filtered[0] ?? all[0];

  const select = (id: number) => {
    setSelId(id);
    if (isCompact) setDetailOpen(true);
  };

  const bump = (key: string) => setBumps((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));

  const handleSubmit = (v: MuseumSubmission) => {
    const id = nextId.current;
    nextId.current += 1;
    const item: MuseumItem = {
      id,
      no: `제${id}호`,
      title: v.title,
      nick: v.nick,
      gu: v.gu,
      era: '방금',
      cat: v.hall,
      comment: '방금 올라온 혼파망. 아직 한 줄 평이 없습니다.',
      counts: { '국보급 참사': 0, '순수 파괴': 0, '멘탈 바사삭': 0, '자진 망각': 0 },
    };
    // 등록 직후 바로 보이도록 필터를 초기화하고 해당 항목을 선택한다.
    setAdded((prev) => [item, ...prev]);
    setGrade('전체');
    setHall('전체');
    setQuery('');
    setSelId(id);
    setSubmitOpen(false);
  };

  const detail = selected && (
    <MuseumDetail
      item={selected}
      isChampion={selected.id === championId}
      bumps={bumps}
      onBump={bump}
    />
  );

  return (
    <div className="page">
      <div className="container">
        <PageHeader
          title="대참사 박물관"
          action={
            <button type="button" className="btn btn--hard" onClick={() => setSubmitOpen(true)}>
              <PlusIcon />
              등록
            </button>
          }
        />

        <div className="muFilters">
          <div className="muSearch">
            <SearchIcon />
            <input
              className="muSearch__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="혼파망 검색 (예: 삼각김밥)"
              aria-label="혼파망 검색"
            />
          </div>
          <div className="muTabs">
            {GRADE_TABS.map((g) => (
              <button
                key={g}
                type="button"
                className="tab"
                aria-pressed={grade === g}
                onClick={() => setGrade(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <p className="muLegend">
          등급별 반응 수 |&nbsp;<strong className="muLegend__national">국보</strong> 1,000 이상 ·{' '}
          <strong className="muLegend__treasure">보물</strong> 300 이상 · <strong>일반</strong> 300
          미만
        </p>

        <div className="muTabs muTabs--halls">
          {HALL_TABS.map((h) => (
            <button
              key={h}
              type="button"
              className="tab tab--sm"
              aria-pressed={hall === h}
              onClick={() => setHall(h)}
            >
              {h}
            </button>
          ))}
        </div>

        <section className="muBoard">
          <div className="muList">
            {filtered.map((it) => (
              <button
                key={it.id}
                type="button"
                className="muCard"
                data-selected={it.id === selected?.id}
                onClick={() => select(it.id)}
              >
                <div className="muCard__meta">
                  <span className="gradeBadge" style={gradeStyle(it.grade)}>
                    {it.grade}
                  </span>
                  <span className="muCard__nick">{it.nick}</span>
                  <span className="regionChip">{it.gu}</span>
                  <span className="muCard__era">{it.era}</span>
                </div>
                <p className="muCard__title">{it.title}</p>
                <div className="muCard__stats">
                  <span>
                    반응 <span className="muCard__total">{it.tot.toLocaleString()}</span>
                  </span>
                  <span>{it.cat}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="muEmpty">조건에 맞는 혼파망이 없습니다.</p>}
          </div>

          {!isCompact && <aside className="muDetail">{detail}</aside>}
        </section>
      </div>

      {isCompact && (
        <Modal
          open={detailOpen && Boolean(selected)}
          onClose={() => setDetailOpen(false)}
          variant="pad32"
        >
          <button
            type="button"
            className="iconBtn muDetail__closeSheet"
            onClick={() => setDetailOpen(false)}
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
          {detail}
        </Modal>
      )}

      <SubmitModal open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
