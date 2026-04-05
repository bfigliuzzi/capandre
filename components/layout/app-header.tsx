"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useHeader } from "./header-context";

export function AppHeader() {
  const { title, backHref } = useHeader();

  if (!title && !backHref) return null;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 min-h-14" style={{ viewTransitionName: "site-header" }}>
      <SidebarTrigger className="md:hidden" />

      {backHref && (
        <Link
          href={backHref}
          transitionTypes={["nav-back"]}
          className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Link>
      )}

      <h1 className="font-heading text-lg font-bold flex-1">
        {title}
      </h1>
    </header>
  );
}
