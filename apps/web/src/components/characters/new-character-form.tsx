"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

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
import { toast } from "@tablekeep/ui/components/sonner";
import { Textarea } from "@tablekeep/ui/components/textarea";

import {
  type CharacterCreateInput,
  characterCreateSchema,
} from "@/lib/validation/character";
import { api } from "@/trpc/react";

type NewCharacterValues = z.input<typeof characterCreateSchema>;

/**
 * Identity only. Ancestry, classes, hit points, and gear belong to the sheet a
 * campaign owns, so this form stays deliberately short.
 */
export function NewCharacterForm() {
  const router = useRouter();
  const form = useForm<NewCharacterValues, unknown, CharacterCreateInput>({
    resolver: zodResolver(characterCreateSchema),
    defaultValues: { name: "", bio: "" },
    mode: "onSubmit",
  });

  const createCharacter = api.character.create.useMutation({
    onSuccess: ({ name, slug }) => {
      toast.success(`${name} is ready`);
      router.push(`/characters/${slug}`);
      router.refresh();
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message || "This character could not be created.",
      });
    },
  });

  const isPending = form.formState.isSubmitting || createCharacter.isPending;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        form.clearErrors("root");
        createCharacter.mutate({
          name: values.name,
          bio: values.bio?.trim() ? values.bio : null,
        });
      })}
    >
      <FieldGroup className="gap-6">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="character-name">Character name</FieldLabel>
              <Input
                {...field}
                id="character-name"
                className="h-11 px-3 text-base"
                maxLength={80}
                autoComplete="off"
                placeholder="Vesper Quill"
                disabled={isPending}
                aria-invalid={fieldState.invalid}
                autoFocus
              />
              <FieldDescription>
                The name you use across every table. Each campaign can record a
                different alias later.
              </FieldDescription>
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
              <FieldLabel htmlFor="character-bio">Bio</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="character-bio"
                rows={5}
                maxLength={2000}
                placeholder="Where they come from, what they want, and the debt they will not talk about."
                disabled={isPending}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Optional. Travels with the character to every campaign.
              </FieldDescription>
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        {form.formState.errors.root ? (
          <p role="alert" className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="min-h-11" disabled={isPending}>
            <LoadingSwap isLoading={isPending}>Create character</LoadingSwap>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={isPending}
            onClick={() => router.push("/characters")}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
