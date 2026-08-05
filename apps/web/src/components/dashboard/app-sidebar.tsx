"use client";

import {
  IconBackpack,
  IconBandage,
  type IconBook2,
  IconCards,
  IconFlag3,
  IconHelpCircle,
  IconMasksTheater,
  IconPaw,
  IconSparkles,
  IconSword,
  IconUsersGroup,
  IconWallpaper,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAME } from "@tablekeep/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@tablekeep/ui/components/sidebar";
import { TablekeepIcon } from "@tablekeep/ui/icons/tablekeep";

import { env } from "@/env/client";

import { CreateNewDialog } from "./create-new-dialog";
import { FeedbackDialog } from "./feedback-dialog";
import { UserMenu } from "./user-menu";

const personalNavigation = [
  { title: "Campaigns", href: "/campaigns", icon: IconFlag3 },
  { title: "Characters", href: "/characters", icon: IconUsersGroup },
] as const;

const wikiNavigation = [
  { title: "Races", href: "/wiki/races", icon: IconMasksTheater },
  { title: "Backgrounds", href: "/wiki/backgrounds", icon: IconWallpaper },
  { title: "Classes", href: "/wiki/classes", icon: IconSword },
  { title: "Spells", href: "/wiki/spells", icon: IconSparkles },
  { title: "Monsters", href: "/wiki/monsters", icon: IconPaw },
  { title: "Feats", href: "/wiki/feats", icon: IconCards },
  { title: "Items", href: "/wiki/items", icon: IconBackpack },
  { title: "Conditions", href: "/wiki/conditions", icon: IconBandage },
] as const;

function NavigationGroup({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<{
    title: string;
    href: string;
    icon: typeof IconBook2;
  }>;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              isActive={pathname === "/"}
              tooltip={`${APP_NAME} dashboard`}
            >
              <Link href="/">
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <TablekeepIcon className="h-5 w-auto" />
                </span>
                <span className="grid flex-1 text-left leading-none">
                  <span className="font-semibold tracking-[-0.02em]">
                    {APP_NAME}
                  </span>
                  <span className="mt-1 text-[10px] text-sidebar-foreground/55 uppercase tracking-[0.14em]">
                    Campaign companion
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <CreateNewDialog />
        <NavigationGroup label="Personal" items={personalNavigation} />
        <NavigationGroup label="Wiki" items={wikiNavigation} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help">
              <a
                href={env.NEXT_PUBLIC_DOCS_URL}
                target="_blank"
                rel="noreferrer"
              >
                <IconHelpCircle />
                <span>Help</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <FeedbackDialog />
        </SidebarMenu>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
