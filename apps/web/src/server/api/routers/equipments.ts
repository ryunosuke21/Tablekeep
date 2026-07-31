import { gql } from "graphql-request";
import { z } from "zod";

import { parseEntity, parseFoundEntity } from "@/server/api/parse";
import {
  ANY_EQUIPMENT_BASE,
  DAMAGE,
  EQUIPMENT_BASE,
  onEveryEquipmentType,
  REFERENCE,
} from "@/server/api/selections";
import {
  createTRPCRouter,
  paginationMiddleware,
  paginationSchema,
  publicProcedure,
} from "@/server/api/trpc";
import { equipmentListSchema, equipmentSchema } from "@/types/equipments";

/**
 * `equipment(index:)` returns the `AnyEquipment` union, so `__typename` drives
 * both the inline fragments and the discriminated union in `equipmentSchema`.
 *
 * `equipmentCategory` filters on an item's own `equipment_category`, which only
 * ever holds one of five top-level values: `adventuring-gear`, `weapon`, `armor`,
 * `tools`, `mounts-and-vehicles`. Sub-categories such as `shields` or
 * `light-armor` exist as `equipmentCategories` entities but never as an item's
 * category, so passing one here matches nothing rather than erroring. Reach those
 * through the `equipmentCategory(index:)` query instead.
 */
const LIST_FIELDS = `index
        name
        equipment_category ${REFERENCE}
        cost {
            quantity
            unit
        }
        weight`;

const EQUIPMENTS_QUERY = gql`
    query Equipments(
        $skip: Int
        $limit: Int
        $name: String
        $equipment_category: [String!]
    ) {
        equipments(
            skip: $skip
            limit: $limit
            name: $name
            equipment_category: $equipment_category
        ) {
            __typename
            ${onEveryEquipmentType(LIST_FIELDS)}
        }
    }
`;

const EQUIPMENT_QUERY = gql`
    query Equipment($index: String!) {
        equipment(index: $index) {
            __typename
            ... on Armor {
                ${EQUIPMENT_BASE}
                armor_category
                armor_class {
                    base
                    dex_bonus
                    max_bonus
                }
                str_minimum
                stealth_disadvantage
            }
            ... on Weapon {
                ${EQUIPMENT_BASE}
                weapon_category
                weapon_range
                category_range
                damage ${DAMAGE}
                two_handed_damage ${DAMAGE}
                range {
                    normal
                    long
                }
                throw_range {
                    normal
                    long
                }
            }
            ... on Tool {
                ${EQUIPMENT_BASE}
                tool_category
            }
            ... on Gear {
                ${EQUIPMENT_BASE}
            }
            ... on Pack {
                ${EQUIPMENT_BASE}
                contents {
                    quantity
                    item ${ANY_EQUIPMENT_BASE}
                }
            }
            ... on Ammunition {
                ${EQUIPMENT_BASE}
                quantity
            }
            ... on Vehicle {
                ${EQUIPMENT_BASE}
                vehicle_category
                speed {
                    quantity
                    unit
                }
                capacity
            }
        }
    }
`;

export const equipmentsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          equipmentCategory: z.array(z.string()).optional(),
        })
        .extend(paginationSchema.shape)
        .optional(),
    )
    .use(paginationMiddleware)
    .query(async ({ ctx, input }) => {
      const { equipments } = await ctx.graphql.request<{
        equipments: unknown[];
      }>(EQUIPMENTS_QUERY, {
        skip: input?.cursor,
        limit: input?.limit,
        name: input?.name,
        equipment_category: input?.equipmentCategory,
      });

      return parseEntity(equipmentListSchema, equipments, "equipment");
    }),
  get: publicProcedure
    .input(z.object({ index: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { equipment } = await ctx.graphql.request<{ equipment: unknown }>(
        EQUIPMENT_QUERY,
        { index: input.index },
      );

      return parseFoundEntity(equipmentSchema, equipment, "Equipment");
    }),
});
