import { TablekeepIcon } from "@tablekeep/ui/icons/tablekeep";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, appUrl, docsRoute, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2">
          <TablekeepIcon className="h-[22px] w-[15px] text-foreground" />
          <span className="font-medium tracking-tight">{appName}</span>
        </span>
      ),
    },
    links: [
      {
        text: "Docs",
        url: docsRoute,
      },
      {
        text: "Open Tablekeep",
        url: appUrl,
        external: true,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
