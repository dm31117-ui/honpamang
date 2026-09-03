import { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { CARD_REACTIONS, type FeedCard } from '../../data/home';
import './cardModal.css';

interface CardModalProps {
  card: FeedCard | null;
  onClose: () => void;
  /** 반응을 서버 합계에 더한다. 시드 카드에는 붙지 않는다. */
  onReact?: (kind: 'cheer' | 'forget') => void;
}

type DespairPhase = 'idle' | 'shattering' | 'done';

/** 피드 카드 상세. 반응 4종 + "같이 절망해주기" (shatter → 문구 교체). */
export function CardModal({ card, onClose, onReact }: CardModalProps) {
  const [phase, setPhase] = useState<DespairPhase>('idle');
  const [sent, setSent] = useState<Record<string, boolean>>({});

  // 다른 카드를 열면 절망 상태를 초기화한다.
  useEffect(() => {
    setPhase('idle');
    setSent({});
  }, [card?.id]);

  useEffect(() => {
    if (phase !== 'shattering') return;
    const id = setTimeout(() => setPhase('done'), 900);
    return () => clearTimeout(id);
  }, [phase]);

  if (!card) return null;

  const story = phase === 'done' ? '이 사연에 다 함께 절망했습니다.' : card.story;

  return (
    <Modal open onClose={onClose} labelledBy="cardModalNick">
      <div className="cardModal__meta">
        <span id="cardModalNick" className="cardModal__nick">
          {card.nick}
        </span>
        <span className="cardModal__chip">{card.gu}</span>
        <span className="cardModal__time">{card.time}</span>
      </div>

      <p className="cardModal__story" data-phase={phase}>
        {story}
      </p>

      <div className="cardModal__stats">
        <span>
          위로 <b>{card.cheers}</b>
        </span>
        <span>
          절망 <b>{card.forgets}</b>
        </span>
      </div>

      <div className="cardModal__reactions">
        {CARD_REACTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className="cardModal__reaction"
            data-sent={Boolean(sent[label])}
            onClick={() => {
              if (sent[label]) return;
              setSent((s) => ({ ...s, [label]: true }));
              onReact?.('cheer');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--ink cardModal__despair"
        disabled={phase !== 'idle'}
        onClick={() => {
          setPhase('shattering');
          onReact?.('forget');
        }}
      >
        {phase === 'done' ? '절망 완료' : '같이 절망해주기'}
      </button>
    </Modal>
  );
}
