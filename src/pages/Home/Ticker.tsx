import { TICKER_LINES } from '../../data/home';
import './ticker.css';

function Block() {
  return (
    <span className="ticker__block">
      {TICKER_LINES.map((line, i) => (
        <span key={line} className="ticker__item">
          <span>
            {i === 0 && <span className="ticker__flash">속보</span>}
            {i === 0 ? ' ' : ''}
            {line}
          </span>
          <span className="ticker__sep">|</span>
        </span>
      ))}
    </span>
  );
}

/** 같은 블록을 2번 이어 붙여 -50% 이동으로 끊김 없이 롤링. */
export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__rail">
        <Block />
        <Block />
      </div>
    </div>
  );
}
