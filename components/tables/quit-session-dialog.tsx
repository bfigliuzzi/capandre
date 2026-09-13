"use client";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuitSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Confirmation avant de quitter. Base UI gère le piège de focus, `Escape` et
 * la restitution du focus ; le minuteur de la session est mis en pause tant
 * que la modale est ouverte.
 */
export function QuitSessionDialog({ open, onOpenChange, onConfirm }: QuitSessionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex flex-col items-center gap-3 text-center">
          <CircleHelp className="size-10 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          <AlertDialogTitle>Arrêter l&apos;exercice ?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta partie ne sera pas enregistrée. Tu pourras recommencer quand tu veux.
          </AlertDialogDescription>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <AlertDialogClose
            render={
              <Button variant="ghost" className="w-full sm:w-auto">
                Continuer à jouer
              </Button>
            }
          />
          <AlertDialogClose
            render={
              <Button variant="secondary" className="w-full sm:w-auto" onClick={onConfirm}>
                Arrêter
              </Button>
            }
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
