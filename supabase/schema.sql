-- 혼파망 실시간 동기화 스키마
--
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣고 한 번 실행하면 된다.
-- 익명 접속(anon 키)만 쓰므로 로그인 개념이 없다. 방어선은 전부 RLS와
-- 컬럼 제약이고, anon 키가 공개되는 것은 설계상 정상이다.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- SOS 프레스 — 누군가 버튼을 누를 때마다 한 줄.
-- TODAY 카운트는 이 테이블의 오늘(KST) 행 수이고,
-- INSERT 실시간 이벤트가 다른 접속자 화면의 비명 이펙트를 띄운다.
-- ---------------------------------------------------------------------------
create table if not exists public.sos_presses (
  id bigint generated always as identity primary key,
  -- "{시도} {구·군}" 라벨. 지역을 안 밝히고 누르면 null.
  region text check (region is null or char_length(region) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists sos_presses_created_at_idx on public.sos_presses (created_at desc);

alter table public.sos_presses enable row level security;

drop policy if exists "sos_presses read" on public.sos_presses;
create policy "sos_presses read" on public.sos_presses for select to anon, authenticated using (true);

drop policy if exists "sos_presses insert" on public.sos_presses;
create policy "sos_presses insert" on public.sos_presses
  for insert to anon, authenticated
  with check (region is null or char_length(region) <= 40);

-- ---------------------------------------------------------------------------
-- 비상벨 상황 (피드 + 지도 핀)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  nick text not null check (char_length(nick) between 1 and 20),
  -- 표기 겸 지도 좌표 조회 키인 "{시도} {구·군}" 라벨.
  region text not null check (char_length(region) between 1 and 40),
  story text not null check (char_length(story) between 1 and 200),
  cheers integer not null default 0 check (cheers >= 0),
  forgets integer not null default 0 check (forgets >= 0),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_region_idx on public.posts (region);

alter table public.posts enable row level security;

drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select to anon, authenticated using (true);

-- 반응 수는 아래 react_post()로만 오른다. 등록은 0에서 시작해야 한다.
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts
  for insert to anon, authenticated
  with check (cheers = 0 and forgets = 0);

-- ---------------------------------------------------------------------------
-- 오늘(KST) 전국 SOS 카운트
-- ---------------------------------------------------------------------------
create or replace function public.sos_today()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.sos_presses
  where created_at >= (date_trunc('day', now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul';
$$;

grant execute on function public.sos_today() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 위로 · 절망 반응. 클라이언트가 임의 값을 쓰지 못하게 +1만 열어둔다.
-- ---------------------------------------------------------------------------
create or replace function public.react_post(post_id uuid, kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if kind not in ('cheer', 'forget') then
    raise exception 'unknown reaction: %', kind;
  end if;

  update public.posts
  set cheers = cheers + (case when kind = 'cheer' then 1 else 0 end),
      forgets = forgets + (case when kind = 'forget' then 1 else 0 end)
  where id = post_id;
end;
$$;

grant execute on function public.react_post(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 오래된 프레스 정리 — 카운트는 오늘 것만 쓰므로 3일이면 충분하다.
-- pg_cron을 켰다면 아래 스케줄을 함께 걸어두면 테이블이 무한정 자라지 않는다.
--   select cron.schedule('honpamang-prune', '0 3 * * *', $$select public.prune_sos_presses()$$);
-- ---------------------------------------------------------------------------
create or replace function public.prune_sos_presses()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sos_presses where created_at < now() - interval '3 days';
$$;

-- ---------------------------------------------------------------------------
-- 실시간 발행 대상 등록. posts는 반응 수 변경(UPDATE)도 흘려보내야 하므로
-- 이전 행이 함께 오도록 replica identity를 full로 둔다.
-- ---------------------------------------------------------------------------
alter table public.posts replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sos_presses'
  ) then
    alter publication supabase_realtime add table public.sos_presses;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;
