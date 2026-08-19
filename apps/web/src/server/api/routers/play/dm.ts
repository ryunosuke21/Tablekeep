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
      return result;
    }),
  advanceTurn: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
        direction: z.enum(["next", "previous"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      advanceEncounterTurn(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      }).then(requireEncounterResult),
    ),
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
    .mutation(({ ctx, input }) =>
      setEncounterCombatantHealth(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      }).then(requireEncounterResult),
    ),
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
    .mutation(({ ctx, input }) =>
      addEncounterEffect(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      }).then(requireEncounterResult),
    ),
  removeEffect: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
        effectId: z.uuid(),
      }),
    )
    .mutation(({ ctx, input }) =>
      removeEncounterEffect(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      }).then(requireEncounterResult),
    ),
  completeEncounter: campaignDmProcedure
    .input(
      z.object({
        campaignId: z.uuid(),
        expectedRevision: revisionSchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      completeEncounter(ctx.db, {
        ...input,
        actorId: ctx.session.user.id,
      }).then(requireEncounterResult),
    ),
});
