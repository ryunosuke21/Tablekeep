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
| `BASE_URL` | Yes | Public URL for the app; use `http://localhost:3000` locally. |
| `NEXT_PUBLIC_DOCS_URL` | No | Public documentation URL used by the product Help link; defaults to `http://localhost:3001/docs`. |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `BETTER_AUTH_SECRET` | Production | Secret used by Better Auth; set it locally as well when testing auth. |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error`; defaults to `info`. |

`apps/docs` reads two public variables through T3 Env.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Deployment | Where every "Open Tablekeep" link points; defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_SITE_URL` | Deployment | The site's own public URL, used to resolve Open Graph images; defaults to `http://localhost:3001`. |

The magic-link plugin is configured, but its sender is currently a no-op. Do not describe email sign-in as working until a delivery service is integrated.

## Application conventions

- Add application-specific components under `apps/web/src/components/`.
- Add marketing pages under `apps/docs/src/app/(home)/` and documentation content as MDX under `apps/docs/content/docs/`.
- Add reusable, broadly applicable primitives under `packages/ui/src/components/` and export them through the package’s existing wildcard exports.
- Use `@/` imports within the web app.
- Keep schema files organized by domain under `apps/web/src/server/db/schema/`, and re-export them from `schema/index.ts`.
- Add tRPC routers under `apps/web/src/server/api/routers/`, then compose them in `index.ts`.

## Campaign-data design

When game-domain tables are introduced, model ownership and membership before convenience fields. A typical server-side authorization path is:

```text
authenticated session → campaign membership → campaign role/permission → requested resource
```

Scope every campaign query by the verified campaign and membership. A client-provided user ID, campaign ID, or hidden screen is never authorization.

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
- `CI / browser` provisions disposable PostgreSQL, applies the schema, installs
  Chromium, and runs the smoke suite.

Both jobs use non-secret fixture values. Coverage and Playwright diagnostics are
uploaded as workflow artifacts for 14 days, including on failed runs.
