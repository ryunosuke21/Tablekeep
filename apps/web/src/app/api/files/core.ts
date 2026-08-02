import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { MAX_FILE_SIZE } from "@/lib/constants";
import { getSession } from "@/server/better-auth/server";

const file = createUploadthing();

export const fileRouter = {
  imageUploader: file({
    image: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await getSession();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.debug("Upload complete for user", metadata.userId);
      console.debug("File url", file.ufsUrl);

      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type TablekeepFileRouter = typeof fileRouter;
