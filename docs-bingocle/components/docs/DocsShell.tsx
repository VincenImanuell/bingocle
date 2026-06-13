import type { ReactNode } from "react";
import { Starfield } from "./Starfield";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { OnThisPage } from "./OnThisPage";
import { Breadcrumb } from "./Breadcrumb";
import { PageNav } from "./PageNav";
import { CommandPalette } from "./CommandPalette";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Starfield />
      <TopBar />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <div className="content-inner">
            <Breadcrumb />
            <article className="prose">{children}</article>
            <PageNav />
          </div>
        </main>
        <div className="toc-col">
          <OnThisPage />
        </div>
      </div>
      <CommandPalette />
    </>
  );
}
