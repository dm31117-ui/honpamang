import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { CloseIcon } from '../../components/Icons';
import { AXIS_COLOR, DILEMMAS, QUESTIONS, RESULTS, type Axis } from '../../data/arcade';
import { ForgetModal } from './ForgetModal';
import './arcade.css';

type QuizPhase = 'idle' | 'run' | 'done';
type Ratio = 'square' | 'tall';
const AXES: Axis[] = ['혼돈', '파괴', '절망'];
const ZERO: Record<Axis, number> = { 혼돈: 0, 파괴: 0, 절망: 0 };

export function Arcade() {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [qi, setQi] = useState(0);
  const [scores, setScores] = useState<Record<Axis, number>>(ZERO);
  const [ratio, setRatio] = useState<Ratio>('square');
  const [shared, setShared] = useState<'insta' | 'x' | ''>('');
  const [di, setDi] = useState(0);
  const [pick, setPick] = useState<'a' | 'b' | null>(null);
  const [forgetOpen, setForgetOpen] = useState(false);

  const result = useMemo(() => {
    const top = AXES.reduce((best, a) => (scores[a] > scores[best] ? a : best), AXES[0]);
    const total = Math.max(
      1,
      AXES.reduce((sum, a) => sum + scores[a], 0),
    );
    return {
      ...RESULTS[top],
      stats: AXES.map((a) => ({
        name: a,
        pct: Math.round((scores[a] / total) * 100),
        color: AXIS_COLOR[a],
      })),
    };
  }, [scores]);

  const startQuiz = () => {
    setPhase('run');
    setQi(0);
    setScores(ZERO);
    setShared('');
  };

  const answer = (axis: Axis) => {
    setScores((s) => ({ ...s, [axis]: s[axis] + 1 }));
    if (qi >= QUESTIONS.length - 1) setPhase('done');
    else setQi((i) => i + 1);
  };

  const share = (kind: 'insta' | 'x') => {
    const text = `내 혼파망 유형: ${result.name} — honpamang.kr`;
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* 클립보드 차단 환경에서는 라벨만 바뀐다 */
    }
    setShared(kind);
    setTimeout(() => setShared(''), 1800);
  };

  const dilemma = DILEMMAS[di % DILEMMAS.length];
  const votes = {
    a: dilemma.av + (pick === 'a' ? 1 : 0),
    b: dilemma.bv + (pick === 'b' ? 1 : 0),
  };
  const voteTotal = votes.a + votes.b;
  const pctOf = (k: 'a' | 'b') => Math.round((votes[k] / voteTotal) * 100);

  const question = QUESTIONS[qi];

  return (
    <div className="page">
      <div className="container container--narrow">
        <PageHeader
          title="혼파망 놀이터"
          titleColor="#373737"
          action={
            <button type="button" className="arForget" onClick={() => setForgetOpen(true)}>
              <CloseIcon />
              망각하기
            </button>
          }
        />

        {/* 01 유형검사 */}
        <section className="arSection">
          <div className="arSection__head">
            <span className="sectionBadge arBadge--test">유형검사</span>
            <span className="arSection__name">내 인생 혼파망 진단 테스트</span>
          </div>

          {phase === 'idle' && (
            <>
              <p className="arQuiz__hook">나는 걸어 다니는 자연재해일까?</p>
              <p className="arQuiz__sub">극단적 상황극 6문항 · 3분이면 결과 카드가 나옵니다</p>
              <button type="button" className="arQuiz__start" onClick={startQuiz}>
                유형 진단 시작
              </button>
            </>
          )}

          {phase === 'run' && question && (
            <>
              <div className="arQuiz__progress">
                <span className="arQuiz__step">
                  Q{qi + 1} / {QUESTIONS.length}
                </span>
                <div className="arQuiz__track">
                  <div
                    className="arQuiz__bar"
                    style={{ width: `${(qi / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>
              <p className="arQuiz__question" key={qi}>
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

          {phase === 'done' && (
            <div className="arResult">
              <div className="arCard" data-ratio={ratio}>
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
                    aria-pressed={ratio === 'square'}
                    onClick={() => setRatio('square')}
                  >
                    1:1
                  </button>
                  <button
                    type="button"
                    className="arShare__ratio"
                    aria-pressed={ratio === 'tall'}
                    onClick={() => setRatio('tall')}
                  >
                    9:16
                  </button>
                </div>
                <button
                  type="button"
                  className="arShare__btn arShare__btn--accent"
                  onClick={() => share('insta')}
                >
                  {shared === 'insta' ? '스토리 문구 복사 완료' : '인스타 스토리 공유'}
                </button>
                <button
                  type="button"
                  className="arShare__btn arShare__btn--ink"
                  onClick={() => share('x')}
                >
                  {shared === 'x' ? '공유 문구 복사 완료' : 'X에 공유'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={startQuiz}>
                  다시 하기
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 02 밸런스 게임 */}
        <section className="arSection arSection--balance">
          <div className="arSection__head">
            <span className="sectionBadge arBadge--balance">밸런스 게임</span>
            <span className="arSection__name">궁극의 혼파망 딜레마</span>
          </div>

          <p className="arBalance__question">{dilemma.q}</p>

          <div className="arBalance__options">
            {(['a', 'b'] as const).map((key) => {
              const picked = pick === key;
              const color = picked ? 'var(--accent)' : 'var(--muted)';
              return (
                <button
                  key={key}
                  type="button"
                  className="arBalance__option"
                  data-picked={picked}
                  onClick={() => setPick(key)}
                >
                  <span className="arBalance__text">{dilemma[key]}</span>
                  {pick && (
                    <span className="arBalance__result">
                      <span className="arBalance__row">
                        <span className="arBalance__pct" style={{ color }}>
                          {pctOf(key)}%
                        </span>
                        <span className="arBalance__votes">{votes[key].toLocaleString()}명</span>
                      </span>
                      <span className="arBalance__track">
                        <span
                          className="arBalance__fill"
                          style={{ width: `${pctOf(key)}%`, background: color }}
                        />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {pick && (
            <div className="arBalance__footer">
              <p className="arBalance__note">
                방금 {votes[pick].toLocaleString()}명이 당신과 같은 절망을 선택했습니다.
              </p>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  setDi((i) => i + 1);
                  setPick(null);
                }}
              >
                다음 딜레마
              </button>
            </div>
          )}
        </section>
      </div>

      <ForgetModal open={forgetOpen} onClose={() => setForgetOpen(false)} />
    </div>
  );
}
