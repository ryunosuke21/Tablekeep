/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env/server";
import "./src/env/client";

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["@tablekeep/ui"],
};

export default config;
