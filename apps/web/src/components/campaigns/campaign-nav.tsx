"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@tablekeep/ui/lib/utils";

export function CampaignNav({ slug, isDm }: { slug: string; isDm: boolean }) {
  const pathname = usePathname();
  const base = `/campaigns/${slug}`;
  const items = [
    { href: base, label: "Overview" },
    { href: `${base}/members`, label: "Members" },
    // Settings is DM-only in the interface; the server enforces it as well.
    ...(isDm ? [{ href: `${base}/settings`, label: "Settings" }] : []),
  ];

  return (
    <nav aria-label="Campaign sections" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 px-1">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center border-b-2 px-3 py-2 text-sm transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  isActive
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
