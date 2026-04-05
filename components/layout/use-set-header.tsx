"use client";

import { useEffect } from "react";
import { useHeader } from "./header-context";

export function useSetHeader(title: string, backHref: string | null) {
  const { setHeader } = useHeader();

  useEffect(() => {
    setHeader({ title, backHref });
    document.title = title ? `${title} — Capandre` : "Capandre";
  }, [title, backHref, setHeader]);
}
