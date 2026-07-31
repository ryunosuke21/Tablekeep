import { GraphQLClient } from "graphql-request";

import { env } from "@/env/server";

export const graphqlClient = new GraphQLClient(`${env.DATA_SOURCE}/graphql`);
