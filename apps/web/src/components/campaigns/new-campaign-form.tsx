"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconCamera,
  IconCheck,
  IconPhotoPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { Badge } from "@tablekeep/ui/components/badge";
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
import { useFileUpload } from "@tablekeep/ui/hooks/use-file-upload";
import { cn } from "@tablekeep/ui/lib/utils";

import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import { useUploadThing } from "@/lib/uploadthing";
import {
  type CampaignDetailsInput,
  campaignDetailsSchema,
} from "@/lib/validation/campaign";
import { api } from "@/trpc/react";

import {
  type CampaignColor,
  CampaignColorsPicker,
} from "./campaign-colors-picker";

type CampaignFormValues = z.input<typeof campaignDetailsSchema>;

const bannerClasses: Record<CampaignColor, string> = {
  lilac: "from-[#302454] via-[#684d8f] to-[#a783b6]",
  rose: "from-[#4b202a] via-[#8b4756] to-[#c48a91]",
  sage: "from-[#183d35] via-[#3d6d5d] to-[#86a287]",
  sky: "from-[#17364d] via-[#356b88] to-[#86aebe]",
};

function initials(name: string) {
  const value = name.trim();
  if (!value) return "?";
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NewCampaignForm() {
  const router = useRouter();
  const form = useForm<CampaignFormValues, unknown, CampaignDetailsInput>({
    resolver: zodResolver(campaignDetailsSchema),
    defaultValues: {
      name: "",
      description: "",
      colors: "lilac",
    },
    mode: "onSubmit",
  });
  const [name = "", description = "", colors = "lilac"] = useWatch({
    control: form.control,
    name: ["name", "description", "colors"],
  });
  const bannerUpload = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
  });
  const logoUpload = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
  });
  const [bannerState, bannerActions] = bannerUpload;
  const [logoState, logoActions] = logoUpload;
  const banner = bannerState.files[0];
  const logo = logoState.files[0];
  const { startUpload, isUploading } = useUploadThing("campaignImage");

  const createCampaign = api.campaign.create.useMutation({
    onSuccess: ({ slug }) => {
      toast.success("Campaign created");
      router.push(`/campaigns/${slug}`);
      router.refresh();
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message || "The campaign could not be created.",
      });
    },
  });

  const isPending =
    form.formState.isSubmitting || isUploading || createCampaign.isPending;
  const mediaError = bannerState.errors[0] ?? logoState.errors[0];

  async function submit(values: CampaignDetailsInput) {
    form.clearErrors("root");
    const bannerFile = banner?.file;
    const logoFile = logo?.file;
    const files = [bannerFile, logoFile].filter(
      (file): file is File => file instanceof File,
    );

    try {
      const uploaded = files.length ? await startUpload(files) : [];
      let index = 0;
      const bannerImage =
        bannerFile instanceof File ? uploaded?.[index++]?.ufsUrl : undefined;
      const logoImage =
        logoFile instanceof File ? uploaded?.[index]?.ufsUrl : undefined;
      if ((bannerFile && !bannerImage) || (logoFile && !logoImage)) {
        throw new Error("Upload did not finish");
      }

      createCampaign.mutate({
        ...values,
        ...(bannerImage ? { bannerImage } : {}),
        ...(logoImage ? { logo: logoImage } : {}),
      });
    } catch {
      form.setError("root", {
        message: "The campaign images could not be uploaded. Try again.",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,.82fr)_minmax(28rem,1.18fr)] lg:items-stretch xl:gap-10">
        <section className="order-2 rounded-2xl border bg-background p-5 sm:p-7 lg:order-1 lg:h-full">
          <div className="mb-7">
            <p className="font-medium text-lg tracking-[-0.02em]">
              Campaign details
            </p>
            <p className="mt-1 text-muted-foreground text-sm leading-6">
              Start with what your group will recognize. You can change all of
              this later.
            </p>
          </div>

          <FieldGroup className="gap-6">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="campaign-name">Campaign name</FieldLabel>
                  <Input
                    {...field}
                    id="campaign-name"
                    className="h-11 px-3 text-base"
                    maxLength={80}
                    autoComplete="off"
                    placeholder="The Ember Coast"
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                    autoFocus
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
                    rows={4}
                    maxLength={280}
                    placeholder="A storm-battered coast, an old promise, and one ship that should never have returned."
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                    aria-describedby="campaign-description-hint"
                  />
                  <FieldDescription id="campaign-description-hint">
                    A sentence or two for everyone at the table.
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
                  <FieldLabel htmlFor="campaign-colors">
                    Profile color
                  </FieldLabel>
                  <CampaignColorsPicker
                    id="campaign-colors"
                    value={field.value ?? "lilac"}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                  <FieldDescription>
                    This fills the cover until you add your own image.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <div className="mt-7 rounded-xl border bg-muted/25 p-4">
            <div className="flex gap-3">
              <IconSparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">After you create it</p>
                <p className="mt-1 text-muted-foreground text-sm leading-6">
                  You’ll land on the campaign profile, where you can set the
                  schedule and invite your group.
                </p>
              </div>
            </div>
          </div>

          <div aria-live="polite" className="mt-5 min-h-5 text-sm">
            {form.formState.errors.root?.message ? (
              <p className="text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : mediaError ? (
              <p className="text-destructive">{mediaError}</p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="sm:min-w-36" disabled={isPending}>
              <LoadingSwap isLoading={isPending}>Create campaign</LoadingSwap>
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => router.push("/campaigns")}
            >
              Cancel
            </Button>
          </div>
        </section>

        <aside className="order-1 lg:sticky lg:top-20 lg:order-2 lg:h-full">
          <div className="h-full overflow-hidden rounded-2xl border bg-background shadow-[0_20px_60px_rgba(23,23,35,.10)]">
            <fieldset
              aria-label="Campaign cover image"
              disabled={isPending}
              className={cn(
                "relative h-40 overflow-hidden bg-gradient-to-br sm:h-52 xl:h-60",
                bannerClasses[colors],
              )}
              onDragEnter={bannerActions.handleDragEnter}
              onDragLeave={bannerActions.handleDragLeave}
              onDragOver={bannerActions.handleDragOver}
              onDrop={bannerActions.handleDrop}
            >
              {banner?.preview ? (
                <Image
                  src={banner.preview}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_78%_22%,rgba(255,255,255,.22),transparent_22%),linear-gradient(115deg,transparent_35%,rgba(255,255,255,.08)_35%,rgba(255,255,255,.08)_36%,transparent_36%)]" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
              <div className="absolute top-3 right-3 flex gap-2">
                {banner ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Remove cover image"
                    disabled={isPending}
                    onClick={() => bannerActions.removeFile(banner.id)}
                  >
                    <IconX />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={bannerActions.openFileDialog}
                >
                  <IconPhotoPlus />
                  {banner ? "Change cover" : "Add cover"}
                </Button>
              </div>
              <input
                {...bannerActions.getInputProps({
                  id: "campaign-cover",
                  className: "sr-only",
                  disabled: isPending,
                  "aria-label": "Choose campaign cover image",
                })}
              />
            </fieldset>

            <div className="relative px-5 pb-6 sm:px-7">
              <div className="flex items-end justify-between gap-4">
                <button
                  type="button"
                  aria-label={
                    logo ? "Change campaign icon" : "Add campaign icon"
                  }
                  disabled={isPending}
                  className="group relative -mt-11 grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-background bg-foreground font-semibold text-2xl text-background shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:-mt-14 sm:size-28"
                  onClick={logoActions.openFileDialog}
                >
                  {logo?.preview ? (
                    <Image
                      src={logo.preview}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span>{initials(name)}</span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <IconCamera className="size-5 text-white" />
                  </span>
                </button>
                <Badge className="mb-2">DM</Badge>
              </div>
              <input
                {...logoActions.getInputProps({
                  id: "campaign-icon",
                  className: "sr-only",
                  disabled: isPending,
                  "aria-label": "Choose campaign icon",
                })}
              />

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h2 className="min-w-0 break-words font-semibold text-2xl tracking-[-0.04em] sm:text-3xl">
                    {name.trim() || "Your campaign"}
                  </h2>
                  {name.trim() ? (
                    <IconCheck className="size-4 shrink-0 text-muted-foreground" />
                  ) : null}
                </div>
                <p className="mt-1 text-muted-foreground text-sm">1 member</p>
                <p className="mt-5 min-h-12 text-muted-foreground text-sm leading-6">
                  {description.trim() ||
                    "Your campaign description will appear here for everyone at the table."}
                </p>
              </div>

              {logo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  disabled={isPending}
                  onClick={() => logoActions.removeFile(logo.id)}
                >
                  <IconX />
                  Remove icon
                </Button>
              ) : (
                <p className="mt-3 text-muted-foreground text-xs">
                  Click the campaign icon or cover to add your own images.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
