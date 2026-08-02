"use client";

import { useState } from "react";

import { todayKey } from "@/lib/date";
import {
  DATEABLE_KINDS,
  ENTRY_KINDS,
  KIND_LABELS,
  parseTags,
  type EntryKind,
} from "@/lib/entries";

const PLACEHOLDERS: Record<EntryKind, string> = {
  thought: "いま考えてることを、まとまってなくても",
  note: "覚えておきたいこと",
  task: "やること",
};

export type Draft = {
  body: string;
  kind: EntryKind;
  tags: string[];
  dueOn: string | null;
};

export function Composer({
  onSubmit,
  knownTags,
  error,
}: {
  onSubmit: (draft: Draft) => void;
  knownTags: string[];
  error: string | null;
}) {
  const [kind, setKind] = useState<EntryKind>("note");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [dueOn, setDueOn] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const canHaveDate = DATEABLE_KINDS.includes(kind);
  // 本文に直接書いた #タグ と、下から選んだタグを合わせて扱う
  const typed = parseTags(text).tags;
  const tags = [...new Set([...typed, ...picked])];

  function toggleTag(tag: string) {
    setPicked((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  function submit() {
    const parsed = parseTags(text);
    if (!parsed.body) {
      setNotice(
        text.trim() ? "本文も書いてな。タグだけやと保存できひん。" : "何か書いてから保存してな",
      );
      return;
    }
    setNotice(null);

    onSubmit({
      body: parsed.body,
      kind,
      tags,
      dueOn: canHaveDate && dueOn ? dueOn : null,
    });

    setText("");
    setPicked([]);
    setDueOn("");
  }

  const suggestions = knownTags.filter((tag) => !typed.includes(tag)).slice(0, 12);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="rounded-2xl border border-border bg-surface p-3 shadow-sm"
    >
      <div className="mb-2 flex gap-1">
        {ENTRY_KINDS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            aria-pressed={kind === option}
            className={
              kind === option
                ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast"
                : "rounded-full px-3 py-1 text-xs text-muted transition-colors hover:bg-background"
            }
          >
            {KIND_LABELS[option]}
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={PLACEHOLDERS[kind]}
        onKeyDown={(event) => {
          // スマホでは改行を邪魔せず、PC では Ctrl/⌘+Enter で素早く保存
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        className="w-full resize-none bg-transparent px-1 text-base outline-none placeholder:text-muted"
      />

      {canHaveDate && (
        <div className="mt-1 flex items-center gap-2 px-1">
          <input
            type="date"
            value={dueOn}
            onChange={(event) => setDueOn(event.target.value)}
            aria-label="日付"
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
          />
          {dueOn ? (
            <button
              type="button"
              onClick={() => setDueOn("")}
              className="text-xs text-muted underline"
            >
              日付を外す
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDueOn(todayKey())}
              className="text-xs text-muted underline"
            >
              今日
            </button>
          )}
        </div>
      )}

      {(tags.length > 0 || suggestions.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1 px-1">
          {suggestions.map((tag) => {
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
                    : "rounded-full bg-background px-2 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
                }
              >
                #{tag}
              </button>
            );
          })}
          {typed.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-contrast"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted" role={notice ?? error ? "alert" : undefined}>
          {notice ?? error ?? "#タグ と書くと本文から外して属性にする"}
        </p>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
        >
          保存
        </button>
      </div>
    </form>
  );
}
