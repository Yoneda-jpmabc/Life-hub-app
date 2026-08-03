-- 勤務時間を記録できるようにする。
-- 経験値は entries から毎回計算する方針なので、経験値そのものは保存しない。
-- 数え方を変えたときに、過去の記録まで新しい数え方で数え直せるようにするため。

-- 種類を1つ増やす。日ごとの勤務記録も entries に入れて、
-- カレンダーや一覧の仕組みをそのまま使い回す。
alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('thought', 'note', 'task', 'work'));

comment on column public.entries.kind is
  'thought=考えてること, note=メモ, task=タスク, work=その日の勤務';

-- 勤務記録は本文が要らない。書きたい日だけ一言添える。
alter table public.entries alter column body set default '';
alter table public.entries drop constraint if exists entries_body_check;
alter table public.entries add constraint entries_body_check
  check (kind = 'work' or length(btrim(body)) > 0);

-- 分で持つ。時間を小数で持つと 7.5 と 7.50 のような揺れが出る。
alter table public.entries add column minutes integer
  check (minutes is null or (minutes >= 0 and minutes <= 1440));

comment on column public.entries.minutes is '勤務記録のはたらいた分。work 以外では null';

-- 勤務記録は「いつの分か」と「何分か」がないと意味を持たない
alter table public.entries add constraint entries_work_shape check (
  kind <> 'work' or (minutes is not null and due_on is not null)
);

-- 1日1件。同じ日を2回記録したら上書きになるようにする
create unique index entries_work_day_idx on public.entries (user_id, due_on)
  where kind = 'work';

-- 片付けたタスクを日ごとに数えるための索引
create index entries_done_tasks_idx on public.entries (user_id, done_at desc)
  where kind = 'task' and done;
