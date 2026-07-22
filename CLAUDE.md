@AGENTS.md

# AI詰将棋トレーナー — プロジェクトメモ

このファイルはClaude Code（および将来このリポジトリを触るエージェント）向けの申し送り事項です。
要件定義書の全文は `C:\Users\234005\Documents\AI詰将棋トレーニングWebアプリ_要件定義書.md` を参照してください。

## メンテナンス方針

このファイルを編集するときは、現在の状況を常にこのファイルに記載し、解決済みの内容はこのファイルから削除
すること。「ハマったポイント」のようなトラブルシュート履歴も、恒久的に有用な教訓（再発防止の知見）でない
限り、問題が解決したら削除する。過去の作業ログを溜め込む場所ではなく、今この時点でのプロジェクトの状態を
正確に映す文書として保つ。

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
- **問題の自動生成**: `lib/shogi/generator.ts` に実装済み。LLM（AI）は使わず、`lib/shogi/rules.ts` の合法手生成器
  をそのまま使った全探索ソルバー（`solveForced`）で「詰み手順が一意」「gote応手が強制1択」「短手数の余詰めが
  ない」ことを保証してから採用するアルゴリズム生成方式。正式な詰将棋ルール（王手は必ずかける／後手は合駒に
  盤上と先手の持ち駒以外の全ての駒を使える／最長の手数で逃げる）も`hasLiveAigomaOption`等で反映済み（合駒が
  現実的に可能な間合いの空いた王手は候補から除外する形で対応。「無駄合」の厳密な判定はしていない）。`/api/daily`
  がその日最初にアクセスされた時点で未生成なら生成→`puzzles`/`daily_challenges`テーブルへ保存（オンデマンド
  生成、Netlify Scheduled Functionは未使用）。生成に失敗しても`lib/dailyPuzzle.ts`のサンプル問題にフォール
  バックする。本番Supabaseへの実保存を`npm run seed:puzzles`（`scripts/backfill-puzzles.ts`、過去日付ぶんを
  まとめてバックフィル）で実地確認済み。5手詰は正しいチェックだと生成の成功率が下がるため（試行回数800→1200等
  で調整）、`/api/daily`は生成失敗時に3手詰・1手詰へ自動でフォールバックする設計。
- **1手詰の生成パターン多様化**: `buildOneMoveVariedPuzzle`が`generatePuzzleForLevel(1)`/`generateDailyPuzzle`の
  主経路（失敗時のみ頭金固定形の`buildOneMoveGoldDropPuzzle`にフォールバック）。3/5手詰と同じ
  `randomCandidateState`+`solveForced`のランダム探索・ソルバー検証方式だが、支え駒1〜2枚という当初の条件下
  では詰み1手が頭金（玉の頭に金を打つ形）に落ち着くケースが構造的に多く、2026-07の実測で本番プールの約77%が
  頭金一色になっていたため、以下2点で是正した。(1) `lib/shogi/tsumekata.ts`の`deriveMateTitle()`が返す
  タイトル（最終手の駒種と玉との位置関係から「頭金」「腹銀」等を判定）をキーに、出現しやすい形を間引く
  `OVERREPRESENTED_ONE_MOVE_SHAPES`（頭金=1/8, 脇金=1/4）でリジェクションサンプリングする。(2)
  `randomCandidateState`の盤上・持ち駒の枚数上限を[1,2]/[0,2]→[1,3]/[0,3]、玉の初期段も
  第3引数`allowThirdRank`（1手詰のみ有効化）で段0/1のみ→段2まで拡張し、腹・尻・背のような頭・脇以外の形も
  構造的に出現できるようにした（3/5手詰の探索予算はこの分布向けに未調整のため、この2点は1手詰専用）。
  捨てる分、試行回数も300→3000へ増加（玉近傍の駒数が少なく1回の探索は軽いため実用上は問題なし）。
  本番DBの重複・偏り是正は、デイリーチャレンジ紐付き・解答履歴ありの問題は残し、それ以外を
  `status='invalid_other'`にして一覧から除外する方式で継続的に実施しており、直近の実測（全293件）では
  Lv1 99件（最多タイトルの脇金でも38%）、Lv3 112件（最多タイトルの腹龍でも21%）、Lv5 82件（最多タイトルの
  頭香でも24%）と、単一パターンへの偏りは解消されている。`generator.ts`内の3つの生成関数すべてで
  `deriveMateTitle()`によるタイトルを使っており、旧来の`"N手詰（自動生成）"`という無機質な固定タイトルは
  廃止済み。
- **間違えた手の表示とアウト判定**（2026-07変更）: 従来は最終手（詰みを狙う手）以外を間違えても無表示で
  黙って再挑戦できる仕様だったが、中間手・最終手を問わずどの間違いにも`hooks/usePuzzleSession.ts`が
  「違います。」を表示するよう変更。あわせて`lib/shogi/validator.ts`の`submitMove`が同一局面
  （`moveIndex`が進まない間＝同じ間違い箇所）での連続誤答を`wrongAttemptsAtSpot`で数え、
  `MAX_WRONG_ATTEMPTS_PER_SPOT`（=3）に達すると`outcome: "out"`を返して`finished: true, success: false`で
  セッションを終了する（`ResultModal`の不正解表示・`onResigned`コールバックへ合流し、連続正解記録もリセット
  される）。正解して`moveIndex`が進むかその問題を解き終えるたびに`wrongAttemptsAtSpot`は0にリセットされる。
- **問題集**: `/puzzles`（一覧）・`/puzzles/[id]`（個別プレイ）を実装済み。`status='valid'`な`puzzles`を
  難易度→作成日時の順で一覧表示（デイリーチャレンジ由来のものは日付も表示）、Lv.1/3/5のタブで絞り込み可能。
  ログイン中は`puzzle_attempts`（`is_correct=true`）と突き合わせて解答済みバッジを表示する。Supabase未接続/
  データなしの場合は`SAMPLE_PUZZLES`3問にフォールバックする。日付に紐付かない練習用プールを
  `npm run seed:levels`（`scripts/generate-level-puzzles.ts`）でレベルごとにまとめて補充できる（Lv.1/3/5に
  各30件以上投入済み）。あるユーザーがそのレベルの未解答問題を解き尽くすと、`/api/attempts`が
  `lib/puzzlePool.ts`の`ensurePoolStocked`をレスポンス後（`next/server`の`after`）にバックグラウンドで呼び、
  同レベルの問題を自動で10件補充する。
- **解答記録**: `hooks/usePuzzleSession.ts`が問題を解く/投了するたびに`/api/attempts`へPOSTするようになった
  （以前はこのAPIがどこからも呼ばれておらず、成績が一切記録されていなかった）。
- **ランキング**: `/ranking`ページが`/api/ranking`を実際に呼ぶよう修正済み。`/api/ranking`は
  `puzzle_attempts`を`createServiceRoleClient()`（RLSで各ユーザーは自分の行しか見えないため）で集計する方式。
  daily/weekly/monthlyは`attempted_at`の期間で絞り込み、totalは全期間、streakは`profiles.current_streak`降順、
  no_hintは`used_hints=0`の正解のみ、speedは正解の平均解答時間昇順。当初UIタブは daily/weekly/total の3種のみで
  monthly/streak/no_hint/speedはAPI実装済みなのにUIから到達不能だったため、`/ranking`ページに全7タブを追加
  （streakタブのみ他と意味が異なる列＝連続正解数を持つため、専用のテーブル表示に分岐）。集計バッチが存在せず
  どこからも書き込まれない設計だった`rankings`テーブルは`schema.sql`から削除した（本番Supabaseに残っていても
  実害はないが、不要なら手動でdropして良い）。
- **お問い合わせ**: `/api/contact`は当初`console.log`するだけで実際の送信先が無く、フォームは常に「送信完了」
  を表示するのに内容が消えていた。`contact_messages`テーブル（RLSは有効化のみ・クライアント向けポリシー無し、
  service roleのみ読み書き）に保存する方式に修正済み。
- **認証はユーザー名+パスワードのみ**（2026-07変更）: `/login`・`/signup`はメールアドレスを収集しない。
  Supabase Authは内部的にemailを必須とするため、`lib/auth.ts`の`usernameToEmail()`でユーザー名から
  `<username>@users.shogi-tsume-ai.invalid`という実在しない決定的アドレスを生成し、それをSupabaseの
  email/passwordログインにそのまま使っている（ユーザー名の一意性はこの仕組み上、Supabase側のemail unique
  制約でも担保される）。ユーザー名は`USERNAME_PATTERN`（半角英数字・アンダースコア・ハイフン、1〜20文字）に
  制限（email local-partとして安全な文字種のみ許可するため）。メールを送らない前提のため
  パスワードリセット機能・`/auth/callback`（メール確認/リセットのリダイレクト先だった）は削除済み。
  **要対応**: Supabaseダッシュボードの `Authentication → Providers → Email` で
  「Confirm email」をOFFにすること。ONのままだと架空アドレス宛の確認メールが永遠に届かず、
  サインアップしたユーザーが誰もログインできなくなる。
- **`/play`はナビゲーションから外したが未削除**: `Header.tsx`のナビ・トップページ・マイページのCTAは
  すべて`/puzzles`に導線を一本化し、`/play`へのリンクはどこにも無い。ただし`app/play/page.tsx`自体は
  削除しておらず、URLを直接指定すればゲストプレイとして今も動く。リンク切れではなく意図的な整理なので、
  「参照されていないから」という理由だけで消さないこと。
- **`/daily`が「反応しない」ように見える不具合**: `getTodayChallenge`→`createTodayChallenge`が呼ぶ
  `generateDailyPuzzle()`はランダム探索＋詰み検証のため実測で最大6〜7秒かかることがある（その日最初のアクセス
  時のみ）。アプリ内に`loading.tsx`/`error.tsx`が1つも存在しなかったため、その間ブラウザは前の画面のまま
  変化がなく、クリックしても無反応に見えていた。`app/daily/loading.tsx`（スケルトン表示）と`app/error.tsx`
  （クライアント側の未捕捉エラーからの復帰導線）を追加して是正済み。他のSupabase依存ページ（`/puzzles`,
  `/mypage`, `/ranking`等）も同種の体感遅延が起こり得るが、`/daily`ほど重い処理はないため未対応。
- **未実装（フェーズ6相当、要件定義書参照）**: AI解説文生成の自動化（現状は`describeSolution`によるテンプレ
  文言）、称号/バッジ、管理者画面。
- **問題集で正解後に次の問題へ進める**（2026-07変更）: `/api/puzzles/next`はこれまでコード上に存在するだけで
  どこからも呼ばれておらず（難易度もプロフィールのlevel、未ログイン時は常にLv.1固定）、`ArchivePuzzleRunner`
  （`/puzzles/[id]`）の「次へ」ボタンは`/puzzles`一覧に戻るだけだった。`/api/puzzles/next`に`?difficulty=`
  クエリを追加（指定があればプロフィールのlevelより優先）し、`ArchivePuzzleRunner`が正解後にそのクエリへ今解いた
  問題のdifficultyを渡して次の未解答問題を取得、`/puzzles/[id]`へ直接遷移するようにした。取得失敗時・候補切れ
  時は従来どおり`/puzzles`一覧に戻る。`/play`（ゲストプレイ）と`/daily`は元から別方式（前者はサンプル問題を
  難易度内でループ、後者は1日1問なので「問題集を見る」に戻るのが妥当）のため変更していない。
- **ヒントの質**: `lib/shogi/hints.ts`の`getHint`は4段階（1=総論／2=着目マス／3=着目マス+駒種／4=正確な一手）で
  情報量が段階的に増える設計だが、駒を動かす手（打ち駒でない手）のstage3が、stage2と同じマス情報を繰り返す
  だけで駒種を教えていなかった（`PIECE_KANJI[... : "FU"]`という未使用のデッドコードがその名残）。打ち駒の
  stage3では駒種を教えていたのに、動かす手だけ手落ちだった。`session.state.board`から移動元マスの実際の駒を
  引いて駒種を教えるよう修正済み。今後ヒントのテキストを触る際は、`drop`/`board`の両方の分岐で段階ごとに
  実際に新情報が増えているかを確認すること。

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
- **`schema.sql`を編集しても本番DBには自動反映されない**: CHECK制約に新しい値を追加するなど`schema.sql`を
  更新しても、既にプロビジョニング済みのSupabaseプロジェクトには手動でSQLを実行するまで反映されない。
  これに気づかず`generation_type`に`'algorithmic'`を追加した際、本番DBの制約が古いままだったため
  `/api/daily`の保存が毎回サイレントに失敗し続けた（`try/catch`でサンプル問題にフォールバックするため
  エラーが表面化しなかった）。スキーマ変更時は必ずSupabaseダッシュボードのSQL Editorで対応する
  `ALTER TABLE`まで実行すること。
- **余詰め（cook）検出は「一意解なし」と「解なし」を区別すること**: `lib/shogi/generator.ts`の`solveForced`は
  当初、短手数の余詰めチェックに`solveExact`（唯一解を要求する関数）を流用していたが、`solveExact`は「短手数の
  詰みが存在しない」場合と「短手数の詰みの手段が複数（曖昧）存在する」場合の両方で`null`を返すため、後者
  （実際には余詰めがある）を誤って「問題なし」と判定してしまっていた。本番の自動生成問題129件中58件（3手詰・
  5手詰）がこのバグの影響で実際には1手詰めなどが混在しており、`invalid_dual_solution`に無効化して生成し直した。
  存在チェック専用の`hasForcedMateWithin`（唯一性を問わない）を別途用意して修正済み。今後ソルバー系のロジックを
  触る際は、「唯一解を要求する関数」と「存在確認だけでよい関数」を混同しないこと。
- **重要**: 過去のやり取りでSupabaseの `anon key` と `service_role key` を平文でチャットに貼ってしまった経緯が
  あるため、**ローテーション（再生成）推奨**を伝達済み。再生成した場合は `.env.local` とNetlify両方の値を
  更新すること。`.env.local` はコミット対象外（`.gitignore`で除外、`.env.local.example`のみ追跡）。

## ディレクトリ構成

```text
app/            画面・APIルート（Next.js App Router）
  api/            puzzles/next, attempts（サーバー側再検証）, ranking, daily, contact
  play/, daily/, puzzles/, puzzles/[id]/   PuzzleRunnerコンポーネントを利用した対局ページ
  login/, signup/  ユーザー名+パスワードのみのSupabase Auth（メールなし、lib/auth.ts参照）
  mypage/, ranking/, terms/, privacy/, contact/
components/     Board, Piece, Header, Footer, AdBanner, HintBox, ResultModal, PuzzleRunner,
                ArchivePuzzleRunner（問題集の個別プレイ）, LogoutButton
hooks/          usePuzzleSession（1局分の状態管理。effect内setState/Date.now()を避けたNext.js16 lint対応版）
lib/auth.ts     ユーザー名⇔Supabase Auth用ダミーemailの変換（usernameToEmail, USERNAME_PATTERN）
lib/shogi/      将棋ルールエンジン（types / rules / validator / hints / puzzles / generator）
lib/score.ts    スコア計算ロジック（要件定義書11章）
lib/dailyPuzzle.ts  日替わり問題選出（Supabase未接続時のフォールバック）
lib/dailyChallenge.ts  デイリーチャレンジの取得/生成（/api/daily と /daily ページ共通）
lib/puzzlePool.ts  問題プールの補充ロジック（生成→保存の共通処理、レベル別の枯渇検知）
lib/supabase/   Supabaseクライアント（client.ts=ブラウザ用, server.ts=サーバー用+service role）
types/          Supabaseテーブルに対応する型定義
supabase/       DBスキーマ・RLSポリシーSQL（schema.sql）
scripts/verify-engine.ts  将棋エンジンの自己検証スクリプト（`npm run verify:engine`）
scripts/backfill-puzzles.ts  デイリー問題の一括生成・バックフィル（`npm run seed:puzzles -- [件数]`）
scripts/generate-level-puzzles.ts  レベル別（1/3/5手詰）の練習プールを一括生成（`npm run seed:levels -- [件数]`）
```

## よく使うコマンド

```bash
npm run dev            # 開発サーバー
npm run build           # 本番ビルド（型チェック含む）
npm run lint             # ESLint
npm run verify:engine    # 詰将棋ルールエンジンの自己検証（サンプル問題を実際に解いて詰みまで確認）
npm run seed:puzzles     # デイリー問題を過去日付ぶんまとめて生成・保存（.env.localのSupabase設定が必要）
npm run seed:levels      # 練習プール問題をレベル別にまとめて生成・保存（同上）
```

## 設計上の注意点

- **サーバー側での再検証必須**（要件6.11 不正対策）: `app/api/attempts/route.ts` はクライアントから送られた
  指し手をそのまま信用せず、`lib/shogi/validator.ts` の `submitMove` で毎回サーバー側から再現・判定している。
- **Supabase未設定でも壊れないこと**（要件12.3 可用性方針）: `/api/puzzles/next`, `/api/attempts`,
  `/api/daily`, `/api/ranking` はすべてSupabase呼び出しをtry/catchで囲み、失敗時はサンプル問題や空データに
  フォールバックする。新しくSupabase呼び出しを追加する際もこの方針を踏襲すること。
- **Reactフックのlintルール対応**: `lib/shogi/validator.ts` の元 `useHint` は `markHintUsed` に改名済み
  （ESLintが"use"始まりの関数をフックと誤認するため）。同様の命名は避けること。
