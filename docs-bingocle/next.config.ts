import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Let .md / .mdx files participate as routes/imports
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

// Plugins are passed in string form so they stay serializable for Turbopack
// (Next 16's default bundler can't serialize imported plugin functions).
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm"]],
    rehypePlugins: [["rehype-slug"]],
  },
});

export default withMDX(nextConfig);
