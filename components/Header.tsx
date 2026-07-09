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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-neutral-900">
          AI詰将棋トレーナー
        </Link>
        <nav className="flex items-center gap-4 text-sm text-neutral-600">
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
