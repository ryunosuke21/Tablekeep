"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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
import { Textarea } from "@tablekeep/ui/components/textarea";

import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";

/**
 * Mirrors `characterUpdateSchema` for the fields this form always sends. The
 * router keeps the authoritative contract; this only guards the inputs.
 */
const identitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a character name.")
    .max(80, "Use 80 characters or fewer."),
  bio: z.string().trim().max(2_000, "Use 2000 characters or fewer."),
});

type IdentityValues = z.infer<typeof identitySchema>;

export function CharacterIdentityForm({
  charId,
  name,
  bio,
}: {
  charId: string;
  name: string;
  bio: string | null;
}) {
  const router = useRouter();
  const form = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: { name, bio: bio ?? "" },
    mode: "onSubmit",
  });

  const updateCharacter = api.character.update.useMutation({
    onSuccess: (updated) => {
      // Keep the typed values the player just entered, then pick up the new slug.
      form.reset({ name: updated.name, bio: updated.bio ?? "" });
      router.replace(`/characters/${updated.slug}`);
      router.refresh();
    },
  });

  function submit(values: IdentityValues) {
    updateCharacter.mutate({
      charId,
      name: values.name,
      bio: values.bio.trim() ? values.bio : null,
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <FieldGroup className="gap-6">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="identity-name">Character name</FieldLabel>
              <Input
                {...field}
                id="identity-name"
                className="h-11 px-3 text-base"
                maxLength={80}
                autoComplete="off"
                disabled={updateCharacter.isPending}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="identity-bio">Bio</FieldLabel>
              <Textarea
                {...field}
                id="identity-bio"
                rows={5}
                maxLength={2000}
                disabled={updateCharacter.isPending}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Shared across every campaign this character plays in.
              </FieldDescription>
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className="min-h-11"
            disabled={updateCharacter.isPending}
          >
            <LoadingSwap isLoading={updateCharacter.isPending}>
              Save identity
            </LoadingSwap>
          </Button>
          <SaveStatus
            state={saveState(updateCharacter)}
            onRetry={() => form.handleSubmit(submit)()}
          />
        </div>
      </FieldGroup>
    </form>
  );
}
