"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { createEntry, type ActionResult } from "@/app/actions";
import { ENTRY_KINDS, KIND_LABELS, type EntryKind } from "@/lib/entries";

const INITIAL: ActionResult = { error: null };

const PLACEHOLDERS: Record<EntryKind, string> = {
  thought: "いま考えてることを、まとまってなくても",
  note: "覚えておきたいことを #タグ 付きでも",
  task: "やること。あとでチェックを付けられる",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition-opacity disabled:opacity-50"
    >
      {pending ? "保存中…" : "保存"}
    </button>
  );
}

export function Composer() {
  const [kind, setKind] = useState<EntryKind>("note");
  const [state, formAction] = useActionState(createEntry, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // 保存が通ったら入力欄を空にして、次をすぐ書ける状態に戻す
  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
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
        <p className="text-xs text-muted" role={state.error ? "alert" : undefined}>
          {state.error ?? "#タグ を混ぜて書くと自動で拾う"}
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
