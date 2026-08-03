import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  type CampaignSchedulePayload,
  ScheduleSummary,
} from "./schedule-summary";

const schedule: CampaignSchedulePayload = {
  recurrence: { freq: "WEEKLY", interval: 2, byDay: ["SA"] },
  startAt: new Date("2026-08-15T23:00:00.000Z"),
  timeZone: "America/Tegucigalpa",
  durationMinutes: 240,
  occurrences: [],
};

describe("ScheduleSummary", () => {
  it("describes the schedule in plain language", () => {
    render(<ScheduleSummary schedule={schedule} />);

    expect(screen.getByText("Every other Saturday")).toBeInTheDocument();
    expect(screen.getByText("5:00 PM")).toBeInTheDocument();
  });

  it("explains that no schedule is set", () => {
    render(
      <ScheduleSummary
        schedule={{
          ...schedule,
          recurrence: null,
          startAt: null,
          timeZone: null,
          durationMinutes: null,
        }}
      />,
    );

    expect(screen.getByText(/no repeating schedule yet/i)).toBeInTheDocument();
  });
});
