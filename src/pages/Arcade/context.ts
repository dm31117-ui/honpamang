import type { Dispatch, SetStateAction } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Axis } from '../../data/arcade';

export type QuizPhase = 'idle' | 'run' | 'done';
export type Ratio = 'square' | 'tall';

export interface QuizState {
  phase: QuizPhase;
  /** 현재 문항 인덱스 */
  qi: number;
  scores: Record<Axis, number>;
  ratio: Ratio;
  shared: 'insta' | 'x' | '';
}

export interface BalanceState {
  /** 딜레마 인덱스 (5개 순환) */
  di: number;
  pick: 'a' | 'b' | null;
}

/**
 * 탭을 옮기면 자식이 언마운트되므로 두 놀이의 상태는 레이아웃이 들고 있는다.
 * 검사 도중 밸런스게임을 잠깐 보고 돌아와도 진행이 유지된다.
 */
export interface ArcadeContext {
  quiz: QuizState;
  setQuiz: Dispatch<SetStateAction<QuizState>>;
  balance: BalanceState;
  setBalance: Dispatch<SetStateAction<BalanceState>>;
}

export const QUIZ_INITIAL: QuizState = {
  phase: 'idle',
  qi: 0,
  scores: { 혼돈: 0, 파괴: 0, 절망: 0 },
  ratio: 'square',
  shared: '',
};

export const BALANCE_INITIAL: BalanceState = { di: 0, pick: null };

export function useArcade(): ArcadeContext {
  return useOutletContext<ArcadeContext>();
}
