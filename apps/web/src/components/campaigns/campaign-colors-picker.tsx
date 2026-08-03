"use client";

import { useId } from "react";

import {
  RadioGroup,
  RadioGroupItem,
} from "@tablekeep/ui/components/radio-group";
import { cn } from "@tablekeep/ui/lib/utils";

import { CAMPAIGN_COLOR_LABELS } from "@/lib/campaign-format";

export type CampaignColor = keyof typeof CAMPAIGN_COLOR_LABELS;

const swatchClasses: Record<CampaignColor, string> = {
  lilac: "bg-campaign-lilac",
  rose: "bg-campaign-rose",
  sage: "bg-campaign-sage",
  sky: "bg-campaign-sky",
};

const colorOrder = ["lilac", "rose", "sage", "sky"] as const;

export function CampaignColorsPicker({
  value,
  onChange,
  disabled,
  id,
}: {
  value: CampaignColor;
  onChange: (value: CampaignColor) => void;
  disabled?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const groupId = id ?? generatedId;

  return (
    <RadioGroup
      id={id}
      className="flex flex-wrap gap-2"
      value={value}
      onValueChange={(next) => onChange(next as CampaignColor)}
      disabled={disabled}
    >
      {colorOrder.map((color) => {
        const optionId = `${groupId}-${color}`;

        return (
          <label
            key={color}
            htmlFor={optionId}
            className={cn(
              "flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent/50 has-disabled:cursor-not-allowed has-disabled:opacity-60",
              value === color ? "border-foreground/40" : "border-input",
            )}
          >
            <RadioGroupItem id={optionId} value={color} />
            <span
              aria-hidden="true"
              className={cn(
                "size-5 rounded-md border border-foreground/10",
                swatchClasses[color],
              )}
            />
            <span>{CAMPAIGN_COLOR_LABELS[color]}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
