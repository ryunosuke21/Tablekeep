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

  await page
    .getByRole("link", { name: /read the docs/i })
    .first()
    .click();
  await expect(page).toHaveURL("http://localhost:3001/docs");
  await expect(
    page.getByRole("heading", { name: "Hello World" }),
  ).toBeVisible();
});
