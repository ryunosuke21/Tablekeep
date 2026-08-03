import { describe, expect, it } from "vitest";

import { getProfileRedirect } from "./profile-redirect";

describe("getProfileRedirect", () => {
  it("keeps the sign-in route public", () => {
    expect(getProfileRedirect("/sign-in", null)).toBeNull();
  });

  it("sends signed-out visitors to sign in", () => {
    expect(getProfileRedirect("/campaigns", null, "/campaigns")).toEqual({
      pathname: "/sign-in",
      destination: "/campaigns",
    });
  });

  it("sends users without a meaningful name to profile setup", () => {
    expect(getProfileRedirect("/", { name: "   " })).toEqual({
      pathname: "/new-profile",
      destination: null,
    });
    expect(
      getProfileRedirect("/characters/one", { name: "" }, "/characters/one"),
    ).toEqual({
      pathname: "/new-profile",
      destination: "/characters/one",
    });
  });

  it("allows an incomplete user to finish profile setup", () => {
    expect(getProfileRedirect("/new-profile", { name: "" })).toBeNull();
  });

  it("keeps complete users out of profile setup", () => {
    expect(getProfileRedirect("/new-profile", { name: "Mara Voss" })).toEqual({
      pathname: "/",
      destination: null,
    });
    expect(
      getProfileRedirect("/new-profile", { name: "Mara Voss" }, "/join/ABCDE"),
    ).toEqual({ pathname: "/join/ABCDE", destination: null });
    expect(getProfileRedirect("/", { name: "Mara Voss" })).toBeNull();
  });
});
