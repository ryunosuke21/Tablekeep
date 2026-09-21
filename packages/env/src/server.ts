import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function createServerEnv() {
  return createEnv({
    server: {
      DOCS_URL: z.url().default("https://docs.localhost.com"),
      APP_URL: z.url().default("https://app.localhost.com"),
    },
    client: {
      NEXT_PUBLIC_DOCS_URL: z.url().default("https://docs.localhost.com"),
      NEXT_PUBLIC_APP_URL: z.url().default("https://app.localhost.com"),
    },
    clientPrefix: "NEXT_PUBLIC_",
    runtimeEnv: process.env,
  });
}
