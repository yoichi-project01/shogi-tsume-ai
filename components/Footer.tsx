import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/contact", label: "お問い合わせ" },
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-sm text-neutral-500">
        <nav className="flex flex-wrap justify-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-amber-700">
              {link.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} AI詰将棋トレーナー</p>
      </div>
    </footer>
  );
}
