import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { campaignMemberCan } from "@tablekeep/campaign-auth/access";

import {
  characterCreateSchema,
  characterIdSchema,
  characterSlugSchema,
  characterUpdateSchema,
  sheetBackgroundCreateSchema,
  sheetBackgroundIdSchema,
  sheetBackgroundUpdateSchema,
  sheetClassCreateSchema,
  sheetClassIdSchema,
  sheetClassUpdateSchema,
  sheetConditionCreateSchema,
  sheetConditionIdSchema,
  sheetCreateSchema,
  sheetCurrencyCreateSchema,
  sheetCurrencyIdSchema,
  sheetCurrencyUpdateSchema,
  sheetEventListSchema,
  sheetFeatCreateSchema,
  sheetFeatIdSchema,
  sheetFeatUpdateSchema,
  sheetIdSchema,
  sheetItemCreateSchema,
  sheetItemIdSchema,
  sheetItemUpdateSchema,
  sheetNpcCreateSchema,
  sheetNpcIdSchema,
  sheetNpcUpdateSchema,
  sheetSpellCreateSchema,
  sheetSpellIdSchema,
  sheetSpellUpdateSchema,
  sheetStatCreateSchema,
  sheetStatIdSchema,
  sheetStatUpdateSchema,
  sheetUpdateSchema,
} from "@/lib/validation/character";
import {
  betaProcedure,
  campaignMemberProcedure,
  createTRPCRouter,
} from "@/server/api/trpc";
import {
  createCharacter,
  createCharacterSheet,
  createSheetBackground,
  createSheetClass,
  createSheetCondition,
  createSheetCurrency,
  createSheetFeat,
  createSheetItem,
  createSheetNpc,
  createSheetSpell,
  createSheetStat,
  deleteCharacter,
  getCharacterForOwnerBySlug,
  getCharacterForSheetCreation,
  getCharacterSheet,
  getSheetAccess,
  listCharacterSheets,
  listCharactersForOwner,
  listSheetEvents,
  reactivateCharacterSheet,
  recordSheetEvent,
  removeSheetBackground,
  removeSheetClass,
  removeSheetCondition,
  removeSheetCurrency,
  removeSheetFeat,
  removeSheetItem,
  removeSheetNpc,
  removeSheetSpell,
  removeSheetStat,
  restoreCharacter,
  restoreSheetCurrency,
  restoreSheetItem,
  retireCharacterSheet,
  updateCharacter,
  updateCharacterSheet,
  updateSheetBackground,
  updateSheetClass,
  updateSheetCurrency,
  updateSheetFeat,
  updateSheetItem,
  updateSheetNpc,
  updateSheetSpell,
  updateSheetStat,
} from "@/server/db/queries/character";

function isDm(role: string) {
  return campaignMemberCan(role, { organization: ["update"] });
}

const characterListSchema = z
  .object({
    status: z.enum(["active", "deleted", "all"]).default("active"),
  })
  .strict()
  .optional();

function requireResult<Result>(result: Result | null | undefined): Result {
  if (!result) throw new TRPCError({ code: "NOT_FOUND" });
  return result;
}

function requireCreated<Result>(result: Result | null | undefined): Result {
  if (!result) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "This entry could not be created in its current state.",
    });
  }
  return result;
}

const HISTORY_ENTITY_LABELS: Record<string, string> = {
  sheet: "Sheet details",
  class: "Class",
  background: "Background",
  condition: "Condition",
  item: "Item",
  currency: "Currency",
  stat: "Stat",
  feat: "Feat",
  npc: "Contact",
  spell: "Spell",
};

const HISTORY_ACTION_VERBS: Record<string, string> = {
  create: "added",
  update: "updated",
  remove: "removed",
  restore: "restored",
  retire: "retired",
  reactivate: "returned to play",
};

/**
 * Read the change out of the tRPC path rather than asking every mutation to
 * describe itself: `character.sheet.item.create` is already the entity and the
 * action, so a new sheet editor is recorded without touching this file.
 *
 * The segment before the action names the entity, and `sheet.update` therefore
 * lands on the sheet itself. Matching by name rather than by depth keeps this
 * correct whether the path is read from the app router or from a caller
 * created on this router alone.
 */
function describeSheetChange(path: string, data: unknown) {
  const segments = path.split(".");
  const action = segments.at(-1) ?? "update";
  const candidate = segments.at(-2);
  const entity =
    candidate && candidate !== "sheet" && candidate in HISTORY_ENTITY_LABELS
      ? candidate
      : "sheet";
  const label = HISTORY_ENTITY_LABELS[entity] ?? entity;
  const verb = HISTORY_ACTION_VERBS[action] ?? action;
  const named =
    entity !== "sheet" &&
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    typeof data.name === "string" &&
    data.name.trim().length > 0
      ? data.name.trim()
      : null;

  return {
    entity,
    action,
    summary: named ? `${label} ${verb}: ${named}` : `${label} ${verb}`,
  };
}

/**
 * A sheet is private to its owner and the campaign's DMs. Returning NOT_FOUND
 * for every denial prevents players from probing another player's sheet IDs.
 *
 * The sheet scope is declared on this builder, not left to each procedure: a
 * middleware only sees the input parsed by the `.input()` calls before it, so
 * reading `sheetId` from an input declared later would read `undefined`. The
 * scope stays non-strict so each procedure's own strict schema still decides
 * which extra keys it accepts.
 */
const sheetScopeSchema = z.object({
  campaignId: z.uuid(),
  sheetId: z.uuid(),
});

const sheetProcedure = campaignMemberProcedure
  .input(sheetScopeSchema)
  .use(async ({ ctx, input, next, type }) => {
    const { campaignId, sheetId } = input;
    const access = await getSheetAccess(ctx.db, campaignId, sheetId);
    if (
      !access ||
      (access.ownerId !== ctx.session.user.id && !isDm(ctx.member.role))
    ) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    if (type === "mutation" && ctx.campaign.status === "archived") {
      throw new TRPCError({ code: "PRECONDITION_FAILED" });
    }

    return next({ ctx: { sheetAccess: access } });
  })
  .use(async ({ ctx, input, next, type, path }) => {
    const result = await next();
    if (type !== "mutation" || !result.ok) return result;

    // Best effort on purpose: the Neon HTTP driver has no interactive
    // transactions, so a failed history insert must not report a write that
    // already landed as a failure. History is a record, not a control.
    try {
      await recordSheetEvent(ctx.db, {
        sheetId: input.sheetId,
        actorId: ctx.session.user.id,
        // Stamped rather than joined: the actor reference nulls out when an
        // account is deleted, but the history still has to name someone.
        actorName: ctx.session.user.name?.trim() || "A former member",
        actorRole: isDm(ctx.member.role) ? "dm" : "player",
        ...describeSheetChange(path, result.data),
      });
    } catch {
      // The mutation stands even when its history row does not.
    }
    return result;
  });

const activeSheetProcedure = sheetProcedure.use(({ ctx, next }) => {
  if (ctx.sheetAccess.retiredAt != null || ctx.sheetAccess.deletedAt != null) {
    throw new TRPCError({ code: "PRECONDITION_FAILED" });
  }
  return next();
});

const reactivateSheetProcedure = sheetProcedure.use(({ ctx, next }) => {
  if (ctx.sheetAccess.retiredAt == null || ctx.sheetAccess.deletedAt != null) {
    throw new TRPCError({ code: "PRECONDITION_FAILED" });
  }
  return next();
});

const characterIdentityProcedures = {
  list: betaProcedure
    .input(characterListSchema)
    .query(async ({ ctx, input }) => {
      const items = await listCharactersForOwner(
        ctx.db,
        ctx.session.user.id,
        input?.status ?? "active",
      );
      return { items, total: items.length };
    }),

  create: betaProcedure
    .input(characterCreateSchema)
    .mutation(async ({ ctx, input }) =>
      requireCreated(
        await createCharacter(ctx.db, {
          ...input,
          ownerId: ctx.session.user.id,
        }),
      ),
    ),

  get: betaProcedure
    .input(characterSlugSchema)
    .query(async ({ ctx, input }) =>
      requireResult(
        await getCharacterForOwnerBySlug(
          ctx.db,
          ctx.session.user.id,
          input.slug,
        ),
      ),
    ),

  update: betaProcedure
    .input(characterUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { charId, ...values } = input;
      return requireResult(
        await updateCharacter(ctx.db, ctx.session.user.id, charId, values),
      );
    }),

  delete: betaProcedure
    .input(characterIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await deleteCharacter(ctx.db, ctx.session.user.id, input.charId),
      ),
    ),

  restore: betaProcedure
    .input(characterIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await restoreCharacter(ctx.db, ctx.session.user.id, input.charId),
      ),
    ),
};

const classesRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetClassCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetClass(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetClassUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, classId, ...values } = input;
      return requireResult(
        await updateSheetClass(
          ctx.db,
          sheetId,
          classId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetClassIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetClass(
          ctx.db,
          input.sheetId,
          input.classId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const backgroundsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetBackgroundCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetBackground(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetBackgroundUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        campaignId: _campaignId,
        sheetId,
        backgroundId,
        ...values
      } = input;
      return requireResult(
        await updateSheetBackground(
          ctx.db,
          sheetId,
          backgroundId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetBackgroundIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetBackground(
          ctx.db,
          input.sheetId,
          input.backgroundId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const conditionsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetConditionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetCondition(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetConditionIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetCondition(
          ctx.db,
          input.sheetId,
          input.conditionId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const itemsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetItemCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetItem(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetItemUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, itemId, ...values } = input;
      return requireResult(
        await updateSheetItem(
          ctx.db,
          sheetId,
          itemId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetItemIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetItem(
          ctx.db,
          input.sheetId,
          input.itemId,
          ctx.session.user.id,
        ),
      ),
    ),
  restore: activeSheetProcedure
    .input(sheetItemIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await restoreSheetItem(
          ctx.db,
          input.sheetId,
          input.itemId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const currenciesRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetCurrencyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetCurrency(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetCurrencyUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, currencyId, ...values } = input;
      return requireResult(
        await updateSheetCurrency(
          ctx.db,
          sheetId,
          currencyId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetCurrencyIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetCurrency(
          ctx.db,
          input.sheetId,
          input.currencyId,
          ctx.session.user.id,
        ),
      ),
    ),
  restore: activeSheetProcedure
    .input(sheetCurrencyIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await restoreSheetCurrency(
          ctx.db,
          input.sheetId,
          input.currencyId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const statsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetStatCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetStat(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetStatUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, statId, ...values } = input;
      return requireResult(
        await updateSheetStat(
          ctx.db,
          sheetId,
          statId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetStatIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetStat(
          ctx.db,
          input.sheetId,
          input.statId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const featsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetFeatCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetFeat(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetFeatUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, featId, ...values } = input;
      return requireResult(
        await updateSheetFeat(
          ctx.db,
          sheetId,
          featId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetFeatIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetFeat(
          ctx.db,
          input.sheetId,
          input.featId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const npcsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetNpcCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetNpc(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetNpcUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, npcId, ...values } = input;
      return requireResult(
        await updateSheetNpc(
          ctx.db,
          sheetId,
          npcId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetNpcIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetNpc(
          ctx.db,
          input.sheetId,
          input.npcId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const spellsRouter = createTRPCRouter({
  create: activeSheetProcedure
    .input(sheetSpellCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, ...values } = input;
      return requireCreated(
        await createSheetSpell(ctx.db, {
          ...values,
          actorId: ctx.session.user.id,
        }),
      );
    }),
  update: activeSheetProcedure
    .input(sheetSpellUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId: _campaignId, sheetId, spellId, ...values } = input;
      return requireResult(
        await updateSheetSpell(
          ctx.db,
          sheetId,
          spellId,
          values,
          ctx.session.user.id,
        ),
      );
    }),
  remove: activeSheetProcedure
    .input(sheetSpellIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await removeSheetSpell(
          ctx.db,
          input.sheetId,
          input.spellId,
          ctx.session.user.id,
        ),
      ),
    ),
});

const sheetRouter = createTRPCRouter({
  list: campaignMemberProcedure
    .input(sheetCreateSchema.pick({ campaignId: true }))
    .query(({ ctx, input }) =>
      listCharacterSheets(
        ctx.db,
        input.campaignId,
        isDm(ctx.member.role) ? undefined : ctx.session.user.id,
      ),
    ),

  create: campaignMemberProcedure
    .input(sheetCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.campaign.status === "archived") {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }
      const character = await getCharacterForSheetCreation(
        ctx.db,
        input.campaignId,
        input.charId,
      );
      if (!character || character.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return requireCreated(
        await createCharacterSheet(ctx.db, {
          campaignId: input.campaignId,
          charId: input.charId,
          ownerId: character.ownerId,
          actorId: ctx.session.user.id,
        }),
      );
    }),

  get: sheetProcedure
    .input(sheetIdSchema)
    .query(async ({ ctx, input }) =>
      requireResult(
        await getCharacterSheet(ctx.db, input.campaignId, input.sheetId),
      ),
    ),

  update: activeSheetProcedure
    .input(sheetUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { campaignId, sheetId, ...values } = input;
      return requireResult(
        await updateCharacterSheet(
          ctx.db,
          campaignId,
          sheetId,
          values,
          ctx.session.user.id,
        ),
      );
    }),

  retire: activeSheetProcedure
    .input(sheetIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await retireCharacterSheet(
          ctx.db,
          input.campaignId,
          input.sheetId,
          ctx.session.user.id,
        ),
      ),
    ),

  reactivate: reactivateSheetProcedure
    .input(sheetIdSchema)
    .mutation(async ({ ctx, input }) =>
      requireResult(
        await reactivateCharacterSheet(
          ctx.db,
          input.campaignId,
          input.sheetId,
          ctx.session.user.id,
        ),
      ),
    ),

  /** Append-only history, so this is the one sheet read with no editor. */
  events: sheetProcedure
    .input(sheetEventListSchema)
    .query(({ ctx, input }) =>
      listSheetEvents(ctx.db, input.sheetId, input.limit),
    ),

  class: classesRouter,
  background: backgroundsRouter,
  condition: conditionsRouter,
  item: itemsRouter,
  currency: currenciesRouter,
  stat: statsRouter,
  feat: featsRouter,
  npc: npcsRouter,
  spell: spellsRouter,
});

export const characterRouter = createTRPCRouter({
  ...characterIdentityProcedures,
  sheet: sheetRouter,
});
