import './sosHero.css';

export interface Shout {
  id: string;
  text: string;
  x: string;
  y: string;
  size: string;
  color: string;
  op: number;
}

interface SosHeroProps {
  todayCount: number;
  shouts: Shout[];
  onPress: () => void;
}

export function SosHero({ todayCount, shouts, onPress }: SosHeroProps) {
  return (
    <div className="hero">
      <div className="hero__shouts" aria-hidden="true">
        {shouts.map((s) => (
          <span
            key={s.id}
            className="hero__shout"
            style={{
              left: s.x,
              top: s.y,
              fontSize: s.size,
              color: s.color,
              opacity: s.op,
            }}
          >
            {s.text}
          </span>
        ))}
      </div>

      <span className="hero__today">TODAY {String(todayCount).padStart(3, '0')}</span>

      <button type="button" className="hero__sos" onClick={onPress}>
        <span className="hero__ring" aria-hidden="true" />
        <span className="hero__ring hero__ring--delayed" aria-hidden="true" />
        SOS
        <span className="hero__press">PRESS</span>
      </button>

      <p className="hero__caption">지금 멘탈 터졌으면 누르세요. 전국에 익명으로 울립니다.</p>
    </div>
  );
}
