# Tablekeep

Tablekeep is a tabletop companion for in-person Dungeons & Dragons campaigns. It is designed to keep the information a group reaches for at the table—characters, spells, inventory, encounters, and rolls—in one shared, practical place without replacing the physical game.

> **Project status:** Tablekeep is in its foundation phase. The repository currently contains the web application, authentication, database integration, the shared UI system, and the marketing/documentation site. The game-facing features below describe the intended product, not functionality that is already available.

## The two applications

Tablekeep ships as two separate Next.js applications:

| Application | Workspace | Purpose |
| --- | --- | --- |
| Product | `apps/web` | The Tablekeep application itself: sign-in, campaigns, character sheets, encounters, and every authenticated, data-backed feature. |
| Site | `apps/docs` | The public-facing marketing site, landing page, and product documentation. |

`apps/web` owns the database, authentication, and tRPC API. `apps/docs` is a static, content-driven site (Fumadocs + MDX) with no database access, no authentication, and no campaign data. Keep that boundary intact: product features belong in `apps/web`, and public marketing or documentation content belongs in `apps/docs`.

## Product direction

### For players

- Character sheets, including current and maximum hit points.
- Spell books and prepared-spell tracking.
- Inventory, equipment, currency, and item notes.
- A place to make campaign-relevant rolls when the table wants a digital roll.

### For Dungeon Masters

- Campaign and party management.
- Encounter tools, including initiative tracking and hit-point management.
- Monster reference and encounter preparation.
- Shop creation and inventory management for in-world vendors.

See [the product scope](docs/product-scope.md) for the principles, roles, and planned feature areas.
The implementation sequence and closed-beta release boundary are defined in
[the product roadmap](docs/roadmap.md).

## Technology

Tablekeep is a pnpm/Turborepo monorepo built with:

- Next.js 16 and React 19
- TypeScript 6.0.3 (pinned) and Tailwind CSS 4
- PostgreSQL and Drizzle ORM 0.45
- Better Auth 1.6 (Google OAuth, admin roles, and multi-session support)
- tRPC and TanStack Query
- Biome 2.5 for formatting and linting

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm 11 (the repository declares the exact package-manager version)
- A running PostgreSQL database
- Google OAuth credentials; they are currently required by the server environment schema

### Set up the app

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/docs/.env.example apps/docs/.env
```

Set `DATABASE_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `apps/web/.env`. Set `BETTER_AUTH_SECRET` before deploying. Keep credentials out of version control.

Apply the current schema, then start the web app:

```bash
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm dev` starts both applications: the product on port 3000 and the site on [http://localhost:3001](http://localhost:3001). Use `pnpm dev:web` or `pnpm dev:docs` to run just one. The site needs no database and uses local URLs by default; set `NEXT_PUBLIC_APP_URL` when the product lives elsewhere.

For a more detailed guide to the repository and data changes, see [docs/development.md](docs/development.md).

## Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run all development tasks through Turborepo. |
| `pnpm dev:web` | Run only the product app (`apps/web`). |
| `pnpm dev:docs` | Run only the marketing and documentation site (`apps/docs`). |
| `pnpm build` | Build all workspaces. |
| `pnpm check-types` | Type-check all workspaces. |
| `pnpm check` | Format and lint the repository with Biome (writes safe fixes). |
| `pnpm db:push` | Push the Drizzle schema to the configured database. |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes. |
| `pnpm db:migrate` | Apply generated Drizzle migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |

## Repository layout

```text
apps/web/                 The product: Next.js app routes, server code, and Drizzle schema
apps/docs/                The public site: marketing, landing page, and product documentation
packages/ui/              Shared UI primitives, styles, and utilities
packages/config/          Shared TypeScript configuration
docs/                     Internal product and contributor documentation
AGENTS.md                 Instructions for coding agents
CLAUDE.md                 Claude-specific entry point for the same workflow
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. It covers the development workflow, checks, and expectations for schema and documentation changes.

## License

No license has been selected yet. Do not assume the repository is available for reuse or redistribution until a license is added.

Tablekeep is an independent project and is not affiliated with or endorsed by Wizards of the Coast. “Dungeons & Dragons” is used descriptively.
