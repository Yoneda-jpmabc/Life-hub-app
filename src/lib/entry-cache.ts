import { DEV_NO_AUTH } from "@/lib/dev-auth";
import type { Entry } from "@/lib/entries";

const KEY = "life-hub:entries:v1";
/**
 * 認証を切っている間は別の場所に貯める。
 * 試し書きが本物の控えに混ざると、認証を戻したときに一瞬だけ偽物が見えてしまう。
 */
const DEV_KEY = "life-hub:entries:dev";
const ACTIVE_KEY = DEV_NO_AUTH ? DEV_KEY : KEY;

/**
 * 直近の一覧を端末に控えておく。次の起動で通信を待たずに描けるようにするため。
 * 正はあくまでサーバー側で、これは表示を先行させるためだけの写し。
 */
export function readCache(): Entry[] | null {
  if (typeof window === "undefined") return null;
  try {
    // 認証を切った直後はローカル側が空なので、本物の控えを一度だけ写して使う。
    // 何もない画面から始めるより、実際の記録で見た目を確かめられるほうがよい。
    // 書き戻す先はローカル側なので、写した元が上書きされることはない。
    const raw =
      window.localStorage.getItem(ACTIVE_KEY) ??
      (DEV_NO_AUTH ? window.localStorage.getItem(KEY) : null);
    return raw ? (JSON.parse(raw) as Entry[]) : null;
  } catch {
    return null;
  }
}

export function writeCache(entries: Entry[]) {
  try {
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(entries));
  } catch {
    // 容量超過などは無視してよい。次回は通信で取り直すだけ。
  }
}

export function clearCache() {
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // 消せなくても実害はない
  }
}
