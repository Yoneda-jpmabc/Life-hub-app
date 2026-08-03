"use client";

import { useEffect, useState } from "react";

import { Character } from "@/components/character";
import { CharacterSheet } from "@/components/character-sheet";
import { rankChanged, rankFor } from "@/lib/ranks";
import { readSeenLevel, writeSeenLevel } from "@/lib/xp-cache";
import {
  MAX_LEVEL,
  TASK_AGE_CAP,
  TASK_AGE_XP,
  TASK_BASE_XP,
  TASK_INTIME_XP,
  daysToNextStep,
  formatMinutes,
  streakMultiplier,
  type XpStatus,
} from "@/lib/xp";

export function StatusBar({ status }: { status: XpStatus }) {
  // 前に見せたレベル。画面を開いた時点の値で止めておき、これを超えたときだけ知らせる。
  // 開くたびに出ると、ただの飾りになってしまう。
  const [seenLevel] = useState(() => readSeenLevel());
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 一度上がったら、次に開いたときは知らせないよう控え直す
  useEffect(() => {
    writeSeenLevel(status.level);
  }, [status.level]);

  const levelUp =
    seenLevel !== null && status.level > seenLevel && status.level !== dismissed;
  // 姿が変わったときだけ、前と後を並べて見せる。
  // レベルは上がったが同じ段階、という回のほうが多いので、そこは静かにしておく。
  const grewUp = levelUp && seenLevel !== null && rankChanged(seenLevel, status.level);
  const rank = rankFor(status.level);

  const maxed = status.level >= MAX_LEVEL;
  const filled = maxed ? 1 : status.need > 0 ? status.into / status.need : 0;
  const nextStep = daysToNextStep(status.streak);

  return (
    <section className="mb-4 rounded-2xl border border-border bg-surface p-3">
      {levelUp && (
        <div
          role="status"
          className="mb-3 rounded-xl bg-accent px-3 py-2 text-accent-contrast"
        >
          <div className="flex items-center justify-between gap-2 text-sm font-medium">
            <span>
              レベルが {status.level} に あがった！
              {grewUp && ` ${status.title} になった。`}
            </span>
            <button
              type="button"
              onClick={() => setDismissed(status.level)}
              aria-label="閉じる"
              className="text-xs opacity-70"
            >
              ✕
            </button>
          </div>

          {grewUp && seenLevel !== null && (
            // 姿が変わった回だけ、前と後を並べる。
            // 背景を敷いてあるのは、絵の色が帯の色と近くても沈まんようにするため。
            // これが無いと「緑系の絵は描けない」という制約が絵の側に回ってしまう。
            <div className="mt-2 flex items-center justify-center gap-3 rounded-lg bg-surface p-2">
              <Character rank={rankFor(seenLevel)} size="large" box={72} className="opacity-40" />
              <span aria-hidden="true" className="text-lg text-muted">
                →
              </span>
              <Character rank={rank} size="large" box={112} />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={`${status.title}。これまでの姿を見る`}
            className="rounded-xl transition-opacity hover:opacity-80"
          >
            <Character rank={rank} size="small" box={48} />
          </button>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">Lv.{status.level}</span>
            <span className="text-sm text-muted">{status.title}</span>
          </div>
        </div>
        <span className="text-xs text-muted tabular-nums">
          {status.total.toLocaleString("ja-JP")} XP
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={maxed ? 1 : status.need}
        aria-valuenow={maxed ? 1 : status.into}
        aria-label="次のレベルまで"
        className="mt-2 h-2 overflow-hidden rounded-full bg-background"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.min(filled, 1) * 100}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted tabular-nums">
        <span>
          {maxed ? "ここまで" : `つぎまで ${(status.need - status.into).toLocaleString("ja-JP")}`}
        </span>
        <span className={status.todayEarned ? "font-medium text-accent" : ""}>
          今日 +{status.today?.total ?? 0}
        </span>
        {status.streak > 0 && (
          <span>
            {status.streak}日つづき
            {streakMultiplier(status.streak) > 1 && ` ×${streakMultiplier(status.streak)}`}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="ml-auto underline transition-colors hover:text-foreground"
        >
          {open ? "閉じる" : "内訳"}
        </button>
      </div>

      {open && (
        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted">
          <div className="flex justify-between gap-3">
            <dt>今日のタスク</dt>
            <dd className="tabular-nums text-foreground">
              {status.today?.tasks ?? 0}件 +{status.today?.taskXp ?? 0}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>今日の勤務</dt>
            <dd className="tabular-nums text-foreground">
              {formatMinutes(status.today?.minutes ?? 0)} +{status.today?.workXp ?? 0}
            </dd>
          </div>
          {status.today && status.today.multiplier > 1 && (
            <div className="flex justify-between gap-3">
              <dt>つづきボーナス</dt>
              <dd className="tabular-nums text-foreground">×{status.today.multiplier}</dd>
            </div>
          )}
          <p className="pt-2 leading-relaxed">
            タスク1件で {TASK_BASE_XP}。期限に間に合えば +{TASK_INTIME_XP}、
            寝かせた日数ぶん +{TASK_AGE_XP}（{TASK_AGE_CAP}日で頭打ち）。
            勤務は8時間で +96、そこから先は半分、12時間で頭打ち。
            {nextStep > 0 && ` あと${nextStep}日つづけたら倍率が上がる。`}
          </p>
        </dl>
      )}

      {sheetOpen && (
        <CharacterSheet level={status.level} onClose={() => setSheetOpen(false)} />
      )}
    </section>
  );
}
