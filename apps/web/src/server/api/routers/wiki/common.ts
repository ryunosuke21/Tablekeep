import { z } from "zod";

import type { Open5eClient } from "@/server/reference-data/open5e/client";
import {
  documentSchema,
  mapSource,
} from "@/server/reference-data/open5e/resources";
import {
  type WikiCatalog,
  type WikiSource,
  wikiCatalogSchema,
} from "@/types/wiki";

export const wikiKeyInputSchema = z.object({
  key: z.string().min(1),
});

/**
 * Every source book the reference service publishes. Cheap to read, cached
 * upstream for a day, and shared by every catalog so entries can carry a plain
 * source key instead of a repeated source object.
 */
export async function readSources(open5e: Open5eClient): Promise<WikiSource[]> {
  const documents = await open5e.listAll("documents", documentSchema);
  return documents.map(mapSource);
}

export function sourceFor(sources: WikiSource[], key: string): WikiSource {
  return (
    sources.find((source) => source.key === key) ?? {
      key,
      name: key,
      displayName: key,
      gameSystem: { key: "unknown", name: "Unknown rules" },
      permalink: key,
      publisher: { key: "unknown", name: "Unknown publisher" },
    }
  );
}

/**
 * Reads a whole category and pairs it with the sources it actually uses. The
 * wiki sends the full catalog to the browser and filters it there, so this
 * never narrows the read.
 */
export async function readWikiCatalog<
  TUpstreamSchema extends z.ZodType,
  TItemSchema extends z.ZodType<{ sourceKey: string }>,
>(
  open5e: Open5eClient,
  options: {
    resource: string;
    fields: string;
    upstreamSchema: TUpstreamSchema;
    itemSchema: TItemSchema;
    map: (value: z.output<TUpstreamSchema>) => z.output<TItemSchema>;
  },
): Promise<WikiCatalog<z.output<TItemSchema>>> {
  const [entries, sources] = await Promise.all([
    open5e.listAll(options.resource, options.upstreamSchema, {
      fields: options.fields,
    }),
    readSources(open5e),
  ]);

  const items = entries.map(options.map);
  const used = new Set(items.map((item) => item.sourceKey));

  return wikiCatalogSchema(options.itemSchema).parse({
    items,
    sources: sources.filter((source) => used.has(source.key)),
  });
}
