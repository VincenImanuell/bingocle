"use client";

import {
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

function langOf(children: ReactNode): string | null {
  const el = children as ReactElement<{ className?: string }> | undefined;
  const cls = el?.props?.className ?? "";
  const m = /language-([\w-]+)/.exec(cls);
  if (!m) return null;
  const map: Record<string, string> = {
    sh: "bash",
    shell: "bash",
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    sol: "solidity",
    md: "markdown",
    json: "json",
    text: "text",
    bash: "bash",
  };
  return map[m[1]] ?? m[1];
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const lang = langOf(children);

  async function copy() {
    const text = preRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="code-card">
      <div className="code-bar">
        <span className="dots" aria-hidden>
          <i className="dot dot-r" />
          <i className="dot dot-y" />
          <i className="dot dot-g" />
        </span>
        {lang && <span className="code-lang">{lang}</span>}
        <button
          type="button"
          className="code-copy"
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}
