"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  expired: "リンクの期限が切れてるか、もう使ったあとやった。下からもう一度送ってな。",
  exchange:
    "リンクを要求したブラウザと、リンクを開いたブラウザが違うみたい。同じブラウザで開き直すと通る。",
  denied: "ログインが拒否された。もう一度試してみて。",
  link: "リンクの形式を読み取れんかった。もう一度送ってな。",
};

function LoginNotice() {
  const error = useSearchParams().get("error");
  if (!error) return null;

  return (
    <p
      role="alert"
      className="mb-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted"
    >
      {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.link}
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // すでに入っているなら本編へ返す
    (async () => {
      const {
        data: { session },
      } = await createClient().auth.getSession();
      if (session) router.replace("/");
    })();
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Life Hub</h1>
      <p className="mb-6 text-sm text-muted">
        考えてること・メモ・タスクをひとつにまとめる場所
      </p>

      <Suspense fallback={null}>
        <LoginNotice />
      </Suspense>

      <LoginForm />
    </main>
  );
}
