"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  onConfirm: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{itemName}</strong> sera supprime definitivement. Cette
            action est irreversible.
          </AlertDialogDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-2">
          <AlertDialogClose
            render={
              <Button variant="ghost" className="w-full sm:w-auto">
                Annuler
              </Button>
            }
          />
          <AlertDialogClose
            render={
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={onConfirm}
              >
                Supprimer
              </Button>
            }
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
