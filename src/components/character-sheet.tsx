"use client";

import { useEffect } from "react";

import { Character } from "@/components/character";
import { RANKS, rankFor } from "@/lib/ranks";

/**
 * 姿の一覧。いまどこにいて、次に何になるかを見せる。
 *
 * 見た目を変えたいときはここと globals.css だけで済むように、
 * 段階の中身は ranks.ts から読むだけにしてある。
 */
export function CharacterSheet({ level, onClose }: { level: number; onClose: () => void }) {
  // 開いてる間は後ろが動かんようにする。閉じたら必ず戻す
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="これまでの姿"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">これまでの姿</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            閉じる
          </button>
        </div>

        <ul className="space-y-1">
          {RANKS.map((rank) => {
            const reached = level >= rank.from;
            const current = rank.key === rankFor(level).key;

            return (
              <li
                key={rank.key}
                aria-current={current ? "true" : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl p-2",
                  current ? "bg-background ring-1 ring-accent" : "",
                ].join(" ")}
              >
                <Character rank={rank} size="small" box={44} locked={!reached} />
                <div className="min-w-0 flex-1">
                  <p className={reached ? "text-sm font-medium" : "text-sm text-muted"}>
                    {rank.name}
                  </p>
                  <p className="text-xs text-muted tabular-nums">Lv.{rank.from} から</p>
                </div>
                {current && <span className="text-xs font-medium text-accent">いま</span>}
                {!reached && (
                  <span className="text-xs text-muted tabular-nums">
                    あと {rank.from - level}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
