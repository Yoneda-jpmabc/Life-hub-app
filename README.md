# Life Hub

考えてること・メモ・タスクを、ひとつの入力欄で受け止めて一箇所に貯める個人用アプリ。
アプリを行き来せんでええようにするのが目的。

## 動かす

```bash
npm run dev
```

http://localhost:3000 を開く。ログインしてなければログイン画面に飛ぶ。

## ログインの仕組み

メールアドレスを入れると Supabase からログイン用リンクが届く。パスワードは無い。
リンクを踏むと `/auth/confirm` に着地してセッションが張られる。

> 無料プランの標準メール送信は **1時間に数通** の制限がある。連続で送ると弾かれるので、
> 本格的に使い出すときは Supabase 側で独自の SMTP を設定する。

## スマホのホーム画面に置く

PWA 対応済み。スマホのブラウザで開いて「ホーム画面に追加」すると、
アドレスバー無しのアプリとして立ち上がる。

同じ Wi-Fi 内なら `npm run dev` の Network アドレスでスマホからも確認できる。
外からも使いたい場合は Vercel などにデプロイする。

## 構成

| 場所 | 中身 |
| --- | --- |
| `src/app/page.tsx` | 中核画面。入力欄 + 一覧 + 絞り込み |
| `src/app/actions.ts` | 保存・完了・編集・削除の Server Action |
| `src/components/` | 入力欄、一覧の各行、ログインフォーム |
| `src/lib/supabase/` | ブラウザ用・サーバー用・セッション更新用のクライアント |
| `supabase/migrations/` | 適用済みの SQL |
| `scripts/generate-icons.mjs` | PWA アイコンの生成 |

## データ

`public.entries` の1テーブルにすべて入る。`kind` が `thought` / `note` / `task`。
本文に `#タグ` を混ぜて書くと `tags` に自動で入る。

RLS が効いてるので、ログインした本人の行しか読み書きできない。

## デプロイするとき

Vercel などに上げる場合:

1. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定
2. Supabase ダッシュボードの Authentication → URL Configuration で
   Site URL と Redirect URLs に本番の URL を追加する（これを忘れるとログインリンクが localhost に飛ぶ）
