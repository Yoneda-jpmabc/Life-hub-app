import type { Tables } from "@/lib/database.types";

export type Entry = Tables<"entries">;

/** 入力を受け止める器。すべて同じ entries テーブルに入る。 */
export const ENTRY_KINDS = ["thought", "note", "task", "work"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const KIND_LABELS: Record<EntryKind, string> = {
  thought: "思考",
  note: "メモ",
  task: "タスク",
  work: "勤務",
};

/** 日付を持てるのはこの3つ。思考は書き殴る場所なので何も要求しない。 */
export const DATEABLE_KINDS: EntryKind[] = ["note", "task", "work"];

/** 勤務だけは本文ではなく時間を記録するので、入力の作りが他と違う。 */
export function isWorkLog(entry: Entry): boolean {
  return entry.kind === "work";
}

export function isEntryKind(value: unknown): value is EntryKind {
  return ENTRY_KINDS.includes(value as EntryKind);
}

// 行頭か空白の直後にある # だけをタグとみなす。
// そうしないと "C#" や "予算は#100万" のような語中の # まで拾ってしまう。
const TAG_PATTERN = /(^|\s)#([^\s#]+)/g;

/**
 * 本文に混ぜて書いた #タグ を抜き出し、本文側からは取り除く。
 * タグは属性として別に表示するので、本文に残すと二重になる。
 */
export function parseTags(input: string): { body: string; tags: string[] } {
  const tags: string[] = [];
  const lines: string[] = [];

  for (const line of input.split("\n")) {
    const stripped = line
      .replace(TAG_PATTERN, (_match, lead: string, tag: string) => {
        tags.push(tag);
        return lead;
      })
      .replace(/[^\S\n]+/g, " ")
      .trim();

    // タグだけで構成されていた行は行ごと落とす。空行が残ると本文が間延びする。
    if (stripped === "" && line.trim() !== "") continue;
    lines.push(stripped);
  }

  return { body: lines.join("\n").trim(), tags: [...new Set(tags)] };
}

export type TagCount = { tag: string; count: number };

/** 使用回数の多い順に並べたタグと、その件数。 */
export function countTags(entries: Entry[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([tag, count]) => ({ tag, count }));
}

/** 使用回数の多い順に並べたタグ一覧。入力欄の候補に使う。 */
export function collectTags(entries: Entry[]): string[] {
  return countTags(entries).map(({ tag }) => tag);
}

/** 選んだタグが付いた記録だけを残す。タグ未選択なら素通し。 */
export function filterByTag(entries: Entry[], tag: string | null): Entry[] {
  if (!tag) return entries;
  return entries.filter((entry) => entry.tags.includes(tag));
}
