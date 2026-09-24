import { createRouteHandler } from "uploadthing/next";
import { userRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: userRouter,
});
