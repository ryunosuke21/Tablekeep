import { z } from "zod";

import type { Open5ePage } from "@/server/reference-data/open5e/client";
import type { WikiPage } from "@/types/wiki";

export const wikiPageInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const wikiKeyInputSchema = z.object({
  key: z.string().min(1),
});

export function mapWikiPage<TInput, TOutput>(
  upstream: Open5ePage<TInput>,
  page: number,
  limit: number,
  mapper: (value: TInput) => TOutput,
): WikiPage<TOutput> {
  return {
    items: upstream.results.map(mapper),
    pageInfo: {
      count: upstream.count,
      page,
      limit,
      hasNextPage: upstream.next !== null,
      hasPreviousPage: upstream.previous !== null,
    },
  };
}
