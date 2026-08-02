import { createRouteHandler } from "uploadthing/next";

import { env } from "@/env/server";

import { fileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: fileRouter,
  config: {
    isDev: env.NODE_ENV === "development",
    logLevel: env.LOG_LEVEL === "debug" ? "All" : "Error",
    token: env.UPLOADTHING_TOKEN,
    callbackUrl: env.VERCEL_URL
      ? `https://${env.VERCEL_URL}/api/files`
      : "http://localhost:3000/api/files",
  },
});
