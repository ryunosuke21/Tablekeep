"use client";

import { useRouter } from "next/navigation";

import { Button } from "@tablekeep/ui/components/button";

type BackButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick">;

export function BackButton(props: BackButtonProps) {
  const router = useRouter();

  return <Button onClick={() => router.back()} {...props} />;
}
