"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/db";
import { cn } from "@/lib/utils";

interface SoundToggleProps {
  className?: string;
}

/** Bascule des sons de l'exercice, persistée dans les réglages de l'appareil. */
export function SoundToggle({ className }: SoundToggleProps) {
  const { settings, setSoundEnabled } = useSettings();
  const enabled = settings.soundEnabled;

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={enabled}
      aria-label={enabled ? "Couper les sons" : "Activer les sons"}
      onClick={() => setSoundEnabled(!enabled)}
      className={cn("gap-2", className)}
    >
      {enabled ? <Volume2 className="size-5" aria-hidden="true" /> : <VolumeX className="size-5" aria-hidden="true" />}
      Sons
    </Button>
  );
}
