"use client";

import { AlertTriangle } from "lucide-react";

export function UnsavedChangesBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2 bg-warning px-4 py-3 text-sm font-medium text-foreground animate-in slide-in-from-bottom duration-200">
      <AlertTriangle className="size-4 shrink-0" />
      Modifications non enregistrees
    </div>
  );
}
