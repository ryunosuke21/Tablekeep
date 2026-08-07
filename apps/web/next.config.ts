/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env/server";
import "./src/env/client";

import type { NextConfig } from "next";

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: [
    "@tablekeep/campaign-auth",
    "@tablekeep/emails",
    "@tablekeep/shared",
    "@tablekeep/ui",
  ],
  experimental: {
    authInterrupts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "4iedin33if.ufs.sh",
        pathname: "/f/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/wiki/races", destination: "/wiki/species", permanent: true },
      {
        source: "/wiki/races/:path*",
        destination: "/wiki/species/:path*",
        permanent: true,
      },
      {
        source: "/wiki/monsters",
        destination: "/wiki/creatures",
        permanent: true,
      },
      {
        source: "/wiki/monsters/:path*",
        destination: "/wiki/creatures/:path*",
        permanent: true,
      },
    ];
  },
};

export default config;
