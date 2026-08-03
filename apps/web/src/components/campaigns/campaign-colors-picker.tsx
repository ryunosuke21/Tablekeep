"use client";

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
  return (
    <RadioGroup
      id={id}
      className="flex flex-wrap gap-2"
      value={value}
      onValueChange={(next) => onChange(next as CampaignColor)}
      disabled={disabled}
    >
      {colorOrder.map((color) => {
        const labelId = `campaign-color-${color}`;

        return (
          <div
            key={color}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors has-disabled:opacity-60",
              value === color ? "border-foreground/40" : "border-input",
            )}
          >
            <RadioGroupItem value={color} aria-labelledby={labelId} />
            <span
              aria-hidden="true"
              className={cn(
                "size-5 rounded-md border border-foreground/10",
                swatchClasses[color],
              )}
            />
            <span id={labelId}>{CAMPAIGN_COLOR_LABELS[color]}</span>
          </div>
        );
      })}
    </RadioGroup>
  );
}
