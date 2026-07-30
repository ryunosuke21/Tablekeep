import { env } from "@/env/client";

export const appName = "Tablekeep";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "ryunosuke21",
  repo: "Tablekeep",
  branch: "main",
};

/** Where the authenticated product lives. */
export const appUrl = env.NEXT_PUBLIC_APP_URL;

/** This site's own public URL, used to resolve Open Graph image paths. */
export const siteUrl = env.NEXT_PUBLIC_SITE_URL;
