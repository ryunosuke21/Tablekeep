import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "docs.localhost.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/1200x675/**",
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["@tablekeep/shared", "@tablekeep/ui"],
};

export default withMDX(config);
