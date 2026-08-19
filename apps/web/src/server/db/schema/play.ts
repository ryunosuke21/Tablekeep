import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { campaigns } from "./campaigns";
import { characterSheets } from "./characters";

const timestamps = () => ({
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const encounterStatus = pgEnum("encounter_status", [
  "draft",
  "active",
  "completed",
]);
export const encounterCombatantSource = pgEnum("encounter_combatant_source", [
  "sheet",
  "custom",
]);
export const encounterVisibility = pgEnum("encounter_visibility", [
  "players",
  "name_only",
  "dm",
]);
export const encounterEffectVisibility = pgEnum("encounter_effect_visibility", [
  "players",
  "dm",
]);
export const encounterEffectTick = pgEnum("encounter_effect_tick", [
  "turn_start",
  "turn_end",
  "round_start",
  "manual",
]);

export const encounters = pgTable(
  "encounters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    name: text("name").default("Encounter").notNull(),
    status: encounterStatus("status").default("draft").notNull(),
    round: integer("round").default(1).notNull(),
    /**
     * The active turn points at a campaign-local ordering position instead of
     * an unconstrained combatant ID. This prevents a cross-encounter pointer at
     * the schema level while still allowing deterministic reordering.
     */
    activePosition: integer("active_position"),
    revision: integer("revision").default(0).notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    startedBy: text("started_by").references(() => users.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at"),
    completedBy: text("completed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("encounters_one_active_campaign_uidx")
      .on(table.campaignId)
      .where(sql`${table.status} = 'active'`),
    index("encounters_campaign_status_updated_idx").on(
      table.campaignId,
      table.status,
      table.updatedAt,
    ),
    check("encounters_round_check", sql`${table.round} >= 1`),
    check(
      "encounters_active_position_check",
      sql`${table.activePosition} is null or ${table.activePosition} >= 0`,
    ),
    check("encounters_revision_check", sql`${table.revision} >= 0`),
    check(
      "encounters_started_shape_check",
      sql`(
        ${table.status} = 'draft'
        or ${table.startedAt} is not null
      )`,
    ),
    check(
      "encounters_completed_shape_check",
      sql`(
        ${table.status} <> 'completed'
        or ${table.completedAt} is not null
      )`,
    ),
  ],
);

export const encounterCombatants = pgTable(
  "encounter_combatants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    sheetId: uuid("sheet_id").references(() => characterSheets.id, {
      onDelete: "set null",
    }),
    source: encounterCombatantSource("source").notNull(),
    name: text("name").notNull(),
    initiativeRoll: integer("initiative_roll"),
    initiativeModifier: integer("initiative_modifier").default(0).notNull(),
    initiativeTotal: integer("initiative_total"),
    position: integer("position").notNull(),
    currentHp: integer("current_hp"),
    maxHp: integer("max_hp"),
    tempHp: integer("temp_hp").default(0).notNull(),
    visibility: encounterVisibility("visibility").default("players").notNull(),
    dmNotes: text("dm_notes"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("encounter_combatants_position_uidx").on(
      table.encounterId,
      table.position,
    ),
    uniqueIndex("encounter_combatants_sheet_uidx")
      .on(table.encounterId, table.sheetId)
      .where(sql`${table.sheetId} is not null`),
    index("encounter_combatants_encounter_initiative_idx").on(
      table.encounterId,
      table.initiativeTotal.desc(),
      table.initiativeModifier.desc(),
      table.position,
    ),
    check(
      "encounter_combatants_source_check",
      sql`(
        (${table.source} = 'sheet' and ${table.sheetId} is not null)
        or (${table.source} = 'custom' and ${table.sheetId} is null)
      )`,
    ),
    check(
      "encounter_combatants_initiative_roll_check",
      sql`${table.initiativeRoll} is null or ${table.initiativeRoll} between 1 and 20`,
    ),
    check(
      "encounter_combatants_initiative_modifier_check",
      sql`${table.initiativeModifier} between -1000 and 1000`,
    ),
    check(
      "encounter_combatants_initiative_total_check",
      sql`${table.initiativeTotal} is null or ${table.initiativeTotal} between -2000 and 2000`,
    ),
    check("encounter_combatants_position_check", sql`${table.position} >= 0`),
    check(
      "encounter_combatants_current_hp_check",
      sql`${table.currentHp} is null or ${table.currentHp} between -1000000 and 1000000`,
    ),
    check(
      "encounter_combatants_max_hp_check",
      sql`${table.maxHp} is null or ${table.maxHp} between 1 and 1000000`,
    ),
    check(
      "encounter_combatants_temp_hp_check",
      sql`${table.tempHp} between 0 and 1000000`,
    ),
  ],
);

export const encounterEffects = pgTable(
  "encounter_effects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    combatantId: uuid("combatant_id")
      .notNull()
      .references(() => encounterCombatants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    remainingTurns: integer("remaining_turns"),
    tick: encounterEffectTick("tick").default("manual").notNull(),
    visibility: encounterEffectVisibility("visibility")
      .default("players")
      .notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    removedBy: text("removed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    removedAt: timestamp("removed_at"),
    ...timestamps(),
  },
  (table) => [
    index("encounter_effects_combatant_removed_idx").on(
      table.combatantId,
      table.removedAt,
    ),
    check(
      "encounter_effects_remaining_turns_check",
      sql`${table.remainingTurns} is null or ${table.remainingTurns} >= 0`,
    ),
    check(
      "encounter_effects_removed_actor_check",
      sql`${table.removedAt} is not null or ${table.removedBy} is null`,
    ),
  ],
);

export const encounterEvents = pgTable(
  "encounter_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    summary: text("summary").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("encounter_events_encounter_created_idx").on(
      table.encounterId,
      table.createdAt.desc(),
    ),
  ],
);

export const sheetResources = pgTable(
  "sheet_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => characterSheets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    currentValue: integer("current_value").default(0).notNull(),
    maxValue: integer("max_value"),
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
    uniqueIndex("sheet_resources_name_uidx").on(
      table.sheetId,
      sql`lower(${table.name})`,
    ),
    index("sheet_resources_sheet_sort_idx").on(table.sheetId, table.sort),
    check(
      "sheet_resources_current_value_check",
      sql`${table.currentValue} between 0 and 1000000`,
    ),
    check(
      "sheet_resources_max_value_check",
      sql`${table.maxValue} is null or ${table.maxValue} between 0 and 1000000`,
    ),
    check(
      "sheet_resources_current_max_check",
      sql`${table.maxValue} is null or ${table.currentValue} <= ${table.maxValue}`,
    ),
    check("sheet_resources_sort_check", sql`${table.sort} >= 0`),
  ],
);

/**
 * Notes belong to the campaign and user rather than the active membership row.
 * Removing a member revokes access immediately but preserves their private
 * notes if they later rejoin the same campaign.
 */
export const campaignMemberNotes = pgTable(
  "campaign_member_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").default("").notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("campaign_member_notes_campaign_user_uidx").on(
      table.campaignId,
      table.userId,
    ),
    index("campaign_member_notes_user_idx").on(table.userId),
  ],
);

export const encountersRelations = relations(encounters, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [encounters.campaignId],
    references: [campaigns.id],
  }),
  combatants: many(encounterCombatants),
  events: many(encounterEvents),
}));

export const encounterCombatantsRelations = relations(
  encounterCombatants,
  ({ one, many }) => ({
    encounter: one(encounters, {
      fields: [encounterCombatants.encounterId],
      references: [encounters.id],
    }),
    sheet: one(characterSheets, {
      fields: [encounterCombatants.sheetId],
      references: [characterSheets.id],
    }),
    effects: many(encounterEffects),
  }),
);

export const encounterEffectsRelations = relations(
  encounterEffects,
  ({ one }) => ({
    combatant: one(encounterCombatants, {
      fields: [encounterEffects.combatantId],
      references: [encounterCombatants.id],
    }),
  }),
);

export const encounterEventsRelations = relations(
  encounterEvents,
  ({ one }) => ({
    encounter: one(encounters, {
      fields: [encounterEvents.encounterId],
      references: [encounters.id],
    }),
  }),
);

export const sheetResourcesRelations = relations(sheetResources, ({ one }) => ({
  sheet: one(characterSheets, {
    fields: [sheetResources.sheetId],
    references: [characterSheets.id],
  }),
}));

export const campaignMemberNotesRelations = relations(
  campaignMemberNotes,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignMemberNotes.campaignId],
      references: [campaigns.id],
    }),
    user: one(users, {
      fields: [campaignMemberNotes.userId],
      references: [users.id],
    }),
  }),
);
