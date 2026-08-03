"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CalendarView } from "@/components/calendar-view";
import { Composer, type Draft } from "@/components/composer";
import { EntryItem, type EntryPatch } from "@/components/entry-item";
import { StatusBar } from "@/components/status-bar";
import { todayKey } from "@/lib/date";
import { clearCache, readCache, writeCache } from "@/lib/entry-cache";
import { ENTRY_KINDS, KIND_LABELS, collectTags, type Entry, type EntryKind } from "@/lib/entries";
import { createClient } from "@/lib/supabase/client";
import { buildStatus, collectDays } from "@/lib/xp";
import { clearXpCache, mergeDays, readDays, writeDays } from "@/lib/xp-cache";

const supabase = createClient();

type View = EntryKind | "all";
/** 一覧とカレンダーは絞り込みではなく見方そのものが違うので、画面を分ける。 */
type Mode = "list" | "calendar";

export function HomeScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(() => readCache() ?? []);
  // 端末に貯めてある日ごとの経験値。読み込みの窓から外れた古い分をここで支える
  const [storedDays] = useState(() => readDays());
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [view, setView] = useState<View>("all");
  const [mode, setMode] = useState<Mode>("list");
  const [showDone, setShowDone] = useState(false);
  /** 絞り込みに使っているタグ。空なら絞り込まない */
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** 一覧を保持し、同じ内容を端末にも控える。 */
  const commit = useCallback((next: Entry[]) => {
    setEntries(next);
    writeCache(next);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      // getSession は手元の cookie を読むだけなので通信が発生しない
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }
      if (!alive) return;
      setUserId(session.user.id);

      const { data, error: fetchError } = await supabase
        .from("entries")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(500);

      if (!alive) return;
      if (fetchError) {
        setError(`読み込めんかった: ${fetchError.message}`);
      } else if (data) {
        commit(data);
      }
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [router, commit]);

  /** 画面を先に更新し、DB 側が失敗したら元に戻す。 */
  async function apply(next: Entry[], run: () => Promise<{ error: unknown }>) {
    const previous = entries;
    commit(next);
    setError(null);

    const { error: writeError } = await run();
    if (writeError) {
      commit(previous);
      setError(
        `保存できひんかった: ${
          writeError instanceof Error ? writeError.message : String(writeError)
        }`,
      );
    }
  }

  function handleCreate(draft: Draft) {
    if (draft.kind === "work" && draft.dueOn) {
      handleWorkLog(draft.dueOn, draft.minutes ?? 0, draft.body);
      return;
    }

    const now = new Date().toISOString();
    const entry: Entry = {
      // id を手元で決めておくと、保存後に差し替える必要がない
      id: crypto.randomUUID(),
      user_id: userId,
      kind: draft.kind,
      body: draft.body,
      tags: draft.tags,
      done: false,
      done_at: null,
      due_on: draft.dueOn,
      minutes: null,
      archived: false,
      created_at: now,
      updated_at: now,
    };

    void apply([entry, ...entries], async () =>
      supabase.from("entries").insert({
        id: entry.id,
        kind: entry.kind,
        body: entry.body,
        tags: entry.tags,
        due_on: entry.due_on,
        created_at: now,
      }),
    );
  }

  /**
   * 勤務は1日1件。同じ日をもう一度記録したら、新しく作らずに時間を差し替える。
   * 添え書きは空で出されたときだけ前のものを残す。消したいときは編集から消せる。
   */
  function handleWorkLog(day: string, minutes: number, memo: string) {
    const existing = entries.find((item) => item.kind === "work" && item.due_on === day);

    if (existing) {
      const body = memo || existing.body;
      const next = entries.map((item) =>
        item.id === existing.id ? { ...item, minutes, body } : item,
      );
      void apply(next, async () =>
        supabase.from("entries").update({ minutes, body }).eq("id", existing.id),
      );
      return;
    }

    const now = new Date().toISOString();
    const entry: Entry = {
      id: crypto.randomUUID(),
      user_id: userId,
      kind: "work",
      body: memo,
      tags: [],
      done: false,
      done_at: null,
      due_on: day,
      minutes,
      archived: false,
      created_at: now,
      updated_at: now,
    };

    void apply([entry, ...entries], async () =>
      supabase.from("entries").insert({
        id: entry.id,
        kind: entry.kind,
        body: entry.body,
        due_on: entry.due_on,
        minutes: entry.minutes,
        created_at: now,
      }),
    );
  }

  function handleToggle(id: string, done: boolean) {
    const next = entries.map((item) =>
      item.id === id
        ? { ...item, done, done_at: done ? new Date().toISOString() : null }
        : item,
    );
    void apply(next, async () => supabase.from("entries").update({ done }).eq("id", id));
  }

  function handleUpdate(id: string, patch: EntryPatch) {
    const next = entries.map((item) => (item.id === id ? { ...item, ...patch } : item));
    void apply(next, async () => supabase.from("entries").update(patch).eq("id", id));
  }

  function handleDelete(id: string) {
    void apply(
      entries.filter((item) => item.id !== id),
      async () => supabase.from("entries").delete().eq("id", id),
    );
  }

  async function handleSignOut() {
    // 再ログインにはメールの送信が要り、その回数には制限がある。
    // 上部の小さなボタンを誤って触ったときの被害が大きいので一度止める。
    if (!window.confirm("ログアウトする？ 次に入るときはメールのリンクが要る。")) {
      return;
    }
    await supabase.auth.signOut();
    clearCache();
    clearXpCache();
    router.replace("/login");
  }

  const knownTags = useMemo(() => collectTags(entries), [entries]);

  /** 押されたタグを絞り込みに足す・外す。 */
  function toggleTag(tag: string) {
    setPicked((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  // 経験値は保存せず、手元の記録から毎回組み立てる。
  // 貯めてある日ごとの分と重ねてから数えるので、古い記録が窓から外れても目減りしない。
  const merged = useMemo(() => mergeDays(storedDays, collectDays(entries)), [storedDays, entries]);
  const status = useMemo(() => buildStatus(merged, todayKey()), [merged]);

  useEffect(() => {
    writeDays(merged);
  }, [merged]);

  // 絞り込みは手元のデータで完結するので通信が発生しない
  const undone = entries.filter((item) => showDone || !item.done);
  // 勤務は毎日1件ずつ増えるので「すべて」には混ぜない。書いたものが押し流されてしまう。
  // 記録できたかどうかは上のレベル表示がその場で動くので、そちらで分かる。
  const byKind = undone.filter((item) =>
    view === "all" ? item.kind !== "work" : item.kind === view,
  );
  // タグは重ねるほど狭くなる。複数選んだら、その全部が付いているものだけ残す
  const visible = byKind.filter((item) => picked.every((tag) => item.tags.includes(tag)));

  // 出す候補は、いま見ている種類の中にあるタグだけ。
  // 選んでも何も出てこないタグを並べても、選ぶ手がかりにならない。
  // ただし選んである分は必ず残す。種類を切り替えた拍子に候補から消えると、
  // 絞り込みが効いたまま外す手立てがなくなってしまう。
  const tagChoices = [...new Set([...picked, ...collectTags(byKind)])];

  const tabs: { key: View; label: string }[] = [
    { key: "all", label: "すべて" },
    ...ENTRY_KINDS.map((kind) => ({ key: kind as View, label: KIND_LABELS[kind] })),
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6">
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Life Hub</h1>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setMode(mode === "calendar" ? "list" : "calendar")}
            className={
              mode === "calendar"
                ? "rounded-full bg-accent px-3 py-1 font-medium text-accent-contrast"
                : "rounded-full px-3 py-1 text-muted transition-colors hover:text-foreground"
            }
          >
            {mode === "calendar" ? "一覧へ" : "カレンダー"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-muted hover:text-foreground"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* レベルはどの見方でも見えるようにしておく */}
      <StatusBar status={status} />

      {mode === "calendar" ? (
        // カレンダーは入力欄を挟まず画面の先頭に置く。
        // 日を選んだときに、その日の中身がそのまま下に続いて見えるようにするため。
        <CalendarView
          entries={undone}
          days={status.days}
          onToggle={handleToggle}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : (
        <>
          <Composer onSubmit={handleCreate} knownTags={knownTags} error={error} />

          <nav className="mt-6 flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key)}
                aria-current={view === tab.key ? "page" : undefined}
                className={
                  view === tab.key
                    ? "rounded-full bg-surface px-3 py-1 text-sm font-medium ring-1 ring-border"
                    : "rounded-full px-3 py-1 text-sm text-muted transition-colors hover:text-foreground"
                }
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowDone((value) => !value)}
              className="ml-auto text-xs text-muted underline transition-colors hover:text-foreground"
            >
              {showDone ? "完了を隠す" : "完了も見る"}
            </button>
          </nav>

          {tagChoices.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {tagChoices.map((tag) => {
                const on = picked.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={on}
                    className={
                      on
                        ? "rounded-full bg-accent px-2 py-0.5 text-xs text-accent-contrast"
                        : "rounded-full bg-surface px-2 py-0.5 text-xs text-muted ring-1 ring-border transition-colors hover:text-foreground"
                    }
                  >
                    #{tag}
                  </button>
                );
              })}
              {picked.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked([])}
                  className="ml-auto text-xs text-muted underline transition-colors hover:text-foreground"
                >
                  絞り込みを外す
                </button>
              )}
            </div>
          )}

          {visible.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {visible.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onTagClick={toggleTag}
                  activeTags={picked}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-10 text-center text-sm text-muted">
              {!ready
                ? "読み込み中…"
                : picked.length > 0
                  ? "この絞り込みに当たるものがない。"
                  : "まだ何もない。上の欄に思いついたことから書いてみて。"}
            </p>
          )}
        </>
      )}
    </main>
  );
}
