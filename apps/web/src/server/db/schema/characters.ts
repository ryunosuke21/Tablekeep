import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { campaigns } from "./campaigns";

const timestamps = () => ({
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bio: text("bio"),
    deletedAt: timestamp("deleted_at"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("characters_slug_uidx").on(table.slug),
    index("characters_owner_deleted_idx").on(table.ownerId, table.deletedAt),
  ],
);

export const characterSheets = pgTable(
  "character_sheets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    charId: uuid("char_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name"),
    ancestry: text("ancestry"),
    maxHp: integer("max_hp").default(1).notNull(),
    notes: text("notes"),
    retiredAt: timestamp("retired_at"),
    retiredBy: text("retired_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("character_sheets_campaign_char_uidx").on(
      table.campaignId,
      table.charId,
    ),
    uniqueIndex("character_sheets_active_owner_uidx")
      .on(table.campaignId, table.ownerId)
      .where(sql`${table.retiredAt} is null`),
    index("character_sheets_char_idx").on(table.charId),
    index("character_sheets_owner_idx").on(table.ownerId),
    check(
      "character_sheets_max_hp_check",
      sql`${table.maxHp} between 1 and 1000000`,
    ),
    check(
      "character_sheets_retired_actor_check",
      sql`${table.retiredAt} is not null or ${table.retiredBy} is null`,
    ),
  ],
);

export const sheetClasses = pgTable(
  "sheet_classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => characterSheets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    subclass: text("subclass"),
    level: integer("level").notNull(),
    source: text("source").default("custom").notNull(),
    ref: text("ref"),
    sort: integer("sort").default(0).notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    index("sheet_classes_sheet_sort_idx").on(table.sheetId, table.sort),
    check("sheet_classes_level_check", sql`${table.level} between 1 and 100`),
    check("sheet_classes_sort_check", sql`${table.sort} >= 0`),
  ],
);

export const sheetBackgrounds = pgTable(
  "sheet_backgrounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => characterSheets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    notes: text("notes"),
    source: text("source").default("custom").notNull(),
    ref: text("ref"),
    sort: integer("sort").default(0).notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    index("sheet_backgrounds_sheet_sort_idx").on(table.sheetId, table.sort),
    check("sheet_backgrounds_sort_check", sql`${table.sort} >= 0`),
  ],
);

export const sheetConditions = pgTable(
  "sheet_conditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => characterSheets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    removedAt: timestamp("removed_at"),
    removedBy: text("removed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("sheet_conditions_active_name_uidx")
      .on(table.sheetId, sql`lower(${table.name})`)
      .where(sql`${table.removedAt} is null`),
    index("sheet_conditions_sheet_removed_idx").on(
      table.sheetId,
      table.removedAt,
    ),
    check(
      "sheet_conditions_removed_actor_check",
      sql`${table.removedAt} is not null or ${table.removedBy} is null`,
    ),
  ],
);

export const sheetItems = pgTable(
  "sheet_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => characterSheets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    qty: integer("qty").default(1).notNull(),
    equipped: boolean("equipped").default(false).notNull(),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    removedAt: timestamp("removed_at"),
    removedBy: text("removed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    index("sheet_items_sheet_removed_idx").on(table.sheetId, table.removedAt),
    check("sheet_items_qty_check", sql`${table.qty} between 0 and 1000000`),
    check(
      "sheet_items_removed_actor_check",
      sql`${table.removedAt} is not null or ${table.removedBy} is null`,
    ),
  ],
);

export const sheetCurrencies = pgTable(
  "sheet_currencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => characterSheets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: integer("amount").default(0).notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    removedAt: timestamp("removed_at"),
    removedBy: text("removed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("sheet_currencies_active_name_uidx")
      .on(table.sheetId, sql`lower(${table.name})`)
      .where(sql`${table.removedAt} is null`),
    index("sheet_currencies_sheet_removed_idx").on(
      table.sheetId,
      table.removedAt,
    ),
    check(
      "sheet_currencies_amount_check",
      sql`${table.amount} between 0 and 1000000000`,
    ),
    check(
      "sheet_currencies_removed_actor_check",
      sql`${table.removedAt} is not null or ${table.removedBy} is null`,
    ),
  ],
);

export const charactersRelations = relations(characters, ({ one, many }) => ({
  owner: one(users, {
    fields: [characters.ownerId],
    references: [users.id],
    relationName: "characterOwner",
  }),
  sheets: many(characterSheets),
}));

export const characterSheetsRelations = relations(
  characterSheets,
  ({ one, many }) => ({
    campaign: one(campaigns, {
      fields: [characterSheets.campaignId],
      references: [campaigns.id],
    }),
    character: one(characters, {
      fields: [characterSheets.charId],
      references: [characters.id],
    }),
    owner: one(users, {
      fields: [characterSheets.ownerId],
      references: [users.id],
      relationName: "sheetOwner",
    }),
    classes: many(sheetClasses),
    backgrounds: many(sheetBackgrounds),
    conditions: many(sheetConditions),
    items: many(sheetItems),
    currencies: many(sheetCurrencies),
  }),
);

export const sheetClassesRelations = relations(sheetClasses, ({ one }) => ({
  sheet: one(characterSheets, {
    fields: [sheetClasses.sheetId],
    references: [characterSheets.id],
  }),
}));

export const sheetBackgroundsRelations = relations(
  sheetBackgrounds,
  ({ one }) => ({
    sheet: one(characterSheets, {
      fields: [sheetBackgrounds.sheetId],
      references: [characterSheets.id],
    }),
  }),
);

export const sheetConditionsRelations = relations(
  sheetConditions,
  ({ one }) => ({
    sheet: one(characterSheets, {
      fields: [sheetConditions.sheetId],
      references: [characterSheets.id],
    }),
  }),
);

export const sheetItemsRelations = relations(sheetItems, ({ one }) => ({
  sheet: one(characterSheets, {
    fields: [sheetItems.sheetId],
    references: [characterSheets.id],
  }),
}));

export const sheetCurrenciesRelations = relations(
  sheetCurrencies,
  ({ one }) => ({
    sheet: one(characterSheets, {
      fields: [sheetCurrencies.sheetId],
      references: [characterSheets.id],
    }),
  }),
);
