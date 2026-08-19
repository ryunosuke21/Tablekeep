# Development guide

## Architecture

Tablekeep is a pnpm workspace managed by Turborepo. It contains two deployable Next.js applications with distinct audiences.

```text
apps/web                   The product (authenticated application)
  party/                   PartyKit real-time server entry points
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
packages/shared            Shared product copy and text-focused utilities
packages/config            Shared TypeScript configuration
```

Product-wide text constants such as the application name, slogan, metadata
description, and email tagline live in `packages/shared/src/index.ts`. Keep this
package limited to text-focused constants and small, environment-independent
helpers that are useful in more than one workspace.

### apps/web — the product

This is Tablekeep itself. Everything a signed-in user does at the table lives here: campaigns, character sheets, spellbooks, inventory, encounters. It owns the PostgreSQL database, Better Auth, and the tRPC API, and it is the only workspace that reads or writes campaign data.

### apps/docs — the public site

This is the marketing surface: the landing page, product pages, and the user-facing documentation. It is built on Fumadocs with MDX content and renders statically. It has no database, no authentication, no tRPC, and no access to campaign data. It links to the product rather than embedding it.

Do not blur the boundary. Public, unauthenticated content belongs in `apps/docs`; anything that needs a session or a query belongs in `apps/web`. If both applications need the same visual primitive, put it in `packages/ui`.

> Note the naming: `apps/docs` is the deployed public site, while the top-level `docs/` directory holds internal product and contributor documentation that is not published.

The web app uses Next.js 16 Server Components by default. Client-side data access uses tRPC with TanStack Query. PostgreSQL is accessed through Drizzle ORM 0.45. Better Auth 1.6 owns authentication tables and session handling. PartyKit server entry points live under `apps/web/party/`, with project configuration in `apps/web/partykit.json`; run the local real-time server with `pnpm dev:party`. Use `pnpm login:party` to authenticate and `pnpm deploy:party` to deploy. Campaign rooms require short-lived membership tokens signed with `PARTYKIT_SECRET`. The web server uses the same secret to publish revision-only encounter events after committed mutations; clients then refetch authorized tRPC data. Configure the secret in both the web environment and PartyKit with `pnpm --filter web exec partykit env add PARTYKIT_SECRET`. The workspace uses TypeScript 6.0.3, pinned exactly in the pnpm catalog; do not broaden or upgrade that version without an explicit decision.

### M3 character architecture

M3 Player essentials is implemented. Its persistence boundary separates a global, owner-controlled character identity from the playable state of each campaign:

- `characters` holds only global identity fields, ownership, and `deleted_at`. It has no campaign mechanics and no `retired_at`.
- `character_sheets` belongs to one campaign and references the global identity through `char_id`. The player and that campaign's DMs co-manage this single campaign-owned source of truth; do not build a base-sheet/DM-override merge.
- Ancestry, maximum HP, and campaign notes live on the sheet. Multiclass class/subclass levels, plural backgrounds, conditions, inventory, and multiple freely named currencies live in `sheet_classes`, `sheet_backgrounds`, `sheet_conditions`, `sheet_items`, and `sheet_currencies` through `sheet_id`.
- Total level is derived from class rows. Currency is one row per freeform type, not fixed denomination columns or an enum.
- `retired_at` applies to a campaign sheet. Global character removal uses `deleted_at` and must not be described as retirement.
- Current HP is deliberately absent from M3 persistence. M6 owns it as encounter participant/combatant state and may initialize or constrain it using `character_sheets.max_hp`.
- Spellbooks attach to `sheet_id`, so the same global character can have independent spell state in different campaigns. `sheet_spells` holds one row per spell with a `level` and a `prepared` flag; learned and prepared are one table, not two.
- Ability scores are rows in `sheet_stats`, not fixed columns, for the same reason currencies are rows: a table that uses a different spread of abilities still fits. `sheet_feats` and `sheet_npcs` follow the `sheet_backgrounds` shape.
- Alignment, appearance, and the campaign's backstory are sheet columns, because they are one value per sheet. The character's global `bio` stays on `characters` and is shown beside the backstory rather than merged with it.

### Sheet history

`sheet_events` is an append-only record of who changed what on a sheet. Rows are
never updated or deleted, and nothing in the product rewrites them.

Events are written by a middleware on `sheetProcedure`, not by each mutation.
The middleware derives the entity and action from the tRPC path
(`character.sheet.item.create` → `item` / `create`), so a new sheet editor is
recorded without touching the middleware. The segment before the action names
the entity and is matched against a known set, which keeps the derivation
correct whether the path comes from the app router or from a caller created on
the character router alone.

The insert is best-effort and deliberately swallows its own failure: the Neon
HTTP driver has no interactive transactions, so a failed history row must not
report a write that already landed as a failure. History is a record, not a
control. `actor_name` and `actor_role` are stamped at write time because the
actor foreign key nulls out when an account is deleted.

### The campaign sheet page

`/campaigns/[slug]/characters/[sheetId]` is a profile with tabs — Overview,
Lore, Inventory, Spellbook, Changes — and the active tab is mirrored into a
`?tab=` search param with `history.replaceState`.

Only a DM edits from this page, including on a character the viewing player
owns. That is a product decision about what the page is for, not an
authorization boundary: `sheetProcedure` still accepts writes from the sheet's
owner, for the player-facing editing surface that comes later. Do not remove
the owner branch from the router to enforce the page's read-only rendering.

Every section component takes `canEdit` and renders either its editor or a
read-only view built from the primitives in
`components/characters/sheet-readouts.tsx`. Both paths show the same facts in
the same order; only the controls differ.

Use short, contextual Drizzle/SQL names for this domain: `charId`/`char_id`, `sheetId`/`sheet_id`, `maxHp`/`max_hp`, `qty`, `equipped`, `ref`, `sort`, and `updatedBy`/`updated_by`. Keep already-clear foreign keys such as `campaignId`/`campaign_id` and `ownerId`/`owner_id`; do not shorten them to ambiguous initials.

## Local environment

Copy `apps/web/.env.example` to `apps/web/.env` and `apps/docs/.env.example` to `apps/docs/.env`. The product server validates its environment through `apps/web/src/env/server.ts`; the site validates its public environment through `apps/docs/src/env/client.ts`. `apps/docs` runs on port 3001, and `pnpm dev:docs` starts it on its own.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `BETTER_AUTH_SECRET` | Production | Secret used by Better Auth; set it locally as well when testing auth. |
| `PARTYKIT_SECRET` | Realtime/production | At least 32 characters; the same signing secret must be configured for the web app and PartyKit. |
| `NEXT_PUBLIC_DOCS_URL` | No | Public documentation URL used by the product Help link; defaults to `http://localhost:3001/docs`. |
| `NEXT_PUBLIC_PARTYKIT_HOST` | No | PartyKit host used by browser clients; defaults to `localhost:1999` for local development. |
| `DATA_SOURCE` | No | Versioned Open5e reference-data API base URL; defaults to `https://api.open5e.com/v2`. |
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

### Wiki reference data

Public rules-reference procedures live under the `wiki` tRPC namespace. The
server fetches them through a single Open5e V2 adapter and maps upstream
snake-case payloads into Tablekeep-owned camel-case Zod schemas before returning
them. Public TypeScript types are inferred from those schemas, and both mapped
entities and catalog envelopes are parsed so defaults are applied and normalized
schema drift fails at the server boundary. Callers use source-qualified `key`
values, not the indexes from the former 2014 data source.

Each resource exposes two procedures: `catalog`, which takes no input and reads
the whole collection, and `get`, which reads one record by key. Nothing is
scoped upstream — the adapter pages through every entry of a resource and the
catalog envelope carries `items` plus the `sources` those entries came from, so
one entry only needs a `sourceKey`. Entries therefore span every document Open5e
publishes, not just the 2024 SRD, and mappers must tolerate the shape drift
between documents: parent references arrive as objects or bare keys, and fields
like class hit dice or creature speeds can be missing. The current resources are
backgrounds, classes/subclasses, creatures, feats, mundane items, magic items,
rules, species/subspecies, and spells. Standalone skills and conditions are
intentionally absent because Open5e does not expose them as collections.

The authenticated product exposes this data under `/wiki`. A category page
fetches its catalog once and does every filter, search, sort, and grouping in
the browser, so no control costs a round trip and nothing is filtered by
default. Keep it that way: new filters belong in
`apps/web/src/lib/wiki/facets.ts` as facet definitions, and the filter state is
mirrored into the URL with `history.replaceState` so links stay shareable
without re-rendering the route.

Entry artwork is hand-added and optional, because the mapped Open5e schemas do
not carry record images. A file at
`apps/web/public/images/wiki/<category>/<slug>.png` is picked up by the entry
whose name slugifies to `<slug>`; there is no manifest or build step to update.
The slug comes from the entry name rather than its source-qualified key, so one
file serves that entry across every source book. Entries without a file fall
back to a dimmed category plate, so upstream additions never leave a gap. See
`apps/web/public/images/wiki/README.md` for the naming rules and
`apps/web/src/lib/wiki/images.ts` for the resolver.

A record page is laid out as an article beside an infobox. Keep the split the
page is built on: identity belongs in the chips under the title, reference
numbers belong in the infobox, and a fact never appears in both. Anything the
infobox shows is dropped from the body for the same reason — a species lists its
size and speed in the infobox, so those traits are filtered out of its trait
list. Sections come from `sectionsFor`, which also feeds the contents list, so a
new section is added in one place.

Keep raw Open5e schemas and mappers under
`apps/web/src/server/reference-data/open5e/`. Do not call Open5e directly from a
router, component, or browser client. Tests must inject the adapter and use
sanitized fixtures; only optional manual diagnostics may contact the public
service.

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

Campaigns store a bounded RFC 5545 recurrence rule, start instant, and inferred IANA time zone. The schedule form submits the normalized RRULE string directly; it does not ask for a session length or expose a time-zone picker. `campaign_occurrence_overrides` stores only cancellations, reschedules, and added one-off sessions. Expansion uses `rrule` and `luxon`, is horizon/count bounded, preserves wall-clock time across daylight-saving changes, and looks back far enough to include a recent occurrence rescheduled into the future. Replacing or clearing a recurrence removes stale rule-bound overrides while preserving added one-offs.

Campaign profiles use Better Auth's organization `logo` field for the campaign icon and the app-owned `bannerImage` organization field for the cover image. Both are private campaign details accepted during authenticated campaign creation and updated afterward through the DM-only campaign procedure. Uploads are staged through UploadThing before those URLs are attached to the campaign.

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
Open5e-compatible REST fixture service. It uses Chromium to verify only the
essential startup and navigation paths. Before running `pnpm test:e2e` locally,
provide the disposable PostgreSQL database configured in `playwright.config.ts`
and apply the schema with `pnpm --filter web db:push`. Traces, screenshots,
videos, and the HTML report are written to ignored test-output directories when
failures occur.

GitHub Actions runs two checks for every pull request and push to `main`:

- `CI / quality` runs non-writing Biome checks, type checking, coverage tests,
  and production builds.
- `CI / browser` runs in the version-matched official Playwright image, where
  Chromium and its Linux dependencies are already installed, then provisions
  disposable PostgreSQL, applies the schema, and runs the smoke suite.

Both jobs use non-secret fixture values. Coverage and Playwright diagnostics are
uploaded as workflow artifacts for 14 days, including on failed runs.
