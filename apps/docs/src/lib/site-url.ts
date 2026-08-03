import "server-only";

import { env } from "@/env/client";

/** This site's own public URL, used to resolve server-rendered metadata. */
export const siteUrl = env.VERCEL_URL
  ? `https://${env.VERCEL_URL}`
  : "http://localhost:3001";
