import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import type * as schema from "@/server/db/schema";
import {
  campaignMemberNotes,
  characterSheets,
  characters,
  encounterCombatants,
  encounterEffects,
  encounters,
  sheetResources,
  users,
} from "@/server/db/schema";

import { getCharacterSheet } from "./character";

export type PlayDatabase = NeonHttpDatabase<typeof schema>;

export async function listPlayPartySummaries(
  db: PlayDatabase,
  campaignId: string,
) {
  return db
    .select({
      sheetId: characterSheets.id,
      ownerId: characterSheets.ownerId,
      name: sql<string>`coalesce(${characterSheets.name}, ${characters.name})`,
      ancestry: characterSheets.ancestry,
      ownerName: users.name,
      ownerImage: users.image,
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
    .innerJoin(users, eq(characterSheets.ownerId, users.id))
    .where(
      and(
        eq(characterSheets.campaignId, campaignId),
        isNull(characterSheets.retiredAt),
        isNull(characters.deletedAt),
      ),
    )
    .orderBy(asc(characters.name));
}

async function getActiveSheetIdForOwner(
  db: PlayDatabase,
  campaignId: string,
  userId: string,
) {
  const [result] = await db
    .select({ sheetId: characterSheets.id })
    .from(characterSheets)
    .innerJoin(characters, eq(characterSheets.charId, characters.id))
    .where(
      and(
        eq(characterSheets.campaignId, campaignId),
        eq(characterSheets.ownerId, userId),
        isNull(characterSheets.retiredAt),
        isNull(characters.deletedAt),
      ),
    )
    .limit(1);

  return result?.sheetId ?? null;
}

async function listSheetResources(db: PlayDatabase, sheetId: string) {
  return db
    .select({
      id: sheetResources.id,
      name: sheetResources.name,
      currentValue: sheetResources.currentValue,
      maxValue: sheetResources.maxValue,
      sort: sheetResources.sort,
      updatedAt: sheetResources.updatedAt,
    })
    .from(sheetResources)
    .where(eq(sheetResources.sheetId, sheetId))
    .orderBy(asc(sheetResources.sort), asc(sheetResources.createdAt));
}

export async function getPrivateCampaignNote(
  db: PlayDatabase,
  campaignId: string,
  userId: string,
) {
  const [note] = await db
    .select({
      content: campaignMemberNotes.content,
      updatedAt: campaignMemberNotes.updatedAt,
    })
    .from(campaignMemberNotes)
    .where(
      and(
        eq(campaignMemberNotes.campaignId, campaignId),
        eq(campaignMemberNotes.userId, userId),
      ),
    )
    .limit(1);

  return note ?? { content: "", updatedAt: null };
}

export async function savePrivateCampaignNote(
  db: PlayDatabase,
  input: { campaignId: string; userId: string; content: string },
) {
  const [note] = await db
    .insert(campaignMemberNotes)
    .values(input)
    .onConflictDoUpdate({
      target: [campaignMemberNotes.campaignId, campaignMemberNotes.userId],
      set: { content: input.content, updatedAt: new Date() },
    })
    .returning({
      content: campaignMemberNotes.content,
      updatedAt: campaignMemberNotes.updatedAt,
    });

  return note ?? null;
}

export async function getActiveEncounterRecord(
  db: PlayDatabase,
  campaignId: string,
) {
  return (
    (await db.query.encounters.findFirst({
      where: and(
        eq(encounters.campaignId, campaignId),
        eq(encounters.status, "active"),
      ),
      with: {
        combatants: {
          orderBy: [asc(encounterCombatants.position)],
          with: {
            effects: {
              where: isNull(encounterEffects.removedAt),
              orderBy: [asc(encounterEffects.createdAt)],
            },
          },
        },
      },
    })) ?? null
  );
}

export type ActiveEncounterRecord = NonNullable<
  Awaited<ReturnType<typeof getActiveEncounterRecord>>
>;

function encounterBase(encounter: ActiveEncounterRecord) {
  return {
    id: encounter.id,
    name: encounter.name,
    status: encounter.status,
    round: encounter.round,
    activePosition: encounter.activePosition,
    revision: encounter.revision,
  };
}

export function toPlayerEncounterState(
  encounter: ActiveEncounterRecord | null,
) {
  if (!encounter) return null;

  return {
    ...encounterBase(encounter),
    combatants: encounter.combatants
      .filter((combatant) => combatant.visibility !== "dm")
      .map((combatant) => ({
        id: combatant.id,
        sheetId: combatant.sheetId,
        name: combatant.name,
        initiativeTotal: combatant.initiativeTotal,
        position: combatant.position,
        visibility: combatant.visibility,
        currentHp:
          combatant.visibility === "players" ? combatant.currentHp : null,
        maxHp: combatant.visibility === "players" ? combatant.maxHp : null,
        tempHp: combatant.visibility === "players" ? combatant.tempHp : null,
        effects: combatant.effects
          .filter((effect) => effect.visibility === "players")
          .map((effect) => ({
            id: effect.id,
            name: effect.name,
            description: effect.description,
            remainingTurns: effect.remainingTurns,
            tick: effect.tick,
          })),
      })),
  };
}

export function toDmEncounterState(encounter: ActiveEncounterRecord | null) {
  if (!encounter) return null;

  return {
    ...encounterBase(encounter),
    combatants: encounter.combatants.map((combatant) => ({
      id: combatant.id,
      sheetId: combatant.sheetId,
      source: combatant.source,
      name: combatant.name,
      initiativeRoll: combatant.initiativeRoll,
      initiativeModifier: combatant.initiativeModifier,
      initiativeTotal: combatant.initiativeTotal,
      position: combatant.position,
      currentHp: combatant.currentHp,
      maxHp: combatant.maxHp,
      tempHp: combatant.tempHp,
      visibility: combatant.visibility,
      dmNotes: combatant.dmNotes,
      effects: combatant.effects.map((effect) => ({
        id: effect.id,
        name: effect.name,
        description: effect.description,
        remainingTurns: effect.remainingTurns,
        tick: effect.tick,
        visibility: effect.visibility,
      })),
    })),
  };
}

export async function getPlayerPlayBootstrap(
  db: PlayDatabase,
  campaignId: string,
  userId: string,
) {
  const [party, note, sheetId, encounter] = await Promise.all([
    listPlayPartySummaries(db, campaignId),
    getPrivateCampaignNote(db, campaignId, userId),
    getActiveSheetIdForOwner(db, campaignId, userId),
    getActiveEncounterRecord(db, campaignId),
  ]);

  const [sheet, resources] = sheetId
    ? await Promise.all([
        getCharacterSheet(db, campaignId, sheetId),
        listSheetResources(db, sheetId),
      ])
    : [null, []];

  return {
    encounter: toPlayerEncounterState(encounter),
    note,
    party,
    sheet: sheet ? { ...sheet, resources } : null,
  };
}

export async function getDmPlayBootstrap(
  db: PlayDatabase,
  campaignId: string,
  userId: string,
) {
  const [party, note, encounter] = await Promise.all([
    listPlayPartySummaries(db, campaignId),
    getPrivateCampaignNote(db, campaignId, userId),
    getActiveEncounterRecord(db, campaignId),
  ]);

  return {
    encounter: toDmEncounterState(encounter),
    note,
    party,
  };
}
