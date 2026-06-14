import Link from "next/link";
import ConnectWalletButton from "./ConnectWalletButton";

const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://bingocle-doc.vercel.app";

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-to-play", desktopOnly: true },
  { label: "Game Flow", href: "#game-preview", desktopOnly: true },
  { label: "Community", href: "#beta", desktopOnly: true },
  { label: "Docs", href: DOCS_URL, desktopOnly: true, external: true },
];

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="mx-auto flex min-h-9 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-1.5">
        <nav
          aria-label="Utility"
          className="flex flex-nowrap items-center gap-x-3 sm:gap-x-4"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              className={`topbar-link${item.desktopOnly ? " max-sm:hidden" : ""}`}
              href={item.href}
              {...(item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/app" className="btn btn-blood inline-flex">
            Launch App
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
