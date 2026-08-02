import type { Tables } from "@/lib/database.types";

export type Entry = Tables<"entries">;

/** 入力を受け止める3つの器。すべて同じ entries テーブルに入る。 */
export const ENTRY_KINDS = ["thought", "note", "task"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const KIND_LABELS: Record<EntryKind, string> = {
  thought: "思考",
  note: "メモ",
  task: "タスク",
};

export function isEntryKind(value: unknown): value is EntryKind {
  return ENTRY_KINDS.includes(value as EntryKind);
}

/** 本文に混ぜて書いた #タグ を拾う。重複は落とす。 */
export function extractTags(body: string): string[] {
  const found = body.match(/#[^\s#]+/g) ?? [];
  return [...new Set(found.map((tag) => tag.slice(1)))];
}
