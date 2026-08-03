import { cache } from "react";
import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { api } from "@/trpc/server";

/**
 * Resolve a campaign for the signed-in caller. `campaign.get` is
 * membership-checked and answers NOT_FOUND for non-members, so a missing
 * campaign and a campaign the caller cannot see are indistinguishable here too.
 *
 * Cached per request so the layout and its pages share one call.
 */
export const getCampaign = cache(async (slug: string) => {
  try {
    return await api.campaign.get({ slug });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
});
