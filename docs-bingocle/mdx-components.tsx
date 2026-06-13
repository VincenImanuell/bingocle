import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { CodeBlock } from "@/components/docs/CodeBlock";

function Anchor({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return <Link href={href} {...props} />;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

const components: MDXComponents = {
  a: Anchor,
  pre: CodeBlock,
  // Tables get a horizontal-scroll wrapper so wide function tables never clip.
  table: (props) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
