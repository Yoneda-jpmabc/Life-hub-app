import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // トップ画面は静的配信のまま CDN から返したいので通さない。
  // 端末側の Supabase クライアントが自分でトークンを更新するため、
  // セッションの世話が要るのはサーバーで判定するログイン画面だけ。
  matcher: ["/login"],
};
