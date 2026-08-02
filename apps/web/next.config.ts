/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env/server";
import "./src/env/client";

import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@tablekeep/emails", "@tablekeep/ui"],
  experimental: {
    authInterrupts: true,
  },
};

export default config;
