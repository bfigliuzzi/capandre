"use client";

import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { HeaderProvider } from "./header-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <HeaderProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div id="main" className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HeaderProvider>
  );
}
