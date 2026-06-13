"use client";

import { usePathname } from "next/navigation";
import { findItem, groupOf } from "@/lib/nav";

export function Breadcrumb() {
  const pathname = usePathname();
  const slug = pathname.replace(/^\//, "").split("/").filter(Boolean);
  const item = findItem(slug);
  const group = groupOf(slug);
  if (!item || !group) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <span>{group}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m9 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="breadcrumb-current">{item.title}</span>
    </nav>
  );
}
