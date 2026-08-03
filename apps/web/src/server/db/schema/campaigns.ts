import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const campaignStatus = pgEnum("campaign_status", ["active", "archived"]);
export const campaignColors = pgEnum("campaign_colors", [
  "lilac",
  "rose",
  "sage",
  "sky",
]);
export const campaignRole = pgEnum("campaign_role", ["dm", "player"]);
export const campaignInvitationStatus = pgEnum("campaign_invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "canceled",
]);
export const campaignInviteCodeStatus = pgEnum("campaign_invite_code_status", [
  "pending",
  "revoked",
]);
export const campaignMemberEventAction = pgEnum(
  "campaign_member_event_action",
  ["joined", "removed", "left", "role_changed"],
);
export const campaignOccurrenceOverrideKind = pgEnum(
  "campaign_occurrence_override_kind",
  ["cancelled", "rescheduled", "added"],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logo: text("logo"),
    bannerImage: text("banner_image"),
    metadata: text("metadata"),
    description: text("description"),
    colors: campaignColors("colors").default("lilac").notNull(),
    status: campaignStatus("status").default("active").notNull(),
    recurrence: text("recurrence"),
    recurrenceStartAt: timestamp("recurrence_start_at", {
      withTimezone: true,
    }),
    recurrenceTimeZone: text("recurrence_time_zone"),
    recurrenceDurationMinutes: integer("recurrence_duration_minutes"),
    archivedAt: timestamp("archived_at"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("campaigns_slug_uidx").on(table.slug),
    index("campaigns_status_idx").on(table.status),
    check(
      "campaigns_schedule_complete_check",
      sql`(
        (${table.recurrence} is null and ${table.recurrenceStartAt} is null and ${table.recurrenceTimeZone} is null)
        or
        (${table.recurrence} is not null and ${table.recurrenceStartAt} is not null and ${table.recurrenceTimeZone} is not null)
      )`,
    ),
    check(
      "campaigns_recurrence_duration_check",
      sql`${table.recurrenceDurationMinutes} is null or ${table.recurrenceDurationMinutes} > 0`,
    ),
  ],
);

/** Better Auth owns active membership rows; removal history lives in events. */
export const campaignMembers = pgTable(
  "campaign_members",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    organizationId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: campaignRole("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("campaign_members_campaign_user_uidx").on(
      table.organizationId,
      table.userId,
    ),
    index("campaign_members_campaign_idx").on(table.organizationId),
    index("campaign_members_user_idx").on(table.userId),
  ],
);

export const campaignMemberEvents = pgTable(
  "campaign_member_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    role: campaignRole("role").notNull(),
    action: campaignMemberEventAction("action").notNull(),
    previousRole: campaignRole("previous_role"),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("campaign_member_events_campaign_created_idx").on(
      table.campaignId,
      table.createdAt,
    ),
    index("campaign_member_events_user_idx").on(table.userId),
  ],
);

export const campaignInvitations = pgTable(
  "campaign_invitations",
  {
    id: text("id").primaryKey(),
    organizationId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: campaignRole("role").notNull(),
    status: campaignInvitationStatus("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("campaign_invitations_campaign_idx").on(table.organizationId),
    index("campaign_invitations_email_idx").on(table.email),
    index("campaign_invitations_campaign_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const campaignInviteCodes = pgTable(
  "campaign_invite_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    role: campaignRole("role").default("player").notNull(),
    status: campaignInviteCodeStatus("status").default("pending").notNull(),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").default(0).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    revokedById: text("revoked_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("campaign_invite_codes_code_uidx").on(table.code),
    index("campaign_invite_codes_campaign_status_idx").on(
      table.campaignId,
      table.status,
    ),
    check("campaign_invite_codes_use_count_check", sql`${table.useCount} >= 0`),
    check(
      "campaign_invite_codes_max_uses_check",
      sql`${table.maxUses} is null or ${table.maxUses} > 0`,
    ),
    check(
      "campaign_invite_codes_usage_check",
      sql`${table.maxUses} is null or ${table.useCount} <= ${table.maxUses}`,
    ),
  ],
);

export const campaignOccurrenceOverrides = pgTable(
  "campaign_occurrence_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    occurrenceStartAt: timestamp("occurrence_start_at", {
      withTimezone: true,
    }).notNull(),
    kind: campaignOccurrenceOverrideKind("kind").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    title: text("title"),
    notes: text("notes"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("campaign_occurrence_overrides_campaign_start_uidx").on(
      table.campaignId,
      table.occurrenceStartAt,
    ),
    check(
      "campaign_occurrence_overrides_shape_check",
      sql`(
        (${table.kind} = 'rescheduled' and ${table.startsAt} is not null)
        or
        (${table.kind} <> 'rescheduled' and ${table.startsAt} is null)
      )`,
    ),
    check(
      "campaign_occurrence_overrides_duration_check",
      sql`${table.durationMinutes} is null or ${table.durationMinutes} > 0`,
    ),
  ],
);

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.createdById],
    references: [users.id],
    relationName: "campaignCreator",
  }),
  members: many(campaignMembers),
  memberEvents: many(campaignMemberEvents),
  invitations: many(campaignInvitations),
  inviteCodes: many(campaignInviteCodes),
  occurrenceOverrides: many(campaignOccurrenceOverrides),
}));

export const campaignMembersRelations = relations(
  campaignMembers,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignMembers.organizationId],
      references: [campaigns.id],
    }),
    user: one(users, {
      fields: [campaignMembers.userId],
      references: [users.id],
    }),
  }),
);

export const campaignMemberEventsRelations = relations(
  campaignMemberEvents,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignMemberEvents.campaignId],
      references: [campaigns.id],
    }),
    user: one(users, {
      fields: [campaignMemberEvents.userId],
      references: [users.id],
      relationName: "campaignMemberEventUser",
    }),
    actor: one(users, {
      fields: [campaignMemberEvents.actorId],
      references: [users.id],
      relationName: "campaignMemberEventActor",
    }),
  }),
);

export const campaignInvitationsRelations = relations(
  campaignInvitations,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignInvitations.organizationId],
      references: [campaigns.id],
    }),
    inviter: one(users, {
      fields: [campaignInvitations.inviterId],
      references: [users.id],
    }),
  }),
);

export const campaignInviteCodesRelations = relations(
  campaignInviteCodes,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignInviteCodes.campaignId],
      references: [campaigns.id],
    }),
  }),
);

export const campaignOccurrenceOverridesRelations = relations(
  campaignOccurrenceOverrides,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignOccurrenceOverrides.campaignId],
      references: [campaigns.id],
    }),
  }),
);
