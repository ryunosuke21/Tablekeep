import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

export const env = createEnv({
  /**
   * Client-side environment variables must use the `NEXT_PUBLIC_` prefix so
   * Next.js can expose them to browser bundles.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },

  /**
   * Environment variables must be destructured explicitly for Next.js edge and
   * client runtimes.
   */
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  extends: [vercel()],

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
