/**
 * 실시간 보드 상태 — 전국 SOS 카운트 · 공유 피드 · 접속자 수를 한 곳에서 들고 있다.
 *
 * Supabase가 설정돼 있으면 모든 접속자가 같은 숫자와 같은 글을 본다.
 * 설정이 없으면 `enabled: false`로 떨어지고 카운트는 예전처럼 localStorage에
 * 저장되는 내 기록이 된다 — 로컬 개발과 프리뷰가 그대로 돌게 하기 위해서다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_ENABLED } from './supabase';
import {
  createPost,
  fetchPosts,
  fetchSosToday,
  pressSos,
  POST_LIMIT,
  reactToPost,
  subscribeLive,
  type LivePost,
  type ReactionKind,
} from './live';
import { loadSosToday, saveSosToday } from './storage';

/** 화면 이펙트를 띄우기 위해 전달되는 프레스 사건. */
export interface PressEvent {
  /** 내가 누른 것인가. 남의 비명은 더 작고 흐리게 그린다. */
  mine: boolean;
  region: string | null;
}

interface Options {
  /** 누군가(나 포함) SOS를 눌렀을 때. */
  onPress?: (press: PressEvent) => void;
}

/** 끊겼다 붙었을 때를 대비한 정기 재동기화 주기. */
const RECONCILE_INTERVAL = 60_000;

export interface LiveBoard {
  /** 실시간 백엔드가 붙어 있는가 */
  enabled: boolean;
  /** 지금 채널이 연결돼 있는가 */
  connected: boolean;
  /** 같이 보고 있는 사람 수 (0이면 표시하지 않는다) */
  online: number;
  sosToday: number;
  posts: LivePost[];
  press: (region: string | null) => void;
  publish: (input: { nick: string; region: string; story: string }) => Promise<LivePost | null>;
  react: (id: string, kind: ReactionKind) => void;
}

export function useLiveBoard({ onPress }: Options = {}): LiveBoard {
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(0);
  const [sosToday, setSosToday] = useState(0);
  const [posts, setPosts] = useState<LivePost[]>([]);

  // 콜백은 매 렌더 바뀌므로 ref로 받는다. 구독을 다시 걸 이유가 되면 안 된다.
  const pressRef = useRef(onPress);
  pressRef.current = onPress;

  /** 내가 방금 넣은 프레스 id — 되돌아오는 이벤트를 내 것으로 알아본다. */
  const mine = useRef(new Set<number>());

  // 오프라인 모드: 예전처럼 내 오늘 기록을 복원한다.
  useEffect(() => {
    if (!LIVE_ENABLED) setSosToday(loadSosToday());
  }, []);

  const reconcile = useCallback(async () => {
    const [count, list] = await Promise.all([fetchSosToday(), fetchPosts()]);
    if (count !== null) setSosToday(count);
    if (list !== null) setPosts(list);
  }, []);

  useEffect(() => {
    if (!LIVE_ENABLED) return;

    void reconcile();

    const stop = subscribeLive({
      onPress: ({ id, region }) => {
        setSosToday((c) => c + 1);
        const isMine = mine.current.delete(id);
        pressRef.current?.({ mine: isMine, region });
      },
      onPost: (post) => {
        setPosts((prev) =>
          prev.some((p) => p.id === post.id) ? prev : [post, ...prev].slice(0, POST_LIMIT),
        );
      },
      onPostUpdate: (post) => {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      },
      onStatus: (ok) => {
        setConnected(ok);
        if (ok) void reconcile();
      },
      onPresence: setOnline,
    });

    const timer = setInterval(() => void reconcile(), RECONCILE_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reconcile();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stop();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      setConnected(false);
    };
  }, [reconcile]);

  const press = useCallback((region: string | null) => {
    if (!LIVE_ENABLED) {
      // 백엔드가 없으면 내 기록만 올리고 이펙트는 즉시 띄운다.
      setSosToday((c) => {
        const next = c + 1;
        saveSosToday(next);
        return next;
      });
      pressRef.current?.({ mine: true, region });
      return;
    }
    // 카운트와 이펙트는 서버가 돌려주는 INSERT 이벤트에서 한 번에 처리한다.
    // 여기서 미리 올리면 이벤트가 돌아올 때 두 번 세어진다.
    void pressSos(region).then((id) => {
      if (id !== null) {
        mine.current.add(id);
        return;
      }
      // 서버에 닿지 못했다. 카운트는 그대로 두되, 버튼은 반응해야 한다.
      pressRef.current?.({ mine: true, region });
    });
  }, []);

  const publish = useCallback(async (input: { nick: string; region: string; story: string }) => {
    if (!LIVE_ENABLED) return null;
    const post = await createPost(input);
    if (post) {
      setPosts((prev) =>
        prev.some((p) => p.id === post.id) ? prev : [post, ...prev].slice(0, POST_LIMIT),
      );
    }
    return post;
  }, []);

  const react = useCallback((id: string, kind: ReactionKind) => {
    if (!LIVE_ENABLED) return;
    // 낙관적 반영 — 서버 UPDATE 이벤트가 오면 그 값으로 덮인다.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              cheers: p.cheers + (kind === 'cheer' ? 1 : 0),
              forgets: p.forgets + (kind === 'forget' ? 1 : 0),
            }
          : p,
      ),
    );
    void reactToPost(id, kind);
  }, []);

  return { enabled: LIVE_ENABLED, connected, online, sosToday, posts, press, publish, react };
}
