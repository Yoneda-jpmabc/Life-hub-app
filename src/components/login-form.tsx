"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(`${email} にログイン用のリンクを送った。メールを開いてな。`);
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm">{message}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-3 text-xs text-muted underline"
        >
          別のアドレスで送り直す
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-5"
    >
      <label htmlFor="email" className="block text-sm text-muted">
        メールアドレス宛にログイン用のリンクを送る。パスワードは要らん。
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-50"
      >
        {status === "sending" ? "送信中…" : "ログインリンクを送る"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-xs text-muted">
          送れんかった: {message}
        </p>
      )}
    </form>
  );
}
