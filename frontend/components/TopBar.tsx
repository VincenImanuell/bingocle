import Link from "next/link";
import ConnectWalletButton from "./ConnectWalletButton";

const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-to-play", desktopOnly: true },
  { label: "Game Flow", href: "#game-preview", desktopOnly: true },
  { label: "Community", href: "#beta", desktopOnly: true },
  { label: "Docs", href: "#footer", desktopOnly: true },
];

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-4">
        <nav
          aria-label="Utility"
          className="flex items-center gap-3 sm:gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map((item, i) => (
            <span
              key={item.label}
              className={`flex items-center gap-3 sm:gap-5${
                item.desktopOnly ? " max-sm:hidden" : ""
              }`}
            >
              {i > 0 && (
                <span className="nav-dot hidden sm:inline" aria-hidden="true">
                  ✦
                </span>
              )}
              <a className="topbar-link" href={item.href}>
                {item.label}
              </a>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/app" className="btn btn-blood hidden md:inline-flex">
            Launch App
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
