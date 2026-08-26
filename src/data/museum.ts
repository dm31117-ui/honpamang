export type Grade = '국보' | '보물' | '일반';
export type Hall = '자연재해관' | '언어재해관' | '순수망각관' | '직장대참사관';

export const REACTION_KEYS = ['국보급 참사', '순수 파괴', '멘탈 바사삭', '자진 망각'] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

export interface MuseumItem {
  id: number;
  no: string;
  title: string;
  nick: string;
  gu: string;
  era: string;
  cat: Hall;
  comment: string;
  counts: Record<ReactionKey, number>;
}

export const GRADE_TABS: ('전체' | Grade)[] = ['전체', '국보', '보물', '일반'];
export const HALL_TABS: ('전체' | Hall)[] = [
  '전체',
  '자연재해관',
  '언어재해관',
  '순수망각관',
  '직장대참사관',
];
export const SUBMIT_HALLS: Hall[] = ['자연재해관', '언어재해관', '순수망각관', '직장대참사관'];

/** 반응 수 합계로 등급이 자동 결정된다. */
export function gradeOf(total: number): Grade {
  return total >= 1000 ? '국보' : total >= 300 ? '보물' : '일반';
}

export function totalOf(item: MuseumItem): number {
  return Object.values(item.counts).reduce((a, b) => a + b, 0);
}

export function gradeStyle(grade: Grade): { background: string; color: string } {
  if (grade === '국보') return { background: '#111111', color: '#FFFFFF' };
  if (grade === '보물') return { background: '#FFEDE7', color: '#D6431F' };
  return { background: '#F3F3F0', color: '#8C8C8C' };
}

export const SEED_ITEMS: MuseumItem[] = [
  {
    id: 1,
    no: '제1호',
    title: '재택 회의에 고양이가 난입해 보고서를 다 지웠습니다',
    nick: '망붕이',
    gu: '마포구',
    era: '오늘',
    cat: '직장대참사관',
    comment: '고양이는 무죄. 저장하지 않은 자의 업보만이 남았다.',
    counts: { '국보급 참사': 1204, '순수 파괴': 320, '멘탈 바사삭': 455, '자진 망각': 98 },
  },
  {
    id: 2,
    no: '제2003-0412호',
    title: '전자레인지 20분 돌린 삼각김밥의 몰락',
    nick: '요리보고조리봐',
    gu: '강서구',
    era: '오늘',
    cat: '자연재해관',
    comment: '삼각김밥은 죽어서 숯을 남겼습니다.',
    counts: { '국보급 참사': 812, '순수 파괴': 240, '멘탈 바사삭': 155, '자진 망각': 44 },
  },
  {
    id: 3,
    no: '제2003-0398호',
    title: "팀 단톡에 보낸 '오늘 야근 실화냐' — 받는 사람이 팀장님이었습니다",
    nick: '전송취소는없다',
    gu: '성동구',
    era: '오늘',
    cat: '언어재해관',
    comment: '이건 언어가 아니라 사직서입니다.',
    counts: { '국보급 참사': 566, '순수 파괴': 120, '멘탈 바사삭': 380, '자진 망각': 77 },
  },
  {
    id: 4,
    no: '제2003-0377호',
    title: '우산을 3일 연속 카페에 두고 왔습니다. 각각 다른 카페입니다.',
    nick: '기억력제로',
    gu: '마포구',
    era: '이번 주',
    cat: '순수망각관',
    comment: '서울 카페 우산 분포도에 기여하신 공로.',
    counts: { '국보급 참사': 132, '순수 파괴': 18, '멘탈 바사삭': 210, '자진 망각': 340 },
  },
  {
    id: 5,
    no: '제2003-0351호',
    title: '발표 자료 최종_진짜최종_이게진짜.pptx를 열었는데 초안이었습니다',
    nick: '파일이름장인',
    gu: '영등포구',
    era: '이번 주',
    cat: '직장대참사관',
    comment: '버전 관리의 순교자.',
    counts: { '국보급 참사': 566, '순수 파괴': 120, '멘탈 바사삭': 380, '자진 망각': 77 },
  },
  {
    id: 6,
    no: '제2003-0349호',
    title: '라면에 물 대신 식초를 부었습니다. 끝까지 먹었습니다.',
    nick: '미각실종',
    gu: '관악구',
    era: '이번 주',
    cat: '자연재해관',
    comment: '인간 승리인가, 미각의 패배인가.',
    counts: { '국보급 참사': 289, '순수 파괴': 402, '멘탈 바사삭': 156, '자진 망각': 45 },
  },
  {
    id: 7,
    no: '제2003-0322호',
    title: '비밀번호를 바꾸고 3분 만에 잊었습니다',
    nick: '초기화인생',
    gu: '송파구',
    era: '지난주',
    cat: '순수망각관',
    comment: '보안은 완벽해졌다. 본인에게조차.',
    counts: { '국보급 참사': 98, '순수 파괴': 12, '멘탈 바사삭': 167, '자진 망각': 210 },
  },
  {
    id: 8,
    no: '제2003-0301호',
    title: '"수고하세요"를 "수고하세여"로 보낸 첫 거래처 메일',
    nick: '경어체수련생',
    gu: '중구',
    era: '지난주',
    cat: '언어재해관',
    comment: '여운이 남는 마무리였다.',
    counts: { '국보급 참사': 154, '순수 파괴': 20, '멘탈 바사삭': 240, '자진 망각': 66 },
  },
];
