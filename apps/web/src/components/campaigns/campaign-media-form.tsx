"use client";

import { useState } from "react";
import { IconCamera, IconPhoto, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { toast } from "@tablekeep/ui/components/sonner";
import { useFileUpload } from "@tablekeep/ui/hooks/use-file-upload";
import { cn } from "@tablekeep/ui/lib/utils";

import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import { useUploadThing } from "@/lib/uploadthing";
import { api } from "@/trpc/react";

function ImagePicker({
  id,
  label,
  shape,
  preview,
  isDisabled,
  upload,
  onRemove,
}: {
  id: string;
  label: string;
  shape: "banner" | "logo";
  preview?: string;
  isDisabled: boolean;
  upload: ReturnType<typeof useFileUpload>;
  onRemove: () => void;
}) {
  const [state, actions] = upload;
  const selected = state.files[0];
  const shown = selected?.preview ?? preview;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-medium text-sm">{label}</p>
        {shown ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            onClick={() => {
              if (selected) actions.removeFile(selected.id);
              onRemove();
            }}
          >
            <IconX />
            Remove
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={isDisabled}
        className={cn(
          "group relative grid w-full place-items-center overflow-hidden border border-dashed bg-muted/35 text-muted-foreground transition hover:border-foreground/35 hover:bg-muted/55 focus-visible:outline-2 focus-visible:outline-ring",
          shape === "banner"
            ? "aspect-[3.6/1] min-h-28 rounded-xl"
            : "size-32 rounded-full",
        )}
        onClick={actions.openFileDialog}
        onDragEnter={actions.handleDragEnter}
        onDragLeave={actions.handleDragLeave}
        onDragOver={actions.handleDragOver}
        onDrop={actions.handleDrop}
      >
        {shown ? (
          <Image src={shown} alt="" fill unoptimized className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-xs">
            {shape === "banner" ? (
              <IconPhoto className="size-5" />
            ) : (
              <IconCamera className="size-5" />
            )}
            Choose an image
          </span>
        )}
      </button>
      <input
        {...actions.getInputProps({
          id,
          disabled: isDisabled,
          "aria-label": `Choose ${label.toLowerCase()}`,
        })}
      />
      {state.errors.length ? (
        <p className="mt-2 text-destructive text-xs">{state.errors[0]}</p>
      ) : null}
    </div>
  );
}

export function CampaignMediaForm({
  campaignId,
  logo,
  bannerImage,
}: {
  campaignId: string;
  logo: string | null;
  bannerImage: string | null;
}) {
  const router = useRouter();
  const logoUpload = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
  });
  const bannerUpload = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
  });
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const { startUpload, isUploading } = useUploadThing("campaignImage");
  const update = api.campaign.update.useMutation({
    onSuccess: () => {
      toast.success("Campaign images saved");
      router.refresh();
    },
    onError: (error) =>
      toast.error("Campaign images were not saved", {
        description: error.message,
      }),
  });
  const isPending = isUploading || update.isPending;

  async function save() {
    const logoFile = logoUpload[0].files[0]?.file;
    const bannerFile = bannerUpload[0].files[0]?.file;
    const files = [logoFile, bannerFile].filter(
      (file): file is File => file instanceof File,
    );
    try {
      const uploaded = files.length ? await startUpload(files) : [];
      let index = 0;
      const nextLogo =
        logoFile instanceof File
          ? (uploaded?.[index++]?.ufsUrl ?? null)
          : logoRemoved
            ? null
            : logo;
      const nextBanner =
        bannerFile instanceof File
          ? (uploaded?.[index]?.ufsUrl ?? null)
          : bannerRemoved
            ? null
            : bannerImage;
      if ((logoFile && !nextLogo) || (bannerFile && !nextBanner))
        throw new Error("Upload did not finish.");
      update.mutate({ campaignId, logo: nextLogo, bannerImage: nextBanner });
    } catch {
      toast.error("The images could not be uploaded. Try again.");
    }
  }

  return (
    <div className="space-y-6">
      <ImagePicker
        id="campaign-banner"
        label="Cover image"
        shape="banner"
        preview={bannerRemoved ? undefined : (bannerImage ?? undefined)}
        isDisabled={isPending}
        upload={bannerUpload}
        onRemove={() => setBannerRemoved(true)}
      />
      <ImagePicker
        id="campaign-logo"
        label="Campaign icon"
        shape="logo"
        preview={logoRemoved ? undefined : (logo ?? undefined)}
        isDisabled={isPending}
        upload={logoUpload}
        onRemove={() => setLogoRemoved(true)}
      />
      <Button type="button" onClick={save} disabled={isPending}>
        <LoadingSwap isLoading={isPending}>Save images</LoadingSwap>
      </Button>
    </div>
  );
}
