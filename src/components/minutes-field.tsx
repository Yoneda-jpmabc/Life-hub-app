"use client";

import { formatMinutes, workXp } from "@/lib/xp";

/** よく使う長さ。指1本で選べるところまでを既定にして、細かい調整は左右のボタンでやる。 */
const PRESETS = [0, 4 * 60, 6 * 60, 8 * 60, 9 * 60, 10 * 60];

const STEP = 30;
const MAX = 24 * 60;

export function MinutesField({
  minutes,
  onChange,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  function shift(delta: number) {
    onChange(Math.min(Math.max(minutes + delta, 0), MAX));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-STEP)}
            aria-label="30分減らす"
            disabled={minutes <= 0}
            className="h-8 w-8 rounded-lg border border-border text-sm text-muted transition-colors hover:text-foreground disabled:opacity-30"
          >
            −
          </button>
          <span className="min-w-28 text-center text-lg font-medium tabular-nums">
            {formatMinutes(minutes)}
          </span>
          <button
            type="button"
            onClick={() => shift(STEP)}
            aria-label="30分増やす"
            disabled={minutes >= MAX}
            className="h-8 w-8 rounded-lg border border-border text-sm text-muted transition-colors hover:text-foreground disabled:opacity-30"
          >
            ＋
          </button>
        </div>
        {/* 記録する前に、どれだけ入るかが見えるようにしておく */}
        <span className="text-sm font-medium text-accent tabular-nums">
          +{workXp(minutes)} XP
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-pressed={minutes === preset}
            className={
              minutes === preset
                ? "rounded-full bg-accent px-3 py-1 text-xs text-accent-contrast"
                : "rounded-full bg-background px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
            }
          >
            {formatMinutes(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
