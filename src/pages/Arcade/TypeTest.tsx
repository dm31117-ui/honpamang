import { useMemo } from 'react';
import { AXIS_COLOR, QUESTIONS, RESULTS, type Axis } from '../../data/arcade';
import { QUIZ_INITIAL, useArcade } from './context';

const AXES: Axis[] = ['혼돈', '파괴', '절망'];

export function TypeTest() {
  const { quiz, setQuiz } = useArcade();

  const result = useMemo(() => {
    const top = AXES.reduce((best, a) => (quiz.scores[a] > quiz.scores[best] ? a : best), AXES[0]);
    const total = Math.max(
      1,
      AXES.reduce((sum, a) => sum + quiz.scores[a], 0),
    );
    return {
      ...RESULTS[top],
      stats: AXES.map((a) => ({
        name: a,
        pct: Math.round((quiz.scores[a] / total) * 100),
        color: AXIS_COLOR[a],
      })),
    };
  }, [quiz.scores]);

  const start = () => setQuiz({ ...QUIZ_INITIAL, phase: 'run', ratio: quiz.ratio });

  const answer = (axis: Axis) =>
    setQuiz((q) => {
      const scores = { ...q.scores, [axis]: q.scores[axis] + 1 };
      return q.qi >= QUESTIONS.length - 1
        ? { ...q, scores, phase: 'done' }
        : { ...q, scores, qi: q.qi + 1 };
    });

  const share = (kind: 'insta' | 'x') => {
    const text = `내 혼파망 유형: ${result.name} — honpamang.kr`;
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* 클립보드 차단 환경에서는 라벨만 바뀐다 */
    }
    setQuiz((q) => ({ ...q, shared: kind }));
    setTimeout(() => setQuiz((q) => ({ ...q, shared: '' })), 1800);
  };

  const question = QUESTIONS[quiz.qi];

  return (
    <section className="arSection">
      <div className="arSection__head">
        <span className="sectionBadge arBadge--test">유형검사</span>
        <span className="arSection__name">내 인생 혼파망 진단 테스트</span>
      </div>

      {quiz.phase === 'idle' && (
        <div className="arQuiz__intro">
          <p className="arQuiz__hook">나는 걸어 다니는 자연재해일까?</p>
          <p className="arQuiz__sub">극단적 상황극 6문항 · 3분이면 결과 카드가 나옵니다</p>
          <button type="button" className="arQuiz__start" onClick={start}>
            유형 진단 시작
          </button>
        </div>
      )}

      {quiz.phase === 'run' && question && (
        <>
          <div className="arQuiz__progress">
            <span className="arQuiz__step">
              Q{quiz.qi + 1} / {QUESTIONS.length}
            </span>
            <div className="arQuiz__track">
              <div
                className="arQuiz__bar"
                style={{ width: `${(quiz.qi / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
          <p className="arQuiz__question" key={quiz.qi}>
            {question.q}
          </p>
          <div className="arQuiz__options">
            {question.o.map(([text, axis]) => (
              <button
                key={text}
                type="button"
                className="arQuiz__option"
                onClick={() => answer(axis)}
              >
                {text}
              </button>
            ))}
          </div>
        </>
      )}

      {quiz.phase === 'done' && (
        <div className="arResult">
          <div className="arCard" data-ratio={quiz.ratio}>
            <div>
              <p className="arCard__label">나의 혼파망 유형</p>
              <p className="arCard__name">{result.name}</p>
              <p className="arCard__desc">{result.desc}</p>
            </div>
            <div className="arCard__gauges">
              {result.stats.map((st) => (
                <div key={st.name} className="arGauge">
                  <span className="arGauge__name">{st.name}</span>
                  <div className="arGauge__track">
                    <div
                      className="arGauge__fill"
                      style={{ width: `${st.pct}%`, background: st.color }}
                    />
                  </div>
                  <span className="arGauge__pct" style={{ color: st.color }}>
                    {st.pct}%
                  </span>
                </div>
              ))}
              <p className="arCard__brand">HONPAMANG.KR</p>
            </div>
          </div>

          <div className="arShare">
            <p className="arShare__label">결과 카드 공유</p>
            <div className="arShare__ratios">
              <button
                type="button"
                className="arShare__ratio"
                aria-pressed={quiz.ratio === 'square'}
                onClick={() => setQuiz((q) => ({ ...q, ratio: 'square' }))}
              >
                1:1
              </button>
              <button
                type="button"
                className="arShare__ratio"
                aria-pressed={quiz.ratio === 'tall'}
                onClick={() => setQuiz((q) => ({ ...q, ratio: 'tall' }))}
              >
                9:16
              </button>
            </div>
            <button
              type="button"
              className="arShare__btn arShare__btn--accent"
              onClick={() => share('insta')}
            >
              {quiz.shared === 'insta' ? '스토리 문구 복사 완료' : '인스타 스토리 공유'}
            </button>
            <button
              type="button"
              className="arShare__btn arShare__btn--ink"
              onClick={() => share('x')}
            >
              {quiz.shared === 'x' ? '공유 문구 복사 완료' : 'X에 공유'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={start}>
              다시 하기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
