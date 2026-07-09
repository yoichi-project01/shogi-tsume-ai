import Link from "next/link";

const NAV_LINKS = [
  { href: "/play", label: "詰将棋を解く" },
  { href: "/daily", label: "デイリーチャレンジ" },
  { href: "/ranking", label: "ランキング" },
  { href: "/mypage", label: "マイページ" },
];

export default function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-base font-bold text-neutral-900 sm:text-lg">
          AI詰将棋トレーナー
        </Link>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-neutral-600 sm:gap-x-4">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-amber-700">
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-700"
          >
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
}
