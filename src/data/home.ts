export interface FeedCard {
  id: string;
  nick: string;
  /** 표기 겸 식별 라벨 "{시도} {구·군}" (예: 서울 강남구) */
  gu: string;
  /** 표시용 상대 시각. createdAt이 있으면 거기서 다시 계산한다. */
  time: string;
  story: string;
  cheers: number;
  forgets: number;
  /** 서버에서 온 카드의 작성 시각 (ISO). 시드 카드에는 없다. */
  createdAt?: string;
}

export interface SeedPin {
  id: string;
  /** 지역 식별자 겸 표기 라벨 "{시도} {구·군}" — 지도 좌표를 여기서 찾는다 */
  region: string;
  count: number;
  stories: string[];
}

export const TICKER_LINES = [
  '전국 비상벨 2,003건 가동 중! 서울 강남구·영등포구 멘탈 과부하 비상',
  '오늘의 최고 존엄: [망붕이: 재택 회의에 고양이가 보고서를 날림]',
  '혼돈, 파괴, 절망... 그 끝은 무엇인가. 그것은 칼퇴 실패이다.',
  '방금 서울 마포구 비상벨에 128명이 실시간 위로를 날렸습니다.',
  '절망적인 하루, 다 같이 유쾌하게 털어버립시다.',
];

export const SHOUT_WORDS = [
  '살려줘...',
  '으악...',
  'SOS...',
  '사람살려...',
  '도와주세요...',
  'ㅠㅠ',
  '하....',
  '엄마아아아악',
  '뭐야 이거...',
  '아니 왜...',
  '순서가 다 뒤죽박죽...',
  '정신이 없어...',
  '어디부터 손대지...',
  '와장창...',
  '박살났다...',
  '다 엎었어...',
  '손대는 순간 부서짐...',
  '끝장났다...',
  '끝났다...',
  '가망 없음...',
  '이번 생은 실패...',
  '안돼....',
  '실화야?...',
];

export const SEED_PINS: SeedPin[] = [
  {
    id: 'gangnam',
    region: '서울 강남구',
    count: 200,
    stories: [
      '보고 5분 전에 노트북이 업데이트를 시작했습니다',
      '팀장님이 "간단한 건데"로 시작하는 메일을 보냈습니다',
      '엘리베이터에서 인사한 분이 면접관이었습니다',
    ],
  },
  {
    id: 'yeouido',
    region: '서울 영등포구',
    count: 142,
    stories: [
      '점심에 산 주식이 오후에 반토막 났습니다',
      '증권사 앱을 지웠는데 꿈에 차트가 나옵니다',
    ],
  },
  {
    id: 'mapo',
    region: '서울 마포구',
    count: 87,
    stories: [
      '카페 노트북 자리 쟁탈전에서 3연패 중입니다',
      '팟캐스트 녹음 파일이 통째로 날아갔습니다',
    ],
  },
  {
    id: 'jungnang',
    region: '서울 중랑구',
    count: 19,
    stories: ['택배가 3일째 "배송 중"입니다'],
  },
  {
    id: 'songpa',
    region: '서울 송파구',
    count: 64,
    stories: [
      '헬스장 등록한 날 헬스장이 폐업했습니다',
      '아이 학원 상담 갔다가 제가 숙제를 받았습니다',
    ],
  },
  {
    id: 'gwanak',
    region: '서울 관악구',
    count: 45,
    stories: ['시험 범위가 어제 바뀐 걸 오늘 알았습니다'],
  },
  {
    id: 'haeundae',
    region: '부산 해운대구',
    count: 78,
    stories: ['바다 보러 갔다가 갈매기에게 김밥을 헌납했습니다', '숙소 예약을 다음 달로 했습니다'],
  },
  {
    id: 'yuseong',
    region: '대전 유성구',
    count: 36,
    stories: ['실험 데이터를 덮어썼습니다. 백업도 같이 덮었습니다'],
  },
  {
    id: 'suseong',
    region: '대구 수성구',
    count: 52,
    stories: ['에어컨 없이 8월 회의실에 2시간 갇혔습니다'],
  },
];

export const SEED_CARDS: FeedCard[] = [
  {
    id: 'seed-1',
    nick: '익명의 사축',
    gu: '서울 강남구',
    time: '2분 전',
    story: "대표님한테 '네' 대신 '웅' 보냄...",
    cheers: 214,
    forgets: 89,
  },
  {
    id: 'seed-2',
    nick: '개미는뚠뚠',
    gu: '서울 영등포구',
    time: '7분 전',
    story: '점심에 산 주식이 퇴근 전에 반토막 났습니다.',
    cheers: 342,
    forgets: 156,
  },
  {
    id: 'seed-3',
    nick: '카페유목민',
    gu: '서울 마포구',
    time: '12분 전',
    story: '4시간 작업한 파일을 저장 안 하고 껐습니다.',
    cheers: 187,
    forgets: 203,
  },
  {
    id: 'seed-4',
    nick: '중랑비둘기',
    gu: '서울 중랑구',
    time: '18분 전',
    story: '택배가 3일째 "배송 중"입니다. 안에 아이스크림이 있습니다.',
    cheers: 96,
    forgets: 41,
  },
  {
    id: 'seed-5',
    nick: '작심삼일러',
    gu: '서울 송파구',
    time: '25분 전',
    story: '헬스장 1년 등록한 날, 헬스장이 폐업 공지를 올렸습니다.',
    cheers: 428,
    forgets: 92,
  },
  {
    id: 'seed-6',
    nick: '벼락치기장인',
    gu: '서울 관악구',
    time: '31분 전',
    story: '시험 범위가 어제 바뀐 걸 시험장에서 알았습니다.',
    cheers: 265,
    forgets: 118,
  },
];

/** 7초마다 "방금"으로 들어오는 실시간 유입 시뮬레이션 풀. */
export const INFLOW_POOL: Omit<FeedCard, 'id' | 'time'>[] = [
  {
    nick: '야근요정',
    gu: '서울 강남구',
    story: '퇴근 10분 전에 "잠깐 회의 가능?" 메시지가 왔습니다.',
    cheers: 3,
    forgets: 1,
  },
  {
    nick: '지옥철생존자',
    gu: '서울 영등포구',
    story: '지하철에서 내릴 역을 세 번 연속 지나쳤습니다.',
    cheers: 8,
    forgets: 2,
  },
  {
    nick: '무야호아님',
    gu: '서울 송파구',
    story: '기다리던 택배가 옆집으로 배송 완료됐습니다.',
    cheers: 5,
    forgets: 0,
  },
  {
    nick: '커피수혈중',
    gu: '서울 마포구',
    story: '아이스 아메리카노를 노트북 위에 쏟았습니다.',
    cheers: 12,
    forgets: 4,
  },
];

export const CARD_REACTIONS = ['눈물의 위로', '토닥토닥', '커피 한 잔', '월급 기운'];
