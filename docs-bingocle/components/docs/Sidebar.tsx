"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, href } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener("toggle-nav", toggle as EventListener);
    return () =>
      window.removeEventListener("toggle-nav", toggle as EventListener);
  }, []);

  // close the mobile drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div
        className={"sidebar-scrim" + (open ? " is-open" : "")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside className={"sidebar" + (open ? " is-open" : "")}>
        <nav className="sidebar-nav" aria-label="Documentation">
          {NAV.map((section) => (
            <div className="nav-group" key={section.group}>
              <p className="nav-group-title">{section.group}</p>
              <ul>
                {section.items.map((item) => {
                  const url = href(item.slug);
                  const active = pathname === url;
                  return (
                    <li key={url}>
                      <Link
                        href={url}
                        className={"nav-link" + (active ? " is-active" : "")}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
