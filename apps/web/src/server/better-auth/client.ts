import {
  adminClient,
  inferAdditionalFields,
  magicLinkClient,
  multiSessionClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { access, roles } from "@/server/better-auth/admin";
import type { auth } from "@/server/better-auth/config";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac: access,
      roles,
    }),
    multiSessionClient(),
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
