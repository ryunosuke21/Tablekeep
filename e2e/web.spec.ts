import { expect, test } from "@playwright/test";

test("the product app starts with deterministic dashboard data", async ({
  page,
  request,
}) => {
  await page.goto("http://localhost:3000");

  await expect(
    page.getByRole("heading", { name: /your table, at a glance/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Campaigns" })).toBeVisible();
  await expect(page.getByText("The Ember Coast").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Characters" })).toBeVisible();
  await expect(page.getByText("Vesper Quill").first()).toBeVisible();

  const health = await request.get(
    "http://localhost:3000/api/trpc/health.check",
  );
  expect(health.ok()).toBe(true);
  expect(await health.text()).toContain('"status":"ok"');

  const response = await request.get("http://127.0.0.1:4100/requests");
  expect(response.ok()).toBe(true);
  const result = (await response.json()) as { operations: string[] };
  expect(result.operations).toEqual([]);
});
