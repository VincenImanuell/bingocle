"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import index from "@/lib/search-index.json";

type Entry = {
  title: string;
  group: string;
  path: string;
  headings: string[];
  text: string;
};

type Hit = { entry: Entry; score: number; snippet?: string };

const ENTRIES = index as Entry[];

function scoreEntry(e: Entry, q: string): Hit | null {
  const ql = q.toLowerCase();
  const title = e.title.toLowerCase();
  let score = 0;
  if (title === ql) score += 100;
  else if (title.startsWith(ql)) score += 60;
  else if (title.includes(ql)) score += 40;

  if (e.group.toLowerCase().includes(ql)) score += 8;

  const heads = e.headings.join(" · ").toLowerCase();
  if (heads.includes(ql)) score += 25;

  let snippet: string | undefined;
  const ti = e.text.toLowerCase().indexOf(ql);
  if (ti !== -1) {
    score += 12;
    const start = Math.max(0, ti - 40);
    snippet =
      (start > 0 ? "…" : "") +
      e.text.slice(start, ti + ql.length + 60).trim() +
      "…";
  }
  return score > 0 ? { entry: e, score, snippet } : null;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-search", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-search", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim();
    if (!term) {
      return ENTRIES.slice(0, 8).map((entry) => ({ entry, score: 0 }));
    }
    return ENTRIES.map((e) => scoreEntry(e, term))
      .filter((x): x is Hit => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active].entry.path);
    }
  }

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onListKey}
      >
        <div className="cmdk-input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="m20 20-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search docs…"
            aria-label="Search docs"
          />
          <kbd className="cmdk-esc">Esc</kbd>
        </div>

        <ul className="cmdk-list">
          {hits.length === 0 && (
            <li className="cmdk-empty">No results for “{q}”.</li>
          )}
          {hits.map((h, i) => (
            <li key={h.entry.path}>
              <button
                type="button"
                className={"cmdk-item" + (i === active ? " is-active" : "")}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h.entry.path)}
              >
                <span className="cmdk-group">{h.entry.group}</span>
                <span className="cmdk-title">{h.entry.title}</span>
                {h.snippet && <span className="cmdk-snippet">{h.snippet}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
