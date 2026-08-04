"use client";

import { useState } from "react";

import type { TagCount } from "@/lib/entries";

/** 一度に出すタグの数。多いと入力欄まで押し下げてしまうので、続きは畳んでおく。 */
const VISIBLE_LIMIT = 10;

export function TagFilter({
  tags,
  selected,
  onSelect,
}: {
  tags: TagCount[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (tags.length === 0) return null;

  const shown = expanded ? tags : tags.slice(0, VISIBLE_LIMIT);
  const hidden = tags.length - shown.length;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {shown.map(({ tag, count }) => {
        const on = tag === selected;
        return (
          <button
            key={tag}
            type="button"
            // もう一度押したら外れる。絞り込みを解くのに別のボタンを探さんでええようにする
            onClick={() => onSelect(on ? null : tag)}
            aria-pressed={on}
            className={
              on
                ? "rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-contrast"
                : "rounded-full bg-background px-2 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
            }
          >
            #{tag}
            <span className="ml-1 tabular-nums opacity-70">{count}</span>
          </button>
        );
      })}

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-1 text-xs text-muted underline transition-colors hover:text-foreground"
        >
          ほか{hidden}
        </button>
      )}

      {expanded && tags.length > VISIBLE_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-1 text-xs text-muted underline transition-colors hover:text-foreground"
        >
          畳む
        </button>
      )}
    </div>
  );
}
