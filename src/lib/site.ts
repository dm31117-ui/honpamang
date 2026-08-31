/**
 * 서비스가 실제로 서빙되는 도메인.
 * 공유 문구와 결과 카드에 노출되므로, 도메인이 바뀌면 여기만 고치면 된다.
 * 배포 base path는 별개다 — `.github/workflows/deploy.yml`의 CUSTOM_DOMAIN 참고.
 */
export const SITE_DOMAIN = 'honpamang.mbers.kr';
