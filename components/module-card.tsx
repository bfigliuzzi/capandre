"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  variant?: "primary" | "secondary";
}

export function ModuleCard({ href, icon, title, description, variant = "primary" }: ModuleCardProps) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className={cn(
        "flex items-center gap-4 rounded-xl border p-4 transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        variant === "primary"
          ? "hover:border-primary/50"
          : "hover:border-secondary/50"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-14 rounded-xl text-3xl shrink-0",
          variant === "primary" ? "bg-primary/10" : "bg-secondary/10"
        )}
        aria-hidden
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-heading text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
