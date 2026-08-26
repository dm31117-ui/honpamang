# 혼파망 (HONPAMANG)

> 혼돈 · 파괴 · 망함 — 지금 터진 멘탈을 익명 한 줄로 전국 지도에 올리고, 서로 위로를 보내는 웹 서비스.

디자인 핸드오프(`design_handoff_honpamang`)를 React로 구현한 프론트엔드입니다. 백엔드 없이
컴포넌트 로컬 상태 + `localStorage`로 동작하며, 데스크톱과 모바일 양쪽에 대응합니다.

## 화면

| 경로 | 화면 | 내용 |
| --- | --- | --- |
| `/` | 메인 | SOS 버튼 + 전국 지도(시·군·구 229개) + 실시간 비상벨 피드 |
| `/museum` | 대참사 박물관 | 등급제 아카이브 (검색 · 등급/관 필터 · 상세 · 등록) |
| `/playground` | 혼파망 놀이터 | 유형검사 · 밸런스게임 · 망각하기 |

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
├── data/                # 시드 데이터 (피드 · 지도 핀 · 박물관 · 문항 · 딜레마)
└── pages/
    ├── Home/            # Ticker · SosHero · KoreaMap · Feed · CardModal · WriteModal
    ├── Museum/          # 목록 · 상세 패널 · 등록 모달
    └── Arcade/          # 유형검사 · 밸런스게임 · 망각하기 모달
```

## 반응형

핸드오프는 데스크톱 1280px 기준이고 지도 폭이 `753px`로 고정돼 있었습니다. 구현하면서 다음을
다시 잡았습니다.

- **지도** — 고정 폭을 없애고 `ResizeObserver`로 컨테이너 크기를 추적해 매번 재투영합니다.
  핀 크기는 기준 폭(753px) 대비 비율로 줄어들고, 확대(×6.5) 시 `1/6.5` 역보정은 그대로 둡니다.
- **1024px 이하** — 지도 + 피드가 1열로 내려가고, 피드는 내부 스크롤(522px 고정)을 버리고
  페이지 스크롤을 따릅니다.
- **900px 이하** — 박물관 상세가 sticky 사이드 패널에서 바텀시트 모달로 바뀝니다.
  목록에서 카드를 누르면 그 자리에서 상세가 열립니다.
- **600px 이하** — 헤더의 `뒤로`는 아이콘만 남고, 등급·관 탭은 가로 스크롤로 흐르며,
  모달 반응 버튼은 2×2로 펴집니다.
- 호버 효과는 전부 `@media (hover: hover)` 안에 있어 터치에서 상태가 눌러붙지 않습니다.
- 장식 요소(SOS 펄스 링·사이렌 글로우)는 `overflow-x: clip`으로 가둬 가로 스크롤을 막습니다.
  `hidden`이 아닌 `clip`이라 박물관 상세의 `position: sticky`가 그대로 동작합니다.
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
4. 박물관 항목 목록 / 등록 / 반응 카운트 — 등급은 서버 합계로 계산
5. 밸런스게임 투표 집계

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포합니다.
저장소 **Settings → Pages → Source**를 **GitHub Actions**로 한 번 지정해 두면 됩니다.

프로젝트 페이지는 `/<repo>/` 아래에서 서빙되므로 빌드 시 `BASE_PATH`를 넘기고
(`BASE_PATH=/honpamang/ npm run build`), 라우터는 `import.meta.env.BASE_URL`을 basename으로 씁니다.
Pages에는 서버 리라이트가 없어서 `index.html`을 `404.html`로 복사해 SPA 딥링크를 처리합니다.

## 핸드오프에서 열려 있는 항목

구현하지 않고 그대로 둔, 결정이 필요한 것들입니다.

1. **망각하기 위치** — 지금은 놀이터 헤더에 있습니다. 핸드오프에는 "박물관 우상단 플로팅
   버튼으로 옮기는 것이 최종 의도"라고 적혀 있지만 그 버튼의 디자인이 없어 프로토타입 위치를
   유지했습니다.
2. **박물관 명칭** — `대참사 박물관`으로 두었습니다. 최종 명칭 후보 `대참사 전당`은 미확정.
3. **놀이터 진입 시 섹션 접힘 여부** — 두 섹션 모두 펼친 상태입니다.
4. **GeoJSON 로딩 실패 UI** — 현재는 조용히 무시합니다. 별도 디자인이 필요합니다.

핸드오프의 dead code(shell/박물관의 미사용 SOS 모달, 메인의 `filter`·`bumped` 상태)는
구현하지 않았습니다.
