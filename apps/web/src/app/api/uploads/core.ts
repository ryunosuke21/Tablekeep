import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/server/better-auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const userRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  user: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async (data) =>
      console.log("Upload complete for userId:", data.metadata.userId),
    ),
  character: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async (data) =>
      console.log("Upload complete for userId:", data.metadata.userId),
    ),
  item: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async (data) =>
      console.log("Upload complete for userId:", data.metadata.userId),
    ),
  campaign: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async (data) =>
      console.log("Upload complete for userId:", data.metadata.userId),
    ),
} satisfies FileRouter;

export type UserFileRouter = typeof userRouter;
