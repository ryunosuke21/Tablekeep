import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  health: createTRPCRouter({
    check: publicProcedure.query(() => {
      return {
        status: "ok",
      };
    }),
  }),
});
