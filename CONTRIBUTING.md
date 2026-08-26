# 기여 가이드

## 개발 흐름

```bash
npm install
npm run dev
```

브랜치를 파고, 커밋하고, PR을 올립니다. `main`은 보호 대상이며 PR을 거쳐 머지합니다.

## 올리기 전에

```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

CI(`.github/workflows/ci.yml`)가 같은 순서로 돌기 때문에, 로컬에서 통과하면 CI도 통과합니다.

## 스타일 규칙

- **색·간격·반경·그림자·모션 값을 하드코딩하지 않습니다.** 전부 `src/styles/tokens.css`의
  CSS 변수(`var(--accent)`, `var(--r-16)`, `var(--sh-hard)` …)를 씁니다.
  토큰에 없는 값이 필요하면 먼저 토큰을 추가하세요.
- 호버 스타일은 `@media (hover: hover)` 안에 둡니다. 터치 기기에서 상태가 눌러붙습니다.
- 새 화면/섹션은 데스크톱과 390px 폭 양쪽에서 확인합니다. **가로 스크롤이 생기면 버그입니다.**
- 클래스 이름은 화면별 접두어를 씁니다 (`home-`/`feed`/`mu`/`ar` 등). CSS는 전역이라
  이름이 겹치면 조용히 깨집니다.

## 커밋 메시지

한 줄 요약 + 필요하면 본문. 무엇을 왜 바꿨는지가 보이면 형식은 자유입니다.
