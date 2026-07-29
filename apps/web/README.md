# Tablekeep web app

This workspace contains Tablekeep’s Next.js 16 application: App Router pages, API route handlers, tRPC routers, Better Auth configuration, and Drizzle schema. It uses the repository-wide pinned TypeScript 6.0.3 version.

Run it from the repository root:

```bash
pnpm dev:web
```

Copy `.env.example` to `.env` and provide the required PostgreSQL and Google OAuth values first. See the root [README](../../README.md) for setup and [docs/development.md](../../docs/development.md) for architecture, environment variables, and database guidance.
