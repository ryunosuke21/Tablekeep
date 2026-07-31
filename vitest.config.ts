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
        "apps/web/src/server/api/parse.ts",
        "apps/web/src/server/api/selections.ts",
        "apps/web/src/server/api/data-source.ts",
        "apps/web/src/server/api/trpc.ts",
        "apps/web/src/server/api/routers/index.ts",
        "apps/web/src/server/api/routers/skills.ts",
        "apps/web/src/server/api/routers/classes.ts",
        "apps/web/src/server/api/routers/spells.ts",
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
