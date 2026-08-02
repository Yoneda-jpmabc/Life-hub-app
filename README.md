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
| `src/app/page.tsx` | 静的な入れ物。サーバー処理を持たず CDN から返る |
| `src/components/home-screen.tsx` | 中核画面。読み込み・保存・絞り込みをすべて端末側で行う |
| `src/components/` | 入力欄、一覧の各行、ログインフォーム |
| `src/lib/entry-cache.ts` | 前回の一覧を端末に控える処理 |
| `src/lib/supabase/` | ブラウザ用・サーバー用・セッション更新用のクライアント |
| `supabase/migrations/` | 適用済みの SQL |
| `scripts/generate-icons.mjs` | PWA アイコンの生成 |

## 画面の作りについて

トップ画面はサーバーを経由せず、端末から Supabase を直接読み書きする。
他人の行に触れないことは RLS がデータベース側で保証しているので、
間にサーバーを挟んで検査する必要がない。

この構成のおかげで、絞り込みの切り替えは通信なしで完結し、
2回目以降の起動は前回の内容を即座に描いてから裏で更新する。

## データ

`public.entries` の1テーブルにすべて入る。`kind` が `thought` / `note` / `task`。
本文に `#タグ` を混ぜて書くと `tags` に自動で入る。

RLS が効いてるので、ログインした本人の行しか読み書きできない。

## デプロイするとき

Vercel などに上げる場合:

1. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定
2. Supabase ダッシュボードの Authentication → URL Configuration で
   Site URL と Redirect URLs に本番の URL を追加する（これを忘れるとログインリンクが localhost に飛ぶ）
