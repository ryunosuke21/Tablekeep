import { afterEach, vi } from "vitest";

process.env.VERCEL_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET =
  "tablekeep-test-secret-at-least-thirty-two-characters";
process.env.GOOGLE_CLIENT_ID = "tablekeep-test-client";
process.env.GOOGLE_CLIENT_SECRET = "tablekeep-test-client-secret";
process.env.DATABASE_URL =
  "postgresql://tablekeep:tablekeep@127.0.0.1:5432/tablekeep_test";
process.env.DATA_SOURCE = "http://127.0.0.1:4100";
process.env.NODE_ENV = "test";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
