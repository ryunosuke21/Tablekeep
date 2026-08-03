"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@tablekeep/ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@tablekeep/ui/components/input-otp";

import { inviteCodePath } from "@/lib/campaign-format";
import { inviteCodeEntrySchema } from "@/lib/validation/campaign";

const CODE_LENGTH = 10;
const slots = Array.from({ length: CODE_LENGTH }, (_, index) => index);

export function JoinCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = inviteCodeEntrySchema.safeParse({ code });

    if (!parsed.success) {
      setError("Enter all 10 letters and numbers from the invitation code.");
      return;
    }

    setError(null);
    router.push(inviteCodePath(parsed.data.code));
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="join-code">Invitation code</FieldLabel>
        <InputOTP
          id="join-code"
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(value) => {
            setError(null);
            setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
          }}
          containerClassName="justify-start"
          aria-invalid={Boolean(error)}
          aria-describedby="join-code-hint"
        >
          <InputOTPGroup>
            {slots.slice(0, 5).map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="size-7 text-sm sm:size-9 sm:text-base"
              />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {slots.slice(5).map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="size-7 text-sm sm:size-9 sm:text-base"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <FieldDescription id="join-code-hint">
          Codes use capital letters and digits, without O, 0, I or 1.
        </FieldDescription>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>

      <Button type="submit" disabled={code.length !== CODE_LENGTH}>
        Find campaign
      </Button>
    </form>
  );
}
