// Builds lib/search-index.json from the MDX content tree.
// Run: node scripts/build-search-index.mjs   (wired as `prebuild`)
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "lib", "search-index.json");

const GROUP_LABELS = {
  "getting-started": "Getting Started",
  contracts: "Smart Contracts",
  agent: "Agent Service",
  capability: "Capability",
  frontend: "Frontend",
  guides: "Guides",
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".mdx") || name.endsWith(".md")) out.push(p);
  }
  return out;
}

function strip(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code fences
    .replace(/^import .*$/gm, " ") // mdx imports
    .replace(/<[^>]+>/g, " ") // jsx/html tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/[#>*_`|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const entries = [];
for (const file of walk(CONTENT)) {
  const raw = readFileSync(file, "utf8");
  const rel = relative(CONTENT, file).replace(/\\/g, "/");
  const slug = rel.replace(/\.mdx?$/, "");
  const group = GROUP_LABELS[slug.split("/")[0]] ?? "Docs";

  const h1 = /^#\s+(.+)$/m.exec(raw);
  const title = h1 ? h1[1].trim() : slug.split("/").pop();

  const headings = [...raw.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) =>
    m[1].replace(/[`*]/g, "").trim()
  );

  const text = strip(raw).slice(0, 1400);

  entries.push({ title, group, path: "/" + slug, headings, text });
}

entries.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(OUT, JSON.stringify(entries, null, 0) + "\n");
console.log(
  `search-index.json: ${entries.length} pages indexed -> ${relative(ROOT, OUT)}`
);
