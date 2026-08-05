import { expect, test } from "@playwright/test";

test("the product app protects the dashboard and keeps public APIs available", async ({
  page,
  request,
}) => {
  await page.goto("http://localhost:3000");

  expect(page.url()).toBe("http://localhost:3000/sign-in?next=%2F");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();

  const health = await request.get(
    "http://localhost:3000/api/trpc/health.check",
  );
  expect(health.ok()).toBe(true);
  expect(await health.text()).toContain('"status":"ok"');

  const spellList = await request.get(
    "http://localhost:3000/api/trpc/wiki.spells.list",
    {
      params: {
        input: JSON.stringify({ json: { limit: 1 } }),
      },
    },
  );
  expect(spellList.ok()).toBe(true);
  expect(await spellList.text()).toContain('"key":"srd-2024_test-spark"');

  const mockResponse = await request.get("http://127.0.0.1:4100/requests");
  expect(mockResponse.ok()).toBe(true);
  const result = (await mockResponse.json()) as { operations: string[] };
  expect(result.operations).toEqual([
    "GET /v2/spells/?page=1&limit=1&fields=key%2Cname%2Cdocument%2Clevel%2Cschool%2Cclasses%2Ccasting_time%2Cconcentration%2Critual%2Cverbal%2Csomatic%2Cmaterial&document__key__in=srd-2024",
  ]);
});

test("campaign routes are protected and keep the requested destination", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/campaigns");

  expect(page.url()).toBe("http://localhost:3000/sign-in?next=%2Fcampaigns");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
});

test("an invitation link keeps its destination through the sign-in redirect", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/join/ABCDE-FGHIJ");

  expect(page.url()).toBe(
    "http://localhost:3000/sign-in?next=%2Fjoin%2FABCDE-FGHIJ",
  );
  await expect(page.getByLabel("Email address")).toBeVisible();
});
