import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { APP_NAME } from "@tablekeep/shared";
import { TablekeepIcon } from "@tablekeep/ui/icons/tablekeep";

import { appUrl, docsRoute, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2">
          <TablekeepIcon className="h-[22px] w-[15px] text-foreground" />
          <span className="font-medium tracking-tight">{APP_NAME}</span>
        </span>
      ),
    },
    links: [
      {
        text: "Docs",
        url: docsRoute,
      },
      {
        text: `Open ${APP_NAME}`,
        url: appUrl,
        external: true,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
