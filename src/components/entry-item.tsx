"use client";

import { useState } from "react";

import { KIND_LABELS, isEntryKind, type Entry } from "@/lib/entries";
import { formatStamp } from "@/lib/format";

export function EntryItem({
  entry,
  onToggle,
  onUpdate,
  onDelete,
}: {
  entry: Entry;
  onToggle: (id: string, done: boolean) => void;
  onUpdate: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.body);
  const kindLabel = isEntryKind(entry.kind) ? KIND_LABELS[entry.kind] : entry.kind;

  function save() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== entry.body) onUpdate(entry.id, trimmed);
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        {entry.kind === "task" && (
          <button
            type="button"
            onClick={() => onToggle(entry.id, !entry.done)}
            aria-label={entry.done ? "未完了に戻す" : "完了にする"}
            className={
              entry.done
                ? "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-accent text-xs text-accent-contrast"
                : "mt-0.5 h-5 w-5 rounded-md border border-border transition-colors hover:border-accent"
            }
          >
            {entry.done ? "✓" : ""}
          </button>
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none rounded-lg border border-border bg-background p-2 text-base outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-contrast"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(entry.body);
                    setEditing(false);
                  }}
                  className="rounded-lg px-3 py-1 text-xs text-muted"
                >
                  やめる
                </button>
              </div>
            </div>
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
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("これを削除する？")) onDelete(entry.id);
                  }}
                  className="transition-colors hover:text-foreground"
                >
                  削除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
