# Working on Tablekeep

Tablekeep is an in-person tabletop-campaign companion. It should reduce bookkeeping at the table, not attempt to replace the social, physical play experience.

## Read first

- [README.md](README.md) for setup and current project status.
- [docs/product-scope.md](docs/product-scope.md) for intended users, roles, and feature boundaries.
- [docs/development.md](docs/development.md) for architecture and data-change guidance.

## Repository rules

- Use pnpm. Do not introduce another package manager or edit `pnpm-lock.yaml` by hand.
- Keep TypeScript strict and use the `@/` alias within `apps/web`.
- TypeScript is intentionally pinned to 6.0.3 in the workspace catalog and pnpm overrides. Do not upgrade or broaden that version without an explicit project decision.
- Put reusable presentational primitives in `packages/ui`; keep application-specific components in `apps/web`.
- Use the existing stack: Next.js App Router, tRPC for application APIs, Drizzle for persistence, Better Auth for identity and authorization, and Tailwind for styling.
- Run the narrowest relevant checks after changes. Before handoff, run `pnpm check-types` and `pnpm check` when practical.
- `pnpm check` writes safe Biome fixes. Inspect its diff before including it with unrelated work.
- Never add credentials, OAuth secrets, connection strings, or copied `.env` files to the repository. Update `apps/web/.env.example` and `apps/web/src/env/server.ts` together when adding environment variables.

## Data and authorization

- Treat campaign data as private by default. Every query and mutation for campaign-owned data must verify membership and the required role server-side.
- Do not rely on hidden UI controls for authorization.
- Make destructive game actions explicit and confirmable in the interface where appropriate.
- Update the Drizzle schema deliberately. Generate a migration for shared or deployed environments; use `db:push` only when the workflow permits direct schema synchronization.

## Product language

- Distinguish **implemented** features from **planned** features in code comments, PR descriptions, and docs.
- Prefer system-neutral terms when possible (for example, “campaign,” “character,” and “creature”). Avoid copying proprietary game-rule text or commercial compendium content into the repository.
- Preserve the player/DM boundary: players manage their own sheets; DMs manage campaign tools and visibility.

## Documentation

Update relevant documentation with behavior, environment, command, data-model, or product-scope changes. Keep `README.md` user- and contributor-facing; keep detailed guidance in `docs/`.
