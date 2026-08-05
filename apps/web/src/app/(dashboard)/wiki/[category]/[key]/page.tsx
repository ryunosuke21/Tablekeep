import type { Metadata } from "next";
import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { WikiDetailPage } from "@/components/wiki/wiki-detail";
import {
  isWikiCategory,
  WIKI_CATEGORY_META,
  type WikiDetail,
} from "@/lib/wiki/catalog";
import { api } from "@/trpc/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; key: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return isWikiCategory(category)
    ? { title: WIKI_CATEGORY_META[category].singular }
    : {};
}

export default async function WikiRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; key: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { category: rawCategory, key } = await params;
  if (!isWikiCategory(rawCategory)) notFound();
  const { kind } = await searchParams;

  try {
    let detail: WikiDetail;
    switch (rawCategory) {
      case "classes":
        detail = await api.wiki.classes.get({ key });
        break;
      case "species":
        detail = await api.wiki.species.get({ key });
        break;
      case "spells":
        detail = await api.wiki.spells.get({ key });
        break;
      case "creatures":
        detail = await api.wiki.creatures.get({ key });
        break;
      case "backgrounds":
        detail = await api.wiki.backgrounds.get({ key });
        break;
      case "feats":
        detail = await api.wiki.feats.get({ key });
        break;
      case "rules":
        detail = await api.wiki.rules.get({ key });
        break;
      case "items":
        detail =
          kind === "magic"
            ? await api.wiki.magicItems.get({ key })
            : await api.wiki.items.get({ key });
        break;
    }
    return <WikiDetailPage category={rawCategory} detail={detail} />;
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}
