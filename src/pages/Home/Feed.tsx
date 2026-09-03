import { PlusIcon } from '../../components/Icons';
import type { FeedCard } from '../../data/home';
import './feed.css';

interface FeedProps {
  cards: FeedCard[];
  highlightNewest: boolean;
  onOpenCard: (id: string) => void;
  onWrite: () => void;
}

export function Feed({ cards, highlightNewest, onOpenCard, onWrite }: FeedProps) {
  return (
    <div className="feed">
      <div className="feed__head">
        <h2 className="feed__title">전국 비상벨 상황</h2>
        <button type="button" className="btn btn--hard" onClick={onWrite}>
          <PlusIcon />
          상황작성
        </button>
      </div>

      <div className="feed__list">
        {cards.map((card, i) => (
          <button
            key={card.id}
            type="button"
            className="feedCard"
            data-fresh={i === 0 && highlightNewest}
            onClick={() => onOpenCard(card.id)}
          >
            <div className="feedCard__meta">
              <span className="feedCard__nick">{card.nick}</span>
              <span className="regionChip">{card.gu}</span>
              <span className="feedCard__time">{card.time}</span>
            </div>
            <p className="feedCard__story">{card.story}</p>
            <div className="feedCard__stats">
              <span>
                위로 <span className="feedCard__cheers">{card.cheers}</span>
              </span>
              <span>
                절망 <span className="feedCard__forgets">{card.forgets}</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
