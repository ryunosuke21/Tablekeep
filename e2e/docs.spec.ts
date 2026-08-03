import { expect, test } from "@playwright/test";

test("the public site communicates status and links to the two surfaces", async ({
  page,
}) => {
  await page.goto("http://localhost:3001");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Keep the table",
  );
  await expect(
    page.getByRole("link", { name: /enter the keep/i }).first(),
  ).toHaveAttribute("href", "http://localhost:3000");
  await expect(page.getByText("Built", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Planned", { exact: true })).toHaveCount(4);

  const docsLink = page.getByRole("link", { name: /read the docs/i }).first();
  await expect(docsLink).toHaveAttribute("href", "/docs");
  await Promise.all([
    page.waitForURL("http://localhost:3001/docs"),
    docsLink.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Tablekeep documentation" }),
  ).toBeVisible();
});
