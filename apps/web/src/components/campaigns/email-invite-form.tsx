"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import {
  NativeSelect,
  NativeSelectOption,
} from "@tablekeep/ui/components/native-select";
import { toast } from "@tablekeep/ui/components/sonner";

import { emailInviteCreationSchema } from "@/lib/validation/campaign";
import { api } from "@/trpc/react";

export function EmailInviteForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"dm" | "player">("player");
  const [error, setError] = useState<string | null>(null);

  const createEmailInvite = api.campaign.invites.createEmail.useMutation({
    onSuccess: (invitation) => {
      // Delivery happens after the invitation is stored, so it is not
      // confirmed here. The pending list offers a resend.
      toast.success(`Invitation created for ${invitation.email}`, {
        description:
          "Delivery is not confirmed yet. Resend it if it does not arrive.",
      });
      setEmail("");
      router.refresh();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = emailInviteCreationSchema.safeParse({
      campaignId,
      email,
      role,
    });

    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }

    createEmailInvite.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="player@example.com"
              value={email}
              disabled={createEmailInvite.isPending}
              aria-invalid={Boolean(error)}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FieldDescription>
              The invitation only works for this address.
            </FieldDescription>
          </Field>

          <Field className="sm:w-32">
            <FieldLabel htmlFor="invite-role">Joins as</FieldLabel>
            <NativeSelect
              className="w-full"
              id="invite-role"
              value={role}
              disabled={createEmailInvite.isPending}
              onChange={(event) =>
                setRole(event.target.value as "dm" | "player")
              }
            >
              <NativeSelectOption value="player">Player</NativeSelectOption>
              <NativeSelectOption value="dm">DM</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>

        {error ? <FieldError>{error}</FieldError> : null}

        <Button
          type="submit"
          variant="outline"
          className="sm:w-fit"
          disabled={createEmailInvite.isPending}
        >
          <LoadingSwap isLoading={createEmailInvite.isPending}>
            Send invitation
          </LoadingSwap>
        </Button>
      </FieldGroup>
    </form>
  );
}
