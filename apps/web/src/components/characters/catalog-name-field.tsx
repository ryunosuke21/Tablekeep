"use client";

import { useId } from "react";

import { Input } from "@tablekeep/ui/components/input";

/**
 * A free-text name with optional suggestions from a reference catalog. The
 * catalog is a convenience only: the field accepts any value the table uses,
 * and a failed or empty catalog leaves plain typing untouched.
 */
export function CatalogNameField({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  maxLength,
  disabled,
  required,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  className?: string;
}) {
  const fallbackId = useId();
  const listId = `${id ?? fallbackId}-suggestions`;
  const hasSuggestions = suggestions.length > 0;

  return (
    <>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={hasSuggestions ? listId : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        autoComplete="off"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={className}
      />
      {hasSuggestions ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}
