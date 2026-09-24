import { dodopaymentsClient } from "@dodopayments/better-auth/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [dodopaymentsClient()],
});

export type Session = typeof authClient.$Infer.Session;
