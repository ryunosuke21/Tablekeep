import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const social = vi.fn();
const magicLink = vi.fn();

vi.mock("@/server/better-auth/client", () => ({
  authClient: {
    signIn: {
      social: (...args: unknown[]) => social(...args),
      magicLink: (...args: unknown[]) => magicLink(...args),
    },
  },
}));

const { SignInForm } = await import("./sign-in-form");

describe("SignInForm destination handling", () => {
  beforeEach(() => {
    social.mockReset().mockResolvedValue({ error: null });
    magicLink.mockReset().mockResolvedValue({ error: null });
  });

  it("keeps a safe destination through Google sign-in and onboarding", async () => {
    render(<SignInForm destination="/join/ABCDEFGHIJ" />);

    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/join/ABCDEFGHIJ",
      newUserCallbackURL: "/new-profile?next=%2Fjoin%2FABCDEFGHIJ",
    });
  });

  it("keeps a safe destination through the magic link", async () => {
    render(<SignInForm destination="/campaigns/the-ember-coast" />);

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "player@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );

    expect(magicLink).toHaveBeenCalledWith({
      email: "player@example.com",
      callbackURL: "/campaigns/the-ember-coast",
      newUserCallbackURL: "/new-profile?next=%2Fcampaigns%2Fthe-ember-coast",
    });
  });

  it.each(["https://evil.example", "//evil.example", "/sign-in"])(
    "falls back to the dashboard for the unsafe destination %s",
    async (destination) => {
      render(<SignInForm destination={destination} />);

      await userEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      expect(social).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/",
        newUserCallbackURL: "/new-profile",
      });
    },
  );
});
