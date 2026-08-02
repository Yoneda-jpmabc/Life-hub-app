"use client";

import { useMemo, useState } from "react";

import { EntryItem, type EntryPatch } from "@/components/entry-item";
import { WEEKDAY_LABELS, formatDay, formatMonth, monthGrid, toDayKey, todayKey } from "@/lib/date";
import type { Entry } from "@/lib/entries";

export function CalendarView({
  entries,
  onToggle,
  onUpdate,
  onDelete,
}: {
  entries: Entry[];
  onToggle: (id: string, done: boolean) => void;
  onUpdate: (id: string, patch: EntryPatch) => void;
  onDelete: (id: string) => void;
}) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(today);

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      if (!entry.due_on) continue;
      const list = map.get(entry.due_on);
      if (list) list.push(entry);
      else map.set(entry.due_on, [entry]);
    }
    return map;
  }, [entries]);

  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const selectedEntries = selected ? (byDay.get(selected) ?? []) : [];

  function shift(step: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + step, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="前の月"
          className="rounded-lg px-3 py-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          ←
        </button>
        <span className="text-sm font-medium">{formatMonth(cursor.year, cursor.month)}</span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="次の月"
          className="rounded-lg px-3 py-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px text-center text-xs text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const key = toDayKey(date);
          const outside = date.getMonth() !== cursor.month;
          const count = byDay.get(key)?.length ?? 0;
          const isToday = key === today;
          const isSelected = key === selected;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              aria-current={isToday ? "date" : undefined}
              className={[
                "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                isSelected ? "bg-accent text-accent-contrast" : "hover:bg-surface",
                outside && !isSelected ? "text-muted/50" : "",
                isToday && !isSelected ? "ring-1 ring-accent" : "",
              ].join(" ")}
            >
              <span>{date.getDate()}</span>
              <span
                className={[
                  "mt-0.5 h-1 w-1 rounded-full",
                  count > 0
                    ? isSelected
                      ? "bg-accent-contrast"
                      : "bg-accent"
                    : "bg-transparent",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">{formatDay(selected)}</p>
          {selectedEntries.length > 0 ? (
            <ul className="space-y-2">
              {selectedEntries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">この日は何もない。</p>
          )}
        </div>
      )}
    </div>
  );
}
