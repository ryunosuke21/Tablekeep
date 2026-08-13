import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { alias } from "drizzle-orm/pg-core";

import {
  MAX_CHARACTERS_PER_USER,
  MAX_SHEET_BACKGROUNDS,
  MAX_SHEET_CLASSES,
  MAX_SHEET_CONDITIONS,
  MAX_SHEET_CURRENCIES,
  MAX_SHEET_FEATS,
  MAX_SHEET_ITEMS,
  MAX_SHEET_NPCS,
  MAX_SHEET_SPELLS,
  MAX_SHEET_STATS,
} from "@/lib/constants";
import type * as schema from "@/server/db/schema";
import {
  campaignMembers,
  campaigns,
  characterSheets,
  characters,
  sheetBackgrounds,
  sheetClasses,
  sheetConditions,
  sheetCurrencies,
  sheetEvents,
  sheetFeats,
  sheetItems,
  sheetNpcs,
  sheetSpells,
  sheetStats,
} from "@/server/db/schema";
import { deriveCharacterSlug } from "@/server/domain/character/slug";
import { randomUUID } from "node:crypto";

export type CharacterDatabase = NeonHttpDatabase<typeof schema>;
export type CharacterStatusFilter = "active" | "deleted" | "all";

function activeSheet(sheetId: unknown) {
  return sql`exists (
    select 1
    from character_sheets active_sheet
    inner join characters active_character
      on active_character.id = active_sheet.char_id
    inner join campaign_members active_member
      on active_member.campaign_id = active_sheet.campaign_id
      and active_member.user_id = active_sheet.owner_id
    inner join campaigns active_campaign
      on active_campaign.id = active_sheet.campaign_id
      and active_campaign.status = 'active'
    where active_sheet.id = ${sheetId}
      and active_sheet.retired_at is null
      and active_character.deleted_at is null
  )`;
}

export async function listCharactersForOwner(
  db: CharacterDatabase,
  ownerId: string,
  status: CharacterStatusFilter = "active",
) {
  const ownedCharacter = alias(characters, "owned_character");
  const ownedCharacterId = sql.raw('"owned_character"."id"');
  const statusPredicate =
    status === "all"
      ? undefined
      : status === "deleted"
        ? isNotNull(ownedCharacter.deletedAt)
        : isNull(ownedCharacter.deletedAt);

  return db
    .select({
      ...getTableColumns(ownedCharacter),
      sheets: sql<
        Array<{
          id: string;
          campaignId: string;
          campaignName: string;
          campaignSlug: string;
          name: string | null;
          ancestry: string | null;
          maxHp: number;
          totalLevel: number;
        }>
      >`coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', sheet.id,
            'campaignId', sheet.campaign_id,
            'campaignName', campaign.name,
            'campaignSlug', campaign.slug,
            'name', sheet.name,
            'ancestry', sheet.ancestry,
            'maxHp', sheet.max_hp,
            'totalLevel', coalesce((
              select sum(class.level)::int
              from sheet_classes class
              where class.sheet_id = sheet.id
            ), 0)
          ) order by sheet.updated_at desc
        )
        from character_sheets sheet
        inner join campaigns campaign on campaign.id = sheet.campaign_id
        inner join campaign_members membership
          on membership.campaign_id = sheet.campaign_id
          and membership.user_id = ${ownerId}
        where sheet.char_id = ${ownedCharacterId}
          and sheet.owner_id = ${ownerId}
          and sheet.retired_at is null
      ), '[]'::jsonb)`,
    })
    .from(ownedCharacter)
    .where(and(eq(ownedCharacter.ownerId, ownerId), statusPredicate))
    .orderBy(desc(ownedCharacter.updatedAt));
}

export async function getCharacterForOwnerBySlug(
  db: CharacterDatabase,
  ownerId: string,
  slug: string,
) {
  const [result] = await db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.ownerId, ownerId),
        eq(characters.slug, slug),
        isNull(characters.deletedAt),
      ),
    )
    .limit(1);
  return result ?? null;
}

export async function createCharacter(
  db: CharacterDatabase,
  input: { ownerId: string; name: string; bio?: string | null },
) {
  const slug = deriveCharacterSlug(input.name, randomUUID().slice(0, 6));
  const result = await db.execute<typeof characters.$inferSelect>(sql`
    with owner_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('character-create:' || ${input.ownerId}, 0)
      ) as acquired
    ), new_character as (
      insert into characters (owner_id, slug, name, bio)
      select ${input.ownerId}, ${slug}, ${input.name}, ${input.bio ?? null}
      from owner_lock
      where (
        select count(*)
        from characters owned
        where owned.owner_id = ${input.ownerId}
          and owned.deleted_at is null
      ) < ${MAX_CHARACTERS_PER_USER}
      returning *
    )
    select * from new_character
  `);
  return result.rows[0] ?? null;
}

export async function updateCharacter(
  db: CharacterDatabase,
  ownerId: string,
  charId: string,
  values: Partial<{ name: string; bio: string | null }>,
) {
  const [result] = await db
    .update(characters)
    .set(values)
    .where(
      and(
        eq(characters.id, charId),
        eq(characters.ownerId, ownerId),
        isNull(characters.deletedAt),
      ),
    )
    .returning();
  return result ?? null;
}

export async function deleteCharacter(
  db: CharacterDatabase,
  ownerId: string,
  charId: string,
) {
  const result = await db.execute<typeof characters.$inferSelect>(sql`
    with deleted_character as (
      update characters
      set deleted_at = now(), updated_at = now()
      where id = ${charId}
        and owner_id = ${ownerId}
        and deleted_at is null
      returning *
    ), retired_sheets as (
      update character_sheets
      set retired_at = now(), retired_by = ${ownerId}, updated_by = ${ownerId}, updated_at = now()
      where char_id in (select id from deleted_character)
        and retired_at is null
    )
    select * from deleted_character
  `);
  return result.rows[0] ?? null;
}

export async function restoreCharacter(
  db: CharacterDatabase,
  ownerId: string,
  charId: string,
) {
  const result = await db.execute<typeof characters.$inferSelect>(sql`
    with owner_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('character-create:' || ${ownerId}, 0)
      ) as acquired
    ), restored_character as (
      update characters
      set deleted_at = null, updated_at = now()
      where id = ${charId}
        and owner_id = ${ownerId}
        and deleted_at is not null
        and exists (select 1 from owner_lock)
        and (
          select count(*) from characters owned
          where owned.owner_id = ${ownerId}
            and owned.deleted_at is null
        ) < ${MAX_CHARACTERS_PER_USER}
      returning *
    )
    select * from restored_character
  `);
  return result.rows[0] ?? null;
}

export async function getSheetAccess(
  db: CharacterDatabase,
  campaignId: string,
  sheetId: string,
) {
  const [result] = await db
    .select({
      ownerId: characterSheets.ownerId,
      retiredAt: characterSheets.retiredAt,
      deletedAt: characters.deletedAt,
    })
    .from(characterSheets)
    .innerJoin(characters, eq(characterSheets.charId, characters.id))
    .where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.campaignId, campaignId),
      ),
    )
    .limit(1);
  return result ?? null;
}

export async function getCharacterForSheetCreation(
  db: CharacterDatabase,
  campaignId: string,
  charId: string,
) {
  const [result] = await db
    .select({ ownerId: characters.ownerId })
    .from(characters)
    .innerJoin(
      campaignMembers,
      and(
        eq(campaignMembers.userId, characters.ownerId),
        eq(campaignMembers.organizationId, campaignId),
      ),
    )
    .innerJoin(
      campaigns,
      and(eq(campaigns.id, campaignId), eq(campaigns.status, "active")),
    )
    .where(and(eq(characters.id, charId), isNull(characters.deletedAt)))
    .limit(1);
  return result ?? null;
}

export async function listCharacterSheets(
  db: CharacterDatabase,
  campaignId: string,
  ownerId?: string,
) {
  return db
    .select({
      ...getTableColumns(characterSheets),
      charName: characters.name,
      charSlug: characters.slug,
      charBio: characters.bio,
      totalLevel: sql<number>`coalesce((
        select sum(class.level)::int
        from sheet_classes class
        where class.sheet_id = ${characterSheets.id}
      ), 0)`,
      classes: sql<
        Array<{ name: string; subclass: string | null; level: number }>
      >`coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'name', class.name,
            'subclass', class.subclass,
            'level', class.level
          ) order by class.sort, class.created_at
        )
        from sheet_classes class
        where class.sheet_id = ${characterSheets.id}
      ), '[]'::jsonb)`,
    })
    .from(characterSheets)
    .innerJoin(characters, eq(characterSheets.charId, characters.id))
    .where(
      and(
        eq(characterSheets.campaignId, campaignId),
        isNull(characterSheets.retiredAt),
        isNull(characters.deletedAt),
        ownerId === undefined
          ? undefined
          : eq(characterSheets.ownerId, ownerId),
      ),
    )
    .orderBy(asc(characters.name));
}

export async function getCharacterSheet(
  db: CharacterDatabase,
  campaignId: string,
  sheetId: string,
) {
  const [sheet] = await db
    .select({
      ...getTableColumns(characterSheets),
      charName: characters.name,
      charSlug: characters.slug,
      charBio: characters.bio,
      charDeletedAt: characters.deletedAt,
    })
    .from(characterSheets)
    .innerJoin(characters, eq(characterSheets.charId, characters.id))
    .where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.campaignId, campaignId),
      ),
    )
    .limit(1);
  if (!sheet) return null;

  const [
    classes,
    backgrounds,
    conditions,
    items,
    currencies,
    stats,
    feats,
    npcs,
    spells,
  ] = await Promise.all([
    db
      .select()
      .from(sheetClasses)
      .where(eq(sheetClasses.sheetId, sheetId))
      .orderBy(asc(sheetClasses.sort), asc(sheetClasses.createdAt)),
    db
      .select()
      .from(sheetBackgrounds)
      .where(eq(sheetBackgrounds.sheetId, sheetId))
      .orderBy(asc(sheetBackgrounds.sort), asc(sheetBackgrounds.createdAt)),
    db
      .select()
      .from(sheetConditions)
      .where(
        and(
          eq(sheetConditions.sheetId, sheetId),
          isNull(sheetConditions.removedAt),
        ),
      )
      .orderBy(asc(sheetConditions.createdAt)),
    db
      .select()
      .from(sheetItems)
      .where(eq(sheetItems.sheetId, sheetId))
      .orderBy(asc(sheetItems.removedAt), asc(sheetItems.createdAt)),
    db
      .select()
      .from(sheetCurrencies)
      .where(eq(sheetCurrencies.sheetId, sheetId))
      .orderBy(asc(sheetCurrencies.removedAt), asc(sheetCurrencies.createdAt)),
    db
      .select()
      .from(sheetStats)
      .where(eq(sheetStats.sheetId, sheetId))
      .orderBy(asc(sheetStats.sort), asc(sheetStats.createdAt)),
    db
      .select()
      .from(sheetFeats)
      .where(eq(sheetFeats.sheetId, sheetId))
      .orderBy(asc(sheetFeats.sort), asc(sheetFeats.createdAt)),
    db
      .select()
      .from(sheetNpcs)
      .where(eq(sheetNpcs.sheetId, sheetId))
      .orderBy(asc(sheetNpcs.sort), asc(sheetNpcs.createdAt)),
    db
      .select()
      .from(sheetSpells)
      .where(eq(sheetSpells.sheetId, sheetId))
      .orderBy(
        asc(sheetSpells.level),
        asc(sheetSpells.sort),
        asc(sheetSpells.name),
      ),
  ]);

  return {
    ...sheet,
    classes,
    backgrounds,
    conditions,
    items,
    currencies,
    stats,
    feats,
    npcs,
    spells,
    totalLevel: classes.reduce((total, entry) => total + entry.level, 0),
  };
}

export async function createCharacterSheet(
  db: CharacterDatabase,
  input: {
    campaignId: string;
    charId: string;
    ownerId: string;
    actorId: string;
  },
) {
  const result = await db.execute<typeof characterSheets.$inferSelect>(sql`
    with owner_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('sheet:' || ${input.campaignId}::text || ':' || ${input.ownerId}, 0)
      ) as acquired
    ), new_sheet as (
      insert into character_sheets (
        campaign_id, char_id, owner_id, updated_by
      )
      select ${input.campaignId}, character.id, character.owner_id, ${input.actorId}
      from characters character
      inner join campaign_members member
        on member.campaign_id = ${input.campaignId}
        and member.user_id = character.owner_id
      inner join campaigns campaign
        on campaign.id = ${input.campaignId}
        and campaign.status = 'active'
      where character.id = ${input.charId}
        and character.owner_id = ${input.ownerId}
        and character.deleted_at is null
        and exists (select 1 from owner_lock)
        and not exists (
          select 1 from character_sheets active
          where active.campaign_id = ${input.campaignId}
            and active.owner_id = ${input.ownerId}
            and active.retired_at is null
        )
      returning *
    )
    select * from new_sheet
  `);
  return result.rows[0] ?? null;
}

export async function updateCharacterSheet(
  db: CharacterDatabase,
  campaignId: string,
  sheetId: string,
  values: Partial<{
    name: string | null;
    ancestry: string | null;
    alignment: string | null;
    appearance: string | null;
    backstory: string | null;
    maxHp: number;
    notes: string | null;
  }>,
  actorId: string,
) {
  const [result] = await db
    .update(characterSheets)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.campaignId, campaignId),
        isNull(characterSheets.retiredAt),
        activeSheet(characterSheets.id),
      ),
    )
    .returning();
  return result ?? null;
}

export async function retireCharacterSheet(
  db: CharacterDatabase,
  campaignId: string,
  sheetId: string,
  actorId: string,
) {
  const [result] = await db
    .update(characterSheets)
    .set({ retiredAt: new Date(), retiredBy: actorId, updatedBy: actorId })
    .where(
      and(
        eq(characterSheets.id, sheetId),
        eq(characterSheets.campaignId, campaignId),
        isNull(characterSheets.retiredAt),
        activeSheet(characterSheets.id),
      ),
    )
    .returning();
  return result ?? null;
}

export async function reactivateCharacterSheet(
  db: CharacterDatabase,
  campaignId: string,
  sheetId: string,
  actorId: string,
) {
  const result = await db.execute<typeof characterSheets.$inferSelect>(sql`
    with target as materialized (
      select sheet.*
      from character_sheets sheet
      inner join characters character
        on character.id = sheet.char_id and character.deleted_at is null
      inner join campaign_members member
        on member.campaign_id = sheet.campaign_id
        and member.user_id = sheet.owner_id
      inner join campaigns campaign
        on campaign.id = sheet.campaign_id and campaign.status = 'active'
      where sheet.id = ${sheetId}
        and sheet.campaign_id = ${campaignId}
        and sheet.retired_at is not null
    ), owner_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('sheet:' || ${campaignId}::text || ':' || target.owner_id, 0)
      ) as acquired
      from target
    ), restored as (
      update character_sheets sheet
      set retired_at = null, retired_by = null, updated_by = ${actorId}, updated_at = now()
      from target
      where sheet.id = target.id
        and exists (select 1 from owner_lock)
        and not exists (
          select 1 from character_sheets active
          where active.campaign_id = ${campaignId}
            and active.owner_id = target.owner_id
            and active.retired_at is null
        )
      returning sheet.*
    )
    select * from restored
  `);
  return result.rows[0] ?? null;
}

type ClassCreate = {
  sheetId: string;
  name: string;
  subclass?: string | null;
  level: number;
  source: string;
  ref?: string | null;
  sort: number;
  actorId: string;
};

export async function createSheetClass(
  db: CharacterDatabase,
  input: ClassCreate,
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(input.sheetId),
    })
    .from(sheetClasses)
    .where(eq(sheetClasses.sheetId, input.sheetId));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_CLASSES) {
    return null;
  }
  const [result] = await db
    .insert(sheetClasses)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      subclass: input.subclass,
      level: input.level,
      source: input.source,
      ref: input.ref,
      sort: input.sort,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetClass(
  db: CharacterDatabase,
  sheetId: string,
  classId: string,
  values: Partial<Omit<ClassCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetClasses)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetClasses.id, classId),
        eq(sheetClasses.sheetId, sheetId),
        activeSheet(sheetClasses.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetClass(
  db: CharacterDatabase,
  sheetId: string,
  classId: string,
  _actorId: string,
) {
  const [result] = await db
    .delete(sheetClasses)
    .where(
      and(
        eq(sheetClasses.id, classId),
        eq(sheetClasses.sheetId, sheetId),
        activeSheet(sheetClasses.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type BackgroundCreate = {
  sheetId: string;
  name: string;
  notes?: string | null;
  source: string;
  ref?: string | null;
  sort: number;
  actorId: string;
};

export async function createSheetBackground(
  db: CharacterDatabase,
  input: BackgroundCreate,
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(input.sheetId),
    })
    .from(sheetBackgrounds)
    .where(eq(sheetBackgrounds.sheetId, input.sheetId));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_BACKGROUNDS) {
    return null;
  }
  const [result] = await db
    .insert(sheetBackgrounds)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      notes: input.notes,
      source: input.source,
      ref: input.ref,
      sort: input.sort,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetBackground(
  db: CharacterDatabase,
  sheetId: string,
  backgroundId: string,
  values: Partial<Omit<BackgroundCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetBackgrounds)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetBackgrounds.id, backgroundId),
        eq(sheetBackgrounds.sheetId, sheetId),
        activeSheet(sheetBackgrounds.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetBackground(
  db: CharacterDatabase,
  sheetId: string,
  backgroundId: string,
  _actorId: string,
) {
  const [result] = await db
    .delete(sheetBackgrounds)
    .where(
      and(
        eq(sheetBackgrounds.id, backgroundId),
        eq(sheetBackgrounds.sheetId, sheetId),
        activeSheet(sheetBackgrounds.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function createSheetCondition(
  db: CharacterDatabase,
  input: { sheetId: string; name: string; actorId: string },
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(input.sheetId),
    })
    .from(sheetConditions)
    .where(
      and(
        eq(sheetConditions.sheetId, input.sheetId),
        isNull(sheetConditions.removedAt),
      ),
    );
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_CONDITIONS) {
    return null;
  }
  const [result] = await db
    .insert(sheetConditions)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      createdBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function removeSheetCondition(
  db: CharacterDatabase,
  sheetId: string,
  conditionId: string,
  actorId: string,
) {
  const [result] = await db
    .update(sheetConditions)
    .set({ removedAt: new Date(), removedBy: actorId })
    .where(
      and(
        eq(sheetConditions.id, conditionId),
        eq(sheetConditions.sheetId, sheetId),
        isNull(sheetConditions.removedAt),
        activeSheet(sheetConditions.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type ItemCreate = {
  sheetId: string;
  name: string;
  qty: number;
  equipped: boolean;
  notes?: string | null;
  actorId: string;
};

export async function createSheetItem(
  db: CharacterDatabase,
  input: ItemCreate,
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(input.sheetId),
    })
    .from(sheetItems)
    .where(
      and(eq(sheetItems.sheetId, input.sheetId), isNull(sheetItems.removedAt)),
    );
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_ITEMS) {
    return null;
  }
  const [result] = await db
    .insert(sheetItems)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      qty: input.qty,
      equipped: input.equipped,
      notes: input.notes,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetItem(
  db: CharacterDatabase,
  sheetId: string,
  itemId: string,
  values: Partial<Omit<ItemCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetItems)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetItems.id, itemId),
        eq(sheetItems.sheetId, sheetId),
        isNull(sheetItems.removedAt),
        activeSheet(sheetItems.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetItem(
  db: CharacterDatabase,
  sheetId: string,
  itemId: string,
  actorId: string,
) {
  const [result] = await db
    .update(sheetItems)
    .set({ removedAt: new Date(), removedBy: actorId, updatedBy: actorId })
    .where(
      and(
        eq(sheetItems.id, itemId),
        eq(sheetItems.sheetId, sheetId),
        isNull(sheetItems.removedAt),
        activeSheet(sheetItems.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function restoreSheetItem(
  db: CharacterDatabase,
  sheetId: string,
  itemId: string,
  actorId: string,
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(sheetId),
    })
    .from(sheetItems)
    .where(and(eq(sheetItems.sheetId, sheetId), isNull(sheetItems.removedAt)));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_ITEMS) {
    return null;
  }
  const [result] = await db
    .update(sheetItems)
    .set({ removedAt: null, removedBy: null, updatedBy: actorId })
    .where(
      and(
        eq(sheetItems.id, itemId),
        eq(sheetItems.sheetId, sheetId),
        sql`${sheetItems.removedAt} is not null`,
        activeSheet(sheetItems.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type CurrencyCreate = {
  sheetId: string;
  name: string;
  amount: number;
  actorId: string;
};

export async function createSheetCurrency(
  db: CharacterDatabase,
  input: CurrencyCreate,
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(input.sheetId),
    })
    .from(sheetCurrencies)
    .where(
      and(
        eq(sheetCurrencies.sheetId, input.sheetId),
        isNull(sheetCurrencies.removedAt),
      ),
    );
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_CURRENCIES) {
    return null;
  }
  const [result] = await db
    .insert(sheetCurrencies)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      amount: input.amount,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetCurrency(
  db: CharacterDatabase,
  sheetId: string,
  currencyId: string,
  values: Partial<Omit<CurrencyCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetCurrencies)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetCurrencies.id, currencyId),
        eq(sheetCurrencies.sheetId, sheetId),
        isNull(sheetCurrencies.removedAt),
        activeSheet(sheetCurrencies.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetCurrency(
  db: CharacterDatabase,
  sheetId: string,
  currencyId: string,
  actorId: string,
) {
  const [result] = await db
    .update(sheetCurrencies)
    .set({ removedAt: new Date(), removedBy: actorId, updatedBy: actorId })
    .where(
      and(
        eq(sheetCurrencies.id, currencyId),
        eq(sheetCurrencies.sheetId, sheetId),
        isNull(sheetCurrencies.removedAt),
        activeSheet(sheetCurrencies.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function restoreSheetCurrency(
  db: CharacterDatabase,
  sheetId: string,
  currencyId: string,
  actorId: string,
) {
  const [countResult] = await db
    .select({
      value: count(),
      sheetActive: activeSheet(sheetId),
    })
    .from(sheetCurrencies)
    .where(
      and(
        eq(sheetCurrencies.sheetId, sheetId),
        isNull(sheetCurrencies.removedAt),
      ),
    );
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_CURRENCIES) {
    return null;
  }
  const [result] = await db
    .update(sheetCurrencies)
    .set({ removedAt: null, removedBy: null, updatedBy: actorId })
    .where(
      and(
        eq(sheetCurrencies.id, currencyId),
        eq(sheetCurrencies.sheetId, sheetId),
        sql`${sheetCurrencies.removedAt} is not null`,
        activeSheet(sheetCurrencies.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type StatCreate = {
  sheetId: string;
  name: string;
  value: number;
  sort: number;
  actorId: string;
};

export async function createSheetStat(
  db: CharacterDatabase,
  input: StatCreate,
) {
  const [countResult] = await db
    .select({ value: count(), sheetActive: activeSheet(input.sheetId) })
    .from(sheetStats)
    .where(eq(sheetStats.sheetId, input.sheetId));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_STATS) {
    return null;
  }
  const [result] = await db
    .insert(sheetStats)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      value: input.value,
      sort: input.sort,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetStat(
  db: CharacterDatabase,
  sheetId: string,
  statId: string,
  values: Partial<Omit<StatCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetStats)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetStats.id, statId),
        eq(sheetStats.sheetId, sheetId),
        activeSheet(sheetStats.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetStat(
  db: CharacterDatabase,
  sheetId: string,
  statId: string,
  _actorId: string,
) {
  const [result] = await db
    .delete(sheetStats)
    .where(
      and(
        eq(sheetStats.id, statId),
        eq(sheetStats.sheetId, sheetId),
        activeSheet(sheetStats.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type FeatCreate = {
  sheetId: string;
  name: string;
  notes?: string | null;
  source: string;
  ref?: string | null;
  sort: number;
  actorId: string;
};

export async function createSheetFeat(
  db: CharacterDatabase,
  input: FeatCreate,
) {
  const [countResult] = await db
    .select({ value: count(), sheetActive: activeSheet(input.sheetId) })
    .from(sheetFeats)
    .where(eq(sheetFeats.sheetId, input.sheetId));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_FEATS) {
    return null;
  }
  const [result] = await db
    .insert(sheetFeats)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      notes: input.notes,
      source: input.source,
      ref: input.ref,
      sort: input.sort,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetFeat(
  db: CharacterDatabase,
  sheetId: string,
  featId: string,
  values: Partial<Omit<FeatCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetFeats)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetFeats.id, featId),
        eq(sheetFeats.sheetId, sheetId),
        activeSheet(sheetFeats.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetFeat(
  db: CharacterDatabase,
  sheetId: string,
  featId: string,
  _actorId: string,
) {
  const [result] = await db
    .delete(sheetFeats)
    .where(
      and(
        eq(sheetFeats.id, featId),
        eq(sheetFeats.sheetId, sheetId),
        activeSheet(sheetFeats.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type NpcCreate = {
  sheetId: string;
  name: string;
  relationship?: string | null;
  notes?: string | null;
  sort: number;
  actorId: string;
};

export async function createSheetNpc(db: CharacterDatabase, input: NpcCreate) {
  const [countResult] = await db
    .select({ value: count(), sheetActive: activeSheet(input.sheetId) })
    .from(sheetNpcs)
    .where(eq(sheetNpcs.sheetId, input.sheetId));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_NPCS) {
    return null;
  }
  const [result] = await db
    .insert(sheetNpcs)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      relationship: input.relationship,
      notes: input.notes,
      sort: input.sort,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetNpc(
  db: CharacterDatabase,
  sheetId: string,
  npcId: string,
  values: Partial<Omit<NpcCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetNpcs)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetNpcs.id, npcId),
        eq(sheetNpcs.sheetId, sheetId),
        activeSheet(sheetNpcs.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetNpc(
  db: CharacterDatabase,
  sheetId: string,
  npcId: string,
  _actorId: string,
) {
  const [result] = await db
    .delete(sheetNpcs)
    .where(
      and(
        eq(sheetNpcs.id, npcId),
        eq(sheetNpcs.sheetId, sheetId),
        activeSheet(sheetNpcs.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

type SpellCreate = {
  sheetId: string;
  name: string;
  level: number;
  prepared: boolean;
  notes?: string | null;
  source: string;
  ref?: string | null;
  sort: number;
  actorId: string;
};

export async function createSheetSpell(
  db: CharacterDatabase,
  input: SpellCreate,
) {
  const [countResult] = await db
    .select({ value: count(), sheetActive: activeSheet(input.sheetId) })
    .from(sheetSpells)
    .where(eq(sheetSpells.sheetId, input.sheetId));
  if (!countResult?.sheetActive || countResult.value >= MAX_SHEET_SPELLS) {
    return null;
  }
  const [result] = await db
    .insert(sheetSpells)
    .values({
      sheetId: input.sheetId,
      name: input.name,
      level: input.level,
      prepared: input.prepared,
      notes: input.notes,
      source: input.source,
      ref: input.ref,
      sort: input.sort,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    })
    .returning();
  return result ?? null;
}

export async function updateSheetSpell(
  db: CharacterDatabase,
  sheetId: string,
  spellId: string,
  values: Partial<Omit<SpellCreate, "sheetId" | "actorId">>,
  actorId: string,
) {
  const [result] = await db
    .update(sheetSpells)
    .set({ ...values, updatedBy: actorId })
    .where(
      and(
        eq(sheetSpells.id, spellId),
        eq(sheetSpells.sheetId, sheetId),
        activeSheet(sheetSpells.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

export async function removeSheetSpell(
  db: CharacterDatabase,
  sheetId: string,
  spellId: string,
  _actorId: string,
) {
  const [result] = await db
    .delete(sheetSpells)
    .where(
      and(
        eq(sheetSpells.id, spellId),
        eq(sheetSpells.sheetId, sheetId),
        activeSheet(sheetSpells.sheetId),
      ),
    )
    .returning();
  return result ?? null;
}

/**
 * History is append-only and deliberately unguarded by `activeSheet`: a change
 * to a retired sheet still deserves a record, and the caller has already been
 * authorized for this sheet by the time it writes one.
 */
export async function recordSheetEvent(
  db: CharacterDatabase,
  input: {
    sheetId: string;
    actorId: string;
    actorName: string;
    actorRole: string;
    entity: string;
    action: string;
    summary: string;
  },
) {
  const [result] = await db.insert(sheetEvents).values(input).returning();
  return result ?? null;
}

export async function listSheetEvents(
  db: CharacterDatabase,
  sheetId: string,
  limit: number,
) {
  return db
    .select()
    .from(sheetEvents)
    .where(eq(sheetEvents.sheetId, sheetId))
    .orderBy(desc(sheetEvents.createdAt), desc(sheetEvents.id))
    .limit(limit);
}
