import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import {
  checkout,
  dodopayments,
  portal,
  webhooks,
} from "@dodopayments/better-auth";
import { betterAuth } from "better-auth";

import { env } from "@/env/server";
import { db } from "@/server/db";
import { dodoPayments } from "@/server/payments/dodo";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {},
  plugins: [
    dodopayments({
      client: dodoPayments,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "pdt_0NoJkJI9n4JNy0Y28oN4e",
              slug: "test-product",
            },
          ],
          authenticatedUsersOnly: true,
          successUrl: "/dashboard?success=true",
        }),
        portal(),
        webhooks({
          webhookKey: env.DODO_PAYMENTS_WEBHOOK_SECRET,
          onPayload: async (payload) => {
            console.log("Received Dodo Payments webhook:", payload);
          },
        }),
      ],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
