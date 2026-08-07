import { TRPCError } from "@trpc/server";
import type { output, ZodType } from "zod";
import { z } from "zod";

import { env } from "@/env/server";

/** Upstream page size for whole-catalog reads. Keeps each cached response well under Next's data-cache entry limit. */
const CATALOG_PAGE_SIZE = 1000;

/** Safety stop so an upstream paging bug cannot loop forever. */
const CATALOG_PAGE_LIMIT = 12;

type QueryValue = boolean | number | string | undefined;
export type Open5eQuery = Record<string, QueryValue>;

export interface Open5ePage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Open5eClient {
  /** Reads every entry of a resource. Filtering happens in the browser, so the wiki never scopes this read. */
  listAll<TSchema extends ZodType>(
    resource: string,
    schema: TSchema,
    query?: Open5eQuery,
  ): Promise<output<TSchema>[]>;
  get<TSchema extends ZodType>(
    resource: string,
    key: string,
    schema: TSchema,
  ): Promise<output<TSchema>>;
}

const pageSchema = <TSchema extends ZodType>(schema: TSchema) =>
  z.object({
    count: z.number().int().nonnegative(),
    next: z.url().nullable(),
    previous: z.url().nullable(),
    results: z.array(schema),
  });

function upstreamError(status: number, resource: string) {
  if (status === 404) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: `${resource} not found`,
    });
  }

  if (status === 429) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "The reference-data service is rate limited",
    });
  }

  return new TRPCError({
    code: "BAD_GATEWAY",
    message: "The reference-data service returned an error",
  });
}

export class Open5eHttpClient implements Open5eClient {
  readonly #baseUrl: URL;
  readonly #fetch: typeof fetch;

  constructor(baseUrl: string, fetchImplementation: typeof fetch = fetch) {
    this.#baseUrl = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    this.#fetch = fetchImplementation;
  }

  async listAll<TSchema extends ZodType>(
    resource: string,
    schema: TSchema,
    query: Open5eQuery = {},
  ): Promise<output<TSchema>[]> {
    const results: output<TSchema>[] = [];

    for (let page = 1; page <= CATALOG_PAGE_LIMIT; page += 1) {
      const response = await this.#request(resource, pageSchema(schema), {
        ...query,
        page,
        limit: CATALOG_PAGE_SIZE,
      });
      results.push(...response.results);
      if (response.next === null) break;
    }

    return results;
  }

  async get<TSchema extends ZodType>(
    resource: string,
    key: string,
    schema: TSchema,
  ): Promise<output<TSchema>> {
    return this.#request(`${resource}/${encodeURIComponent(key)}`, schema, {});
  }

  async #request<TSchema extends ZodType>(
    path: string,
    schema: TSchema,
    query: Open5eQuery,
  ): Promise<output<TSchema>> {
    const url = new URL(`${path.replace(/^\/+|\/+$/g, "")}/`, this.#baseUrl);

    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(name, String(value));
      }
    }

    let response: Response;
    try {
      response = await this.#fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 86_400 },
        signal: AbortSignal.timeout(8_000),
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "TimeoutError") {
        throw new TRPCError({
          code: "TIMEOUT",
          message: "The reference-data service timed out",
          cause,
        });
      }

      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "The reference-data service could not be reached",
        cause,
      });
    }

    if (!response.ok) {
      throw upstreamError(response.status, path);
    }

    try {
      const data: unknown = await response.json();
      return schema.parse(data);
    } catch (cause) {
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "The reference-data service returned invalid data",
        cause,
      });
    }
  }
}

export const open5eClient: Open5eClient = new Open5eHttpClient(env.DATA_SOURCE);
