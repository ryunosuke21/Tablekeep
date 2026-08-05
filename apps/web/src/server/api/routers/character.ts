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
  sheetIdSchema,
  sheetItemCreateSchema,
  sheetItemIdSchema,
  sheetItemUpdateSchema,
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
  createSheetItem,
  deleteCharacter,
  getCharacterForOwnerBySlug,
  getCharacterForSheetCreation,
  getCharacterSheet,
  getSheetAccess,
  listCharacterSheets,
  listCharactersForOwner,
  reactivateCharacterSheet,
  removeSheetBackground,
  removeSheetClass,
  removeSheetCondition,
  removeSheetCurrency,
  removeSheetItem,
  restoreCharacter,
  restoreSheetCurrency,
  restoreSheetItem,
  retireCharacterSheet,
  updateCharacter,
  updateCharacterSheet,
  updateSheetBackground,
  updateSheetClass,
  updateSheetCurrency,
  updateSheetItem,
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

/**
 * A sheet is private to its owner and the campaign's DMs. Returning NOT_FOUND
 * for every denial prevents players from probing another player's sheet IDs.
 */
const sheetProcedure = campaignMemberProcedure.use(
  async ({ ctx, input, next, type }) => {
    const { campaignId, sheetId } = input as {
      campaignId: string;
      sheetId: string;
    };
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
  },
);

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

  class: classesRouter,
  background: backgroundsRouter,
  condition: conditionsRouter,
  item: itemsRouter,
  currency: currenciesRouter,
});

export const characterRouter = createTRPCRouter({
  ...characterIdentityProcedures,
  sheet: sheetRouter,
});
