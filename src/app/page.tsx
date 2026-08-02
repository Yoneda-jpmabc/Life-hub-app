import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import { EntryBoard } from "@/components/entry-board";
import { ENTRY_KINDS, KIND_LABELS, isEntryKind } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";

type Search = { view?: string; done?: string };

function buildHref(view: string | undefined, showDone: boolean) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (showDone) params.set("done", "1");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { view, done } = await searchParams;
  const supabase = await createClient();

  // getClaims は JWKS でその場で検証するので認証サーバーへの往復が要らない
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const activeView = isEntryKind(view) ? view : undefined;
  const showDone = done === "1";

  let query = supabase
    .from("entries")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(200);

  if (activeView) query = query.eq("kind", activeView);
  // 完了済みは既定で伏せる。done を持つのは実質タスクだけ。
  if (!showDone) query = query.eq("done", false);

  const { data: entries, error } = await query;

  const tabs: { key: string | undefined; label: string }[] = [
    { key: undefined, label: "すべて" },
    ...ENTRY_KINDS.map((kind) => ({ key: kind as string, label: KIND_LABELS[kind] })),
  ];

  const filters = (
    <nav className="mt-6 flex flex-wrap items-center gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={buildHref(tab.key, showDone)}
          aria-current={activeView === tab.key ? "page" : undefined}
          className={
            activeView === tab.key
              ? "rounded-full bg-surface px-3 py-1 text-sm font-medium ring-1 ring-border"
              : "rounded-full px-3 py-1 text-sm text-muted transition-colors hover:text-foreground"
          }
        >
          {tab.label}
        </Link>
      ))}
      <Link
        href={buildHref(activeView, !showDone)}
        className="ml-auto text-xs text-muted underline transition-colors hover:text-foreground"
      >
        {showDone ? "完了を隠す" : "完了も見る"}
      </Link>
    </nav>
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6">
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Life Hub</h1>
        <form action={signOut}>
          <button type="submit" className="text-xs text-muted hover:text-foreground">
            {auth?.claims.email ?? "ログイン中"} / ログアウト
          </button>
        </form>
      </header>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-muted">
          読み込めんかった: {error.message}
        </p>
      ) : (
        <EntryBoard
          entries={entries ?? []}
          view={activeView}
          showDone={showDone}
          userId={userId}
          filters={filters}
        />
      )}
    </main>
  );
}
