import { generateReactHelpers } from "@uploadthing/react";

import type { TablekeepFileRouter } from "@/app/api/files/core";

export const { useUploadThing } = generateReactHelpers<TablekeepFileRouter>({
  url: "/api/files",
});
