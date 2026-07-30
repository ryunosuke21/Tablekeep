import { feedbackSubmissionSchema } from "@/lib/validation/feedback";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const feedbackRouter = createTRPCRouter({
  submit: publicProcedure
    .input(feedbackSubmissionSchema)
    .mutation(({ input }) => ({
      accepted: true as const,
      reference: `preview-${input.category}-${input.message.length}`,
    })),
});
