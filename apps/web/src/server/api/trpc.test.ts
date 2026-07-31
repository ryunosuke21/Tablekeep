import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { testContext } from "@/test/context";

const testRouter = createTRPCRouter({
  protectedUser: protectedProcedure.query(({ ctx }) => ctx.session.user),
  pagination: publicProcedure
    .input(
      z
        .object({ marker: z.string().optional() })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(({ input }) => input),
  validated: publicProcedure
    .input(z.object({ name: z.string().min(2) }))
    .query(({ input }) => input),
});

describe("tRPC infrastructure", () => {
  it("rejects protected procedures without a user", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.protectedUser()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("exposes the authenticated user to protected procedures", async () => {
    const session = {
      user: {
        id: "user-1",
        name: "Table Player",
        email: "player@example.test",
        emailVerified: true,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
      },
      session: {
        id: "session-1",
        userId: "user-1",
        token: "test-token",
        expiresAt: new Date("2027-01-01"),
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        ipAddress: null,
        userAgent: null,
        impersonatedBy: null,
      },
    };
    const caller = testRouter.createCaller(
      testContext(vi.fn(), session as never),
    );

    await expect(caller.protectedUser()).resolves.toMatchObject({
      id: "user-1",
      email: "player@example.test",
    });
  });

  it("accepts omitted pagination input", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.pagination()).resolves.toEqual({});
  });

  it("forwards pagination and procedure-specific input", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(
      caller.pagination({ cursor: 20, limit: 10, marker: "next" }),
    ).resolves.toEqual({ cursor: 20, limit: 10, marker: "next" });
  });

  it("keeps input validation failures as Zod-backed tRPC errors", async () => {
    const caller = testRouter.createCaller(testContext(vi.fn()));

    await expect(caller.validated({ name: "x" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      cause: expect.any(z.ZodError),
    });
  });
});
