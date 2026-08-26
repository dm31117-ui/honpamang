import logoUrl from '../assets/logo-honpamang.png';

/** 혼파망 워드마크. 메인 30px, 서브페이지 28px. */
export function Logo({ height = 30 }: { height?: number }) {
  return (
    <img
      src={logoUrl}
      alt="혼파망"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
