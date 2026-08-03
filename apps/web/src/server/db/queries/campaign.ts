import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import {
  MAX_ACTIVE_CAMPAIGNS_PER_USER,
  MAX_CAMPAIGN_MEMBERS,
} from "@/lib/constants";
import type * as schema from "@/server/db/schema";
import {
  campaignInvitations,
  campaignInviteCodes,
  campaignMemberEvents,
  campaignMembers,
  campaignOccurrenceOverrides,
  campaigns,
  users,
} from "@/server/db/schema";

export type CampaignDatabase = NeonHttpDatabase<typeof schema>;
export type CampaignStatusFilter = "active" | "archived" | "all";
export type CampaignRole = "dm" | "player";

export type CampaignAvatar = {
  id: string;
  name: string;
  image: string | null;
};

export async function listCampaignsForUser(
  db: CampaignDatabase,
  userId: string,
  status: CampaignStatusFilter = "active",
) {
  const statusPredicate =
    status === "all" ? undefined : eq(campaigns.status, status);

  return db
    .select({
      ...getTableColumns(campaigns),
      memberId: campaignMembers.id,
      role: campaignMembers.role,
      memberCount: sql<number>`(
        select count(*)::int
        from ${campaignMembers} all_members
        where all_members.campaign_id = ${campaigns.id}
      )`,
      members: sql<CampaignAvatar[]>`coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', member_avatar.id,
            'name', member_avatar.name,
            'image', member_avatar.image
          ) order by member_avatar.created_at
        )
        from (
          select
            member_user.id,
            member_user.name,
            member_user.image,
            avatar_member.created_at
          from ${campaignMembers} avatar_member
          inner join ${users} member_user on member_user.id = avatar_member.user_id
          where avatar_member.campaign_id = ${campaigns.id}
          order by avatar_member.created_at
          limit 4
        ) member_avatar
      ), '[]'::jsonb)`,
    })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaignMembers.organizationId, campaigns.id))
    .where(and(eq(campaignMembers.userId, userId), statusPredicate))
    .orderBy(desc(campaigns.updatedAt));
}

function campaignMembershipSelection() {
  return {
    ...getTableColumns(campaigns),
    memberId: campaignMembers.id,
    memberRole: campaignMembers.role,
    memberSince: campaignMembers.createdAt,
  };
}

export async function getCampaignForMemberById(
  db: CampaignDatabase,
  campaignId: string,
  userId: string,
) {
  const [result] = await db
    .select(campaignMembershipSelection())
    .from(campaigns)
    .innerJoin(
      campaignMembers,
      and(
        eq(campaignMembers.organizationId, campaigns.id),
        eq(campaignMembers.userId, userId),
      ),
    )
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  return result ?? null;
}

export async function getCampaignForMemberBySlug(
  db: CampaignDatabase,
  slug: string,
  userId: string,
) {
  const [result] = await db
    .select(campaignMembershipSelection())
    .from(campaigns)
    .innerJoin(
      campaignMembers,
      and(
        eq(campaignMembers.organizationId, campaigns.id),
        eq(campaignMembers.userId, userId),
      ),
    )
    .where(eq(campaigns.slug, slug))
    .limit(1);
  return result ?? null;
}

export async function listCampaignMembers(
  db: CampaignDatabase,
  campaignId: string,
) {
  return db
    .select({
      id: campaignMembers.id,
      userId: campaignMembers.userId,
      role: campaignMembers.role,
      joinedAt: campaignMembers.createdAt,
      name: users.name,
      image: users.image,
    })
    .from(campaignMembers)
    .innerJoin(users, eq(campaignMembers.userId, users.id))
    .where(eq(campaignMembers.organizationId, campaignId))
    .orderBy(asc(campaignMembers.createdAt));
}

export async function listCampaignMemberEvents(
  db: CampaignDatabase,
  campaignId: string,
) {
  return db
    .select()
    .from(campaignMemberEvents)
    .where(eq(campaignMemberEvents.campaignId, campaignId))
    .orderBy(desc(campaignMemberEvents.createdAt));
}

export async function countCampaignMembers(
  db: CampaignDatabase,
  campaignId: string,
) {
  const [result] = await db
    .select({ value: count() })
    .from(campaignMembers)
    .where(eq(campaignMembers.organizationId, campaignId));
  return result?.value ?? 0;
}

export async function countCampaignDms(
  db: CampaignDatabase,
  campaignId: string,
) {
  const [result] = await db
    .select({ value: count() })
    .from(campaignMembers)
    .where(
      and(
        eq(campaignMembers.organizationId, campaignId),
        eq(campaignMembers.role, "dm"),
      ),
    );
  return result?.value ?? 0;
}

export async function countActiveCampaignsForUser(
  db: CampaignDatabase,
  userId: string,
) {
  const [result] = await db
    .select({ value: count() })
    .from(campaignMembers)
    .innerJoin(campaigns, eq(campaignMembers.organizationId, campaigns.id))
    .where(
      and(eq(campaignMembers.userId, userId), eq(campaigns.status, "active")),
    );
  return result?.value ?? 0;
}

export async function campaignSlugExists(db: CampaignDatabase, slug: string) {
  const [result] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.slug, slug))
    .limit(1);
  return result !== undefined;
}

export type CreateCampaignInput = {
  slug: string;
  name: string;
  description?: string | null;
  colors?: "lilac" | "rose" | "sage" | "sky";
  logo?: string | null;
  bannerImage?: string | null;
  creatorId: string;
};

export async function createCampaign(
  db: CampaignDatabase,
  input: CreateCampaignInput,
) {
  // Neon HTTP has no interactive transactions. These dependent writes are one
  // PostgreSQL statement so a campaign can never exist without its first DM.
  const result = await db.execute<{ campaignId: string; slug: string }>(sql`
    with creator_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('campaign-create:' || ${input.creatorId}, 0)
      ) as acquired
    ), new_campaign as (
      insert into campaigns (
        slug, name, description, colors, logo, banner_image, created_by_id
      )
      select
        ${input.slug},
        ${input.name},
        ${input.description ?? null},
        ${input.colors ?? "lilac"}::campaign_colors,
        ${input.logo ?? null},
        ${input.bannerImage ?? null},
        ${input.creatorId}
      from creator_lock
      where (
        select count(*)
        from campaign_members creator_membership
        inner join campaigns creator_campaign
          on creator_campaign.id = creator_membership.campaign_id
        where creator_membership.user_id = ${input.creatorId}
          and creator_campaign.status = 'active'
      ) < ${MAX_ACTIVE_CAMPAIGNS_PER_USER}
      returning id, slug
    ), new_member as (
      insert into campaign_members (campaign_id, user_id, role)
      select id, ${input.creatorId}, 'dm'::campaign_role from new_campaign
      returning campaign_id, user_id, role
    ), new_event as (
      insert into campaign_member_events (
        campaign_id, user_id, role, action, actor_id
      )
      select campaign_id, user_id, role, 'joined', ${input.creatorId}
      from new_member
    )
    select id as "campaignId", slug from new_campaign
  `);
  return result.rows[0] ?? null;
}

export type CampaignDetailsUpdate = Partial<{
  name: string;
  description: string | null;
  colors: "lilac" | "rose" | "sage" | "sky";
  logo: string | null;
  bannerImage: string | null;
}>;

export async function updateCampaign(
  db: CampaignDatabase,
  campaignId: string,
  values: CampaignDetailsUpdate,
) {
  const [result] = await db
    .update(campaigns)
    .set(values)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.status, "active")))
    .returning();
  return result ?? null;
}

export async function archiveCampaign(
  db: CampaignDatabase,
  campaignId: string,
  actorId: string,
) {
  const result = await db.execute<{
    id: string;
    slug: string;
    status: "archived";
    archivedAt: Date;
  }>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${campaignId}::text, 0)
      ) as acquired
    ), archived_campaign as (
      update campaigns
      set status = 'archived', archived_at = now(), updated_at = now()
      where id = ${campaignId}
        and status = 'active'
        and exists (select 1 from campaign_lock)
      returning *
    ), revoked_codes as (
      update campaign_invite_codes
      set status = 'revoked', revoked_at = now(), revoked_by_id = ${actorId}, updated_at = now()
      where campaign_id = ${campaignId} and status = 'pending'
    ), canceled_invitations as (
      update campaign_invitations
      set status = 'canceled'
      where campaign_id = ${campaignId} and status = 'pending'
    )
    select
      id,
      slug,
      status,
      archived_at as "archivedAt"
    from archived_campaign
  `);
  return result.rows[0] ?? null;
}

export async function restoreCampaign(
  db: CampaignDatabase,
  campaignId: string,
) {
  const [result] = await db
    .update(campaigns)
    .set({ status: "active", archivedAt: null })
    .where(eq(campaigns.id, campaignId))
    .returning();
  return result ?? null;
}

export async function listPendingCampaignInvitations(
  db: CampaignDatabase,
  campaignId: string,
) {
  return db
    .select()
    .from(campaignInvitations)
    .where(
      and(
        eq(campaignInvitations.organizationId, campaignId),
        eq(campaignInvitations.status, "pending"),
        gt(campaignInvitations.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(campaignInvitations.createdAt));
}

export async function listPendingCampaignInviteCodes(
  db: CampaignDatabase,
  campaignId: string,
) {
  return db
    .select()
    .from(campaignInviteCodes)
    .where(
      and(
        eq(campaignInviteCodes.campaignId, campaignId),
        eq(campaignInviteCodes.status, "pending"),
        gt(campaignInviteCodes.expiresAt, new Date()),
        sql`(${campaignInviteCodes.maxUses} is null or ${campaignInviteCodes.useCount} < ${campaignInviteCodes.maxUses})`,
      ),
    )
    .orderBy(desc(campaignInviteCodes.createdAt));
}

export async function countPendingCampaignInvites(
  db: CampaignDatabase,
  campaignId: string,
) {
  const result = await db.execute<{ value: number }>(sql`
    select (
      (select count(*) from campaign_invitations
        where campaign_id = ${campaignId} and status = 'pending'
          and expires_at > now())
      +
      (select count(*) from campaign_invite_codes
        where campaign_id = ${campaignId} and status = 'pending'
          and expires_at > now()
          and (max_uses is null or use_count < max_uses))
    )::int as value
  `);
  return result.rows[0]?.value ?? 0;
}

export async function getCampaignInviteCode(
  db: CampaignDatabase,
  code: string,
) {
  const [result] = await db
    .select({
      ...getTableColumns(campaignInviteCodes),
      campaignName: campaigns.name,
      campaignStatus: campaigns.status,
      campaignSlug: campaigns.slug,
      inviterName: users.name,
    })
    .from(campaignInviteCodes)
    .innerJoin(campaigns, eq(campaignInviteCodes.campaignId, campaigns.id))
    .leftJoin(users, eq(campaignInviteCodes.createdById, users.id))
    .where(eq(campaignInviteCodes.code, code))
    .limit(1);
  return result ?? null;
}

export type CreateInviteCodeInput = {
  campaignId: string;
  code: string;
  role: CampaignRole;
  expiresAt: Date;
  maxUses?: number | null;
  createdById: string;
};

export async function createCampaignInviteCode(
  db: CampaignDatabase,
  input: CreateInviteCodeInput,
) {
  const [result] = await db
    .insert(campaignInviteCodes)
    .values(input)
    .returning();
  return result ?? null;
}

/** Revoke the previous role code and create its replacement atomically. */
export async function replaceCampaignInviteCode(
  db: CampaignDatabase,
  input: CreateInviteCodeInput,
) {
  const result = await db.execute<typeof campaignInviteCodes.$inferSelect>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${input.campaignId}::text, 0)
      ) as acquired
    ), active_campaign as materialized (
      select id
      from campaigns
      where id = ${input.campaignId}
        and status = 'active'
        and exists (select 1 from campaign_lock)
    ), revoked_codes as (
      update campaign_invite_codes
      set
        status = 'revoked',
        revoked_at = now(),
        revoked_by_id = ${input.createdById},
        updated_at = now()
      where campaign_id = ${input.campaignId}
        and role = ${input.role}::campaign_role
        and status = 'pending'
        and exists (select 1 from active_campaign)
      returning id
    ), inserted_code as (
      insert into campaign_invite_codes (
        campaign_id, code, role, expires_at, max_uses, created_by_id
      )
      select
        active_campaign.id,
        ${input.code},
        ${input.role}::campaign_role,
        ${input.expiresAt},
        ${input.maxUses ?? null},
        ${input.createdById}
      from active_campaign
      where (select count(*) from revoked_codes) >= 0
      returning *
    )
    select
      id,
      campaign_id as "campaignId",
      code,
      role,
      status,
      max_uses as "maxUses",
      use_count as "useCount",
      expires_at as "expiresAt",
      created_by_id as "createdById",
      revoked_by_id as "revokedById",
      revoked_at as "revokedAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from inserted_code
  `);
  return result.rows[0] ?? null;
}

export async function revokeCampaignInviteCodes(
  db: CampaignDatabase,
  input: { campaignId: string; role?: CampaignRole; actorId: string },
) {
  return db
    .update(campaignInviteCodes)
    .set({
      status: "revoked",
      revokedAt: new Date(),
      revokedById: input.actorId,
    })
    .where(
      and(
        eq(campaignInviteCodes.campaignId, input.campaignId),
        eq(campaignInviteCodes.status, "pending"),
        input.role ? eq(campaignInviteCodes.role, input.role) : undefined,
      ),
    )
    .returning();
}

/**
 * Claim a code and add its member in one statement. Any insert or event failure
 * rolls the use-count update back with the rest of the PostgreSQL statement.
 */
export async function acceptCampaignInviteCode(
  db: CampaignDatabase,
  input: { inviteCodeId: string; userId: string; now: Date },
) {
  const result = await db.execute<typeof campaignMembers.$inferSelect>(sql`
    with invite_campaign as materialized (
      select campaign_id
      from campaign_invite_codes
      where id = ${input.inviteCodeId}
    ), campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended((select campaign_id::text from invite_campaign), 0)
      ) as acquired
    ), active_campaign as materialized (
      select campaign.id
      from campaigns campaign
      inner join invite_campaign on invite_campaign.campaign_id = campaign.id
      where campaign.status = 'active'
        and exists (select 1 from campaign_lock)
    ), claimed_code as (
      update campaign_invite_codes invite_code
      set use_count = invite_code.use_count + 1, updated_at = now()
      where invite_code.id = ${input.inviteCodeId}
        and exists (select 1 from active_campaign)
        and invite_code.status = 'pending'
        and invite_code.expires_at > ${input.now}
        and (
          invite_code.max_uses is null
          or invite_code.use_count < invite_code.max_uses
        )
        and not exists (
          select 1 from campaign_members existing_member
          where existing_member.campaign_id = invite_code.campaign_id
            and existing_member.user_id = ${input.userId}
        )
        and (
          select count(*)
          from campaign_members member_count
          where member_count.campaign_id = invite_code.campaign_id
        ) < ${MAX_CAMPAIGN_MEMBERS}
      returning invite_code.campaign_id, invite_code.role
    ), inserted_member as (
      insert into campaign_members (campaign_id, user_id, role)
      select campaign_id, ${input.userId}, role from claimed_code
      returning *
    ), joined_event as (
      insert into campaign_member_events (
        campaign_id, user_id, role, action, actor_id
      )
      select campaign_id, user_id, role, 'joined', ${input.userId}
      from inserted_member
    )
    select
      id,
      campaign_id as "organizationId",
      user_id as "userId",
      role,
      created_at as "createdAt"
    from inserted_member
  `);
  return result.rows[0] ?? null;
}

export async function upsertCampaignMembership(
  db: CampaignDatabase,
  input: {
    campaignId: string;
    userId: string;
    role: CampaignRole;
    actorId?: string | null;
  },
) {
  const result = await db.execute<typeof campaignMembers.$inferSelect>(sql`
    with inserted_member as (
      insert into campaign_members (campaign_id, user_id, role)
      values (${input.campaignId}, ${input.userId}, ${input.role}::campaign_role)
      on conflict (campaign_id, user_id) do nothing
      returning *
    ), joined_event as (
      insert into campaign_member_events (
        campaign_id, user_id, role, action, actor_id
      )
      select campaign_id, user_id, role, 'joined', ${input.actorId ?? input.userId}
      from inserted_member
    )
    select
      id,
      campaign_id as "organizationId",
      user_id as "userId",
      role,
      created_at as "createdAt"
    from inserted_member
    union all
    select
      id,
      campaign_id as "organizationId",
      user_id as "userId",
      role,
      created_at as "createdAt"
    from campaign_members
    where campaign_id = ${input.campaignId}
      and user_id = ${input.userId}
      and not exists (select 1 from inserted_member)
    limit 1
  `);
  return result.rows[0] ?? null;
}

export async function updateCampaignMemberRole(
  db: CampaignDatabase,
  input: {
    campaignId: string;
    memberId: string;
    role: CampaignRole;
    actorId: string;
  },
) {
  const result = await db.execute<typeof campaignMembers.$inferSelect>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${input.campaignId}::text, 0)
      ) as acquired
    ), active_campaign as materialized (
      select id
      from campaigns
      where id = ${input.campaignId}
        and status = 'active'
        and exists (select 1 from campaign_lock)
    ), locked_dms as materialized (
      select id
      from campaign_members
      where campaign_id = ${input.campaignId}
        and role = 'dm'
        and exists (select 1 from active_campaign)
      order by id
      for update
    ), original_member as materialized (
      select id, campaign_id, user_id, role, created_at
      from campaign_members
      where id = ${input.memberId}
        and campaign_id = ${input.campaignId}
        and exists (select 1 from active_campaign)
    ), updated_member as (
      update campaign_members target
      set role = ${input.role}::campaign_role
      from original_member original
      where target.id = original.id
        and (
          original.role <> 'dm'
          or ${input.role}::campaign_role = 'dm'
          or (select count(*) from locked_dms) > 1
        )
      returning
        target.id,
        target.campaign_id,
        target.user_id,
        target.role,
        target.created_at,
        original.role as previous_role
    ), role_event as (
      insert into campaign_member_events (
        campaign_id, user_id, role, action, previous_role, actor_id
      )
      select
        campaign_id,
        user_id,
        role,
        'role_changed',
        previous_role,
        ${input.actorId}
      from updated_member
      where previous_role <> role
    )
    select
      id,
      campaign_id as "organizationId",
      user_id as "userId",
      role,
      created_at as "createdAt"
    from updated_member
  `);
  return result.rows[0] ?? null;
}

async function deleteMembershipWithEvent(
  db: CampaignDatabase,
  input: {
    campaignId: string;
    memberId?: string;
    userId?: string;
    actorId: string;
    action: "removed" | "left";
    rejectActorAsTarget: boolean;
  },
) {
  if ((input.memberId === undefined) === (input.userId === undefined)) {
    throw new Error(
      "Select a campaign membership by either member id or user id.",
    );
  }
  const targetPredicate = input.memberId
    ? sql`target.id = ${input.memberId}`
    : sql`target.user_id = ${input.userId}`;
  const result = await db.execute<typeof campaignMembers.$inferSelect>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${input.campaignId}::text, 0)
      ) as acquired
    ), active_campaign as materialized (
      select id
      from campaigns
      where id = ${input.campaignId}
        and status = 'active'
        and exists (select 1 from campaign_lock)
    ), locked_dms as materialized (
      select id
      from campaign_members
      where campaign_id = ${input.campaignId}
        and role = 'dm'
        and exists (select 1 from active_campaign)
      order by id
      for update
    ), deleted_member as (
      delete from campaign_members target
      where ${targetPredicate}
        and target.campaign_id = ${input.campaignId}
        and exists (select 1 from active_campaign)
        and (${!input.rejectActorAsTarget} or target.user_id <> ${input.actorId})
        and (
          target.role <> 'dm'
          or (select count(*) from locked_dms) > 1
        )
      returning *
    ), member_event as (
      insert into campaign_member_events (
        campaign_id, user_id, role, action, actor_id
      )
      select
        campaign_id,
        user_id,
        role,
        ${input.action}::campaign_member_event_action,
        ${input.actorId}
      from deleted_member
    )
    select
      id,
      campaign_id as "organizationId",
      user_id as "userId",
      role,
      created_at as "createdAt"
    from deleted_member
  `);
  return result.rows[0] ?? null;
}

export function removeCampaignMember(
  db: CampaignDatabase,
  input: {
    campaignId: string;
    memberId: string;
    actorId: string;
  },
) {
  return deleteMembershipWithEvent(db, {
    ...input,
    action: "removed",
    rejectActorAsTarget: true,
  });
}

export async function leaveCampaign(
  db: CampaignDatabase,
  input: { campaignId: string; userId: string },
) {
  return deleteMembershipWithEvent(db, {
    campaignId: input.campaignId,
    userId: input.userId,
    actorId: input.userId,
    action: "left",
    rejectActorAsTarget: false,
  });
}

export type CampaignScheduleUpdate = {
  recurrence: string;
  recurrenceStartAt: Date;
  recurrenceTimeZone: string;
};

export async function setCampaignSchedule(
  db: CampaignDatabase,
  campaignId: string,
  schedule: CampaignScheduleUpdate,
) {
  const result = await db.execute<{
    id: string;
    recurrence: string;
    recurrenceStartAt: Date;
    recurrenceTimeZone: string;
    recurrenceDurationMinutes: null;
  }>(sql`
    with scheduled_campaign as (
      update campaigns
      set
        recurrence = ${schedule.recurrence},
        recurrence_start_at = ${schedule.recurrenceStartAt},
        recurrence_time_zone = ${schedule.recurrenceTimeZone},
        recurrence_duration_minutes = null,
        updated_at = now()
      where id = ${campaignId}
        and status = 'active'
      returning
        id,
        recurrence,
        recurrence_start_at,
        recurrence_time_zone,
        recurrence_duration_minutes
    ), removed_rule_overrides as (
      delete from campaign_occurrence_overrides
      where campaign_id = ${campaignId}
        and kind <> 'added'
        and exists (select 1 from scheduled_campaign)
      returning id
    )
    select
      id,
      recurrence,
      recurrence_start_at as "recurrenceStartAt",
      recurrence_time_zone as "recurrenceTimeZone",
      recurrence_duration_minutes as "recurrenceDurationMinutes"
    from scheduled_campaign
    where (select count(*) from removed_rule_overrides) >= 0
  `);
  return result.rows[0] ?? null;
}

export async function clearCampaignSchedule(
  db: CampaignDatabase,
  campaignId: string,
) {
  // Neon HTTP has no interactive transactions. Clear the recurring rule and
  // its rule-bound exceptions together while preserving added one-offs.
  const result = await db.execute<{
    id: string;
    recurrence: null;
    recurrenceStartAt: null;
    recurrenceTimeZone: null;
    recurrenceDurationMinutes: null;
  }>(sql`
    with cleared_campaign as (
      update campaigns
      set
        recurrence = null,
        recurrence_start_at = null,
        recurrence_time_zone = null,
        recurrence_duration_minutes = null,
        updated_at = now()
      where id = ${campaignId}
        and status = 'active'
      returning id
    ), removed_rule_overrides as (
      delete from campaign_occurrence_overrides
      where campaign_id = ${campaignId}
        and kind <> 'added'
        and exists (select 1 from cleared_campaign)
      returning id
    )
    select
      id,
      null::text as recurrence,
      null::timestamptz as "recurrenceStartAt",
      null::text as "recurrenceTimeZone",
      null::integer as "recurrenceDurationMinutes"
    from cleared_campaign
    where (select count(*) from removed_rule_overrides) >= 0
  `);
  return result.rows[0] ?? null;
}

export async function listCampaignOccurrenceOverrides(
  db: CampaignDatabase,
  campaignIds: string[],
  range?: { from: Date; through: Date },
) {
  if (campaignIds.length === 0) return [];
  return db
    .select()
    .from(campaignOccurrenceOverrides)
    .where(
      and(
        inArray(campaignOccurrenceOverrides.campaignId, campaignIds),
        range
          ? and(
              gte(campaignOccurrenceOverrides.occurrenceStartAt, range.from),
              lte(campaignOccurrenceOverrides.occurrenceStartAt, range.through),
            )
          : undefined,
      ),
    )
    .orderBy(asc(campaignOccurrenceOverrides.occurrenceStartAt));
}

export type OccurrenceOverrideWrite = {
  campaignId: string;
  occurrenceStartAt: Date;
  kind: "cancelled" | "rescheduled" | "added";
  startsAt?: Date | null;
  durationMinutes?: number | null;
  title?: string | null;
  notes?: string | null;
  createdById: string;
};

export async function upsertCampaignOccurrenceOverride(
  db: CampaignDatabase,
  input: OccurrenceOverrideWrite,
) {
  const result = await db.execute<
    typeof campaignOccurrenceOverrides.$inferSelect
  >(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${input.campaignId}::text, 0)
      ) as acquired
    ), active_campaign as materialized (
      select id
      from campaigns
      where id = ${input.campaignId}
        and status = 'active'
        and exists (select 1 from campaign_lock)
    ), written_override as (
      insert into campaign_occurrence_overrides (
        campaign_id,
        occurrence_start_at,
        kind,
        starts_at,
        duration_minutes,
        title,
        notes,
        created_by_id
      )
      select
        id,
        ${input.occurrenceStartAt},
        ${input.kind}::campaign_occurrence_override_kind,
        ${input.startsAt ?? null},
        ${input.durationMinutes ?? null},
        ${input.title ?? null},
        ${input.notes ?? null},
        ${input.createdById}
      from active_campaign
      on conflict (campaign_id, occurrence_start_at) do update set
        kind = excluded.kind,
        starts_at = excluded.starts_at,
        duration_minutes = excluded.duration_minutes,
        title = excluded.title,
        notes = excluded.notes,
        updated_at = now()
      returning *
    )
    select
      id,
      campaign_id as "campaignId",
      occurrence_start_at as "occurrenceStartAt",
      kind,
      starts_at as "startsAt",
      duration_minutes as "durationMinutes",
      title,
      notes,
      created_by_id as "createdById",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from written_override
  `);
  return result.rows[0] ?? null;
}

export async function removeCampaignOccurrenceOverride(
  db: CampaignDatabase,
  campaignId: string,
  occurrenceStartAt: Date,
) {
  const result = await db.execute<
    typeof campaignOccurrenceOverrides.$inferSelect
  >(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended(${campaignId}::text, 0)
      ) as acquired
    ), active_campaign as materialized (
      select id
      from campaigns
      where id = ${campaignId}
        and status = 'active'
        and exists (select 1 from campaign_lock)
    ), removed_override as (
      delete from campaign_occurrence_overrides
      where campaign_id = ${campaignId}
        and occurrence_start_at = ${occurrenceStartAt}
        and exists (select 1 from active_campaign)
      returning *
    )
    select
      id,
      campaign_id as "campaignId",
      occurrence_start_at as "occurrenceStartAt",
      kind,
      starts_at as "startsAt",
      duration_minutes as "durationMinutes",
      title,
      notes,
      created_by_id as "createdById",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from removed_override
  `);
  return result.rows[0] ?? null;
}
