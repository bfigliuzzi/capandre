"use client";

import { createContext, use, useState, useCallback, useMemo, type ReactNode } from "react";

interface HeaderConfig {
  title: string;
  backHref: string | null;
}

interface HeaderContextValue extends HeaderConfig {
  setHeader: (config: HeaderConfig) => void;
}

const HeaderContext = createContext<HeaderContextValue | null>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({ title: "", backHref: null });

  const setHeader = useCallback((newConfig: HeaderConfig) => {
    setConfig(newConfig);
  }, []);

  const value = useMemo(
    () => ({ ...config, setHeader }),
    [config, setHeader]
  );

  return (
    <HeaderContext value={value}>
      {children}
    </HeaderContext>
  );
}

export function useHeader() {
  const ctx = use(HeaderContext);
  if (!ctx) throw new Error("useHeader must be used within HeaderProvider");
  return ctx;
}
