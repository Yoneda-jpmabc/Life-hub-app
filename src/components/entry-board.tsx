"use client";

import { useOptimistic, useState, type ReactNode } from "react";

import { createEntry, deleteEntry, toggleDone, updateBody } from "@/app/actions";
import { Composer } from "@/components/composer";
import { EntryItem } from "@/components/entry-item";
import { extractTags, isEntryKind, type Entry, type EntryKind } from "@/lib/entries";

type Patch =
  | { type: "create"; entry: Entry }
  | { type: "toggle"; id: string; done: boolean }
  | { type: "update"; id: string; body: string }
  | { type: "delete"; id: string };

/** サーバーが採番する前の仮の1件。revalidate で本物に差し替わる。 */
function draft(body: string, kind: EntryKind, userId: string): Entry {
  const now = new Date().toISOString();
  return {
    id: `draft-${crypto.randomUUID()}`,
    user_id: userId,
    kind,
    body,
    tags: extractTags(body),
    done: false,
    done_at: null,
    due_at: null,
    archived: false,
    created_at: now,
    updated_at: now,
  };
}

export function EntryBoard({
  entries,
  view,
  showDone,
  userId,
  filters,
}: {
  entries: Entry[];
  view?: EntryKind;
  showDone: boolean;
  userId: string;
  filters: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);

  // サーバーの返事を待たずに画面を先に動かす。
  // 失敗しても revalidate 後の実データで上書きされる。
  const [items, patch] = useOptimistic(entries, (state: Entry[], action: Patch) => {
    switch (action.type) {
      case "create":
        return [action.entry, ...state];
      case "toggle":
        return state
          .map((item) => (item.id === action.id ? { ...item, done: action.done } : item))
          .filter((item) => showDone || !item.done);
      case "update":
        return state.map((item) =>
          item.id === action.id
            ? { ...item, body: action.body, tags: extractTags(action.body) }
            : item,
        );
      case "delete":
        return state.filter((item) => item.id !== action.id);
    }
  });

  async function handleCreate(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) {
      setError("何か書いてから保存してな");
      return;
    }

    const kindValue = formData.get("kind");
    const kind = isEntryKind(kindValue) ? kindValue : "note";

    // 表示中の絞り込みに合う場合だけ先出しする
    if (!view || view === kind) {
      patch({ type: "create", entry: draft(body, kind, userId) });
    }
    setError(null);

    const result = await createEntry(formData);
    if (result.error) setError(result.error);
  }

  async function handleToggle(formData: FormData) {
    patch({
      type: "toggle",
      id: String(formData.get("id") ?? ""),
      done: formData.get("done") === "true",
    });
    await toggleDone(formData);
  }

  async function handleUpdate(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    patch({ type: "update", id: String(formData.get("id") ?? ""), body });
    await updateBody(formData);
  }

  async function handleDelete(formData: FormData) {
    patch({ type: "delete", id: String(formData.get("id") ?? "") });
    await deleteEntry(formData);
  }

  return (
    <>
      <Composer action={handleCreate} error={error} />
      {filters}
      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-sm text-muted">
          まだ何もない。上の欄に思いついたことから書いてみて。
        </p>
      )}
    </>
  );
}
