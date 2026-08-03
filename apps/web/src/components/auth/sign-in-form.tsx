"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { z } from "zod";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldError, FieldLabel } from "@tablekeep/ui/components/field";
import { Input } from "@tablekeep/ui/components/input";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";

import { safeDestination, withDestination } from "@/lib/redirect-destination";
import { authClient } from "@/server/better-auth/client";

const magicLinkSchema = z.object({
  email: z.email("Enter a valid email address."),
  magicLinkRequested: z.boolean(),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function SignInForm({
  destination = null,
}: {
  destination?: string | null;
}) {
  // Revalidate at this boundary: the value reaches Better Auth's callbackURL.
  const returnTo = safeDestination(destination);
  const googleForm = useForm();
  const emailForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
      magicLinkRequested: false,
    },
  });
  const magicLinkRequested = useWatch({
    control: emailForm.control,
    name: "magicLinkRequested",
  });

  async function signInWithGoogle() {
    googleForm.clearErrors();
    emailForm.clearErrors("root");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: returnTo ?? "/",
        newUserCallbackURL: withDestination("/new-profile", returnTo),
      });

      if (result.error) {
        googleForm.setError("root", {
          message:
            result.error.message ?? "Google sign-in could not be started.",
        });
      }
    } catch {
      googleForm.setError("root", {
        message: "Google sign-in could not be started. Please try again.",
      });
    }
  }

  async function requestMagicLink(values: MagicLinkFormValues) {
    emailForm.clearErrors("root");
    googleForm.clearErrors();
    emailForm.setValue("magicLinkRequested", false);

    try {
      const result = await authClient.signIn.magicLink({
        email: values.email,
        callbackURL: returnTo ?? "/",
        newUserCallbackURL: withDestination("/new-profile", returnTo),
      });

      if (result.error) {
        emailForm.setError("root", {
          message:
            result.error.message ?? "The sign-in link could not be sent.",
        });
        return;
      }

      emailForm.setValue("magicLinkRequested", true);
    } catch {
      emailForm.setError("root", {
        message: "The sign-in link could not be sent. Please try again.",
      });
    }
  }

  const isGooglePending = googleForm.formState.isSubmitting;
  const isEmailPending = emailForm.formState.isSubmitting;
  const isPending = isGooglePending || isEmailPending;
  const requestError =
    googleForm.formState.errors.root?.message ??
    emailForm.formState.errors.root?.message;

  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2 text-center">
        <h1 className="font-semibold text-3xl tracking-[-0.035em]">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Sign in to continue to your campaigns.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <form onSubmit={googleForm.handleSubmit(signInWithGoogle)}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="h-11 w-full border-[#dadce0] bg-white text-[#1f1f1f] shadow-xs hover:bg-[#f8f9fa] hover:text-[#1f1f1f] dark:border-[#dadce0] dark:bg-white dark:hover:bg-[#f8f9fa]"
            disabled={isPending}
          >
            <LoadingSwap isLoading={isGooglePending}>
              <span className="flex items-center justify-center gap-1.5">
                <FcGoogle className="size-[18px]" aria-hidden="true" />
                Continue with Google
              </span>
            </LoadingSwap>
          </Button>
        </form>

        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.18em]">
            OR
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={emailForm.handleSubmit(requestMagicLink)}
          noValidate
        >
          <Controller
            name="email"
            control={emailForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  className="h-11 px-3"
                  disabled={isPending}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "email-error" : undefined
                  }
                />
                {fieldState.error && (
                  <FieldError id="email-error" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-tk-keep text-white hover:bg-tk-keep/90"
            disabled={isPending}
          >
            <LoadingSwap isLoading={isEmailPending}>
              Continue with email
            </LoadingSwap>
          </Button>
        </form>

        <div className="min-h-5 text-center text-sm" aria-live="polite">
          {requestError && <p className="text-destructive">{requestError}</p>}
          {magicLinkRequested && !requestError && (
            <p className="text-muted-foreground">
              Check your inbox for your sign-in link.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
