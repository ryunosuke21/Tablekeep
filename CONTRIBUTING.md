# Contributing to Tablekeep

Thanks for helping build Tablekeep. The project is early, so clear scope and small, reviewable changes matter as much as the code itself.

## Before you start

1. Read the [product scope](docs/product-scope.md) and the repository guidance in [AGENTS.md](AGENTS.md).
2. Set up the project using the instructions in the [README](README.md).
3. Check existing work before beginning a large feature so product and data-model decisions stay aligned.

## Development workflow

Create a focused branch, make the smallest complete change, and verify it locally.

```bash
pnpm check-types
pnpm check
pnpm build
```

Run the checks affected by your change at minimum. `pnpm check` applies safe formatting and lint fixes, so review the resulting diff.

## Database changes

The Drizzle schema is in `apps/web/src/server/db/schema/`.

1. Update the schema and its relations.
2. Generate a migration with `pnpm db:generate`.
3. Review the generated SQL before applying it.
4. Apply it with `pnpm db:migrate` in environments that use migrations.

`pnpm db:push` changes the configured database directly. Use it for local development only when that is the agreed workflow; do not use it casually against shared or production data.

## Pull requests

Include a short description of the user problem, the behavior changed, and how you verified it. Call out schema changes, authorization decisions, environment variables, or deliberately deferred work. Update the relevant documentation in the same change.

## Product and content boundaries

Keep campaign data private by default, and enforce access control on the server. Do not add copyrighted game rules, commercial stat blocks, or copied compendium text. Prefer original, user-provided, open-licensed, or system-neutral content.
