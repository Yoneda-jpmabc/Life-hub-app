import type { DayKey } from "@/lib/date";
import { DEV_NO_AUTH } from "@/lib/dev-auth";
import type { DayXp } from "@/lib/xp";

// 貯めた経験値は取り消さない決めごとなので、認証を切っている間の試し書きが
// 混ざると本物のレベルが戻せなくなる。開発中は置き場所を分ける。
const DAYS_KEY = DEV_NO_AUTH ? "life-hub:xp-days:dev" : "life-hub:xp-days:v1";
const LEVEL_KEY = DEV_NO_AUTH ? "life-hub:xp-level:dev" : "life-hub:xp-level:v1";

/**
 * 一覧の読み込みは直近500件までなので、記録が積もると古い分が視界から外れる。
 * そのまま数えると、ある日を境に経験値が減ってレベルが下がってしまう。
 *
 * そこで日ごとの取り分を端末に貯めておき、通信で取れた分と重ねて使う。
 * 重ねるときは多いほうを残す。一度もらった経験値は取り消さん、という決めごとにして、
 * 「窓から外れただけ」と「本当に記録を消した」を区別せずに済ませる。
 *
 * 貯めた分は画面を開いた時点で読み、その値のまま使う。
 * なので押し間違いは開いている間なら取り消せて、開き直したあとは残る。
 * 端末ごとに貯まる控えなので、別の端末で開くと窓に入っている分から数え直しになる。
 */
export function readDays(): Map<DayKey, DayXp> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.localStorage.getItem(DAYS_KEY);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw) as Record<DayKey, DayXp>));
  } catch {
    return new Map();
  }
}

export function writeDays(days: Map<DayKey, DayXp>) {
  try {
    window.localStorage.setItem(DAYS_KEY, JSON.stringify(Object.fromEntries(days)));
  } catch {
    // 書けなくても表示は続けられる。次に取り直したときに揃う。
  }
}

/** 貯めてある分と、いま数えた分を重ねる。同じ日は多いほうを採る。 */
export function mergeDays(
  stored: Map<DayKey, DayXp>,
  fresh: Map<DayKey, DayXp>,
): Map<DayKey, DayXp> {
  const merged = new Map(stored);
  for (const [day, value] of fresh) {
    const kept = merged.get(day);
    if (!kept || value.base >= kept.base) merged.set(day, value);
  }
  return merged;
}

/** 前に見せたレベル。上がった瞬間だけ知らせるために控えておく。 */
export function readSeenLevel(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEVEL_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function writeSeenLevel(level: number) {
  try {
    window.localStorage.setItem(LEVEL_KEY, String(level));
  } catch {
    // 控えられんかったら、次に開いたときにもう一度知らせるだけ
  }
}

export function clearXpCache() {
  try {
    window.localStorage.removeItem(DAYS_KEY);
    window.localStorage.removeItem(LEVEL_KEY);
  } catch {
    // 消せなくても実害はない
  }
}
