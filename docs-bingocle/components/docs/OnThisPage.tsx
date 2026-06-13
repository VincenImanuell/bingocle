"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Head = { id: string; text: string; level: number };

// Reads h2/h3 (given ids by rehype-slug) out of the rendered article and keeps
// the active anchor in sync with scroll position.
export function OnThisPage() {
  const pathname = usePathname();
  const [heads, setHeads] = useState<Head[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const article = document.querySelector("article.prose");
    if (!article) return;
    const nodes = Array.from(
      article.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]")
    );
    setHeads(
      nodes.map((n) => ({
        id: n.id,
        text: n.textContent ?? "",
        level: Number(n.tagName[1]),
      }))
    );

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [pathname]);

  if (heads.length === 0) return null;

  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <ul>
        {heads.map((h) => (
          <li key={h.id} className={h.level === 3 ? "toc-sub" : ""}>
            <a
              href={`#${h.id}`}
              className={active === h.id ? "is-active" : ""}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
