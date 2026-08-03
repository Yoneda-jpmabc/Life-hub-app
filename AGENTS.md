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
- `src/proxy.ts` がセッション更新を担当（Next 16 で `middleware.ts` は非推奨）。
  トップ画面を静的配信のままにするため、matcher は `/login` だけに絞ってある

## 画面の作り

トップ画面 (`/`) はサーバー処理を持たない静的ページで、中身は
`src/components/home-screen.tsx` が端末側で描く。データは Supabase を
直接読み書きし、結果を localStorage に控えて次回の初期表示に使う。

回線が細い環境で体感を保つための構成なので、ここにサーバー処理を
足し戻すときは、通信回数が増えないか確認すること。

## データ設計の考え方

`public.entries` の1テーブルで思考・メモ・タスク・勤務をすべて受け止める。`kind` 列で
区別するだけにして、種類を跨いだ検索や横断表示を後から足しやすくしてある。
スケジュールやお金を足すときも、まず「entries に列を足して済むか」を先に検討する。

経験値は列に持たず、`src/lib/xp.ts` の決まりに沿って entries から毎回組み立てる。
保存すると「記録は消したのに経験値だけ残る」食い違いが出るうえ、数え方を直したときに
過去の分を数え直せなくなる。数え方を変えるときは xp.ts の定数だけ触ればよい。

RLS で `auth.uid() = user_id` の行だけ読み書きできる。新しいテーブルを足したら
必ず RLS を有効にしてポリシーを書くこと。

## 作業時の注意

- スキーマを変えたら `supabase/migrations/` に SQL を残し、型定義を生成し直す
- アイコンを変えたら `node scripts/generate-icons.mjs`
- キャラクターの絵を変えたら `node scripts/generate-characters.mjs`

見た目は差し替えられるようにしてある。キャラクターの絵は `art/characters/` の
ファイルを置き換えるだけで済み、段階そのものは `src/lib/ranks.ts` の1枚から
称号もキャラも引く。経験値の計算は見た目と切れているので、デザインを変えても
数え方には影響しない。この分かれ方は保っておくこと。
- `.env.local` は git 管理外。接続情報は `.env.example` を参照
