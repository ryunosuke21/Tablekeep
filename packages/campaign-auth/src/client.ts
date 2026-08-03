import { organizationClient } from "better-auth/client/plugins";

import { campaignAccess, campaignRoles } from "./access";

/** Browser plugin configured with the same static access model as the server. */
export const campaignOrganizationClient = organizationClient({
  ac: campaignAccess,
  roles: campaignRoles,
  teams: { enabled: false },
  dynamicAccessControl: { enabled: false },
});
