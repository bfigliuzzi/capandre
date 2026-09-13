"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "primary" | "secondary" | "tertiary";
}

export function ModuleCard({ href, icon: Icon, title, description, variant = "primary" }: ModuleCardProps) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className={cn(
        "flex items-center gap-5 rounded-xl border-2 border-border p-5 shadow-sm transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        variant === "primary" && "hover:border-primary/50",
        variant === "secondary" && "hover:border-secondary/50",
        variant === "tertiary" && "hover:border-info/50"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-16 rounded-xl shrink-0",
          variant === "primary" && "bg-primary/10",
          variant === "secondary" && "bg-secondary/10",
          variant === "tertiary" && "bg-info/10"
        )}
        aria-hidden
      >
        <Icon className="size-8" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-heading text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground leading-normal">{description}</p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
