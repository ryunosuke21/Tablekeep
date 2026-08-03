"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";

import { withDestination } from "@/lib/redirect-destination";
import { authClient } from "@/server/better-auth/client";

/**
 * Recovery for an invitation addressed to another account. Signing out first is
 * necessary: a signed-in visit to /sign-in is redirected straight back.
 */
export function SwitchAccountButton({ destination }: { destination: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  // The destination came from this route's own params; validate it anyway.
  const signInHref = withDestination("/sign-in", destination);

  async function switchAccount() {
    setIsPending(true);

    const result = await authClient.signOut();

    if (result.error) {
      setIsPending(false);
      toast.error("Could not sign out", { description: result.error.message });
      return;
    }

    router.push(signInHref);
    router.refresh();
  }

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => void switchAccount()}
    >
      <LoadingSwap isLoading={isPending}>
        Sign in with the invited address
      </LoadingSwap>
    </Button>
  );
}
