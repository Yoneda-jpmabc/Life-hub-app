import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  expired:
    "リンクの期限が切れてるか、もう使ったあとやった。下からもう一度送ってな。",
  exchange:
    "リンクを要求したブラウザと、リンクを開いたブラウザが違うみたい。同じブラウザで開き直すと通る。",
  denied: "ログインが拒否された。もう一度試してみて。",
  link: "リンクの形式を読み取れんかった。もう一度送ってな。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.link) : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Life Hub</h1>
      <p className="mb-6 text-sm text-muted">
        考えてること・メモ・タスクをひとつにまとめる場所
      </p>

      {message && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted"
        >
          {message}
        </p>
      )}

      <LoginForm />
    </main>
  );
}
