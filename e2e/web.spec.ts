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

  const spellCatalog = await request.get(
    "http://localhost:3000/api/trpc/wiki.spells.catalog",
  );
  expect(spellCatalog.ok()).toBe(true);
  expect(await spellCatalog.text()).toContain('"key":"srd-2024_test-spark"');

  const mockResponse = await request.get("http://127.0.0.1:4100/requests");
  expect(mockResponse.ok()).toBe(true);
  const result = (await mockResponse.json()) as { operations: string[] };
  const spellReads = result.operations.filter((operation) =>
    operation.startsWith("GET /v2/spells/?"),
  );
  expect(spellReads.length).toBeGreaterThan(0);
  // The catalog is read whole and filtered in the browser, never scoped upstream.
  for (const read of spellReads) {
    expect(read).toContain("page=1&limit=1000");
    expect(read).not.toContain("document__key__in");
  }
  expect(
    result.operations.some((operation) =>
      operation.startsWith("GET /v2/documents/"),
    ),
  ).toBe(true);
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
