import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import type * as schema from "@/server/db/schema";

export type EncounterDatabase = NeonHttpDatabase<typeof schema>;

export type BeginEncounterCombatant = {
  sheetId: string | null;
  name: string;
  initiativeModifier: number;
  initiativeTotal: number | null;
  currentHp: number | null;
  maxHp: number | null;
  visibility: "players" | "name_only" | "dm";
};

export type BeginEncounterInput = {
  campaignId: string;
  actorId: string;
  name: string;
  initiativeMode: "auto" | "manual";
  combatants: BeginEncounterCombatant[];
};

type EncounterRevisionResult = {
  encounterId: string;
  revision: number;
};

export async function beginEncounter(
  db: EncounterDatabase,
  input: BeginEncounterInput,
) {
  const payload = input.combatants.map((combatant, inputOrder) => ({
    ...combatant,
    inputOrder,
  }));
  const autoRoll = input.initiativeMode === "auto";

  const result = await db.execute<EncounterRevisionResult>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('encounter:' || ${input.campaignId}::text, 0)
      ) as acquired
    ), input_combatants as materialized (
      select *
      from jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) as input(
        "inputOrder" integer,
        "sheetId" uuid,
        "name" text,
        "initiativeModifier" integer,
        "initiativeTotal" integer,
        "currentHp" integer,
        "maxHp" integer,
        "visibility" encounter_visibility
      )
    ), eligible as materialized (
      select
        input."inputOrder" as input_order,
        input."sheetId" as sheet_id,
        case
          when input."sheetId" is null then input."name"
          else coalesce(sheet.name, character.name)
        end as combatant_name,
        input."initiativeModifier" as initiative_modifier,
        input."initiativeTotal" as manual_total,
        case
          when input."sheetId" is null then input."maxHp"
          else sheet.max_hp
        end as max_hp,
        case
          when input."sheetId" is null
            then coalesce(input."currentHp", input."maxHp")
          else sheet.max_hp
        end as current_hp,
        input."visibility" as visibility
      from input_combatants input
      left join character_sheets sheet
        on sheet.id = input."sheetId"
        and sheet.campaign_id = ${input.campaignId}
        and sheet.retired_at is null
      left join characters character
        on character.id = sheet.char_id
        and character.deleted_at is null
      where input."sheetId" is null
        or (sheet.id is not null and character.id is not null)
    ), rolled as materialized (
      select
        eligible.*,
        case
          when ${autoRoll} then floor(random() * 20)::int + 1
          else null
        end as initiative_roll
      from eligible
    ), scored as materialized (
      select
        rolled.*,
        case
          when ${autoRoll}
            then rolled.initiative_roll + rolled.initiative_modifier
          else rolled.manual_total
        end as initiative_total
      from rolled
    ), ranked as materialized (
      select
        gen_random_uuid() as id,
        scored.*,
        row_number() over (
          order by
            scored.initiative_total desc,
            scored.initiative_modifier desc,
            scored.input_order
        )::int - 1 as position
      from scored
    ), new_encounter as (
      insert into encounters (
        campaign_id,
        name,
        status,
        round,
        active_position,
        revision,
        created_by,
        started_by,
        started_at
      )
      select
        ${input.campaignId},
        ${input.name},
        'active',
        1,
        0,
        1,
        ${input.actorId},
        ${input.actorId},
        now()
      from campaign_lock
      where exists (
        select 1
        from campaigns campaign
        where campaign.id = ${input.campaignId}
          and campaign.status = 'active'
      )
        and not exists (
        select 1
        from encounters active
        where active.campaign_id = ${input.campaignId}
          and active.status = 'active'
      )
        and (select count(*) from ranked) = jsonb_array_length(${JSON.stringify(payload)}::jsonb)
        and (select count(*) from ranked) > 0
        and not exists (
          select 1 from ranked where initiative_total is null
        )
      returning id, revision
    ), new_combatants as (
      insert into encounter_combatants (
        id,
        encounter_id,
        sheet_id,
        source,
        name,
        initiative_roll,
        initiative_modifier,
        initiative_total,
        position,
        current_hp,
        max_hp,
        temp_hp,
        visibility,
        created_by,
        updated_by
      )
      select
        ranked.id,
        new_encounter.id,
        ranked.sheet_id,
        case when ranked.sheet_id is null then 'custom' else 'sheet' end,
        ranked.combatant_name,
        ranked.initiative_roll,
        ranked.initiative_modifier,
        ranked.initiative_total,
        ranked.position,
        ranked.current_hp,
        ranked.max_hp,
        0,
        ranked.visibility,
        ${input.actorId},
        ${input.actorId}
      from ranked
      cross join new_encounter
      returning encounter_id
    ), new_event as (
      insert into encounter_events (
        encounter_id, actor_id, action, entity_type, summary, details
      )
      select
        new_encounter.id,
        ${input.actorId},
        'started',
        'encounter',
        'Encounter started',
        jsonb_build_object('combatantCount', count(new_combatants.encounter_id))
      from new_encounter
      join new_combatants on new_combatants.encounter_id = new_encounter.id
      group by new_encounter.id
    )
    select id as "encounterId", revision
    from new_encounter
  `);

  return result.rows[0] ?? null;
}

export async function advanceEncounterTurn(
  db: EncounterDatabase,
  input: {
    campaignId: string;
    actorId: string;
    expectedRevision: number;
    direction: "next" | "previous";
  },
) {
  const result = await db.execute<EncounterRevisionResult>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('encounter:' || ${input.campaignId}::text, 0)
      ) as acquired
    ), target as materialized (
      select
        encounter.id,
        encounter.round,
        encounter.active_position,
        min(combatant.position)::int as first_position,
        max(combatant.position)::int as last_position
      from encounters encounter
      cross join campaign_lock
      inner join campaigns campaign
        on campaign.id = encounter.campaign_id
        and campaign.status = 'active'
      inner join encounter_combatants combatant
        on combatant.encounter_id = encounter.id
      where encounter.campaign_id = ${input.campaignId}
        and encounter.status = 'active'
        and encounter.revision = ${input.expectedRevision}
      group by encounter.id
    ), updated_encounter as (
      update encounters encounter
      set
        active_position = case
          when ${input.direction} = 'next'
            and target.active_position >= target.last_position
            then target.first_position
          when ${input.direction} = 'next'
            then target.active_position + 1
          when target.active_position <= target.first_position
            then target.last_position
          else target.active_position - 1
        end,
        round = case
          when ${input.direction} = 'next'
            and target.active_position >= target.last_position
            then target.round + 1
          when ${input.direction} = 'previous'
            and target.active_position <= target.first_position
            then greatest(target.round - 1, 1)
          else target.round
        end,
        revision = encounter.revision + 1,
        updated_at = now()
      from target
      where encounter.id = target.id
      returning encounter.id, encounter.revision
    ), new_event as (
      insert into encounter_events (
        encounter_id, actor_id, action, entity_type, summary
      )
      select
        updated_encounter.id,
        ${input.actorId},
        ${input.direction},
        'turn',
        case
          when ${input.direction} = 'next' then 'Turn advanced'
          else 'Turn moved back'
        end
      from updated_encounter
    )
    select id as "encounterId", revision
    from updated_encounter
  `);

  return result.rows[0] ?? null;
}

export async function setEncounterCombatantHealth(
  db: EncounterDatabase,
  input: {
    campaignId: string;
    actorId: string;
    expectedRevision: number;
    combatantId: string;
    currentHp: number | null;
    tempHp: number;
  },
) {
  const result = await db.execute<
    EncounterRevisionResult & { currentHp: number | null; tempHp: number }
  >(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('encounter:' || ${input.campaignId}::text, 0)
      ) as acquired
    ), target as materialized (
      select combatant.id, encounter.id as encounter_id
      from encounters encounter
      cross join campaign_lock
      inner join campaigns campaign
        on campaign.id = encounter.campaign_id
        and campaign.status = 'active'
      inner join encounter_combatants combatant
        on combatant.encounter_id = encounter.id
      where encounter.campaign_id = ${input.campaignId}
        and encounter.status = 'active'
        and encounter.revision = ${input.expectedRevision}
        and combatant.id = ${input.combatantId}
    ), updated_combatant as (
      update encounter_combatants combatant
      set
        current_hp = ${input.currentHp},
        temp_hp = ${input.tempHp},
        updated_by = ${input.actorId},
        updated_at = now()
      from target
      where combatant.id = target.id
      returning combatant.id, combatant.current_hp, combatant.temp_hp, target.encounter_id
    ), updated_encounter as (
      update encounters encounter
      set revision = encounter.revision + 1, updated_at = now()
      from updated_combatant
      where encounter.id = updated_combatant.encounter_id
      returning encounter.id, encounter.revision
    ), new_event as (
      insert into encounter_events (
        encounter_id, actor_id, action, entity_type, entity_id, summary, details
      )
      select
        updated_encounter.id,
        ${input.actorId},
        'health_changed',
        'combatant',
        updated_combatant.id,
        'Combatant health changed',
        jsonb_build_object(
          'currentHp', updated_combatant.current_hp,
          'tempHp', updated_combatant.temp_hp
        )
      from updated_encounter
      join updated_combatant
        on updated_combatant.encounter_id = updated_encounter.id
    )
    select
      updated_encounter.id as "encounterId",
      updated_encounter.revision,
      updated_combatant.current_hp as "currentHp",
      updated_combatant.temp_hp as "tempHp"
    from updated_encounter
    join updated_combatant
      on updated_combatant.encounter_id = updated_encounter.id
  `);

  return result.rows[0] ?? null;
}

export async function addEncounterEffect(
  db: EncounterDatabase,
  input: {
    campaignId: string;
    actorId: string;
    expectedRevision: number;
    combatantId: string;
    name: string;
    description: string | null;
    remainingTurns: number | null;
    tick: "turn_start" | "turn_end" | "round_start" | "manual";
    visibility: "players" | "dm";
  },
) {
  const result = await db.execute<
    EncounterRevisionResult & { effectId: string }
  >(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('encounter:' || ${input.campaignId}::text, 0)
      ) as acquired
    ), target as materialized (
      select combatant.id as combatant_id, encounter.id as encounter_id
      from encounters encounter
      cross join campaign_lock
      inner join campaigns campaign
        on campaign.id = encounter.campaign_id
        and campaign.status = 'active'
      inner join encounter_combatants combatant
        on combatant.encounter_id = encounter.id
      where encounter.campaign_id = ${input.campaignId}
        and encounter.status = 'active'
        and encounter.revision = ${input.expectedRevision}
        and combatant.id = ${input.combatantId}
    ), new_effect as (
      insert into encounter_effects (
        combatant_id,
        name,
        description,
        remaining_turns,
        tick,
        visibility,
        created_by
      )
      select
        target.combatant_id,
        ${input.name},
        ${input.description},
        ${input.remainingTurns},
        ${input.tick},
        ${input.visibility},
        ${input.actorId}
      from target
      returning id, combatant_id
    ), updated_encounter as (
      update encounters encounter
      set revision = encounter.revision + 1, updated_at = now()
      from target
      where encounter.id = target.encounter_id
        and exists (select 1 from new_effect)
      returning encounter.id, encounter.revision
    ), new_event as (
      insert into encounter_events (
        encounter_id, actor_id, action, entity_type, entity_id, summary
      )
      select
        updated_encounter.id,
        ${input.actorId},
        'effect_added',
        'effect',
        new_effect.id,
        'Effect added'
      from updated_encounter
      cross join new_effect
    )
    select
      updated_encounter.id as "encounterId",
      updated_encounter.revision,
      new_effect.id as "effectId"
    from updated_encounter
    cross join new_effect
  `);

  return result.rows[0] ?? null;
}

export async function removeEncounterEffect(
  db: EncounterDatabase,
  input: {
    campaignId: string;
    actorId: string;
    expectedRevision: number;
    effectId: string;
  },
) {
  const result = await db.execute<EncounterRevisionResult>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('encounter:' || ${input.campaignId}::text, 0)
      ) as acquired
    ), target as materialized (
      select effect.id as effect_id, encounter.id as encounter_id
      from encounters encounter
      cross join campaign_lock
      inner join campaigns campaign
        on campaign.id = encounter.campaign_id
        and campaign.status = 'active'
      inner join encounter_combatants combatant
        on combatant.encounter_id = encounter.id
      inner join encounter_effects effect
        on effect.combatant_id = combatant.id
        and effect.removed_at is null
      where encounter.campaign_id = ${input.campaignId}
        and encounter.status = 'active'
        and encounter.revision = ${input.expectedRevision}
        and effect.id = ${input.effectId}
    ), removed_effect as (
      update encounter_effects effect
      set
        removed_at = now(),
        removed_by = ${input.actorId},
        updated_at = now()
      from target
      where effect.id = target.effect_id
      returning effect.id, target.encounter_id
    ), updated_encounter as (
      update encounters encounter
      set revision = encounter.revision + 1, updated_at = now()
      from removed_effect
      where encounter.id = removed_effect.encounter_id
      returning encounter.id, encounter.revision
    ), new_event as (
      insert into encounter_events (
        encounter_id, actor_id, action, entity_type, entity_id, summary
      )
      select
        updated_encounter.id,
        ${input.actorId},
        'effect_removed',
        'effect',
        removed_effect.id,
        'Effect removed'
      from updated_encounter
      join removed_effect
        on removed_effect.encounter_id = updated_encounter.id
    )
    select id as "encounterId", revision
    from updated_encounter
  `);

  return result.rows[0] ?? null;
}

export async function completeEncounter(
  db: EncounterDatabase,
  input: {
    campaignId: string;
    actorId: string;
    expectedRevision: number;
  },
) {
  const result = await db.execute<EncounterRevisionResult>(sql`
    with campaign_lock as materialized (
      select pg_advisory_xact_lock(
        hashtextextended('encounter:' || ${input.campaignId}::text, 0)
      ) as acquired
    ), updated_encounter as (
      update encounters encounter
      set
        status = 'completed',
        active_position = null,
        completed_by = ${input.actorId},
        completed_at = now(),
        revision = encounter.revision + 1,
        updated_at = now()
      from campaign_lock
      where encounter.campaign_id = ${input.campaignId}
        and encounter.status = 'active'
        and encounter.revision = ${input.expectedRevision}
        and exists (
          select 1
          from campaigns campaign
          where campaign.id = encounter.campaign_id
            and campaign.status = 'active'
        )
      returning encounter.id, encounter.revision
    ), new_event as (
      insert into encounter_events (
        encounter_id, actor_id, action, entity_type, summary
      )
      select
        updated_encounter.id,
        ${input.actorId},
        'completed',
        'encounter',
        'Encounter completed'
      from updated_encounter
    )
    select id as "encounterId", revision
    from updated_encounter
  `);

  return result.rows[0] ?? null;
}
