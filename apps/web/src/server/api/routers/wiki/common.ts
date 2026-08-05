import { z } from "zod";

import type { Open5ePage } from "@/server/reference-data/open5e/client";
import { type WikiPage, wikiPageSchema } from "@/types/wiki";

export const wikiPageInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export const wikiKeyInputSchema = z.object({
  key: z.string().min(1),
});

export function mapWikiPage<TInput, TOutputSchema extends z.ZodType>(
  upstream: Open5ePage<TInput>,
  page: number,
  limit: number,
  mapper: (value: TInput) => z.output<TOutputSchema>,
  outputSchema: TOutputSchema,
): WikiPage<z.output<TOutputSchema>> {
  return wikiPageSchema(outputSchema).parse({
    items: upstream.results.map(mapper),
    pageInfo: {
      count: upstream.count,
      page,
      limit,
      hasNextPage: upstream.next !== null,
      hasPreviousPage: upstream.previous !== null,
    },
  });
}
