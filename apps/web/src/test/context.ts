import type { createTRPCContext } from "@/server/api/trpc";

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

export function testContext(
  request: ReturnType<typeof import("vitest").vi.fn>,
  session: TRPCContext["session"] = null,
): TRPCContext {
  return {
    headers: new Headers(),
    db: {},
    open5e: {
      get: request,
      listAll: request,
    },
    session,
  } as unknown as TRPCContext;
}
