import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

type Client = ReturnType<typeof createBrowserClient<Database>>;

let client: Client | null = null;

/**
 * 必ず同じインスタンスを返す。
 *
 * 複数作るとそれぞれが独立してトークンの自動更新を回してしまう。
 * 更新は一度きりで古いトークンが無効になる仕組みなので、片方が更新した
 * 瞬間にもう片方が握っている分が使えなくなり、refresh_token_not_found で
 * ログアウトさせられる。
 */
export function createClient(): Client {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // リンクの受け取りは /auth/confirm で明示的に行う。
        // 自動検出に任せると二重に交換して片方が失敗する。
        detectSessionInUrl: false,
      },
    },
  );
  return client;
}
