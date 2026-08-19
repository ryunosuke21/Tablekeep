import { describe, expect, it } from "vitest";

import { isPlayRoute } from "./proxy";

describe("isPlayRoute", () => {
  it.each(["/play", "/play/campaign-id", "/play/campaign-id/encounter"])(
    "matches %s",
    (pathname) => {
      expect(isPlayRoute(pathname)).toBe(true);
    },
  );

  it.each(["/", "/campaigns", "/player", "/playground"])(
    "does not match %s",
    (pathname) => {
      expect(isPlayRoute(pathname)).toBe(false);
    },
  );
});
