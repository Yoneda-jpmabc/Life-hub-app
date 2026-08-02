-- 予定は「日」で扱う。時刻付きだと時差の解釈で取り違えが起きるため。
alter table public.entries add column due_on date;

comment on column public.entries.due_on is 'カレンダーに並べる日。未設定なら日付を持たない項目';

-- due_at は全行 null のまま使われていないので落とす
drop index if exists entries_open_tasks_idx;
alter table public.entries drop column due_at;

-- カレンダー表示のための索引
create index entries_due_on_idx on public.entries (user_id, due_on)
  where due_on is not null and not archived;

-- 未完了タスクを期限順に取り出すための索引
create index entries_open_tasks_idx on public.entries (user_id, due_on)
  where kind = 'task' and not done and not archived;
