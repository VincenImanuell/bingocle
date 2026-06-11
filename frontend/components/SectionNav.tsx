const LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-to-play" },
  { label: "Game Flow", href: "#game-preview" },
  { label: "Community", href: "#beta" },
];

export default function SectionNav() {
  return (
    <nav aria-label="Primary" className="section-nav mt-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-5 sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {LINKS.map((l, i) => (
            <span key={l.label} className="flex items-center gap-5">
              {i > 0 && (
                <span className="nav-dot hidden sm:inline" aria-hidden="true">
                  ·
                </span>
              )}
              <a href={l.href}>{l.label}</a>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <a href="#footer" className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-gold/80" aria-hidden="true">
              <path d="M13 10h3l-.5 3H13v9h-3v-9H7v-3h3V8.2C10 5.9 11.2 4 14 4h2v3h-1.6c-1 0-1.4.5-1.4 1.4V10z" />
            </svg>
            X / Twitter
          </a>
          <span className="nav-dot" aria-hidden="true">
            |
          </span>
          <a href="#footer" className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-gold/80" aria-hidden="true">
              <path d="M21 5.5 18.4 18c-.2.9-.7 1.1-1.5.7l-4-3-1.9 1.9c-.2.2-.4.4-.8.4l.3-4.1 7.4-6.7c.3-.3-.1-.4-.5-.2L8.1 12.8l-3.9-1.2c-.9-.3-.9-.9.2-1.3l15.3-5.9c.7-.3 1.4.2 1.3 1.1z" />
            </svg>
            Telegram
          </a>
        </div>
      </div>
    </nav>
  );
}
