import { TRPCError } from "@trpc/server";

import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/server";

export type InvitePreviewResult =
  | { ok: true; preview: RouterOutputs["campaign"]["invites"]["preview"] }
  | { ok: false; code: TRPCError["code"]; message: string };

/**
 * Preview an invitation without accepting it. Failure reasons come from the
 * server, which decides how much it is willing to say about an invitation.
 */
export async function previewInvite(
  reference: { code: string } | { invitationId: string },
): Promise<InvitePreviewResult> {
  try {
    return { ok: true, preview: await api.campaign.invites.preview(reference) };
  } catch (error) {
    if (error instanceof TRPCError) {
      return { ok: false, code: error.code, message: error.message };
    }
    throw error;
  }
}
