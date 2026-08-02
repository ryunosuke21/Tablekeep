import { BetterAuthError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, multiSession } from "better-auth/plugins";

import { renderMagicLink } from "@tablekeep/emails";

import { env } from "@/env/server";
import { APP_NAME } from "@/lib/constants";
import { access, roles } from "@/server/better-auth/admin";
import { db, schema } from "@/server/db";
import { sendEmail } from "@/server/services/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    camelCase: false,
    usePlural: true,
    schema,
    debugLogs: env.LOG_LEVEL === "debug",
  }),
  appName: APP_NAME,
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
      sendMagicLink: async ({ email, url }) => {
        const html = await renderMagicLink({
          appName: APP_NAME,
          url,
          baseUrl: env.VERCEL_URL
            ? `https://${env.VERCEL_URL}`
            : "http://localhost:3000",
        });

        const { data, error } = await sendEmail({
          to: email,
          html,
          subject: "Sign in to your account",
          from: env.FROM_EMAIL,
        });

        if (error) {
          throw new BetterAuthError(error.message, { cause: error });
        }

        console.log(`Magic link ${data.id} was sent`);
      },
      storeToken: env.NODE_ENV === "production" ? "hashed" : "plain",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
