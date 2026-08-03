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
  type CampaignDetailsInput,
  campaignDetailsSchema,
} from "@/lib/validation/campaign";
import { api } from "@/trpc/react";

import { CampaignColorsPicker } from "./campaign-colors-picker";

/** Form state uses the schema input: `colors` gains its default on parse. */
type CampaignFormValues = z.input<typeof campaignDetailsSchema>;

type CampaignFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      campaignId: string;
      defaultValues: CampaignDetailsInput;
    };

export function CampaignForm(props: CampaignFormProps) {
  const router = useRouter();
  const form = useForm<CampaignFormValues, unknown, CampaignDetailsInput>({
    resolver: zodResolver(campaignDetailsSchema),
    defaultValues:
      props.mode === "edit"
        ? props.defaultValues
        : { name: "", description: "", colors: "lilac" },
    mode: "onSubmit",
  });

  const createCampaign = api.campaign.create.useMutation({
    onSuccess: ({ slug }) => {
      toast.success("Campaign created");
      router.push(`/campaigns/${slug}`);
      // The campaigns index and dashboard were rendered before this campaign
      // existed, so drop the client router cache as well.
      router.refresh();
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message || "The campaign could not be created.",
      });
    },
  });

  const updateCampaign = api.campaign.update.useMutation({
    onSuccess: () => {
      toast.success("Campaign details saved");
      router.refresh();
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message || "The campaign could not be saved.",
      });
    },
  });

  const isPending = createCampaign.isPending || updateCampaign.isPending;
  const rootError = form.formState.errors.root?.message;

  function submit(values: CampaignDetailsInput) {
    form.clearErrors("root");

    if (props.mode === "create") {
      createCampaign.mutate(values);
      return;
    }

    updateCampaign.mutate({
      campaignId: props.campaignId,
      name: values.name,
      description: values.description ?? "",
      colors: values.colors,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="campaign-name">Campaign name</FieldLabel>
              <Input
                {...field}
                id="campaign-name"
                maxLength={80}
                autoComplete="off"
                placeholder="The Ember Coast"
                disabled={isPending}
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
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="campaign-description">
                Short description
              </FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="campaign-description"
                rows={3}
                maxLength={280}
                placeholder="One or two lines your table will recognize."
                disabled={isPending}
                aria-invalid={fieldState.invalid}
                aria-describedby="campaign-description-hint"
              />
              <FieldDescription id="campaign-description-hint">
                Everyone in the campaign can read this. Up to 280 characters.
              </FieldDescription>
              {fieldState.error ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="colors"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="campaign-colors">Card color</FieldLabel>
              <CampaignColorsPicker
                id="campaign-colors"
                value={field.value ?? "lilac"}
                onChange={field.onChange}
                disabled={isPending}
              />
              <FieldDescription>
                Used on the campaign card so you can spot it quickly.
              </FieldDescription>
            </Field>
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={isPending} className="sm:w-fit">
            <LoadingSwap isLoading={isPending}>
              {props.mode === "create" ? "Create campaign" : "Save details"}
            </LoadingSwap>
          </Button>
          {props.mode === "create" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => router.push("/campaigns")}
              className="sm:w-fit"
            >
              Cancel
            </Button>
          ) : null}
        </div>

        <div aria-live="polite" className="min-h-5 text-sm">
          {rootError ? <p className="text-destructive">{rootError}</p> : null}
        </div>
      </FieldGroup>
    </form>
  );
}
