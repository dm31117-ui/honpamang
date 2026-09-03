/**
 * 실시간 보드의 데이터 접근층 — Supabase 테이블 두 개(`sos_presses`, `posts`)를
 * 감싼다. React에 붙이는 쪽은 `useLiveBoard`다.
 *
 * Supabase가 설정돼 있지 않으면 모든 읽기는 빈 값, 모든 쓰기는 조용한 no-op이
 * 되어 앱이 기존의 로컬 동작으로 떨어진다.
 */
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** 누군가 SOS를 누른 사건. 카운트 +1과 화면 이펙트를 함께 만든다. */
export interface SosPress {
  id: number;
  region: string | null;
}

export interface LivePost {
  id: string;
  nick: string;
  region: string;
  story: string;
  cheers: number;
  forgets: number;
  createdAt: string;
}

export type ReactionKind = 'cheer' | 'forget';

/** 피드에 한 번에 들고 있는 최대 개수. */
export const POST_LIMIT = 30;

interface PostRow {
  id: string;
  nick: string;
  region: string;
  story: string;
  cheers: number;
  forgets: number;
  created_at: string;
}

function toPost(row: PostRow): LivePost {
  return {
    id: row.id,
    nick: row.nick,
    region: row.region,
    story: row.story,
    cheers: row.cheers,
    forgets: row.forgets,
    createdAt: row.created_at,
  };
}

/** 오늘(KST) 전국 SOS 카운트. 실패하면 null — 호출한 쪽이 기존 값을 유지한다. */
export async function fetchSosToday(): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('sos_today');
  if (error || data == null) return null;
  return Number(data);
}

export async function fetchPosts(): Promise<LivePost[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('posts')
    .select('id,nick,region,story,cheers,forgets,created_at')
    .order('created_at', { ascending: false })
    .limit(POST_LIMIT);
  if (error || !data) return null;
  return (data as PostRow[]).map(toPost);
}

/**
 * SOS 프레스 1건 기록. 성공하면 모든 접속자에게 INSERT 이벤트가 퍼진다.
 * 돌려받은 id로 "내가 누른 것"과 "남이 누른 것"을 구분한다.
 */
export async function pressSos(region: string | null): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sos_presses')
    .insert({ region })
    .select('id')
    .single();
  if (error || !data) return null;
  return (data as { id: number }).id;
}

export async function createPost(input: {
  nick: string;
  region: string;
  story: string;
}): Promise<LivePost | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('posts')
    .insert(input)
    .select('id,nick,region,story,cheers,forgets,created_at')
    .single();
  if (error || !data) return null;
  return toPost(data as PostRow);
}

export async function reactToPost(id: string, kind: ReactionKind): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc('react_post', { post_id: id, kind });
  return !error;
}

export interface LiveHandlers {
  onPress: (press: SosPress) => void;
  onPost: (post: LivePost) => void;
  onPostUpdate: (post: LivePost) => void;
  /** 채널 상태 변화. 연결되면 끊긴 동안 놓친 것을 다시 읽어올 신호이기도 하다. */
  onStatus: (connected: boolean) => void;
  /** 지금 같이 보고 있는 사람 수. */
  onPresence: (count: number) => void;
}

/**
 * 실시간 채널 하나에 프레스·상황·접속자를 모두 태운다.
 * 반환값을 호출하면 구독이 해제된다. Supabase가 없으면 no-op.
 */
export function subscribeLive(handlers: LiveHandlers): () => void {
  if (!supabase) return () => {};
  const client = supabase;

  const channel: RealtimeChannel = client
    .channel('honpamang-board')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sos_presses' },
      (payload) => {
        const row = payload.new as { id: number; region: string | null };
        handlers.onPress({ id: row.id, region: row.region ?? null });
      },
    )
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
      handlers.onPost(toPost(payload.new as PostRow));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
      handlers.onPostUpdate(toPost(payload.new as PostRow));
    })
    .on('presence', { event: 'sync' }, () => {
      handlers.onPresence(Object.keys(channel.presenceState()).length);
    });

  channel.subscribe((status) => {
    const connected = status === 'SUBSCRIBED';
    handlers.onStatus(connected);
    if (connected) void channel.track({ at: Date.now() });
  });

  return () => {
    void client.removeChannel(channel);
  };
}
