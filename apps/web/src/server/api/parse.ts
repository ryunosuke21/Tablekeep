import { TRPCError } from "@trpc/server";
import type { output, ZodType } from "zod";

/**
 * Validate a GraphQL payload. A mismatch means the query and the schema have
 * drifted apart, which is our bug rather than the caller's — hence a 500.
 */
export function parseEntity<TSchema extends ZodType>(
  schema: TSchema,
  data: unknown,
  entity: string,
): output<TSchema> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Invalid ${entity} data`,
      cause: result.error,
    });
  }

  return result.data;
}

/**
 * As {@link parseEntity}, but for singular lookups: the API returns `null` for an
 * unknown index, which is a 404 rather than a validation failure.
 */
export function parseFoundEntity<TSchema extends ZodType>(
  schema: TSchema,
  data: unknown,
  entity: string,
): output<TSchema> {
  if (data === null || data === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${entity} not found`,
    });
  }

  return parseEntity(schema, data, entity);
}
