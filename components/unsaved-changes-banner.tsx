"use client";

import { TriangleAlert } from "lucide-react";

export function UnsavedChangesBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      role="status"
      className="callout-warning fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2.5 border-t-2 px-6 py-3 text-sm font-semibold shadow-lg animate-in slide-in-from-bottom duration-200 md:left-[16rem]"
    >
      <TriangleAlert className="shrink-0 size-5" strokeWidth={2} aria-hidden="true" />
      Modifications non enregistrées
    </div>
  );
}
