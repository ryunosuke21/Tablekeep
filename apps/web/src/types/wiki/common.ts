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

export const wikiPageInfoSchema = z.object({
  count: z.number().int().nonnegative(),
  hasNextPage: z.boolean().default(false),
  hasPreviousPage: z.boolean().default(false),
  limit: z.number().int().min(1).max(50),
  page: z.number().int().min(1),
});
export type WikiPageInfo = z.infer<typeof wikiPageInfoSchema>;

export const wikiPageSchema = <TItemSchema extends z.ZodType>(
  itemSchema: TItemSchema,
) =>
  z.object({
    items: z.array(itemSchema).default([]),
    pageInfo: wikiPageInfoSchema,
  });

export type WikiPage<TItem> = z.output<
  ReturnType<typeof wikiPageSchema<z.ZodType<TItem>>>
>;
