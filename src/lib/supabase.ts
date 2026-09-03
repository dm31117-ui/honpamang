/**
 * Supabase 클라이언트 — 실시간 동기화(전국 SOS 카운트 · 공유 피드)의 백엔드.
 *
 * 환경변수 두 개가 모두 있을 때만 켜진다. 비어 있으면 `client`가 null이고,
 * 앱은 로컬 상태 + 시뮬레이션으로만 도는 기존 동작을 유지한다.
 * anon 키는 브라우저에 노출되는 것이 정상이며, 실제 방어선은 RLS다
 * (`supabase/schema.sql` 참고).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false },
        // 비상벨이 몰려도 브라우저가 초당 20건 넘게는 그리지 않아도 된다.
        realtime: { params: { eventsPerSecond: 20 } },
      })
    : null;

/** 실시간 동기화가 켜져 있는가. */
export const LIVE_ENABLED = supabase !== null;
