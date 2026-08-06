"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DEV_NO_AUTH } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/client";

/**
 * メールのリンクを踏んだときの着地点。
 * セッションを作るのは端末側のクライアントだけに任せる。サーバーでも
 * 交換すると cookie の書き手が二人になり、更新の競合でログアウトする。
 */
export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    // 認証を切っている間はリンクを交換しない。
    // 交換すると使い捨てのリンクをここで無駄にしてしまう。
    if (DEV_NO_AUTH) {
      router.replace("/");
      return;
    }

    // useSearchParams を使うと静的配信でなくなるため、URL から直接読む
    const params = new URLSearchParams(window.location.search);

    (async () => {
      const supabase = createClient();

      // Supabase 側で弾かれたときは理由がクエリに乗ってくる
      const errorCode = params.get("error_code");
      if (errorCode) {
        router.replace(`/login?error=${errorCode === "otp_expired" ? "expired" : "denied"}`);
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        router.replace(error ? "/login?error=exchange" : "/");
        return;
      }

      // メールのテンプレートを token_hash 形式に替えた場合はこちらで届く
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        router.replace(error ? "/login?error=expired" : "/");
        return;
      }

      router.replace("/login?error=link");
    })();
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <p className="text-sm text-muted">ログインしてる…</p>
    </main>
  );
}
