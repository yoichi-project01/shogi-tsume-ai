# AI詰将棋トレーナー

毎日挑戦できるAI詰将棋トレーニングWebアプリ。要件定義書は `Documents/AI詰将棋トレーニングWebアプリ_要件定義書.md` を参照。

## 現在の実装状況（MVP: フェーズ1〜2相当）

- ✅ 詰将棋ルールエンジン（合法手生成・王手判定・詰み判定・打ち歩詰め判定）: [`lib/shogi/`](./lib/shogi)
- ✅ 将棋盤UI・持ち駒・成り選択・ヒント・結果画面: [`components/`](./components)
- ✅ ゲストプレイ（`/play`）・デイリーチャレンジ（`/daily`、サンプル問題を日替わりで選択）
- ✅ Supabase Auth によるログイン・新規登録・パスワードリセット
- ✅ マイページ（ログイン時に成績を表示、未ログイン時は誘導）
- ✅ ランキング画面（現状はサンプルデータ表示）
- ✅ API雛形: `/api/puzzles/next`, `/api/attempts`（サーバー側で詰み判定）, `/api/ranking`, `/api/daily`
- ✅ 利用規約・プライバシーポリシー・お問い合わせページ
- ⏳ 未実装（フェーズ6相当）: AI問題自動生成、AI解説生成の自動化、5手詰以上、称号/バッジ、月間ランキング、管理者画面

サンプル問題は [`lib/shogi/puzzles.ts`](./lib/shogi/puzzles.ts) にハードコードされており（1手詰×2、3手詰×1）、
`Supabase` の `puzzles` テーブルが空でもアプリが遊べる状態を保っています（要件定義書 12.3 可用性方針）。

エンジンの自己検証スクリプト:

```bash
npm run verify:engine
```

## セットアップ

```bash
npm install
cp .env.local.example .env.local  # Supabaseのキーなどを設定
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認してください。Supabaseの環境変数を設定しなくても、
`/play` や `/daily` はサンプル問題でそのまま動作します（ログイン関連機能のみSupabase接続が必要です）。

## Supabaseのセットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. SQL Editor で [`supabase/schema.sql`](./supabase/schema.sql) を実行（テーブル・RLSポリシー・プロフィール自動作成トリガーを作成）
3. `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を設定
4. 必要に応じて `puzzles` / `daily_challenges` テーブルに検証済み問題を投入

## Netlifyへのデプロイ

このリポジトリには [`netlify.toml`](./netlify.toml) と `@netlify/plugin-nextjs` が含まれています。
Netlifyのサイト設定で GitHub リポジトリを接続し、環境変数（`.env.local.example` と同じキー）を設定してください。

## ディレクトリ構成

```text
app/            画面・APIルート（Next.js App Router）
components/     Board, Piece, HintBox, ResultModal などのUI部品
hooks/          usePuzzleSession（問題を解く一連のフローを管理）
lib/shogi/      将棋ルールエンジン（types / rules / validator / hints / puzzles）
lib/score.ts    スコア計算ロジック（要件定義書 11章に対応）
lib/supabase/   Supabaseクライアント（ブラウザ用・サーバー用）
types/          Supabaseテーブルに対応する型定義
supabase/       DBスキーマ・RLSポリシーのSQL
scripts/        エンジン検証用スクリプト
```

## 技術構成

Next.js (App Router) / TypeScript / Tailwind CSS / Supabase (PostgreSQL, Auth) / Netlify を採用。
詳細は要件定義書の「4. システム構成」を参照してください。
