import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const feedbackRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        category: z.enum(["idea", "issue", "other"]),
        message: z.string().trim().min(10).max(1_000),
        page: z.string().trim().min(1).max(200),
      }),
    )
    .mutation(({ input }) => ({
      accepted: true as const,
      reference: `preview-${input.category}-${input.message.length}`,
    })),
});
