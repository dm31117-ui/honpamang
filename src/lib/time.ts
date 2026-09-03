/** 피드 카드에 붙는 "방금 · 7분 전" 표기. */
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '방금';

  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;

  const day = Math.floor(hour / 24);
  return day < 7 ? `${day}일 전` : `${Math.floor(day / 7)}주 전`;
}
