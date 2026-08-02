"use client";

import { useState } from "react";

import { ENTRY_KINDS, KIND_LABELS, type EntryKind } from "@/lib/entries";

const PLACEHOLDERS: Record<EntryKind, string> = {
  thought: "いま考えてることを、まとまってなくても",
  note: "覚えておきたいことを #タグ 付きでも",
  task: "やること。あとでチェックを付けられる",
};

export function Composer({
  action,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  error: string | null;
}) {
  const [kind, setKind] = useState<EntryKind>("note");
  const [body, setBody] = useState("");

  // formData は action 呼び出し前に確定しているので、
  // ここで入力欄を空にしても送信内容には影響しない。
  async function handle(formData: FormData) {
    setBody("");
    await action(formData);
  }

  return (
    <form
      action={handle}
      className="rounded-2xl border border-border bg-surface p-3 shadow-sm"
    >
      <input type="hidden" name="kind" value={kind} />

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
        name="body"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={PLACEHOLDERS[kind]}
        onKeyDown={(event) => {
          // スマホでは改行を邪魔せず、PC では Ctrl/⌘+Enter で素早く保存
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.currentTarget.form?.requestSubmit();
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
