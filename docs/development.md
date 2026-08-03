# Development guide

## Architecture

Tablekeep is a pnpm workspace managed by Turborepo. It contains two deployable Next.js applications with distinct audiences.

```text
apps/web                   The product (authenticated application)
  src/app/                 Next.js App Router pages and route handlers
  src/server/api/          tRPC routers and procedures
  src/server/better-auth/  Authentication and authorization configuration
  src/server/db/           Drizzle client and PostgreSQL schema
  src/env/                 Validated server and client environment variables
apps/docs                  The public site (marketing, landing page, documentation)
  content/docs/            MDX documentation content
  src/app/(home)/          Landing page and other marketing routes
  src/app/docs/            Documentation layout and pages
  src/lib/                 Fumadocs content source and layout configuration
packages/ui
  src/components/          Reusable UI primitives
  src/styles/              Shared CSS and design tokens
packages/config            Shared TypeScript configuration
```

### apps/web — the product

This is Tablekeep itself. Everything a signed-in user does at the table lives here: campaigns, character sheets, spellbooks, inventory, encounters. It owns the PostgreSQL database, Better Auth, and the tRPC API, and it is the only workspace that reads or writes campaign data.

### apps/docs — the public site

This is the marketing surface: the landing page, product pages, and the user-facing documentation. It is built on Fumadocs with MDX content and renders statically. It has no database, no authentication, no tRPC, and no access to campaign data. It links to the product rather than embedding it.

Do not blur the boundary. Public, unauthenticated content belongs in `apps/docs`; anything that needs a session or a query belongs in `apps/web`. If both applications need the same visual primitive, put it in `packages/ui`.

> Note the naming: `apps/docs` is the deployed public site, while the top-level `docs/` directory holds internal product and contributor documentation that is not published.

The web app uses Next.js 16 Server Components by default. Client-side data access uses tRPC with TanStack Query. PostgreSQL is accessed through Drizzle ORM 0.45. Better Auth 1.6 owns authentication tables and session handling. The workspace uses TypeScript 6.0.3, pinned exactly in the pnpm catalog; do not broaden or upgrade that version without an explicit decision.

## Local environment

Copy `apps/web/.env.example` to `apps/web/.env` and `apps/docs/.env.example` to `apps/docs/.env`. The product server validates its environment through `apps/web/src/env/server.ts`; the site validates its public environment through `apps/docs/src/env/client.ts`. `apps/docs` runs on port 3001, and `pnpm dev:docs` starts it on its own.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `BETTER_AUTH_SECRET` | Production | Secret used by Better Auth; set it locally as well when testing auth. |
| `NEXT_PUBLIC_DOCS_URL` | No | Public documentation URL used by the product Help link; defaults to `http://localhost:3001/docs`. |
| `DATA_SOURCE` | No | Reference-data API base URL; defaults to `https://www.dnd5eapi.co`. |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error`; defaults to `info`. |

The product’s public URL comes from Vercel’s `VERCEL_URL` system variable in deployed environments (via the T3 Env Vercel preset), and falls back to `http://localhost:3000` locally. You do not need to set an app URL in `.env`.

`apps/docs` reads one public variable through T3 Env.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Deployment | Where every "Open Tablekeep" link points; defaults to `http://localhost:3000`. |

The site's own public URL (used for Open Graph image resolution) comes from Vercel's `VERCEL_URL` system variable in deployed environments, and falls back to `http://localhost:3001` locally.

The magic-link plugin is configured, but its sender is currently a no-op. Do not describe email sign-in as working until a delivery service is integrated.

## Application conventions

- Add application-specific components under `apps/web/src/components/`.
- Add marketing pages under `apps/docs/src/app/(home)/` and documentation content as MDX under `apps/docs/content/docs/`.
- Add reusable, broadly applicable primitives under `packages/ui/src/components/` and export them through the package’s existing wildcard exports.
- Use `@/` imports within the web app.
- Keep schema files organized by domain under `apps/web/src/server/db/schema/`, and re-export them from `schema/index.ts`.
- Add tRPC routers under `apps/web/src/server/api/routers/`, then compose them in `index.ts`.

### Profile onboarding

Authenticated users whose name is empty are redirected to `/new-profile` before
they can enter another product page. The Next.js proxy applies the redirect
across page routes, while protected layouts and pages still validate sessions
server-side. Keep `/sign-in` public and `/new-profile` available to incomplete
users so the redirect flow cannot loop.

Profile pictures are staged locally with the shared `useFileUpload` hook and
uploaded only when the React Hook Form profile form is submitted. The custom
uploader uses UploadThing's function API against `/api/files`; its client-side
byte limit and server-side UploadThing string limit both derive from
`MAX_FILE_SIZE` in `apps/web/src/lib/constants.ts`.

## Campaign data and authorization

Private campaigns are implemented in `apps/web`. The normal authorization path is:

```text
authenticated session
  → betaProcedure seam
  → active campaign membership
  → campaign role/permission
  → requested resource
```

`betaProcedure` currently aliases `protectedProcedure`; M1 will replace that seam with the closed-beta allowlist. Campaign membership never derives from the site-wide Better Auth administrator role. `campaignMemberProcedure` returns `NOT_FOUND` for a missing campaign and for a non-member so private campaign existence is not disclosed. `campaignDmProcedure` additionally checks the campaign-scoped Better Auth access-control role and rejects writes to archived campaigns. Only the restore procedure bypasses the archived-write guard.

The Better Auth organization plugin is configured as the campaign identity/membership adapter through `packages/campaign-auth`. Better Auth 1.6.25 does not expose sufficient hooks to enforce Tablekeep's last-DM and archival rules on all stock organization mutations, so the stock create, update, delete, remove-member, update-role, and leave HTTP paths are disabled. Campaign mutations go through tRPC and the query layer. The wrapper carries both `disableMigration` and `disableMigrations` because the plugin descriptor and table normalizer inspect different spellings; campaign tables remain owned by the app's Drizzle schema and migration.

### Membership history

`campaign_members` contains active rows only. Removing or leaving deletes the active row immediately, which makes every membership-scoped read deny access on its next request. `campaign_member_events` is append-only history for joins, removals, departures, and role changes. This model was chosen instead of a soft-status membership row because Better Auth's organization plugin treats membership rows as active and hard-deletes them.

Last-DM checks are enforced in the same PostgreSQL statement as role changes, removal, and departure. These statements take a campaign-scoped advisory transaction lock and lock the current DM rows before writing. Account deletion remains a limitation: the user foreign key cascades the active membership, so deleting the sole DM account can orphan a campaign. Account deletion must gain a transfer/archive guard before self-service deletion ships.

### Invitations

Email invitations use Better Auth's opaque invitation ID, recipient check, compare-and-swap acceptance, and the existing email delivery service. Shareable codes are app-owned, human-enterable, expiring, revocable, role-specific secrets. They are stored in plaintext because a DM must be able to retrieve and share the current code; access to that value is restricted to DM-only responses. Codes exclude ambiguous glyphs and are never accepted without an authenticated session.

Link-code acceptance, membership-cap enforcement, use-count claiming, membership creation, and history insertion are one locked SQL statement. Regeneration similarly revokes the previous code and inserts its replacement atomically. Preview and acceptance are limited in process to 20 attempts per user and operation per minute; email resend is limited to once per invitation per minute. These are closed-beta, single-process controls and must move to a shared store before horizontally scaling the web app. Better Auth's direct `organization/invite-member` resend branch can bypass the app's resend throttle and its archived hook; the supported UI/tRPC path is guarded, and the stock invitation endpoint must be disabled or gateway-limited before untrusted direct API access is supported.

### Scheduling and atomic writes

Campaigns store a bounded RFC 5545 recurrence rule, start instant, IANA time zone, and duration. `campaign_occurrence_overrides` stores only cancellations, reschedules, and added one-off sessions. Expansion uses `rrule` and `luxon`, is horizon/count bounded, preserves wall-clock time across daylight-saving changes, and looks back far enough to include a recent occurrence rescheduled into the future. Replacing or clearing a recurrence removes stale rule-bound overrides while preserving added one-offs.

The web app uses Drizzle's Neon HTTP driver, which does not support interactive transactions. Dependent campaign writes use single data-modifying CTE statements, conditional updates, and advisory transaction locks instead of `db.transaction()`. Do not enable the Better Auth adapter's transaction option for this driver.

The migration for this feature is `apps/web/drizzle/0001_elite_shadow_king.sql`. Use `pnpm db:migrate` in shared environments; reserve `db:push` for disposable databases.

## Database workflow

Use migrations for changes that other developers or deployed environments need:

```bash
pnpm db:generate
pnpm db:migrate
```

`pnpm db:push` synchronizes the configured database directly and is best reserved for disposable local databases. Always inspect generated migration SQL and consider the safety of data transformations before applying them.

## Verification

```bash
pnpm test:run
pnpm check-types
pnpm check
pnpm build
```

For UI work, also exercise the affected route manually. For authorization or data work, verify both an allowed case and a denied case.

### Automated tests

The root Vitest configuration defines separate projects for the product server,
the public site, and shared UI components. Tests live beside the source they
exercise as `*.test.ts` or `*.test.tsx`. Reusable product API fixtures belong in
`apps/web/src/test/fixtures/`; keep them minimal, system-neutral, and valid
against the existing Zod schemas.

Use `pnpm test` while developing, `pnpm test:run` for a one-shot run, and
`pnpm test:coverage` before handing off changes to the covered server or UI
modules. The coverage command writes HTML and LCOV output under `coverage/` and
enforces the thresholds declared in `vitest.config.ts`. Unit and component tests
must stub network boundaries; they must never contact OAuth, PostgreSQL, or the
public reference-data API.

The Playwright suite under `e2e/` starts both Next.js applications and a local
GraphQL fixture service. It uses Chromium to verify only the essential startup
and navigation paths. Before running `pnpm test:e2e` locally, provide the
disposable PostgreSQL database configured in `playwright.config.ts` and apply
the schema with `pnpm --filter web db:push`. Traces, screenshots, videos, and the
HTML report are written to ignored test-output directories when failures occur.

GitHub Actions runs two checks for every pull request and push to `main`:

- `CI / quality` runs non-writing Biome checks, type checking, coverage tests,
  and production builds.
- `CI / browser` runs in the version-matched official Playwright image, where
  Chromium and its Linux dependencies are already installed, then provisions
  disposable PostgreSQL, applies the schema, and runs the smoke suite.

Both jobs use non-secret fixture values. Coverage and Playwright diagnostics are
uploaded as workflow artifacts for 14 days, including on failed runs.
