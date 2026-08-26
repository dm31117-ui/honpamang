import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from './Icons';
import { Logo } from './Logo';
import './pageHeader.css';

interface PageHeaderProps {
  title: string;
  /** 우측 CTA 슬롯 */
  action?: ReactNode;
  /** 제목 색 (놀이터는 #373737) */
  titleColor?: string;
}

export function PageHeader({ title, action, titleColor }: PageHeaderProps) {
  const navigate = useNavigate();
  const goHome = () => navigate('/');

  return (
    <header className="pageHeader">
      <div className="pageHeader__left">
        <button type="button" className="btn btn--outline pageHeader__back" onClick={goHome}>
          <ChevronLeftIcon />
          <span className="pageHeader__backLabel">뒤로</span>
        </button>
        <button type="button" className="pageHeader__logo" onClick={goHome} aria-label="홈으로">
          <Logo height={28} />
        </button>
        <h1 className="pageHeader__title" style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}
