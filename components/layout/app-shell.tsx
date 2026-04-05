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
          <div id="main" tabIndex={-1} className="flex-1 px-6 py-6 md:px-8 md:py-8 max-w-[800px] mx-auto w-full outline-none">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HeaderProvider>
  );
}
