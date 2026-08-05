import { vi } from "vitest";

/**
 * A stand-in for the tRPC React client in component tests. Procedures are
 * resolved lazily by path, so a test only sets up the calls it cares about and
 * every other hook still returns a quiet, non-pending stub.
 */
export type MutationStub = {
  path: string;
  mutate: ReturnType<typeof vi.fn>;
  mutateAsync: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isSuccess: boolean;
  error: { message: string } | null;
};

export type TrpcMock = {
  api: unknown;
  mutation: (path: string) => MutationStub;
  setQueryData: (path: string, data: unknown) => void;
  invalidate: ReturnType<typeof vi.fn>;
};

export function createTrpcMock(): TrpcMock {
  const mutations = new Map<string, MutationStub>();
  const queryData = new Map<string, unknown>();
  const invalidate = vi.fn();

  function mutation(path: string): MutationStub {
    const existing = mutations.get(path);
    if (existing) return existing;
    const created: MutationStub = {
      path,
      mutate: vi.fn(),
      mutateAsync: vi.fn(async () => undefined),
      isPending: false,
      isSuccess: false,
      error: null,
    };
    mutations.set(path, created);
    return created;
  }

  function utilsProxy(path: string[]): unknown {
    return new Proxy(() => undefined, {
      get(_target, property) {
        if (typeof property !== "string") return undefined;
        if (property === "invalidate" || property === "refetch") {
          return (...args: unknown[]) => invalidate(path.join("."), ...args);
        }
        return utilsProxy([...path, property]);
      },
    });
  }

  function apiProxy(path: string[]): unknown {
    return new Proxy(() => undefined, {
      get(_target, property) {
        if (typeof property !== "string") return undefined;

        if (property === "useUtils") return () => utilsProxy([]);

        if (property === "useMutation") {
          return () => mutation(path.join("."));
        }

        if (property === "useQuery") {
          return (_input: unknown, options?: { initialData?: unknown }) => {
            const key = path.join(".");
            const data = queryData.has(key)
              ? queryData.get(key)
              : options?.initialData;
            return {
              data,
              isPending: false,
              isLoading: false,
              isSuccess: data !== undefined,
              isError: false,
              error: null,
            };
          };
        }

        return apiProxy([...path, property]);
      },
    });
  }

  return {
    api: apiProxy([]),
    mutation,
    setQueryData: (path, data) => queryData.set(path, data),
    invalidate,
  };
}
