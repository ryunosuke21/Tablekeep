import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  allowedDevOrigins: ["127.0.0.1"],
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
