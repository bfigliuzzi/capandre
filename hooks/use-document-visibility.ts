"use client";

import { useEffect, useState } from "react";

/** true par défaut (au 1er rendu et côté serveur) ; suit `visibilitychange`. */
export function useDocumentVisible(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    onVisibilityChange();
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return isVisible;
}
