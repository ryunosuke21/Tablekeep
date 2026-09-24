import { genUploader } from "uploadthing/client";

import type { UserFileRouter } from "@/app/api/uploads/core";

export const uploader = genUploader<UserFileRouter>();
