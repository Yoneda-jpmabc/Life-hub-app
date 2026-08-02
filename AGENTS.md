<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Life Hub

考えてること・メモ・タスク・（今後）スケジュールとお金を1つのアプリで扱う個人用アプリ。

## 構成

- Next.js 16 (App Router, Turbopack) + Tailwind v4 + TypeScript
- Supabase (Postgres + Auth)。プロジェクト ref: `hqjoncbueuadqxkkpdsn`（東京リージョン）
- 認証はメールのマジックリンクのみ。パスワードは使わない
- `src/proxy.ts` がセッション更新を担当（Next 16 で `middleware.ts` は非推奨）

## データ設計の考え方

`public.entries` の1テーブルで思考・メモ・タスクをすべて受け止める。`kind` 列で
区別するだけにして、種類を跨いだ検索や横断表示を後から足しやすくしてある。
スケジュールやお金を足すときも、まず「entries に列を足して済むか」を先に検討する。

RLS で `auth.uid() = user_id` の行だけ読み書きできる。新しいテーブルを足したら
必ず RLS を有効にしてポリシーを書くこと。

## 作業時の注意

- スキーマを変えたら `supabase/migrations/` に SQL を残し、型定義を生成し直す
- アイコンを変えたら `node scripts/generate-icons.mjs`
- `.env.local` は git 管理外。接続情報は `.env.example` を参照
