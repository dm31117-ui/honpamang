import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { CloseIcon } from '../../components/Icons';

type Phase = 'idle' | 'chaos' | 'destroy' | 'done';

interface ForgetModalProps {
  open: boolean;
  onClose: () => void;
}

/** 셀프 디지털 망각 버튼 — chaos(0.9s) → destroy(1.4s) → done, 총 2.3초. */
export function ForgetModal({ open, onClose }: ForgetModalProps) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (!open) {
      setText('');
      setPhase('idle');
    }
  }, [open]);

  useEffect(() => {
    if (phase !== 'chaos') return;
    const toDestroy = setTimeout(() => setPhase('destroy'), 900);
    const toDone = setTimeout(() => setPhase('done'), 2300);
    return () => {
      clearTimeout(toDestroy);
      clearTimeout(toDone);
    };
  }, [phase]);

  const shown = text.trim() || '그 날의 흑역사';

  return (
    <Modal open={open} onClose={onClose} variant="wide" labelledBy="forgetTitle">
      <div className="modal__head">
        <div className="forget__heading">
          <span className="sectionBadge forget__badge">힐링 툴</span>
          <h3 id="forgetTitle" className="forget__title">
            셀프 디지털 망각 버튼
          </h3>
        </div>
        <button type="button" className="iconBtn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>

      <p className="forget__desc">
        남들에게 말 못 할 흑역사나 스트레스, 여기서 산산조각 내서 날려버리세요.
      </p>

      {phase === 'idle' && (
        <>
          <textarea
            className="textarea forget__text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="잊고 싶은 일을 적어보세요"
          />
          <button type="button" className="forget__cta" onClick={() => setPhase('chaos')}>
            망각하기
          </button>
        </>
      )}

      {(phase === 'chaos' || phase === 'destroy') && (
        <>
          <div className="forget__stage">
            <p className="forget__victim" data-phase={phase}>
              {shown}
            </p>
          </div>
          {phase === 'destroy' && (
            <div className="forget__smoke" aria-hidden="true">
              <span className="forget__puff forget__puff--a" />
              <span className="forget__puff forget__puff--b" />
              <span className="forget__puff forget__puff--c" />
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
        <div className="forget__done">
          <p className="forget__doneText">성공적으로 망각되었습니다. 마음을 가다듬으세요.</p>
          <button
            type="button"
            className="btn btn--ghost forget__again"
            onClick={() => {
              setText('');
              setPhase('idle');
            }}
          >
            하나 더 날리기
          </button>
        </div>
      )}
    </Modal>
  );
}
