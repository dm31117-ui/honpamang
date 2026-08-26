import { DILEMMAS } from '../../data/arcade';
import { useArcade } from './context';

export function BalanceGame() {
  const { balance, setBalance } = useArcade();

  const dilemma = DILEMMAS[balance.di % DILEMMAS.length];
  const votes = {
    a: dilemma.av + (balance.pick === 'a' ? 1 : 0),
    b: dilemma.bv + (balance.pick === 'b' ? 1 : 0),
  };
  const total = votes.a + votes.b;
  const pctOf = (k: 'a' | 'b') => Math.round((votes[k] / total) * 100);

  return (
    <section className="arSection">
      <div className="arSection__head">
        <span className="sectionBadge arBadge--balance">밸런스 게임</span>
        <span className="arSection__name">궁극의 혼파망 딜레마</span>
      </div>

      <p className="arBalance__question">{dilemma.q}</p>

      <div className="arBalance__options">
        {(['a', 'b'] as const).map((key) => {
          const picked = balance.pick === key;
          const color = picked ? 'var(--accent)' : 'var(--muted)';
          return (
            <button
              key={key}
              type="button"
              className="arBalance__option"
              data-picked={picked}
              onClick={() => setBalance((b) => ({ ...b, pick: key }))}
            >
              <span className="arBalance__text">{dilemma[key]}</span>
              {balance.pick && (
                <span className="arBalance__result">
                  <span className="arBalance__row">
                    <span className="arBalance__pct" style={{ color }}>
                      {pctOf(key)}%
                    </span>
                    <span className="arBalance__votes">{votes[key].toLocaleString()}명</span>
                  </span>
                  <span className="arBalance__track">
                    <span
                      className="arBalance__fill"
                      style={{ width: `${pctOf(key)}%`, background: color }}
                    />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {balance.pick && (
        <div className="arBalance__footer">
          <p className="arBalance__note">
            방금 {votes[balance.pick].toLocaleString()}명이 당신과 같은 절망을 선택했습니다.
          </p>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setBalance((b) => ({ di: b.di + 1, pick: null }))}
          >
            다음 딜레마
          </button>
        </div>
      )}
    </section>
  );
}
