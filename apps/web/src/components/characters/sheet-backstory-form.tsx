"use client";

import { useEffect, useState } from "react";

import { Button } from "@tablekeep/ui/components/button";
import { Field, FieldDescription } from "@tablekeep/ui/components/field";
import { LoadingSwap } from "@tablekeep/ui/components/loading-swap";
import { Textarea } from "@tablekeep/ui/components/textarea";

import { api } from "@/trpc/react";

import { SaveStatus, saveState } from "./save-status";
import { ReadProse } from "./sheet-readouts";

const MAX_BACKSTORY = 20_000;

/**
 * The campaign's telling of where this character came from. It is separate
 * from the character's global bio: the same character can carry a different
 * history at a different table.
 */
export function SheetBackstoryForm({
  campaignId,
  sheetId,
  backstory,
  disabled,
  canEdit,
}: {
  campaignId: string;
  sheetId: string;
  backstory: string | null;
  disabled: boolean;
  canEdit: boolean;
}) {
  const utils = api.useUtils();
  const [value, setValue] = useState(backstory ?? "");
  const [dirty, setDirty] = useState(false);

  // Follow a co-manager's saved change unless this editor is mid-edit.
  useEffect(() => {
    if (dirty) return;
    setValue(backstory ?? "");
  }, [backstory, dirty]);

  const updateSheet = api.character.sheet.update.useMutation({
    onSuccess: (sheet) => {
      setDirty(false);
      setValue(sheet.backstory ?? "");
      void utils.character.sheet.get.invalidate({ campaignId, sheetId });
    },
  });

  if (!canEdit) {
    return (
      <ReadProse
        value={backstory}
        empty="No backstory has been written for this campaign yet."
      />
    );
  }

  const tooLong = value.length > MAX_BACKSTORY;

  function save() {
    if (tooLong) return;
    updateSheet.mutate({
      campaignId,
      sheetId,
      backstory: value.trim() ? value.trim() : null,
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Field>
        <Textarea
          id="sheet-backstory"
          aria-label="Backstory"
          rows={12}
          maxLength={MAX_BACKSTORY}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setDirty(true);
          }}
          placeholder="Where they came from, and what they left behind."
          disabled={disabled || updateSheet.isPending}
          aria-invalid={tooLong}
        />
        <FieldDescription>
          Visible to this character's player and the campaign's DMs.
        </FieldDescription>
      </Field>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          className="min-h-11"
          disabled={disabled || updateSheet.isPending || tooLong}
        >
          <LoadingSwap isLoading={updateSheet.isPending}>
            Save backstory
          </LoadingSwap>
        </Button>
        <SaveStatus state={saveState(updateSheet)} onRetry={save} />
      </div>
    </form>
  );
}
