# Development guide

## Architecture

Tablekeep is a pnpm workspace managed by Turborepo.

```text
apps/web
  src/app/                 Next.js App Router pages and route handlers
  src/server/api/          tRPC routers and procedures
  src/server/better-auth/  Authentication and authorization configuration
  src/server/db/           Drizzle client and PostgreSQL schema
  src/env/                 Validated server and client environment variables
packages/ui
  src/components/          Reusable UI primitives
  src/styles/              Shared CSS and design tokens
packages/config            Shared TypeScript configuration
```

The web app uses Next.js 16 Server Components by default. Client-side data access uses tRPC with TanStack Query. PostgreSQL is accessed through Drizzle ORM 0.45. Better Auth 1.6 owns authentication tables and session handling. The workspace uses TypeScript 6.0.3, pinned exactly in the pnpm catalog; do not broaden or upgrade that version without an explicit decision.

## Local environment

Copy `apps/web/.env.example` to `apps/web/.env`. The server validates its environment through `apps/web/src/env/server.ts`.

| Variable | Required | Description |
| --- | --- | --- |
| `BASE_URL` | Yes | Public URL for the app; use `http://localhost:3000` locally. |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `BETTER_AUTH_SECRET` | Production | Secret used by Better Auth; set it locally as well when testing auth. |
| `LOG_LEVEL` | No | `debug`, `info`, `warn`, or `error`; defaults to `info`. |

The magic-link plugin is configured, but its sender is currently a no-op. Do not describe email sign-in as working until a delivery service is integrated.

## Application conventions

- Add application-specific components under `apps/web/src/components/`.
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
pnpm check-types
pnpm check
pnpm build
```

For UI work, also exercise the affected route manually. For authorization or data work, verify both an allowed case and a denied case.
