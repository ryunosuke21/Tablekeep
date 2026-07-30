# Tablekeep site

This workspace is Tablekeep's **public-facing site**: the marketing pages, the landing page, and the product documentation. It is the surface people see before they sign in.

It is not the application. The Tablekeep product — campaigns, character sheets, encounters, and everything behind authentication — lives in [`apps/web`](../web). This site has no database, no authentication, no tRPC, and no access to campaign data; it renders static MDX content and links out to the product.

Built with Next.js 16 and [Fumadocs](https://fumadocs.dev).

## Run it

From the repository root:

```bash
pnpm dev:docs
```

No database or environment configuration is required for local development.
Copy `.env.example` to `.env` when you need to point the site at a different
Tablekeep application.

## Layout

| Path | Contents |
| --- | --- |
| `src/app/(home)/` | Landing page and other marketing routes. |
| `src/app/docs/` | Documentation layout and pages. |
| `content/docs/` | Documentation content as MDX. |
| `src/lib/source.ts` | Fumadocs content source adapter. |
| `src/lib/layout.shared.tsx` | Shared layout options. |
| `src/app/api/search/route.ts` | Search route handler. |

`source.config.ts` holds the Fumadocs MDX configuration, including the frontmatter schema.

## Writing content

Add documentation pages as MDX files under `content/docs/`. Add marketing pages as routes under `src/app/(home)/`. Reusable presentational primitives shared with the product belong in `packages/ui`, not here.

Internal contributor and product documentation is separate: it lives in the repository's top-level `docs/` directory and is not published by this site.
