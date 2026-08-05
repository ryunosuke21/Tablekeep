import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WikiCatalog } from "@/components/wiki/wiki-catalog";
import {
  isWikiCategory,
  WIKI_CATEGORY_META,
  type WikiListItem,
} from "@/lib/wiki/catalog";
import { parseWikiQuery, type WikiSearchParams } from "@/lib/wiki/query-state";
import { api } from "@/trpc/server";
import type { WikiPage } from "@/types/wiki";

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
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<WikiSearchParams>;
}) {
  const { category: rawCategory } = await params;
  if (!isWikiCategory(rawCategory)) notFound();
  const query = parseWikiQuery(rawCategory, await searchParams);
  const page = query.view === "cards" ? 1 : query.page;
  const limit = query.view === "cards" ? 20 : query.limit;
  const name = query.q || undefined;

  let result: WikiPage<WikiListItem>;
  switch (rawCategory) {
    case "classes":
      result = await api.wiki.classes.list({
        page,
        limit,
        name,
        kind: (query.kind as "class" | "subclass" | "all") ?? "all",
      });
      break;
    case "species":
      result = await api.wiki.species.list({
        page,
        limit,
        name,
        kind: (query.kind as "species" | "subspecies" | "all") ?? "all",
      });
      break;
    case "spells":
      result = await api.wiki.spells.list({
        page,
        limit,
        name,
        level: query.level,
      });
      break;
    case "creatures":
      result = await api.wiki.creatures.list({
        page,
        limit,
        name,
        challengeRatingMin: query.crMin,
        challengeRatingMax: query.crMax,
        armorClassMin: query.acMin,
        armorClassMax: query.acMax,
      });
      break;
    case "backgrounds":
      result = await api.wiki.backgrounds.list({ page, limit, name });
      break;
    case "feats":
      result = await api.wiki.feats.list({ page, limit, name });
      break;
    case "rules":
      result = await api.wiki.rules.list({ page, limit, name });
      break;
    case "items":
      result =
        query.kind === "magic"
          ? await api.wiki.magicItems.list({ page, limit, name })
          : await api.wiki.items.list({ page, limit, name });
      break;
  }

  return (
    <WikiCatalog
      key={`${rawCategory}-${JSON.stringify(query)}`}
      category={rawCategory}
      query={query}
      initialPage={result}
    />
  );
}
