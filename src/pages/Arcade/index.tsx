import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { CloseIcon } from '../../components/Icons';
import { ForgetModal } from './ForgetModal';
import {
  BALANCE_INITIAL,
  QUIZ_INITIAL,
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
  const [quiz, setQuiz] = useState<QuizState>(QUIZ_INITIAL);
  const [balance, setBalance] = useState<BalanceState>(BALANCE_INITIAL);
  const [forgetOpen, setForgetOpen] = useState(false);

  const context: ArcadeContext = { quiz, setQuiz, balance, setBalance };

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
