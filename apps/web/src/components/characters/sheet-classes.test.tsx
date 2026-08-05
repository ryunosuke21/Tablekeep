import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createTrpcMock } from "@/test/trpc-mock";
import type { RouterOutputs } from "@/trpc/react";

const trpc = createTrpcMock();

vi.mock("@/trpc/react", () => ({ api: trpc.api }));

const { SheetClasses } = await import("./sheet-classes");

type SheetClass = RouterOutputs["character"]["sheet"]["get"]["classes"][number];

const campaignId = "33333333-3333-3333-3333-333333333333";
const sheetId = "22222222-2222-2222-2222-222222222222";

function sheetClass(
  overrides: Partial<SheetClass> & { id: string },
): SheetClass {
  return {
    sheetId,
    name: "Rogue",
    subclass: null,
    level: 4,
    source: "custom",
    ref: null,
    sort: 0,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    ...overrides,
  };
}

function renderClasses(classes: SheetClass[]) {
  const totalLevel = classes.reduce((total, entry) => total + entry.level, 0);
  return render(
    <SheetClasses
      campaignId={campaignId}
      sheetId={sheetId}
      classes={classes}
      totalLevel={totalLevel}
      disabled={false}
    />,
  );
}

describe("SheetClasses", () => {
  it("reports the derived total level across multiclass rows", () => {
    renderClasses([
      sheetClass({ id: "class-1", name: "Rogue", level: 4 }),
      sheetClass({
        id: "class-2",
        name: "Fighter",
        subclass: "Champion",
        level: 2,
        sort: 1,
      }),
    ]);

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText(/from 2 classes/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Champion")).toBeInTheDocument();
  });

  it("accepts a homebrew class when the reference catalog gives nothing", async () => {
    const create = trpc.mutation("character.sheet.class.create");
    create.mutate.mockClear();
    renderClasses([]);

    // No catalog data is stubbed, so the query resolves to nothing.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Add a class"), "Bone Singer");
    await userEvent.type(
      screen.getByLabelText("Subclass for the new class"),
      "Reliquary",
    );
    const level = screen.getByLabelText("Starting level");
    await userEvent.clear(level);
    await userEvent.type(level, "3");
    await userEvent.click(screen.getByRole("button", { name: /add class/i }));

    expect(create.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      name: "Bone Singer",
      subclass: "Reliquary",
      level: 3,
      source: "custom",
      sort: 0,
    });
  });

  it("saves an edited level and confirms before dropping a class", async () => {
    const update = trpc.mutation("character.sheet.class.update");
    const remove = trpc.mutation("character.sheet.class.remove");
    update.mutate.mockClear();
    remove.mutate.mockClear();
    renderClasses([sheetClass({ id: "class-3", name: "Rogue", level: 4 })]);

    const level = screen.getByLabelText("Level");
    await userEvent.clear(level);
    await userEvent.type(level, "5");
    await userEvent.click(screen.getByRole("button", { name: /save class/i }));

    expect(update.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      classId: "class-3",
      name: "Rogue",
      subclass: null,
      level: 5,
    });

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(remove.mutate).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /remove class/i }),
    );
    expect(remove.mutate).toHaveBeenCalledWith({
      campaignId,
      sheetId,
      classId: "class-3",
    });
  });

  it("offers catalog suggestions when the reference data loads", async () => {
    trpc.setQueryData("classes.list", [
      {
        index: "bard",
        name: "Bard",
        hit_die: 8,
        subclasses: [{ index: "lore", name: "College of Lore" }],
      },
    ]);
    renderClasses([]);

    const input = screen.getByLabelText("Add a class");
    expect(input).toHaveAttribute("list");
    await userEvent.type(input, "Bard");

    // Suggestions arrive as datalist options, which stay optional to use.
    expect(document.querySelector('option[value="Bard"]')).toBeInTheDocument();
    expect(
      document.querySelector('option[value="College of Lore"]'),
    ).toBeInTheDocument();
  });
});
