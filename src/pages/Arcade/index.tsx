import { useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { CloseIcon } from '../../components/Icons';
import { ForgetModal } from './ForgetModal';
import {
  BALANCE_INITIAL,
  QUIZZES_INITIAL,
  type ArcadeContext,
  type BalanceState,
  type QuizState,
} from './context';
import './arcade.css';

const TABS = [
  { to: 'test', label: '유형검사' },
  { to: 'balance', label: '밸런스게임' },
];

/**
 * 놀이터 레이아웃. 두 놀이는 성격이 달라 한 화면에 하나씩만 보여주고
 * 탭(= 경로)으로 전환한다. 상태는 여기서 들고 있어 탭을 옮겨도 진행이 남는다.
 */
export function Arcade() {
  const [quizzes, setQuizzes] = useState<Record<string, QuizState>>(QUIZZES_INITIAL);
  const [balance, setBalance] = useState<BalanceState>(BALANCE_INITIAL);
  const [forgetOpen, setForgetOpen] = useState(false);

  // 검사별 상태를 한 곳에 모아 두고, 갱신은 해당 검사 칸만 갈아 끼운다.
  const setQuiz = useCallback<ArcadeContext['setQuiz']>((testId, update) => {
    setQuizzes((prev) => {
      const next = typeof update === 'function' ? update(prev[testId]) : update;
      return { ...prev, [testId]: next };
    });
  }, []);

  const context: ArcadeContext = { quizzes, setQuiz, balance, setBalance };

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

        <nav className="arTabs" aria-label="놀이 선택">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => 'tab' + (isActive ? ' tab--on' : '')}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <Outlet context={context} />
      </div>

      <ForgetModal open={forgetOpen} onClose={() => setForgetOpen(false)} />
    </div>
  );
}
