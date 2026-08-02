-- 中核テーブル: 思考・メモ・タスクを1つのテーブルで受け止める
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null default 'note' check (kind in ('thought', 'note', 'task')),
  body text not null check (length(btrim(body)) > 0),
  tags text[] not null default '{}',
  done boolean not null default false,
  done_at timestamptz,
  due_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.entries is '思考・メモ・タスクを一元的に保持する中核テーブル';
comment on column public.entries.kind is 'thought=考えてること, note=メモ, task=タスク';

-- 自分の行だけ読み書きできるようにする
alter table public.entries enable row level security;

create policy "entries_select_own" on public.entries
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "entries_insert_own" on public.entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "entries_update_own" on public.entries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "entries_delete_own" on public.entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 一覧表示と未完了タスク抽出のための索引
create index entries_user_created_idx on public.entries (user_id, created_at desc);

create index entries_open_tasks_idx on public.entries (user_id, due_at)
  where kind = 'task' and not done and not archived;

create index entries_tags_idx on public.entries using gin (tags);

-- updated_at と done_at を自動で面倒みる
create or replace function public.touch_entry()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.done and not coalesce(old.done, false) then
    new.done_at := now();
  elsif not new.done then
    new.done_at := null;
  end if;
  return new;
end;
$$;

create trigger entries_touch
  before update on public.entries
  for each row execute function public.touch_entry();
