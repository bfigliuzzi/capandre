"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentItemProps {
  href: string;
  icon: string;
  title: string;
  meta: string;
  variant?: "primary" | "secondary";
}

export function ContentItem({ href, icon, title, meta, variant = "primary" }: ContentItemProps) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div
        className={cn(
          "flex items-center justify-center size-10 rounded-lg text-lg shrink-0",
          variant === "primary" ? "bg-primary/10" : "bg-secondary/10"
        )}
        aria-hidden
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
