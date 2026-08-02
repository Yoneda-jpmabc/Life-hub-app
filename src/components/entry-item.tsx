"use client";

import { useState } from "react";

import { KIND_LABELS, isEntryKind, type Entry } from "@/lib/entries";
import { formatStamp } from "@/lib/format";

type Handler = (formData: FormData) => Promise<void>;

export function EntryItem({
  entry,
  onToggle,
  onUpdate,
  onDelete,
}: {
  entry: Entry;
  onToggle: Handler;
  onUpdate: Handler;
  onDelete: Handler;
}) {
  const [editing, setEditing] = useState(false);
  const kindLabel = isEntryKind(entry.kind) ? KIND_LABELS[entry.kind] : entry.kind;

  return (
    <li className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        {entry.kind === "task" && (
          <form action={onToggle} className="pt-0.5">
            <input type="hidden" name="id" value={entry.id} />
            <input type="hidden" name="done" value={String(!entry.done)} />
            <button
              type="submit"
              aria-label={entry.done ? "未完了に戻す" : "完了にする"}
              className={
                entry.done
                  ? "flex h-5 w-5 items-center justify-center rounded-md bg-accent text-xs text-accent-contrast"
                  : "h-5 w-5 rounded-md border border-border transition-colors hover:border-accent"
              }
            >
              {entry.done ? "✓" : ""}
            </button>
          </form>
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              action={async (formData) => {
                setEditing(false);
                await onUpdate(formData);
              }}
              className="space-y-2"
            >
              <input type="hidden" name="id" value={entry.id} />
              <textarea
                name="body"
                defaultValue={entry.body}
                rows={3}
                autoFocus
                className="w-full resize-none rounded-lg border border-border bg-background p-2 text-base outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-contrast"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg px-3 py-1 text-xs text-muted"
                >
                  やめる
                </button>
              </div>
            </form>
          ) : (
            <p
              className={
                entry.done
                  ? "whitespace-pre-wrap break-words text-base text-muted line-through"
                  : "whitespace-pre-wrap break-words text-base"
              }
            >
              {entry.body}
            </p>
          )}

          {entry.tags.length > 0 && !editing && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-background px-2 py-0.5 text-xs text-muted"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span>{kindLabel}</span>
            <span>{formatStamp(entry.created_at)}</span>
            {!editing && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="transition-colors hover:text-foreground"
                >
                  編集
                </button>
                <form
                  action={onDelete}
                  onSubmit={(event) => {
                    if (!window.confirm("これを削除する？")) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={entry.id} />
                  <button type="submit" className="transition-colors hover:text-foreground">
                    削除
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
