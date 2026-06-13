"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { REPO_URL, href, HOME_SLUG } from "@/lib/nav";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle navigation"
            onClick={() => window.dispatchEvent(new Event("toggle-nav"))}
          >
            <span />
            <span />
            <span />
          </button>
          <Link href={href(HOME_SLUG)} className="brand">
            <Logo />
            <span className="brand-name">Bingocle Docs</span>
          </Link>
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className="search-trigger"
            onClick={() => window.dispatchEvent(new Event("open-search"))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="m20 20-3-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>Search docs…</span>
            <kbd>Ctrl K</kbd>
          </button>

          <a
            className="gh-link"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.8 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z" />
            </svg>
            <span className="gh-text">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
