"use client";

import { useState } from "react";

import { MinutesField } from "@/components/minutes-field";
import { formatDay } from "@/lib/date";
import { DATEABLE_KINDS, KIND_LABELS, isEntryKind, parseTags, type Entry } from "@/lib/entries";
import { formatStamp } from "@/lib/format";
import { formatMinutes, taskXp, workXp } from "@/lib/xp";

export type EntryPatch = {
  body: string;
  tags: string[];
  due_on: string | null;
  minutes?: number | null;
};

export function EntryItem({
  entry,
  onToggle,
  onUpdate,
  onDelete,
  onTagClick,
  activeTags = [],
}: {
  entry: Entry;
  onToggle: (id: string, done: boolean) => void;
  onUpdate: (id: string, patch: EntryPatch) => void;
  onDelete: (id: string) => void;
  /** タグを押して絞り込む。渡さなければタグはただの表示 */
  onTagClick?: (tag: string) => void;
  /** いま絞り込みに使われているタグ */
  activeTags?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.body);
  const [dueOn, setDueOn] = useState(entry.due_on ?? "");
  const [minutes, setMinutes] = useState(entry.minutes ?? 0);

  const isWork = entry.kind === "work";
  const kindLabel = isEntryKind(entry.kind) ? KIND_LABELS[entry.kind] : entry.kind;
  const canHaveDate = isEntryKind(entry.kind) && DATEABLE_KINDS.includes(entry.kind);
  // 経験値が入った記録にだけ、入った分を添える
  const earned = isWork ? workXp(entry.minutes ?? 0) : taskXp(entry);

  function save() {
    setEditing(false);
    const parsed = parseTags(draft);
    // 勤務は時間そのものが中身なので、本文が空でも保存できる
    if (!isWork && !parsed.body) return;

    // 編集中に書き足した #タグ も拾い、元から付いていたものと合わせる
    const tags = [...new Set([...entry.tags, ...parsed.tags])];
    // 勤務はどの日の分か分からんようになると置き場所を失うので、空にはさせない
    const nextDue = isWork ? (dueOn || entry.due_on) : canHaveDate && dueOn ? dueOn : null;

    if (
      parsed.body === entry.body &&
      nextDue === entry.due_on &&
      tags.length === entry.tags.length &&
      (!isWork || minutes === entry.minutes)
    ) {
      return;
    }
    onUpdate(entry.id, {
      body: parsed.body,
      tags,
      due_on: nextDue,
      ...(isWork ? { minutes } : {}),
    });
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
              {isWork && <MinutesField minutes={minutes} onChange={setMinutes} />}
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={isWork ? 2 : 3}
                autoFocus={!isWork}
                placeholder={isWork ? "その日のこと(書かんでもええ)" : undefined}
                className="w-full resize-none rounded-lg border border-border bg-background p-2 text-base outline-none placeholder:text-muted"
              />
              {canHaveDate && (
                <input
                  type="date"
                  value={dueOn}
                  onChange={(event) => setDueOn(event.target.value)}
                  aria-label="日付"
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none"
                />
              )}
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
                    setDueOn(entry.due_on ?? "");
                    setMinutes(entry.minutes ?? 0);
                    setEditing(false);
                  }}
                  className="rounded-lg px-3 py-1 text-xs text-muted"
                >
                  やめる
                </button>
              </div>
            </div>
          ) : isWork ? (
            // 勤務は時間が中身。本文は添え書きなので、あるときだけ下に出す
            <div>
              <p className="text-base font-medium tabular-nums">
                {formatMinutes(entry.minutes ?? 0)}
              </p>
              {entry.body && (
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
                  {entry.body}
                </p>
              )}
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

          {!editing && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted">
              <span className="rounded-full bg-background px-2 py-0.5">{kindLabel}</span>
              {earned > 0 && (
                <span className="rounded-full bg-background px-2 py-0.5 font-medium text-accent tabular-nums">
                  +{earned} XP
                </span>
              )}
              {entry.due_on && (
                <span className="rounded-full bg-background px-2 py-0.5 text-foreground">
                  {formatDay(entry.due_on)}
                </span>
              )}
              {entry.tags.map((tag) =>
                // 目に入ったタグをそのまま押せるほうが、上の一覧まで戻るより早い
                onTagClick ? (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagClick(tag)}
                    aria-pressed={activeTags.includes(tag)}
                    className={
                      activeTags.includes(tag)
                        ? "rounded-full bg-accent px-2 py-0.5 text-accent-contrast"
                        : "rounded-full bg-background px-2 py-0.5 transition-colors hover:text-foreground"
                    }
                  >
                    #{tag}
                  </button>
                ) : (
                  <span key={tag} className="rounded-full bg-background px-2 py-0.5">
                    #{tag}
                  </span>
                ),
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
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
