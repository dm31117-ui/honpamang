import { TICKER_LINES } from '../../data/home';
import './ticker.css';

function Block({ lines }: { lines: string[] }) {
  return (
    <span className="ticker__block">
      {lines.map((line, i) => (
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

interface TickerProps {
  /** 실시간 수치로 갈아끼울 첫 줄. 없으면 시드 문구를 그대로 쓴다. */
  lead?: string;
}

/** 같은 블록을 2번 이어 붙여 -50% 이동으로 끊김 없이 롤링. */
export function Ticker({ lead }: TickerProps) {
  const lines = lead ? [lead, ...TICKER_LINES.slice(1)] : TICKER_LINES;
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__rail">
        <Block lines={lines} />
        <Block lines={lines} />
      </div>
    </div>
  );
}
