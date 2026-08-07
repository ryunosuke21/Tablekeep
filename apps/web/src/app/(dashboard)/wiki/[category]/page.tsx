import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { WikiCatalog } from "@/components/wiki/wiki-catalog";
import { isWikiCategory, WIKI_CATEGORY_META } from "@/lib/wiki/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isWikiCategory(category)) return {};
  const meta = WIKI_CATEGORY_META[category];
  return { title: meta.title, description: meta.description };
}

export default async function WikiCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isWikiCategory(category)) notFound();

  return (
    <Suspense fallback={null}>
      <WikiCatalog key={category} category={category} />
    </Suspense>
  );
}
