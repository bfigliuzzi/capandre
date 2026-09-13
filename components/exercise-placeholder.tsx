import type { LucideIcon } from "lucide-react";

interface ExercisePlaceholderProps {
  icon: LucideIcon;
  title: string;
  message: string;
}

export function ExercisePlaceholder({ icon: Icon, title, message }: ExercisePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 min-h-[300px] text-center">
      <Icon className="size-12 opacity-50" strokeWidth={1.5} aria-hidden />
      <h2 className="font-heading text-xl font-bold text-muted-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}
