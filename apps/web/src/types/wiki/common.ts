import { z } from "zod";

export const wikiReferenceSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
});
export type WikiReference = z.infer<typeof wikiReferenceSchema>;

export const wikiSourceSchema = wikiReferenceSchema.extend({
  displayName: z.string().min(1),
  gameSystem: wikiReferenceSchema,
  permalink: z.string().min(1),
  publisher: wikiReferenceSchema,
});
export type WikiSource = z.infer<typeof wikiSourceSchema>;

/**
 * A whole catalog for one wiki category. Entries carry only a `sourceKey`; the
 * sources they point at are sent once alongside them, because the browser holds
 * the full catalog and does all the filtering.
 */
export const wikiCatalogSchema = <TItemSchema extends z.ZodType>(
  itemSchema: TItemSchema,
) =>
  z.object({
    items: z.array(itemSchema).default([]),
    sources: z.array(wikiSourceSchema).default([]),
  });

export type WikiCatalog<TItem> = z.output<
  ReturnType<typeof wikiCatalogSchema<z.ZodType<TItem>>>
>;
