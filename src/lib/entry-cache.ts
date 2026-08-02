import type { Entry } from "@/lib/entries";

const KEY = "life-hub:entries:v1";

/**
 * 直近の一覧を端末に控えておく。次の起動で通信を待たずに描けるようにするため。
 * 正はあくまでサーバー側で、これは表示を先行させるためだけの写し。
 */
export function readCache(): Entry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : null;
  } catch {
    return null;
  }
}

export function writeCache(entries: Entry[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // 容量超過などは無視してよい。次回は通信で取り直すだけ。
  }
}

export function clearCache() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 消せなくても実害はない
  }
}
