interface ExercisePlaceholderProps {
  icon: string;
  title: string;
  message: string;
}

export function ExercisePlaceholder({ icon, title, message }: ExercisePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 min-h-[300px] text-center">
      <span className="text-5xl opacity-50" aria-hidden>{icon}</span>
      <h2 className="font-heading text-xl font-bold text-muted-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}
