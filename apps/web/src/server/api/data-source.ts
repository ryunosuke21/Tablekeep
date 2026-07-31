import { TRPCError } from "@trpc/server";
import type { output, ZodType } from "zod";

import { env } from "@/env/server";

type FetchOptions = Omit<RequestInit, "method">;

export async function dndApi<TSchema extends ZodType>(
  path: string,
  options: FetchOptions & { schema: TSchema },
): Promise<output<TSchema>>;
export async function dndApi(
  path: string,
  options?: FetchOptions & { schema?: undefined },
): Promise<unknown>;
export async function dndApi(
  path: string,
  options: FetchOptions & { schema?: ZodType } = {},
): Promise<unknown> {
  const { schema, ...init } = options;

  const headers = new Headers();
  headers.append("Accept", "application/json");

  const response = await fetch(`${env.DATA_SOURCE}/api/2014${path}`, {
    ...init,
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to fetch ${path}: ${response.statusText}`,
      cause: response.body,
    });
  }

  const data: unknown = await response.json();

  if (schema) {
    return schema.parse(data);
  }

  return data;
}
