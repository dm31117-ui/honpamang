/** localStorage 래퍼 — 프라이빗 모드/차단 환경에서도 조용히 넘어간다. */

const PROFILE_KEY = 'honpamang.profile';
const SOS_KEY = 'honpamang.sosToday.v2';

export interface Profile {
  nick: string;
  gu: string;
}

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Profile>;
    if (!p || (!p.nick && !p.gu)) return null;
    return { nick: p.nick ?? '', gu: p.gu ?? '' };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function today(): string {
  return new Date().toDateString();
}

/** 날짜가 바뀌었으면 0으로 리셋된 오늘 카운트. */
export function loadSosToday(): number {
  try {
    const raw = localStorage.getItem(SOS_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as { day?: string; count?: number };
    return saved?.day === today() ? (saved.count ?? 0) : 0;
  } catch {
    return 0;
  }
}

export function saveSosToday(count: number): void {
  try {
    localStorage.setItem(SOS_KEY, JSON.stringify({ day: today(), count }));
  } catch {
    /* ignore */
  }
}
