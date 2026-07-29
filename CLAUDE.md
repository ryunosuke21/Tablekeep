# Tablekeep: Claude guide

Follow [AGENTS.md](AGENTS.md) as the authoritative repository guide. This file provides a short entry point for Claude-based workflows.

## Context

Tablekeep is a planned companion for in-person tabletop RPG campaigns. The repository currently supplies a Next.js 16 foundation with React 19, TypeScript 6.0.3 (pinned), Better Auth, PostgreSQL/Drizzle, tRPC, and shared UI components; character, campaign, inventory, spell, shop, and encounter tools are planned work.

## Commands

```bash
pnpm dev
pnpm dev:web
pnpm check-types
pnpm check
pnpm db:generate
pnpm db:migrate
```

Use `pnpm db:push` only when direct synchronization of the configured database is appropriate.

## Guardrails

- Use pnpm and preserve workspace boundaries.
- Keep UI primitives in `packages/ui` and product-specific work in `apps/web`.
- Enforce campaign membership and roles on the server for all campaign data.
- Do not commit secrets. Keep the environment schema and `.env.example` synchronized.
- Update the docs when changing behavior or product scope.

See [docs/development.md](docs/development.md) and [docs/product-scope.md](docs/product-scope.md) for detail.
