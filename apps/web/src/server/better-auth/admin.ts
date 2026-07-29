import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

export const statements = {
  ...defaultStatements,
  characters: ["list", "update", "delete", "create"],
  campaigns: ["list", "update", "delete", "create"],
} as const;

export const access = createAccessControl(statements);

const admin = access.newRole({
  ...adminAc.statements,
});

const user = access.newRole({
  ...userAc.statements,
});

export const roles = {
  admin,
  user,
};
