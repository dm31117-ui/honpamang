import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '../../components/Icons';
import {
  TYPE_TESTS,
  findTest,
  resultKeyOf,
  scoresOf,
  type TestResult,
  type TypeTestDef,
} from '../../data/tests';
import { SITE_DOMAIN } from '../../lib/site';
import { QUIZ_INITIAL, useArcade, type ShareKind } from './context';

type ShareTarget = Exclude<ShareKind, ''>;

/** [기본 라벨, 복사 직후 라벨] */
const SHARE_LABELS: Record<ShareTarget, [string, string]> = {
  kakao: ['카카오톡 공유 문구 복사', '카톡 문구 복사 완료'],
  insta: ['인스타 스토리 공유', '스토리 문구 복사 완료'],
  x: ['X에 공유', '공유 문구 복사 완료'],
};

const SHARE_ORDER: ShareTarget[] = ['kakao', 'insta', 'x'];

/** 검사 하나를 처음부터 끝까지 진행하는 화면. 어떤 검사인지는 경로가 정한다. */
export function TypeTest() {
  const { testId } = useParams();
  const test = findTest(testId);
  const { quizzes, setQuiz } = useArcade();
  const quiz = (test && quizzes[test.id]) ?? QUIZ_INITIAL;

  const result = useMemo(() => {
    if (!test) return null;
    const scores = scoresOf(test, quiz.answers);
    const card = test.results[resultKeyOf(test, scores)];
    // 결과별 고정 능력치가 기획된 검사는 그걸 쓰고, 아니면 축 비율을 그린다.
    const total = Math.max(1, quiz.answers.length);
    const gauges = card.stats
      ? card.stats.map((s, i) => ({
          ...s,
          color: test.axisColor[test.axes[i % test.axes.length]],
        }))
      : test.axes.map((a) => ({
          name: a,
          pct: Math.round((scores[a] / total) * 100),
          color: test.axisColor[a],
        }));
    return { card, gauges, scores };
  }, [test, quiz.answers]);

  // 없는 경로로 들어오면 선택 화면으로 돌려보낸다.
  if (!test || !result) return <Navigate to="/playground/test" replace />;

  const start = () => setQuiz(test.id, { ...QUIZ_INITIAL, phase: 'run', ratio: quiz.ratio });

  const answer = (axis: string) =>
    setQuiz(test.id, (q) => {
      const answers = [...q.answers, axis];
      return { ...q, answers, phase: answers.length >= test.questions.length ? 'done' : 'run' };
    });

  const back = () =>
    setQuiz(test.id, (q) =>
      q.answers.length === 0
        ? { ...q, phase: 'idle' }
        : { ...q, answers: q.answers.slice(0, -1), phase: 'run' },
    );

  const share = (kind: ShareTarget) => {
    const text = `${test.sharePrompt.replace('{name}', result.card.name)} ${SITE_DOMAIN}`;
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* 클립보드 차단 환경에서는 라벨만 바뀐다 */
    }
    setQuiz(test.id, (q) => ({ ...q, shared: kind }));
    setTimeout(() => setQuiz(test.id, (q) => ({ ...q, shared: '' })), 1800);
  };

  const qi = quiz.answers.length;
  const question = test.questions[qi];
  const others = TYPE_TESTS.filter((t) => t.id !== test.id);

  return (
    <section className="arSection">
      <div className="arSection__head">
        <Link to="/playground/test" className="arSection__back">
          <ChevronLeftIcon size={13} />
          검사 목록
        </Link>
        <span className="sectionBadge arBadge--test">유형검사</span>
        <span className="arSection__name">{test.title}</span>
      </div>

      {quiz.phase === 'idle' && (
        <div className="arQuiz__intro">
          <p className="arQuiz__hook">{test.hook}</p>
          <p className="arQuiz__sub">{test.sub}</p>
          <button type="button" className="arQuiz__start" onClick={start}>
            유형 진단 시작
          </button>
        </div>
      )}

      {quiz.phase === 'run' && question && (
        <>
          <div className="arQuiz__progress">
            <span className="arQuiz__step">
              Q{qi + 1} / {test.questions.length}
            </span>
            <div className="arQuiz__track">
              <div
                className="arQuiz__bar"
                style={{ width: `${(qi / test.questions.length) * 100}%` }}
              />
            </div>
          </div>
          <p className="arQuiz__question" key={qi}>
            {question.q}
          </p>
          <div className="arQuiz__options">
            {question.o.map((option) => (
              <button
                key={option.text}
                type="button"
                className="arQuiz__option"
                onClick={() => answer(option.axis)}
              >
                {option.text}
              </button>
            ))}
          </div>
          <button type="button" className="arQuiz__prev" onClick={back}>
            <ChevronLeftIcon size={12} />
            {qi === 0 ? '시작 화면으로' : '이전 문항'}
          </button>
        </>
      )}

      {quiz.phase === 'done' && (
        <div className="arResult">
          <div className="arResult__main">
            <div className="arCard" data-ratio={quiz.ratio}>
              <div>
                <p className="arCard__label">{result.card.tag}</p>
                <p className="arCard__name">{result.card.name}</p>
                <p className="arCard__desc">{result.card.desc}</p>
              </div>
              <div className="arCard__gauges">
                {result.gauges.map((g) => (
                  <div key={g.name} className="arGauge">
                    <span className="arGauge__name">{g.name}</span>
                    <div className="arGauge__track">
                      <div
                        className="arGauge__fill"
                        style={{ width: `${g.pct}%`, background: g.color }}
                      />
                    </div>
                    {/* 0%까지 축 색으로 칠하면 안 고른 축이 도리어 강조된다. */}
                    <span
                      className="arGauge__pct"
                      style={{ color: g.pct === 0 ? 'var(--faint)' : g.color }}
                    >
                      {g.pct}%
                    </span>
                  </div>
                ))}
                <p className="arCard__brand">{SITE_DOMAIN.toUpperCase()}</p>
              </div>
            </div>

            <div className="arShare">
              <ResultDetail test={test} card={result.card} scores={result.scores} />

              <p className="arShare__label">결과 카드 공유</p>
              <div className="arShare__ratios">
                <button
                  type="button"
                  className="arShare__ratio"
                  aria-pressed={quiz.ratio === 'square'}
                  onClick={() => setQuiz(test.id, (q) => ({ ...q, ratio: 'square' }))}
                >
                  1:1
                </button>
                <button
                  type="button"
                  className="arShare__ratio"
                  aria-pressed={quiz.ratio === 'tall'}
                  onClick={() => setQuiz(test.id, (q) => ({ ...q, ratio: 'tall' }))}
                >
                  9:16
                </button>
              </div>
              {SHARE_ORDER.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={`arShare__btn arShare__btn--${kind}`}
                  onClick={() => share(kind)}
                >
                  {SHARE_LABELS[kind][quiz.shared === kind ? 1 : 0]}
                </button>
              ))}
              <button type="button" className="btn btn--ghost" onClick={start}>
                다시 하기
              </button>
            </div>
          </div>

          <nav className="arCross" aria-label="다른 유형검사">
            <p className="arCross__label">이 검사 끝냈다면, 남은 {others.length}종도</p>
            <div className="arCross__links">
              {others.map((t) => (
                <Link key={t.id} to={`/playground/test/${t.path}`} className="arCross__link">
                  <span className="arCross__name">{t.label}</span>
                  <span className="arCross__meta">{t.meta}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </section>
  );
}

/** 대처법·궁합·공유 멘트 등 공유 카드 밖으로 뺀 상세. 있는 것만 그린다. */
function ResultDetail({
  test,
  card,
  scores,
}: {
  test: TypeTestDef;
  card: TestResult;
  scores: Record<string, number>;
}) {
  // 카드 게이지가 고정 능력치로 채워진 검사는, 내가 실제로 고른 축 비중을 따로 보여준다.
  const picks = card.stats ? test.axes.map((a) => `${a} ${scores[a]}`).join(' · ') : undefined;

  if (!picks && !card.tip && !card.match && !card.mention) return null;

  return (
    <div className="arDetail">
      {picks && (
        <div className="arDetail__row">
          <span className="arDetail__key">내 선택</span>
          <span className="arDetail__val">{picks}</span>
        </div>
      )}
      {card.tip && (
        <div className="arDetail__row">
          <span className="arDetail__key">{card.tip.label}</span>
          <span className="arDetail__val">{card.tip.text}</span>
        </div>
      )}
      {card.match && (
        <div className="arDetail__row">
          <span className="arDetail__key">궁합</span>
          <span className="arDetail__val">
            환상 <strong>{card.match.best}</strong>
            <br />
            환장 <strong>{card.match.worst}</strong>
          </span>
        </div>
      )}
      {card.mention && <p className="arDetail__mention">“{card.mention}”</p>}
    </div>
  );
}
