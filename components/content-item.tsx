"use client";

import Link from "next/link";
import { ChevronRight, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentItemProps {
  href: string;
  icon: LucideIcon;
  title: string;
  meta: string;
  variant?: "primary" | "secondary";
  editHref?: string;
  onDelete?: () => void;
}

export function ContentItem({
  href,
  icon: Icon,
  title,
  meta,
  variant = "primary",
  editHref,
  onDelete,
}: ContentItemProps) {
  const hasActions = editHref || onDelete;

  const content = (
    <>
      <div
        className={cn(
          "flex items-center justify-center size-11 rounded-lg shrink-0",
          variant === "primary" ? "bg-primary/10" : "bg-secondary/10"
        )}
        aria-hidden
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold truncate">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{meta}</p>
      </div>
    </>
  );

  if (!hasActions) {
    return (
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="flex items-center gap-5 rounded-xl border border-border px-6 py-4 transition-[box-shadow,border-color] hover:shadow-sm hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {content}
        <ChevronRight className="size-5 text-muted-foreground shrink-0" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border px-6 py-4 transition-[box-shadow,border-color] hover:shadow-sm hover:border-primary/50">
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="flex items-center gap-5 flex-1 min-w-0 transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none rounded"
      >
        {content}
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {editHref && (
          <Link
            href={editHref}
            transitionTypes={["nav-forward"]}
            className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Modifier ${title}`}
          >
            <Pencil className="size-[18px]" />
          </Link>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Supprimer ${title}`}
          >
            <Trash2 className="size-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
}
