# 혼파망 (HONPAMANG)

> 혼돈 · 파괴 · 망함 — 지금 터진 멘탈을 익명 한 줄로 전국 지도에 올리고, 서로 위로를 보내는 웹 서비스.

디자인 핸드오프(`design_handoff_honpamang`)를 React로 구현한 프론트엔드입니다. 백엔드 없이
컴포넌트 로컬 상태 + `localStorage`로 동작하며, 데스크톱과 모바일 양쪽에 대응합니다.

## 화면

| 경로 | 화면 | 내용 |
| --- | --- | --- |
| `/` | 메인 | SOS 버튼 + 전국 지도(시·군·구 229개) + 실시간 비상벨 피드 |
| `/museum` | 대참사 전당 | 등급제 아카이브 (검색 · 등급/관 필터 · 상세 · 등록) |
| `/playground/test` | 놀이터 — 유형검사 | 6문항 진단 + 결과 공유 카드 (1:1 / 9:16) |
| `/playground/balance` | 놀이터 — 밸런스게임 | 딜레마 5종 투표 |

`/playground` 는 `/playground/test` 로 리다이렉트합니다. 두 놀이는 상단 pill 탭으로 전환하며,
`망각하기`는 놀이터 헤더 어느 탭에서나 열립니다.

## 시작하기

```bash
npm install
npm run dev      # http://localhost:5173
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 로컬 확인 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 타입 체크만 |
| `npm run format` | Prettier 적용 |

## 기술 스택

- **Vite + React 18 + TypeScript** — 백엔드가 없는 순수 클라이언트 앱이라 정적 배포가 가장 단순합니다.
- **react-router-dom** — 프로토타입의 탭 상태(`home`/`museum`/`arcade`)를 실제 경로로 대체했습니다.
- **순수 CSS + 디자인 토큰** — 색·간격·모션 값은 전부 `src/styles/tokens.css`의 CSS 변수입니다.
  프레임워크를 얹지 않아 핸드오프 값과 1:1로 대조됩니다.

## 구조

```
src/
├── App.tsx              # 라우터
├── styles/
│   ├── tokens.css       # 디자인 토큰 (색 · 반경 · 그림자 · 레이아웃 · 모션)
│   ├── global.css       # 리셋 · 레이아웃 프리미티브 · 공용 keyframes
│   └── ui.css           # 버튼 · 필 · 폼 · 모달 프리미티브
├── lib/
│   ├── geo.ts           # GeoJSON 로딩(모듈 캐시) + equirectangular 투영 + 지역 검색
│   ├── storage.ts       # localStorage 래퍼 (프로필 · 오늘 SOS 카운트)
│   └── hooks.ts         # useMediaQuery · useElementSize · useModal · useTimers
├── components/          # Modal · RegionSearch · PageHeader · Logo · Icons
├── data/                # 시드 데이터 (피드 · 지도 핀 · 전당 · 문항 · 딜레마)
└── pages/
    ├── Home/            # Ticker · SosHero · KoreaMap · Feed · CardModal · WriteModal
    ├── Museum/          # 목록 · 상세 패널 · 등록 모달
    └── Arcade/          # 레이아웃(탭 + 놀이 상태) · TypeTest · BalanceGame · 망각하기 모달
```

## 반응형

핸드오프는 데스크톱 1280px 기준이고 지도 폭이 `753px`로 고정돼 있었습니다. 구현하면서 다음을
다시 잡았습니다.

- **지도** — 고정 폭을 없애고 `ResizeObserver`로 컨테이너 크기를 추적해 매번 재투영합니다.
  핀 크기는 기준 폭(753px) 대비 비율로 줄어들고, 확대(×6.5) 시 `1/6.5` 역보정은 그대로 둡니다.
- **1024px 이하** — 지도 + 피드가 1열로 내려가고, 피드는 내부 스크롤(522px 고정)을 버리고
  페이지 스크롤을 따릅니다.
- **900px 이하** — 전당 상세가 sticky 사이드 패널에서 바텀시트 모달로 바뀝니다.
  목록에서 카드를 누르면 그 자리에서 상세가 열립니다.
- **600px 이하** — 헤더의 `뒤로`는 아이콘만 남고, 등급·관 탭은 가로 스크롤로 흐르며,
  모달 반응 버튼은 2×2로 펴집니다.
- 호버 효과는 전부 `@media (hover: hover)` 안에 있어 터치에서 상태가 눌러붙지 않습니다.
- 한글 본문은 `word-break: keep-all`로 어절 단위로 끊습니다. 기본값이면 단어 중간에서 잘립니다.
- 장식 요소(SOS 펄스 링·사이렌 글로우)는 `overflow-x: clip`으로 가둬 가로 스크롤을 막습니다.
  `hidden`이 아닌 `clip`이라 전당 상세의 `position: sticky`가 그대로 동작합니다.
- `prefers-reduced-motion`에서 무한 루프 애니메이션이 멈춥니다.

## 데이터

- 지도와 지역 검색은 [southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps)의
  시·군·구 GeoJSON(229개)을 CDN에서 한 번만 받아 모듈 레벨에서 캐시합니다.
  실패하면 조용히 넘어가고, 지도는 배경 장식만 남습니다.
- 나머지는 전부 `src/data/`의 시드 + 로컬 상태입니다. 피드는 7초마다 새 카드가 들어오는
  유입 시뮬레이션이며, 프로덕션에서는 소켓/폴링으로 대체할 자리입니다.
- `localStorage` 키: `honpamang.profile`(닉네임·지역), `honpamang.sosToday.v2`(오늘 SOS 카운트).

### API로 바꿔야 할 부분

1. 비상벨 피드 목록 / 등록 / 반응(위로 · 절망)
2. 지역별 SOS 카운트 + 사연 목록 (지도 핀)
3. SOS 프레스 카운트 (TODAY, 남들 비명 실시간 스트림)
4. 전당 항목 목록 / 등록 / 반응 카운트 — 등급은 서버 합계로 계산
5. 밸런스게임 투표 집계

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다.
저장소 **Settings → Pages → Source**를 **GitHub Actions**로 한 번 지정해 두면 됩니다.

프로젝트 페이지는 `/<repo>/` 아래에서 서빙되므로 빌드 시 `BASE_PATH`를 넘기고
(`BASE_PATH=/honpamang/ npm run build`), 라우터는 `import.meta.env.BASE_URL`을 basename으로 씁니다.
Pages에는 서버 리라이트가 없어서 `index.html`을 `404.html`로 복사해 SPA 딥링크를 처리합니다.

## 핸드오프에서 내린 결정

핸드오프 "남은 작업"에 미확정으로 남아 있던 항목들의 현재 상태입니다.

1. **망각하기 위치 — 놀이터 헤더 유지.** 핸드오프에는 "전당 우상단 플로팅 버튼으로 옮기는
   것이 최종 의도"라고 적혀 있었지만, 그 버튼의 디자인이 없어 프로토타입 위치를 그대로 둡니다.
2. **화면 명칭 — `대참사 전당`.** 프로토타입의 `대참사 박물관`에서 확정된 이름으로 바꿨습니다.
   경로(`/museum`)와 코드 식별자(`Museum`, `mu-` 클래스 접두어)는 그대로입니다.
3. **놀이터 진입 화면 — 상단 탭으로 한 번에 하나씩.** 유형검사와 밸런스게임은 성격이 달라
   (6문항 몰입형 vs 한 번에 끝나는 가벼운 놀이) 한 화면에 쌓지 않고 pill 탭으로 나눴습니다.
   기본 진입은 유형검사이고, 각각 경로를 가져서 결과 카드 공유 링크가 의미를 갖습니다.
   두 놀이의 상태는 레이아웃이 들고 있어 탭을 옮겼다 돌아와도 진행이 유지됩니다.
   섹션에는 `min-height`로 "무대" 높이를 줘서 문항을 넘길 때 카드가 들썩이지 않습니다.

그 외 손본 것:

- 홈 하단 진입 카드의 `5문항`을 `6문항`으로 고쳤습니다. 핸드오프 자체가 메인(5문항)과
  놀이터(6문항)에서 서로 다르게 적혀 있었는데, 실제 문항은 6개입니다.

아직 열려 있는 것:

- **GeoJSON 로딩 실패 UI** — 지금은 조용히 무시합니다. 지도는 배경 장식만 남고 지역 검색은
  빈 결과가 됩니다. 안내가 필요하면 새 디자인이 있어야 합니다.

핸드오프의 dead code(shell/전당의 미사용 SOS 모달, 메인의 `filter`·`bumped` 상태)는
구현하지 않았습니다.
