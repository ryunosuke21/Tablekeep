import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, multiSession } from "better-auth/plugins";

import { env } from "@/env/server";
import { access, roles } from "@/server/better-auth/admin";
import { db, schema } from "@/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    camelCase: false,
    usePlural: true,
    schema,
    debugLogs: env.LOG_LEVEL === "debug",
  }),
  appName: "Tablekeep",
  baseURL: env.VERCEL_URL
    ? `https://${env.VERCEL_URL}`
    : "http://localhost:3000",
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    admin({
      ac: access,
      roles,
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    multiSession({
      maximumSessions: 5,
    }),
    magicLink({
      sendMagicLink: async () => {},
      storeToken: env.NODE_ENV === "production" ? "hashed" : "plain",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
