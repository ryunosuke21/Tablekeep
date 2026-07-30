import { z } from "zod";

export const feedbackFormSchema = z.object({
  category: z.enum(["idea", "issue", "other"]),
  message: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters.")
    .max(1_000, "Use 1,000 characters or fewer."),
});

export const feedbackSubmissionSchema = feedbackFormSchema.extend({
  page: z.string().trim().min(1).max(200),
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;
