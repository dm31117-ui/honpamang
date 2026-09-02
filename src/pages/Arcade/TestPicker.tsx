import { Link } from 'react-router-dom';
import { TYPE_TESTS, resultKeyOf, scoresOf } from '../../data/tests';
import { ArrowUpRightIcon } from '../../components/Icons';
import { useArcade } from './context';

/**
 * 유형검사 선택 화면. 검사가 여러 개라 곧바로 문항을 띄우지 않고
 * 무엇을 할지 먼저 고르게 한다. 이미 끝낸 검사는 결과를 배지로 되돌려준다.
 */
export function TestPicker() {
  const { quizzes } = useArcade();

  return (
    <section className="arSection">
      <div className="arSection__head">
        <span className="sectionBadge arBadge--test">유형검사</span>
        <span className="arSection__name">{TYPE_TESTS.length}종 중에 하나를 고르세요</span>
      </div>

      <div className="arPicker__body">
        <p className="arPicker__lead">
          오늘의 혼파망을 어느 각도에서 파볼까요? 하나를 끝내면 나머지도 이어서 할 수 있습니다.
        </p>

        <ul className="arPicker">
          {TYPE_TESTS.map((test, i) => {
            const quiz = quizzes[test.id];
            const done = quiz?.phase === 'done';
            const running = quiz?.phase === 'run';
            const resultName = done
              ? test.results[resultKeyOf(test, scoresOf(test, quiz.answers))]?.name
              : undefined;

            return (
              <li key={test.id}>
                <Link to={test.path} className="arPickerCard">
                  <div className="arPickerCard__top">
                    <span className="arPickerCard__no">{String(i + 1).padStart(2, '0')}</span>
                    <span className="arPickerCard__meta">{test.meta}</span>
                    <ArrowUpRightIcon />
                  </div>
                  <p className="arPickerCard__title">{test.label}</p>
                  <p className="arPickerCard__summary">{test.summary}</p>
                  <span className="arPickerCard__state" data-done={done}>
                    {resultName ? `내 결과 · ${resultName}` : running ? '진행 중' : '검사 시작'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
