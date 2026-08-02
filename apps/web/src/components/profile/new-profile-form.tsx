"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import { Button } from "@tablekeep/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Progress } from "@tablekeep/ui/components/progress";
import { useFileUpload } from "@tablekeep/ui/hooks/use-file-upload";
import { TablekeepIcon } from "@tablekeep/ui/icons/tablekeep";
import { cn } from "@tablekeep/ui/lib/utils";

import { env } from "@/env/client";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_BYTES } from "@/lib/constants";
import { useUploadThing } from "@/lib/uploadthing";
import { authClient } from "@/server/better-auth/client";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters for your name.")
    .max(80, "Keep your name under 80 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type NewProfileFormProps = {
  email: string;
  initialImage: string | null | undefined;
};

const docsHomeUrl = new URL("/", env.NEXT_PUBLIC_DOCS_URL).toString();

export function NewProfileForm({ email, initialImage }: NewProfileFormProps) {
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });
  const name = useWatch({ control: form.control, name: "name" });
  const [fileState, fileActions] = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
  });
  const { startUpload, isUploading } = useUploadThing("profileImage", {
    uploadProgressGranularity: "fine",
    onUploadProgress: setUploadProgress,
  });

  const selected = fileState.files[0];
  const preview = selected?.preview ?? initialImage ?? undefined;
  const displayName = name.trim() || "Your name";
  const initials = getInitials(name);
  const hasValidName = form.formState.isValid;

  async function saveProfile(values: ProfileFormValues) {
    form.clearErrors("root");
    let image = initialImage ?? undefined;

    try {
      if (selected?.file instanceof File) {
        setUploadProgress(0);
        const uploadedFiles = await startUpload([selected.file]);
        const uploadedImage = uploadedFiles?.[0];

        if (!uploadedImage) {
          form.setError("root", {
            message:
              "Your picture could not be uploaded. Try choosing it again.",
          });
          return;
        }

        image = uploadedImage.ufsUrl;
      }

      const result = await authClient.updateUser({
        name: values.name.trim(),
        image,
      });

      if (result.error) {
        form.setError("root", {
          message: result.error.message ?? "Your profile could not be saved.",
        });
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      form.setError("root", {
        message:
          "Your profile could not be saved. Check your connection and try again.",
      });
    }
  }

  const isPending = form.formState.isSubmitting || isUploading;
  const formError = form.formState.errors.root?.message;

  return (
    <main className="grid min-h-svh place-items-center bg-background p-4 sm:p-8">
      <div className="grid min-h-[680px] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border bg-background shadow-[0_24px_70px_rgba(30,30,65,0.14)] lg:grid-cols-[0.82fr_1.18fr]">
        <ProfileStoryPanel />

        <section className="flex flex-col px-6 py-7 sm:px-10 sm:py-10 lg:px-12">
          <header>
            <p className="font-mono text-[10px] text-tk-arcane uppercase tracking-[0.2em]">
              Player profile
            </p>
            <h1 className="mt-3 max-w-md font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
              Take your seat at the table.
            </h1>
            <p className="mt-3 max-w-md text-muted-foreground text-sm leading-6">
              Add the name and picture your party will recognize. You can change
              both later.
            </p>
          </header>

          <form
            className="mt-7 flex flex-1 flex-col"
            onSubmit={form.handleSubmit(saveProfile)}
            noValidate
          >
            <div className="grid gap-8 sm:grid-cols-[9rem_1fr] sm:items-start">
              <ProfilePhotoPicker
                preview={preview}
                canRemove={Boolean(selected)}
                initials={initials}
                isDragging={fileState.isDragging}
                errors={fileState.errors}
                isDisabled={isPending}
                onOpen={fileActions.openFileDialog}
                onRemove={() => selected && fileActions.removeFile(selected.id)}
                inputProps={fileActions.getInputProps({
                  id: "profile-picture",
                  disabled: isPending,
                  "aria-label": "Choose a profile picture",
                })}
                dropHandlers={{
                  onDragEnter: fileActions.handleDragEnter,
                  onDragLeave: fileActions.handleDragLeave,
                  onDragOver: fileActions.handleDragOver,
                  onDrop: fileActions.handleDrop,
                }}
              />

              <div className="space-y-6">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Your name</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        autoComplete="name"
                        placeholder="Mara Voss"
                        className="h-11 px-3"
                        disabled={isPending}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid ? "name-error" : "name-help"
                        }
                        autoFocus
                      />
                      {fieldState.error ? (
                        <FieldError
                          id="name-error"
                          errors={[fieldState.error]}
                        />
                      ) : (
                        <FieldDescription id="name-help">
                          Use your real name, nickname, or table name.
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />

                <Field>
                  <FieldLabel htmlFor="profile-email">Email address</FieldLabel>
                  <Input
                    id="profile-email"
                    value={email}
                    className="h-11 bg-muted/45 px-3 text-muted-foreground"
                    disabled
                  />
                  <FieldDescription>
                    This stays private and is used only for your account.
                  </FieldDescription>
                </Field>
              </div>
            </div>

            <div className="mt-8 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  {preview && <AvatarImage src={preview} alt="" />}
                  <AvatarFallback className="bg-tk-keep font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{displayName}</p>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    This is how you’ll appear to your party.
                  </p>
                </div>
                {hasValidName && (
                  <IconCheck
                    className="size-4 text-tk-tide"
                    aria-label="Valid name"
                  />
                )}
              </div>
            </div>

            {isUploading && (
              <div className="mt-5 space-y-2" aria-live="polite">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Uploading picture</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="mt-auto pt-8">
              <div className="min-h-6 text-sm" aria-live="polite">
                {formError && <p className="text-destructive">{formError}</p>}
              </div>
              <Button
                type="submit"
                size="lg"
                className="mt-2 h-12 w-full bg-tk-keep text-white shadow-[0_8px_24px_rgba(28,37,72,0.2)] hover:bg-tk-keep/92"
                disabled={isPending}
              >
                <LoadingSwap isLoading={isPending}>
                  <span className="flex items-center gap-2">
                    Enter Tablekeep
                    <IconArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </LoadingSwap>
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                <IconShieldCheck className="size-3.5" aria-hidden="true" />
                Profile pictures can be up to {MAX_FILE_SIZE}.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function ProfileStoryPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-tk-keep p-10 text-white lg:flex lg:flex-col">
      <Image
        src="/party.jpg"
        alt="A party of adventurers deciding which path to take"
        fill
        priority
        sizes="(min-width: 1024px) 40vw, 0vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-tk-keep/55" aria-hidden="true" />

      <a
        href={docsHomeUrl}
        className="relative flex w-fit items-center gap-2.5 rounded-lg font-semibold tracking-tight outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        aria-label="Visit Tablekeep documentation"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <TablekeepIcon className="h-5 w-auto" />
        </span>
        Tablekeep
      </a>

      <div className="relative mt-auto max-w-sm">
        <p className="font-semibold text-2xl leading-tight tracking-[-0.035em]">
          Every campaign starts with the people around the table.
        </p>
        <p className="mt-3 text-sm text-white/60 leading-6">
          Your profile helps the party know who’s behind each character, roll,
          and shared note.
        </p>
      </div>
    </aside>
  );
}

type ProfilePhotoPickerProps = {
  preview?: string;
  canRemove: boolean;
  initials: string;
  isDragging: boolean;
  errors: string[];
  isDisabled: boolean;
  onOpen: () => void;
  onRemove: () => void;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
  dropHandlers: Pick<
    React.HTMLAttributes<HTMLDivElement>,
    "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"
  >;
};

function ProfilePhotoPicker({
  preview,
  canRemove,
  initials,
  isDragging,
  errors,
  isDisabled,
  onOpen,
  onRemove,
  inputProps,
  dropHandlers,
}: ProfilePhotoPickerProps) {
  return (
    <Field data-invalid={errors.length > 0}>
      <FieldLabel>Profile picture</FieldLabel>
      <div
        {...dropHandlers}
        className={cn(
          "group relative flex aspect-square max-w-36 items-center justify-center rounded-2xl border border-dashed bg-muted/30 transition-colors",
          isDragging && "border-tk-arcane bg-primary/5",
        )}
      >
        <input {...inputProps} className="sr-only" />
        <Avatar className="size-24 shadow-sm">
          {preview && <AvatarImage src={preview} alt="Profile preview" />}
          <AvatarFallback className="bg-tk-keep font-semibold text-2xl text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          className="absolute right-3 bottom-3 size-8 rounded-full bg-background text-foreground shadow-md ring-1 ring-border hover:bg-muted"
          onClick={onOpen}
          disabled={isDisabled}
          aria-label={
            preview ? "Change profile picture" : "Choose profile picture"
          }
        >
          <IconCamera className="size-4" />
        </Button>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 size-7 rounded-full bg-background/85 opacity-0 shadow-sm backdrop-blur-sm transition-opacity focus:opacity-100 group-hover:opacity-100"
            onClick={onRemove}
            disabled={isDisabled}
            aria-label="Remove selected profile picture"
          >
            <IconX className="size-3.5" />
          </Button>
        )}
      </div>
      <FieldDescription>
        Drop an image here or use the camera button.
      </FieldDescription>
      {errors.length > 0 && (
        <FieldError errors={errors.map((message) => ({ message }))} />
      )}
    </Field>
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "?";
}
