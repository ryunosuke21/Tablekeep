import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function createClientEnv() {
  return createEnv({
    client: {
      NEXT_PUBLIC_DOCS_URL: z.url().default("https://docs.localhost.com"),
      NEXT_PUBLIC_APP_URL: z.url().default("https://app.localhost.com"),
    },
    clientPrefix: "NEXT_PUBLIC_",
    runtimeEnv: process.env,
  });
}
