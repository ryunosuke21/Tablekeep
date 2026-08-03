import { organization } from "better-auth/plugins";

import { campaignAccess, campaignRoles } from "./access";

type OrganizationOptions = NonNullable<Parameters<typeof organization>[0]>;

export type CampaignOrganizationOptions = Omit<
  OrganizationOptions,
  "ac" | "roles" | "creatorRole" | "teams" | "dynamicAccessControl"
>;

/**
 * Create the server plugin with Tablekeep's fixed role model.
 *
 * App-owned schema fields, hooks, limits, and email delivery remain options so
 * this package does not depend on the product application's server modules.
 */
export function createCampaignOrganization(
  options: CampaignOrganizationOptions = {},
) {
  const plugin = organization({
    ...options,
    ac: campaignAccess,
    roles: campaignRoles,
    creatorRole: "dm",
    teams: { enabled: false },
    dynamicAccessControl: { enabled: false },
  });

  // OrganizationOptions does not pass migration flags through to the plugin
  // descriptor in Better Auth 1.6.25. Its plugin descriptor uses the singular
  // name, then getAuthTables normalizes it to the plural name. Carry both on
  // the wrapper so either descriptor consumer leaves app-owned tables alone.
  return {
    ...plugin,
    schema: {
      ...plugin.schema,
      organization: {
        ...plugin.schema.organization,
        disableMigration: true,
        disableMigrations: true,
      },
      member: {
        ...plugin.schema.member,
        disableMigration: true,
        disableMigrations: true,
      },
      invitation: {
        ...plugin.schema.invitation,
        disableMigration: true,
        disableMigrations: true,
      },
    },
  };
}
