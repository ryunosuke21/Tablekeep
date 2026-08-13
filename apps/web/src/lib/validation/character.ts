import { z } from "zod";

import {
  MAX_CHARACTER_HP,
  MAX_CLASS_LEVEL,
  MAX_CURRENCY_AMOUNT,
  MAX_ITEM_QTY,
  MAX_SHEET_EVENTS_PAGE,
  MAX_SPELL_LEVEL,
  MAX_STAT_VALUE,
} from "@/lib/constants";

const uuidSchema = z.string().uuid();

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .max(max, `Use ${max} characters or fewer.`);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Use ${max} characters or fewer.`).nullable();

const mutable = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

const characterNameSchema = requiredText("a character name", 80);
const characterBioSchema = optionalText(2_000);
const sheetNameSchema = optionalText(80);
const ancestrySchema = optionalText(80);
const sheetNotesSchema = optionalText(5_000);
const alignmentSchema = optionalText(80);
const appearanceSchema = optionalText(2_000);
const backstorySchema = optionalText(20_000);
const entryNameSchema = requiredText("a name", 100);
const sourceSchema = requiredText("a source", 64);
const refSchema = optionalText(200);
const sortSchema = z.number().int().min(0).max(10_000);

export const characterCreateSchema = z
  .object({
    name: characterNameSchema,
    bio: characterBioSchema.optional(),
  })
  .strict();

export const characterUpdateSchema = mutable({
  charId: uuidSchema,
  name: characterNameSchema.optional(),
  bio: characterBioSchema.optional(),
}).refine(({ name, bio }) => name !== undefined || bio !== undefined, {
  message: "Provide at least one character detail to update.",
});

export const characterIdSchema = z.object({ charId: uuidSchema }).strict();

export const characterSlugSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  })
  .strict();

export const sheetCreateSchema = z
  .object({
    campaignId: uuidSchema,
    charId: uuidSchema,
  })
  .strict();

export const sheetIdSchema = z
  .object({
    campaignId: uuidSchema,
    sheetId: uuidSchema,
  })
  .strict();

/**
 * A partial update must carry at least one field, or it is a write that means
 * nothing. Scope keys are excluded so `{ campaignId, sheetId }` alone still
 * fails, and new optional fields join the check without editing it.
 */
const requiresOneOf =
  (...scopeKeys: string[]) =>
  (value: Record<string, unknown>) =>
    Object.entries(value).some(
      ([key, entry]) => !scopeKeys.includes(key) && entry !== undefined,
    );

const sheetScopeKeys = ["campaignId", "sheetId"] as const;

export const sheetUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  name: sheetNameSchema.optional(),
  ancestry: ancestrySchema.optional(),
  alignment: alignmentSchema.optional(),
  appearance: appearanceSchema.optional(),
  backstory: backstorySchema.optional(),
  maxHp: z.number().int().min(1).max(MAX_CHARACTER_HP).optional(),
  notes: sheetNotesSchema.optional(),
}).refine(requiresOneOf(...sheetScopeKeys), {
  message: "Provide at least one sheet detail to update.",
});

const sourceFields = {
  source: sourceSchema.default("custom"),
  ref: refSchema.optional(),
};

export const sheetClassCreateSchema = z
  .object({
    campaignId: uuidSchema,
    sheetId: uuidSchema,
    name: entryNameSchema,
    subclass: optionalText(100).optional(),
    level: z.number().int().min(1).max(MAX_CLASS_LEVEL),
    ...sourceFields,
    sort: sortSchema.default(0),
  })
  .strict();

export const sheetClassUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  classId: uuidSchema,
  name: entryNameSchema.optional(),
  subclass: optionalText(100).optional(),
  level: z.number().int().min(1).max(MAX_CLASS_LEVEL).optional(),
  source: sourceSchema.optional(),
  ref: refSchema.optional(),
  sort: sortSchema.optional(),
}).refine(
  ({ name, subclass, level, source, ref, sort }) =>
    name !== undefined ||
    subclass !== undefined ||
    level !== undefined ||
    source !== undefined ||
    ref !== undefined ||
    sort !== undefined,
  { message: "Provide at least one class detail to update." },
);

export const sheetClassIdSchema = sheetIdSchema.extend({
  classId: uuidSchema,
});

export const sheetBackgroundCreateSchema = z
  .object({
    campaignId: uuidSchema,
    sheetId: uuidSchema,
    name: entryNameSchema,
    notes: optionalText(2_000).optional(),
    ...sourceFields,
    sort: sortSchema.default(0),
  })
  .strict();

export const sheetBackgroundUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  backgroundId: uuidSchema,
  name: entryNameSchema.optional(),
  notes: optionalText(2_000).optional(),
  source: sourceSchema.optional(),
  ref: refSchema.optional(),
  sort: sortSchema.optional(),
}).refine(
  ({ name, notes, source, ref, sort }) =>
    name !== undefined ||
    notes !== undefined ||
    source !== undefined ||
    ref !== undefined ||
    sort !== undefined,
  { message: "Provide at least one background detail to update." },
);

export const sheetBackgroundIdSchema = sheetIdSchema.extend({
  backgroundId: uuidSchema,
});

export const sheetConditionCreateSchema = sheetIdSchema.extend({
  name: requiredText("a condition", 80),
});

export const sheetConditionIdSchema = sheetIdSchema.extend({
  conditionId: uuidSchema,
});

export const sheetItemCreateSchema = sheetIdSchema.extend({
  name: requiredText("an item name", 120),
  qty: z.number().int().min(0).max(MAX_ITEM_QTY).default(1),
  equipped: z.boolean().default(false),
  notes: optionalText(2_000).optional(),
});

export const sheetItemUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  itemId: uuidSchema,
  name: requiredText("an item name", 120).optional(),
  qty: z.number().int().min(0).max(MAX_ITEM_QTY).optional(),
  equipped: z.boolean().optional(),
  notes: optionalText(2_000).optional(),
}).refine(
  ({ name, qty, equipped, notes }) =>
    name !== undefined ||
    qty !== undefined ||
    equipped !== undefined ||
    notes !== undefined,
  { message: "Provide at least one item detail to update." },
);

export const sheetItemIdSchema = sheetIdSchema.extend({ itemId: uuidSchema });

export const sheetCurrencyCreateSchema = sheetIdSchema.extend({
  name: requiredText("a currency name", 40),
  amount: z.number().int().min(0).max(MAX_CURRENCY_AMOUNT).default(0),
});

export const sheetCurrencyUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  currencyId: uuidSchema,
  name: requiredText("a currency name", 40).optional(),
  amount: z.number().int().min(0).max(MAX_CURRENCY_AMOUNT).optional(),
}).refine(({ name, amount }) => name !== undefined || amount !== undefined, {
  message: "Provide at least one currency detail to update.",
});

export const sheetCurrencyIdSchema = sheetIdSchema.extend({
  currencyId: uuidSchema,
});

const statValueSchema = z
  .number()
  .int()
  .min(-MAX_STAT_VALUE)
  .max(MAX_STAT_VALUE);

export const sheetStatCreateSchema = sheetIdSchema.extend({
  name: requiredText("a stat name", 40),
  value: statValueSchema.default(10),
  sort: sortSchema.default(0),
});

export const sheetStatUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  statId: uuidSchema,
  name: requiredText("a stat name", 40).optional(),
  value: statValueSchema.optional(),
  sort: sortSchema.optional(),
}).refine(requiresOneOf(...sheetScopeKeys, "statId"), {
  message: "Provide at least one stat detail to update.",
});

export const sheetStatIdSchema = sheetIdSchema.extend({ statId: uuidSchema });

export const sheetFeatCreateSchema = sheetIdSchema.extend({
  name: entryNameSchema,
  notes: optionalText(2_000).optional(),
  ...sourceFields,
  sort: sortSchema.default(0),
});

export const sheetFeatUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  featId: uuidSchema,
  name: entryNameSchema.optional(),
  notes: optionalText(2_000).optional(),
  source: sourceSchema.optional(),
  ref: refSchema.optional(),
  sort: sortSchema.optional(),
}).refine(requiresOneOf(...sheetScopeKeys, "featId"), {
  message: "Provide at least one feat detail to update.",
});

export const sheetFeatIdSchema = sheetIdSchema.extend({ featId: uuidSchema });

export const sheetNpcCreateSchema = sheetIdSchema.extend({
  name: entryNameSchema,
  relationship: optionalText(120).optional(),
  notes: optionalText(2_000).optional(),
  sort: sortSchema.default(0),
});

export const sheetNpcUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  npcId: uuidSchema,
  name: entryNameSchema.optional(),
  relationship: optionalText(120).optional(),
  notes: optionalText(2_000).optional(),
  sort: sortSchema.optional(),
}).refine(requiresOneOf(...sheetScopeKeys, "npcId"), {
  message: "Provide at least one contact detail to update.",
});

export const sheetNpcIdSchema = sheetIdSchema.extend({ npcId: uuidSchema });

const spellLevelSchema = z.number().int().min(0).max(MAX_SPELL_LEVEL);

export const sheetSpellCreateSchema = sheetIdSchema.extend({
  name: entryNameSchema,
  level: spellLevelSchema.default(0),
  prepared: z.boolean().default(false),
  notes: optionalText(2_000).optional(),
  ...sourceFields,
  sort: sortSchema.default(0),
});

export const sheetSpellUpdateSchema = mutable({
  campaignId: uuidSchema,
  sheetId: uuidSchema,
  spellId: uuidSchema,
  name: entryNameSchema.optional(),
  level: spellLevelSchema.optional(),
  prepared: z.boolean().optional(),
  notes: optionalText(2_000).optional(),
  source: sourceSchema.optional(),
  ref: refSchema.optional(),
  sort: sortSchema.optional(),
}).refine(requiresOneOf(...sheetScopeKeys, "spellId"), {
  message: "Provide at least one spell detail to update.",
});

export const sheetSpellIdSchema = sheetIdSchema.extend({ spellId: uuidSchema });

export const sheetEventListSchema = sheetIdSchema.extend({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_SHEET_EVENTS_PAGE)
    .default(MAX_SHEET_EVENTS_PAGE),
});

export type CharacterCreateInput = z.infer<typeof characterCreateSchema>;
export type CharacterUpdateInput = z.infer<typeof characterUpdateSchema>;
export type SheetUpdateInput = z.infer<typeof sheetUpdateSchema>;
export type SheetClassInput = z.infer<typeof sheetClassCreateSchema>;
export type SheetBackgroundInput = z.infer<typeof sheetBackgroundCreateSchema>;
export type SheetItemInput = z.infer<typeof sheetItemCreateSchema>;
export type SheetCurrencyInput = z.infer<typeof sheetCurrencyCreateSchema>;
export type SheetStatInput = z.infer<typeof sheetStatCreateSchema>;
export type SheetFeatInput = z.infer<typeof sheetFeatCreateSchema>;
export type SheetNpcInput = z.infer<typeof sheetNpcCreateSchema>;
export type SheetSpellInput = z.infer<typeof sheetSpellCreateSchema>;
