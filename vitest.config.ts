import { defineConfig } from "vitest/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const fromRoot = (...parts: string[]) => path.join(rootDir, ...parts);

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: fromRoot("coverage"),
      reporter: ["text", "json-summary", "lcov", "html"],
      include: [
        "apps/web/src/server/api/trpc.ts",
        "apps/web/src/server/api/routers/index.ts",
        "apps/web/src/server/api/routers/wiki/*.ts",
        "apps/web/src/server/reference-data/open5e/*.ts",
        "apps/web/src/server/api/routers/campaign/*.ts",
        "apps/web/src/server/domain/campaign/*.ts",
        "apps/web/src/lib/redirect-destination.ts",
        "apps/web/src/lib/profile-redirect.ts",
        "apps/web/src/lib/validation/campaign.ts",
        "packages/campaign-auth/src/access.ts",
        "packages/campaign-auth/src/server.ts",
        "packages/emails/src/emails/campaign-invite.tsx",
        "apps/docs/src/components/marketing/hero.tsx",
        "apps/docs/src/components/marketing/where-it-stands.tsx",
        "packages/ui/src/components/button.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/src/test/**",
        "**/.next/**",
        "**/.source/**",
      ],
      thresholds: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    projects: [
      {
        test: {
          name: "campaign-auth-node",
          root: fromRoot("packages/campaign-auth"),
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: {
            "@": fromRoot("apps/web/src"),
            "@tablekeep/ui": fromRoot("packages/ui/src"),
          },
        },
        test: {
          name: "web-node",
          root: fromRoot("apps/web"),
          environment: "node",
          include: ["src/**/*.test.ts"],
          setupFiles: [fromRoot("vitest.web.setup.ts")],
        },
      },
      {
        test: {
          name: "emails-node",
          root: fromRoot("packages/emails"),
          environment: "node",
          include: ["src/**/*.test.tsx"],
        },
      },
      {
        resolve: {
          alias: {
            "@": fromRoot("apps/web/src"),
            "@tablekeep/ui": fromRoot("packages/ui/src"),
          },
        },
        test: {
          name: "web-jsdom",
          root: fromRoot("apps/web"),
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: [
            fromRoot("vitest.web.setup.ts"),
            fromRoot("vitest.dom.setup.ts"),
          ],
        },
      },
      {
        resolve: {
          alias: {
            "@": fromRoot("apps/docs/src"),
            "@tablekeep/ui": fromRoot("packages/ui/src"),
          },
        },
        test: {
          name: "docs-dom",
          root: fromRoot("apps/docs"),
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: [fromRoot("vitest.dom.setup.ts")],
        },
      },
      {
        resolve: {
          alias: {
            "@tablekeep/ui": fromRoot("packages/ui/src"),
          },
        },
        test: {
          name: "ui-dom",
          root: fromRoot("packages/ui"),
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: [fromRoot("vitest.dom.setup.ts")],
        },
      },
    ],
  },
});
