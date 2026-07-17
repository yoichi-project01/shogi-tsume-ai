import Link from "next/link";
import PieceMoveDiagram from "@/components/PieceMoveDiagram";
import { BASE_PIECE_ORDER, PIECE_INFO } from "@/lib/shogi/pieceInfo";

export const metadata = { title: "駒の動かし方 | AI詰将棋トレーナー" };

export default function HowToPlayPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed text-neutral-700">
      <h1 className="text-xl font-bold text-neutral-900">駒の動かし方</h1>

      <section className="mt-4 space-y-2">
        <p>
          将棋の駒は、それぞれ違う方向・違う距離に動けます。図の
          <span className="mx-1 inline-block rounded-sm border border-neutral-800 bg-amber-200 px-1.5 font-bold">駒</span>
          が今いるマス、
          <span className="mx-1 inline-block rounded-sm border border-green-400 bg-green-100 px-1.5 text-green-600">●</span>
          が動けるマスです。図はすべて自分（下側・先手）から見た向きで、「上」が相手陣（前方向）です。
        </p>
        <p>
          香車・角・飛車のように「何マスでも進める」駒は、図では盤の端まで●がついていますが、実際は途中に駒があればそこで止まり、
          さらに先まで自由な距離を進めます。
        </p>
      </section>

      <section className="mt-8 space-y-6">
        {BASE_PIECE_ORDER.map((type) => {
          const info = PIECE_INFO[type];
          const promoted = (Object.values(PIECE_INFO) as (typeof info)[]).find((p) => p.promotesFrom === type);
          return (
            <div key={type} className="rounded border border-neutral-200 p-4">
              <div className="flex flex-wrap items-start gap-4">
                <PieceMoveDiagram type={type} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-neutral-900">
                    {info.kanji}
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {info.name}（{info.reading}）
                    </span>
                  </h2>
                  <p className="mt-1">{info.description}</p>
                </div>
              </div>

              {promoted && (
                <div className="mt-4 flex flex-wrap items-start gap-4 border-t border-dashed border-neutral-200 pt-4">
                  <PieceMoveDiagram type={promoted.type} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-red-600">
                      成ると「{promoted.kanji}」
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        {promoted.name}（{promoted.reading}）
                      </span>
                    </h3>
                    <p className="mt-1">{promoted.description}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-8 space-y-4 rounded border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-bold text-neutral-900">「成る」って何？</h2>
        <p>
          歩・香車・桂馬・銀将・角・飛車は、相手陣（盤の向こう側3段）に入る手で「成る」ことができ、上の表のとおりより強い動きに変化します。
          金将と玉将は成れません。一度成った駒は、取られて持ち駒に戻るまで元に戻りません。
        </p>
        <h2 className="font-bold text-neutral-900">「持ち駒」って何？</h2>
        <p>
          相手の駒を取ると、その駒は自分の「持ち駒」になります。持ち駒は、盤上の空いているマスならどこにでも自分の駒として打つことができます
          （歩を打って直接王手で相手玉を詰ませる「打ち歩詰め」だけは反則です）。
        </p>
      </section>

      <div className="mt-8 text-center">
        <Link href="/play" className="rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700">
          さっそく詰将棋を解いてみる
        </Link>
      </div>
    </div>
  );
}
