import { ThemeProvider } from "next-themes";

import { Toaster } from "@tablekeep/ui/components/sonner";
import { TooltipProvider } from "@tablekeep/ui/components/tooltip";

import { TRPCReactProvider } from "@/trpc/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </TRPCReactProvider>
  );
}
