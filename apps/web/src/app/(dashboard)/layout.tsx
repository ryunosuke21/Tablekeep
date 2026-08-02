import type { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@tablekeep/ui/components/sidebar";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { getSession } from "@/server/better-auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (!session.user.name?.trim()) {
    redirect("/new-profile");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="tk-dashboard-canvas min-h-svh overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-3 h-4 w-px bg-border" aria-hidden="true" />
          <span className="ml-3 text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
            Dashboard
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
