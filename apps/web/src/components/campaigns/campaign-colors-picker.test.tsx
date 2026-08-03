import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  type CampaignColor,
  CampaignColorsPicker,
} from "./campaign-colors-picker";

function PickerHarness() {
  const [color, setColor] = useState<CampaignColor>("lilac");

  return <CampaignColorsPicker value={color} onChange={setColor} />;
}

describe("CampaignColorsPicker", () => {
  it("selects a color when its outlined option is clicked", async () => {
    render(<PickerHarness />);
    const sageOption = screen.getByText("Sage").closest("label");

    expect(sageOption).not.toBeNull();
    if (!sageOption) {
      return;
    }
    await userEvent.click(sageOption);

    expect(screen.getByRole("radio", { name: "Sage" })).toBeChecked();
  });
});
