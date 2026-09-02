import type { Dispatch, SetStateAction } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TYPE_TESTS } from '../../data/tests';

export type QuizPhase = 'idle' | 'run' | 'done';
export type Ratio = 'square' | 'tall';
export type ShareKind = 'insta' | 'x' | 'kakao' | '';

export interface QuizState {
  phase: QuizPhase;
  /**
   * 문항별로 고른 축을 순서대로 쌓는다. 점수는 여기서 파생시키므로
   * 이전 문항으로 되돌아가도 점수가 어긋나지 않는다.
   */
  answers: string[];
  ratio: Ratio;
  shared: ShareKind;
}

export interface BalanceState {
  /** 딜레마 인덱스 (5개 순환) */
  di: number;
  pick: 'a' | 'b' | null;
}

/**
 * 탭·검사를 옮기면 자식이 언마운트되므로 놀이 상태는 레이아웃이 들고 있는다.
 * 검사별로 따로 담아, 다른 검사를 보고 돌아와도 각자의 진행이 남는다.
 */
export interface ArcadeContext {
  quizzes: Record<string, QuizState>;
  setQuiz: (testId: string, update: SetStateAction<QuizState>) => void;
  balance: BalanceState;
  setBalance: Dispatch<SetStateAction<BalanceState>>;
}

export const QUIZ_INITIAL: QuizState = { phase: 'idle', answers: [], ratio: 'square', shared: '' };

export const QUIZZES_INITIAL: Record<string, QuizState> = Object.fromEntries(
  TYPE_TESTS.map((t) => [t.id, QUIZ_INITIAL]),
);

export const BALANCE_INITIAL: BalanceState = { di: 0, pick: null };

export function useArcade(): ArcadeContext {
  return useOutletContext<ArcadeContext>();
}
