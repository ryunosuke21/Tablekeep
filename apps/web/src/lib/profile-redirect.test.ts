import { describe, expect, it } from "vitest";

import { getProfileRedirect } from "./profile-redirect";

describe("getProfileRedirect", () => {
  it("keeps the sign-in route public", () => {
    expect(getProfileRedirect("/sign-in", null)).toBeNull();
  });

  it("sends signed-out visitors to sign in", () => {
    expect(getProfileRedirect("/campaigns", null)).toBe("/sign-in");
  });

  it("sends users without a meaningful name to profile setup", () => {
    expect(getProfileRedirect("/", { name: "   " })).toBe("/new-profile");
    expect(getProfileRedirect("/characters/one", { name: "" })).toBe(
      "/new-profile",
    );
  });

  it("allows an incomplete user to finish profile setup", () => {
    expect(getProfileRedirect("/new-profile", { name: "" })).toBeNull();
  });

  it("keeps complete users out of profile setup", () => {
    expect(getProfileRedirect("/new-profile", { name: "Mara Voss" })).toBe("/");
    expect(getProfileRedirect("/", { name: "Mara Voss" })).toBeNull();
  });
});
