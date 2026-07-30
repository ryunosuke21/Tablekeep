"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tablekeep/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tablekeep/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@tablekeep/ui/components/sidebar";
import { toast } from "@tablekeep/ui/components/sonner";
import {
  IconCheck,
  IconChevronUp,
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { authClient } from "@/server/better-auth/client";

const previewUser = {
  name: "Mara Voss",
  email: "Preview adventurer",
  image: null,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const { isMobile } = useSidebar();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const user = session?.user ?? previewUser;
  const hasSession = Boolean(session?.user);

  async function signOut() {
    const result = await authClient.signOut();

    if (result.error) {
      toast.error("Could not sign out", {
        description: result.error.message,
      });
      return;
    }

    toast.success("Signed out");
    router.refresh();
  }

  const themeItems = [
    { value: "light", label: "Light", icon: IconSun },
    { value: "dark", label: "Dark", icon: IconMoon },
    { value: "system", label: "System", icon: IconDeviceDesktop },
  ] as const;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar size="sm">
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-sidebar-foreground/60 text-xs">
                  {user.email}
                </span>
              </div>
              <IconChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
            className="w-60"
          >
            <DropdownMenuLabel className="py-2">
              <span className="block truncate text-foreground">
                {user.name}
              </span>
              <span className="block truncate font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <IconSettings />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            {themeItems.map((item) => {
              const ThemeIcon = item.icon;

              return (
                <DropdownMenuItem
                  key={item.value}
                  onSelect={() => setTheme(item.value)}
                >
                  <ThemeIcon />
                  {item.label}
                  {theme === item.value ? (
                    <IconCheck className="ml-auto" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!hasSession}
              onSelect={() => void signOut()}
            >
              <IconLogout />
              {hasSession ? "Sign out" : "Sign out unavailable in preview"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
