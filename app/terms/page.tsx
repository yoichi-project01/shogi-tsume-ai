export const metadata = { title: "利用規約 | AI詰将棋トレーナー" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-neutral-700">
      <h1 className="text-xl font-bold text-neutral-900">利用規約</h1>

      <section className="mt-6 space-y-4">
        <p>
          この利用規約（以下、「本規約」といいます。）は、AI詰将棋トレーナー（以下、「本サービス」といいます。）の利用条件を定めるものです。
          登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
        </p>

        <h2 className="font-bold text-neutral-900">第1条（サービスの利用条件）</h2>
        <p>
          ユーザーは、本規約に同意の上、本サービスが定める方法により利用登録を行うものとします。
          未登録の場合でも、ゲストプレイとして一部機能を利用できますが、成績の保存やランキング登録は行われません。
        </p>

        <h2 className="font-bold text-neutral-900">第2条（禁止事項）</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>法令または公序良俗に違反する行為</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>不正な手段によるスコア・ランキングの操作</li>
          <li>解答APIへの直接送信など、通常の操作を経ない不正なリクエスト</li>
          <li>他のユーザーになりすます行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>

        <h2 className="font-bold text-neutral-900">第3条（免責事項）</h2>
        <p>
          本サービスは、詰将棋の学習支援を目的として提供されるものであり、内容の正確性・完全性について保証するものではありません。
          本サービスの利用により生じた損害について、運営者は一切の責任を負わないものとします。
        </p>

        <h2 className="font-bold text-neutral-900">第4条（アカウントの停止）</h2>
        <p>
          運営者は、ユーザーが本規約に違反したと判断した場合、事前の通知なくアカウントの利用を停止できるものとします。
          特に、ランキングにおける不正行為が確認された場合は、該当スコアの削除およびアカウント停止の対象となります。
        </p>

        <h2 className="font-bold text-neutral-900">第5条（広告掲載）</h2>
        <p>
          本サービスでは、Google AdSense等の第三者配信の広告サービスを利用する場合があります。
          広告配信事業者は、ユーザーの興味に応じた広告を表示するためCookie等を使用することがあります。
        </p>

        <h2 className="font-bold text-neutral-900">第6条（規約の変更）</h2>
        <p>
          運営者は、必要と判断した場合には、ユーザーへの事前通知なく本規約を変更できるものとします。
        </p>
      </section>
    </div>
  );
}
