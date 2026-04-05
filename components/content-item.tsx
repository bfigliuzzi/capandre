"use client";

import Link from "next/link";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentItemProps {
  href: string;
  icon: string;
  title: string;
  meta: string;
  variant?: "primary" | "secondary";
  editHref?: string;
  onDelete?: () => void;
}

export function ContentItem({
  href,
  icon,
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
    </>
  );

  if (!hasActions) {
    return (
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {content}
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="flex items-center gap-3 flex-1 min-w-0 transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none rounded"
      >
        {content}
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {editHref && (
          <Link
            href={editHref}
            transitionTypes={["nav-forward"]}
            className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Modifier ${title}`}
          >
            <Pencil className="size-4" />
          </Link>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Supprimer ${title}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
