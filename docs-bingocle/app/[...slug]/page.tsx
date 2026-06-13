import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGES, loadPage } from "@/lib/registry";
import { findItem } from "@/lib/nav";

type Params = { slug: string[] };

export function generateStaticParams(): Params[] {
  return Object.keys(PAGES).map((key) => ({ slug: key.split("/") }));
}

// Only the routes listed in the registry exist; anything else 404s.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = findItem(slug);
  return { title: item?.title ?? "Docs" };
}

export default async function DocPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const load = loadPage(slug);
  if (!load) notFound();

  const { default: Content } = await load();
  return <Content />;
}
