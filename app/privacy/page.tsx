export const metadata = { title: "プライバシーポリシー | AI詰将棋トレーナー" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-neutral-700">
      <h1 className="text-xl font-bold text-neutral-900">プライバシーポリシー</h1>

      <section className="mt-6 space-y-4">
        <h2 className="font-bold text-neutral-900">1. 取得する情報</h2>
        <p>
          本サービスは、利用登録時にメールアドレス・ユーザー名を取得します。
          また、詰将棋の解答履歴、正答率、解答時間、ヒント使用回数などの学習データを取得・記録します。
        </p>

        <h2 className="font-bold text-neutral-900">2. 利用目的</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>ユーザー認証およびアカウント管理のため</li>
          <li>成績に応じた難易度の自動調整のため</li>
          <li>ランキング・デイリーチャレンジ機能の提供のため</li>
          <li>サービス改善のための分析のため</li>
        </ul>

        <h2 className="font-bold text-neutral-900">3. Supabaseによる認証・データ保存</h2>
        <p>
          本サービスは、認証基盤およびデータベースとしてSupabaseを利用しています。
          ユーザーの登録情報および学習データは、Supabaseのインフラ上に保存されます。
        </p>

        <h2 className="font-bold text-neutral-900">4. Google AdSenseによる広告配信</h2>
        <p>
          本サービスでは、第三者配信の広告サービスであるGoogle
          AdSenseを利用しています。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
          Cookieを無効にする方法や、Googleの広告に関するポリシーの詳細については、Googleのポリシーおよび規約をご確認ください。
        </p>

        <h2 className="font-bold text-neutral-900">5. Cookieの利用</h2>
        <p>
          本サービスは、ログイン状態の維持や利用状況の分析のためにCookieを使用します。
          ブラウザの設定によりCookieを無効化できますが、一部機能が利用できなくなる場合があります。
        </p>

        <h2 className="font-bold text-neutral-900">6. お問い合わせ先</h2>
        <p>
          個人情報の取り扱いに関するお問い合わせは、
          <a href="/contact" className="text-amber-700 hover:underline">
            お問い合わせページ
          </a>
          よりご連絡ください。
        </p>
      </section>
    </div>
  );
}
