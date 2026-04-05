"use client";

export function UnsavedChangesBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2.5 bg-[#FEF3C7] border-t-2 border-[#F59E0B] px-6 py-3 text-sm font-semibold text-[#92400E] shadow-lg animate-in slide-in-from-bottom duration-200 md:left-[16rem]"
    >
      <span className="shrink-0 text-lg leading-none" aria-hidden="true">⚠️</span>
      Modifications non enregistrées
    </div>
  );
}
