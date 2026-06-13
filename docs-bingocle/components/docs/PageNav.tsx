"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siblings, href } from "@/lib/nav";

export function PageNav() {
  const pathname = usePathname();
  const slug = pathname.replace(/^\//, "").split("/").filter(Boolean);
  const { prev, next } = siblings(slug);
  if (!prev && !next) return null;

  return (
    <div className="page-nav">
      {prev ? (
        <Link href={href(prev.slug)} className="page-nav-card prev">
          <span className="page-nav-dir">← Previous</span>
          <span className="page-nav-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={href(next.slug)} className="page-nav-card next">
          <span className="page-nav-dir">Next →</span>
          <span className="page-nav-title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
