import { gradeStyle, REACTION_KEYS, type Grade, type MuseumItem } from '../../data/museum';

interface MuseumDetailProps {
  item: MuseumItem & { tot: number; grade: Grade };
  isChampion: boolean;
  bumps: Record<string, number>;
  onBump: (key: string) => void;
}

/** 상세 패널 본문 — 데스크톱은 sticky aside, 모바일은 바텀시트 모달에 들어간다. */
export function MuseumDetail({ item, isChampion, bumps, onBump }: MuseumDetailProps) {
  return (
    <>
      {isChampion && <span className="muDetail__champion">오늘의 최고 존엄</span>}

      <div className="muDetail__head">
        <span className="gradeBadge" style={gradeStyle(item.grade)}>
          {item.grade}
        </span>
        <span className="muDetail__no">{item.no}</span>
      </div>

      <h2 className="muDetail__title">&ldquo;{item.title}&rdquo;</h2>

      <dl className="muDetail__dl">
        <dt>작성자</dt>
        <dd className="muDetail__strong">{item.nick}</dd>
        <dt>지역</dt>
        <dd>{item.gu}</dd>
        <dt>시점</dt>
        <dd>{item.era}</dd>
        <dt>분류</dt>
        <dd>{item.cat}</dd>
      </dl>

      <div className="muDetail__comment">
        <p className="muDetail__commentLabel">한 줄 평</p>
        <p className="muDetail__commentBody">&ldquo;{item.comment}&rdquo;</p>
      </div>

      <div className="muDetail__reactions">
        {REACTION_KEYS.map((label) => {
          const key = item.id + label;
          const extra = bumps[key] ?? 0;
          return (
            <button
              key={label}
              type="button"
              className="muDetail__reaction"
              data-sent={extra > 0}
              onClick={() => onBump(key)}
            >
              {label} {(item.counts[label] + extra).toLocaleString()}
            </button>
          );
        })}
      </div>
    </>
  );
}
