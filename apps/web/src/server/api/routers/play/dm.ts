import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { campaignDmProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
  addEncounterEffect,
  advanceEncounterTurn,
  beginEncounter,
  completeEncounter,
  removeEncounterEffect,
  setEncounterCombatantHealth,
} from "@/server/db/queries/encounter";
import { getDmPlayBootstrap } from "@/server/db/queries/play";
import { publishEncounterChanged } from "@/server/partykit/publish";

import { playCampaignSummary } from "./common";

const combatantVisibilitySchema = z.enum(["players", "name_only", "dm"]);
const effectVisibilitySchema = z.enum(["players", "dm"]);
const effectTickSchema = z.enum([
  "turn_start",
  "turn_end",
  "round_start",
  "manual",
]);
const revisionSchema = z.number().int().min(0);
const hpSchema = z.number().int().min(-1_000_000).max(1_000_000);

const beginEncounterSchema = z
  .object({
    campaignId: z.uuid(),
    name: z.string().trim().min(1).max(120).default("Encounter"),
    initiativeMode: z.enum(["auto", "manual"]),
    combatants: z
      .array(
        z.object({
          sheetId: z.uuid().nullable(),
          name: z.string().trim().min(1).max(120),
          initiativeModifier: z.number().int().min(-1000).max(1000),
          initiativeTotal: z.number().int().min(-2000).max(2000).nullable(),
          currentHp: hpSchema.nullable(),
          maxHp: z.number().int().min(1).max(1_000_000).nullable(),
          visibility: combatantVisibilitySchema,
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((input, ctx) => {
    input.combatants.forEach((combatant, index) => {
      if (
        input.initiativeMode === "manual" &&
        combatant.initiativeTotal === null
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Manual initiative requires a total for every combatant",
          path: ["combatants", index, "initiativeTotal"],
        });
      }
      if (
        combatant.sheetId === null &&
        combatant.currentHp !== null &&
        combatant.maxHp !== null &&
        combatant.currentHp > combatant.maxHp
      ) {
        ctx.addIssue({
          code: "custom",
          message:
            "Current HP cannot exceed maximum HP when an encounter starts",
          path: ["combatants", index, "currentHp"],
        });
      }
    });
  });

function requireEncounterResult<T>(result: T | null): T {
  if (!result) {
    throw new TRPCError({ code: "CONFLICT" });
  }
  return result;
}

async function publishResult<
  T extends { encounterId: string; revision: number },
>(campaignId: string, result: T) {
  await publishEncounterChanged({
    campaignId,
    encounterId: result.encounterId,
    revision: result.revision,
  });
  return result;
}

export const playDmRouter = createTRPCRouter({
  bootstrap: campaignDmProcedure.query(async ({ ctx }) => ({
    campaign: playCampaignSummary(ctx.campaign),
    role: "dm" as const,
    ...(await getDmPlayBootstrap(ctx.db, ctx.campaign.id, ctx.session.user.id)),
  })),
  beginEncounter: campaignDmProcedure
    .input(beginEncounterSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await beginEncounter(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      if (!result) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }
      return publishResult(input.campaignId, result);
    }),
  advanceTurn: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
        direction: z.enum(["next", "previous"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await advanceEncounterTurn(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      return publishResult(input.campaignId, requireEncounterResult(result));
    }),
  setHealth: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
        combatantId: z.uuid(),
        currentHp: hpSchema.nullable(),
        tempHp: z.number().int().min(0).max(1_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await setEncounterCombatantHealth(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      return publishResult(input.campaignId, requireEncounterResult(result));
    }),
  addEffect: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
        combatantId: z.uuid(),
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(2000).nullable(),
        remainingTurns: z.number().int().min(0).max(100_000).nullable(),
        tick: effectTickSchema,
        visibility: effectVisibilitySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await addEncounterEffect(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      return publishResult(input.campaignId, requireEncounterResult(result));
    }),
  removeEffect: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
        effectId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await removeEncounterEffect(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      return publishResult(input.campaignId, requireEncounterResult(result));
    }),
  completeEncounter: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await completeEncounter(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      });
      return publishResult(input.campaignId, requireEncounterResult(result));
    }),
});
