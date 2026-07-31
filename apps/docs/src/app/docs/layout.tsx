import type { CSSProperties } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      containerProps={{
        style: { "--fd-layout-width": "100%" } as CSSProperties,
      }}
    >
      {children}
    </DocsLayout>
  );
}
