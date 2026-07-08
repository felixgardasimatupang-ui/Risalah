"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) root.classList.add("dark");
      else root.classList.remove("dark");

      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
}
