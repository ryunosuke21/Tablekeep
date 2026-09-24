import DodoPayments from "dodopayments";

import { env } from "@/env/server";

export const dodoPayments = new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY,
  environment: env.NODE_ENV === "production" ? "live_mode" : "test_mode",
});
