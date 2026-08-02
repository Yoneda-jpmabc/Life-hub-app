"use client";

import { useState } from "react";

import { ENTRY_KINDS, KIND_LABELS, type EntryKind } from "@/lib/entries";

const PLACEHOLDERS: Record<EntryKind, string> = {
  thought: "いま考えてることを、まとまってなくても",
  note: "覚えておきたいことを #タグ 付きでも",
  task: "やること。あとでチェックを付けられる",
};

export function Composer({
  onSubmit,
  error,
}: {
  onSubmit: (body: string, kind: EntryKind) => void;
  error: string | null;
}) {
  const [kind, setKind] = useState<EntryKind>("note");
  const [body, setBody] = useState("");

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    onSubmit(trimmed, kind);
  }

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
        value={body}
        onChange={(event) => setBody(event.target.value)}
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted" role={error ? "alert" : undefined}>
          {error ?? "#タグ を混ぜて書くと自動で拾う"}
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
