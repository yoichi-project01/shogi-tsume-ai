@AGENTS.md

# AI詰将棋トレーナー — プロジェクトメモ

このファイルはClaude Code（および将来このリポジトリを触るエージェント）向けの申し送り事項です。
要件定義書の全文は `C:\Users\234005\Documents\AI詰将棋トレーニングWebアプリ_要件定義書.md` を参照してください。

## プロジェクト概要

毎日挑戦できるAI詰将棋トレーニングWebアプリ。Next.js (App Router) / TypeScript / Tailwind CSS / Supabase
(PostgreSQL, Auth) / Netlify 構成。要件定義書のフェーズ1〜2（基盤構築・詰将棋プレイ機能）を実際に動く
MVPとして実装済み。詳細な実装状況チェックリストは `README.md` を参照。

## 現在の状況（2026-07時点）

- **開発**: ローカルで `npm run dev` 起動確認済み。ゲストプレイ（`/play`）・デイリーチャレンジ（`/daily`）は
  Supabase未接続でも `lib/shogi/puzzles.ts` のサンプル問題（1手詰×2、3手詰×1）で動作する設計。
- **Supabase**: プロジェクト作成済み・`supabase/schema.sql` 投入済み・接続確認済み（下記「ハマったポイント」参照）。
- **Netlify**: GitHubリポジトリ（`https://github.com/yoichi-project01/shogi-tsume-ai`, `master`ブランチ）を
  連携してデプロイ済み。ビルドコマンド `npm run build`、`@netlify/plugin-nextjs` 使用。
- **Git**: `master` ブランチのみ。直近コミット `d19ed3f`（MVP一式）。リモート push 済み。
- **未実装（フェーズ6相当、要件定義書参照）**: AI問題自動生成、AI解説生成の自動化、5手詰以上、称号/バッジ、
  月間ランキング、管理者画面。

## ハマったポイント（デプロイ作業でのトラブルシュート履歴）

- **Supabaseの新しいAPIキー体系に注意**: Supabaseダッシュボードが刷新され、`Project Settings → API` に
  「Project URL」が直接表示されず、`Project Settings → Data API` に移動していた。さらに新形式のキー
  （`sb_publishable_...` / `sb_secret_...`）と旧来のJWT形式（`anon` / `service_role`）が並んで表示されるため、
  **`NEXT_PUBLIC_SUPABASE_URL` に誤って `sb_publishable_...` キーを入れてしまうミスが発生した**
  （→ `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.` エラーの原因）。
  - Project URLは `https://<project-ref>.supabase.co` の形式。project refはJWTペイロード（`ref`クレーム）や
    ダッシュボードのURL (`supabase.com/dashboard/project/<ref>/...`) からも確認できる。
- **Netlifyの`NEXT_PUBLIC_*`環境変数はビルド時に埋め込まれる**: 環境変数をNetlify側で変更しただけでは
  反映されず、**「Trigger deploy → Clear cache and deploy site」で再デプロイが必須**（キャッシュ付き再デプロイ
  でないと古いビルド成果物が使われ続けることがある）。
- **重要**: 過去のやり取りでSupabaseの `anon key` と `service_role key` を平文でチャットに貼ってしまった経緯が
  あるため、**ローテーション（再生成）推奨**を伝達済み。再生成した場合は `.env.local` とNetlify両方の値を
  更新すること。`.env.local` はコミット対象外（`.gitignore`で除外、`.env.local.example`のみ追跡）。

## ディレクトリ構成

```text
app/            画面・APIルート（Next.js App Router）
  api/            puzzles/next, attempts（サーバー側再検証）, ranking, daily, contact
  play/, daily/   PuzzleRunnerコンポーネントを利用した対局ページ
  login/, signup/, reset-password/, auth/callback/  Supabase Auth
  mypage/, ranking/, terms/, privacy/, contact/
components/     Board, Piece, Header, Footer, AdBanner, HintBox, ResultModal, PuzzleRunner
hooks/          usePuzzleSession（1局分の状態管理。effect内setState/Date.now()を避けたNext.js16 lint対応版）
lib/shogi/      将棋ルールエンジン（types / rules / validator / hints / puzzles）
lib/score.ts    スコア計算ロジック（要件定義書11章）
lib/dailyPuzzle.ts  日替わり問題選出（Supabase未接続時のフォールバック）
lib/supabase/   Supabaseクライアント（client.ts=ブラウザ用, server.ts=サーバー用+service role）
types/          Supabaseテーブルに対応する型定義
supabase/       DBスキーマ・RLSポリシーSQL（schema.sql）
scripts/verify-engine.ts  将棋エンジンの自己検証スクリプト（`npm run verify:engine`）
```

## よく使うコマンド

```bash
npm run dev            # 開発サーバー
npm run build           # 本番ビルド（型チェック含む）
npm run lint             # ESLint
npm run verify:engine    # 詰将棋ルールエンジンの自己検証（サンプル問題を実際に解いて詰みまで確認）
```

## 設計上の注意点

- **サーバー側での再検証必須**（要件6.11 不正対策）: `app/api/attempts/route.ts` はクライアントから送られた
  指し手をそのまま信用せず、`lib/shogi/validator.ts` の `submitMove` で毎回サーバー側から再現・判定している。
- **Supabase未設定でも壊れないこと**（要件12.3 可用性方針）: `/api/puzzles/next`, `/api/attempts`,
  `/api/daily`, `/api/ranking` はすべてSupabase呼び出しをtry/catchで囲み、失敗時はサンプル問題や空データに
  フォールバックする。新しくSupabase呼び出しを追加する際もこの方針を踏襲すること。
- **Reactフックのlintルール対応**: `lib/shogi/validator.ts` の元 `useHint` は `markHintUsed` に改名済み
  （ESLintが"use"始まりの関数をフックと誤認するため）。同様の命名は避けること。
