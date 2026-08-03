import { daysBetween, toDayKey, type DayKey } from "@/lib/date";
import type { Entry } from "@/lib/entries";

/**
 * 経験値は保存せず、entries から毎回組み立てる。
 * 保存すると「記録は消したのに経験値だけ残っている」のような食い違いが起きるうえ、
 * 数え方を直したときに過去の分を数え直せなくなる。
 */

// ---- タスク ----

/** 1つ片付けたら必ずこれだけ入る。 */
export const TASK_BASE_XP = 10;
/** 期限に間に合ったときの上乗せ。 */
export const TASK_INTIME_XP = 5;
/** 寝かせた日数1日ごとの上乗せ。長く残ってた相手ほど手強かった、という扱い。 */
export const TASK_AGE_XP = 1;
/** 上乗せの頭打ち。放っておくほど得になると、片付ける気がなくなる。 */
export const TASK_AGE_CAP = 10;

// ---- 勤務 ----

/** ここまでは満額で数える。 */
const WORK_FULL_MINUTES = 8 * 60;
/** ここから先は数えない。働くほど伸びる作りにすると、休めなくなる。 */
const WORK_LIMIT_MINUTES = 12 * 60;
/** 満額のときの1分あたり。8時間で 96。 */
const WORK_XP_PER_MINUTE = 0.2;

// ---- レベル ----

export const MAX_LEVEL = 99;

/** そのレベルから次に上がるまでに要る量。上がるほど重くなる。 */
export function levelCost(level: number): number {
  return Math.round((80 * level ** 1.35) / 10) * 10;
}

export type LevelState = {
  level: number;
  /** いまのレベルに入ってから積んだ分 */
  into: number;
  /** いまのレベルを抜けるのに要る分。最高レベルなら 0 */
  need: number;
};

export function levelFor(total: number): LevelState {
  let level = 1;
  let rest = Math.max(0, Math.floor(total));

  while (level < MAX_LEVEL) {
    const cost = levelCost(level);
    if (rest < cost) return { level, into: rest, need: cost };
    rest -= cost;
    level += 1;
  }
  return { level: MAX_LEVEL, into: 0, need: 0 };
}

/** レベルの節目に付く呼び名。数字だけやと、上がった実感が出ない。 */
const TITLES: { from: number; name: string }[] = [
  { from: 99, name: "勇者" },
  { from: 80, name: "伝説" },
  { from: 60, name: "英雄" },
  { from: 45, name: "賢者" },
  { from: 30, name: "達人" },
  { from: 20, name: "熟練者" },
  { from: 15, name: "一人前" },
  { from: 10, name: "ベテラン" },
  { from: 5, name: "せんし" },
  { from: 3, name: "みならい" },
  { from: 1, name: "たびびと" },
];

export function titleFor(level: number): string {
  return TITLES.find((entry) => level >= entry.from)?.name ?? "たびびと";
}

// ---- 連続日数 ----

/** 続けた日数に応じてその日の取り分が増える。 */
const STREAK_STEPS: { days: number; multiplier: number }[] = [
  { days: 30, multiplier: 1.5 },
  { days: 14, multiplier: 1.3 },
  { days: 7, multiplier: 1.2 },
  { days: 3, multiplier: 1.1 },
];

export function streakMultiplier(streak: number): number {
  return STREAK_STEPS.find((step) => streak >= step.days)?.multiplier ?? 1;
}

/** あと何日続けたら倍率が上がるか。0 なら次の段はない。 */
export function daysToNextStep(streak: number): number {
  const next = [...STREAK_STEPS].reverse().find((step) => step.days > streak);
  return next ? next.days - streak : 0;
}

// ---- 1件あたりの取り分 ----

/** 働いた分から取り分を出す。8時間までは満額、12時間で頭打ち。 */
export function workXp(minutes: number): number {
  const counted = Math.min(Math.max(minutes, 0), WORK_LIMIT_MINUTES);
  const full = Math.min(counted, WORK_FULL_MINUTES);
  const over = counted - full;
  return Math.round((full + over / 2) * WORK_XP_PER_MINUTE);
}

/** 片付いたタスク1件の取り分。未完了なら 0。 */
export function taskXp(entry: Entry): number {
  if (entry.kind !== "task" || !entry.done) return 0;

  const doneDay = toDayKey(new Date(entry.done_at ?? entry.updated_at));
  const bornDay = toDayKey(new Date(entry.created_at));

  let xp = TASK_BASE_XP;
  if (entry.due_on && doneDay <= entry.due_on) xp += TASK_INTIME_XP;
  xp += Math.min(Math.max(daysBetween(bornDay, doneDay), 0), TASK_AGE_CAP) * TASK_AGE_XP;
  return xp;
}

/** その記録の取り分が、どの日に付くか。付かないなら null。 */
export function xpDayOf(entry: Entry): DayKey | null {
  if (entry.kind === "work") return entry.due_on;
  if (entry.kind === "task" && entry.done) {
    return toDayKey(new Date(entry.done_at ?? entry.updated_at));
  }
  return null;
}

// ---- 日ごとの集計 ----

export type DayXp = {
  day: DayKey;
  /** その日に片付けたタスクの数 */
  tasks: number;
  taskXp: number;
  /** その日はたらいた分 */
  minutes: number;
  workXp: number;
  /** 倍率をかける前の合計 */
  base: number;
};

/** 手元の記録から、日ごとの取り分を組み立てる。 */
export function collectDays(entries: Entry[]): Map<DayKey, DayXp> {
  const days = new Map<DayKey, DayXp>();

  const at = (day: DayKey): DayXp => {
    const found = days.get(day);
    if (found) return found;
    const fresh: DayXp = { day, tasks: 0, taskXp: 0, minutes: 0, workXp: 0, base: 0 };
    days.set(day, fresh);
    return fresh;
  };

  for (const entry of entries) {
    if (entry.archived) continue;
    const day = xpDayOf(entry);
    if (!day) continue;

    if (entry.kind === "work") {
      const minutes = entry.minutes ?? 0;
      const slot = at(day);
      slot.minutes += minutes;
      slot.workXp += workXp(minutes);
    } else {
      const slot = at(day);
      slot.tasks += 1;
      slot.taskXp += taskXp(entry);
    }
  }

  for (const slot of days.values()) {
    slot.base = slot.taskXp + slot.workXp;
  }

  // 何も入らんかった日は持たない。連続日数の判定をここに寄せるため。
  for (const [day, slot] of days) {
    if (slot.base <= 0) days.delete(day);
  }

  return days;
}

// ---- まとめ ----

export type DayResult = DayXp & {
  /** その日を含めて何日続いたか */
  streak: number;
  multiplier: number;
  /** 倍率をかけたあとの、その日の取り分 */
  total: number;
};

export type XpStatus = {
  total: number;
  level: number;
  into: number;
  need: number;
  title: string;
  /** 日ごとの結果。カレンダーに数字を出すのに使う */
  days: Map<DayKey, DayResult>;
  today: DayResult | null;
  /** 今日まだ何もしてなければ、昨日までの連続日数(まだ途切れてはいない) */
  streak: number;
  todayEarned: boolean;
};

/**
 * 日ごとの取り分を古い順に見て、連続日数と倍率を決めながら積み上げる。
 * 倍率は「その日までに何日続いたか」で決まるので、順に見る必要がある。
 */
export function buildStatus(days: Map<DayKey, DayXp>, today: DayKey): XpStatus {
  const sorted = [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
  const results = new Map<DayKey, DayResult>();

  let total = 0;
  let streak = 0;
  let previous: DayKey | null = null;

  for (const day of sorted) {
    streak = previous && daysBetween(previous, day.day) === 1 ? streak + 1 : 1;
    previous = day.day;

    const multiplier = streakMultiplier(streak);
    const dayTotal = Math.round(day.base * multiplier);
    total += dayTotal;
    results.set(day.day, { ...day, streak, multiplier, total: dayTotal });
  }

  const todayResult = results.get(today) ?? null;
  const last = sorted.at(-1);

  // 今日まだ何もしてなくても、昨日の分までは途切れてない扱いにする。
  // 一日の途中で「連続0日」と出ると、続いてるものが切れたように見える。
  const liveStreak = todayResult
    ? todayResult.streak
    : last && daysBetween(last.day, today) === 1
      ? (results.get(last.day)?.streak ?? 0)
      : 0;

  const level = levelFor(total);

  return {
    total,
    ...level,
    title: titleFor(level.level),
    days: results,
    today: todayResult,
    streak: liveStreak,
    todayEarned: todayResult !== null,
  };
}

/** 「8時間30分」のような表示。0分なら休み。 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "休み";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}分`;
  if (rest === 0) return `${hours}時間`;
  return `${hours}時間${rest}分`;
}
