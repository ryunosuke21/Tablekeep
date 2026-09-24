import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function createServerEnv() {
  return createEnv({
    server: {
      DOCS_URL: z.url().default("https://docs.localhost.com"),
      APP_URL: z.url().default("https://app.localhost.com"),
    },
    runtimeEnv: process.env,
  });
}
