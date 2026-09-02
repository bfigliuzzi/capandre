interface TablesLoaderProps {
  label?: string;
}

/** Spinner de chargement — reprend le markup de app/(app)/dictee/page.tsx. */
export function TablesLoader({ label = "Chargement en cours" }: TablesLoaderProps) {
  return (
    <div className="flex justify-center py-12" role="status" aria-label={label}>
      <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}…</span>
    </div>
  );
}
