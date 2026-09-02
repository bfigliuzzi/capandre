"use client";

import { useCallback, useRef } from "react";

export interface UseRovingTabindexOptions {
  count: number;
  activeIndex: number;
  onActivate: (index: number) => void;
  orientation?: "horizontal" | "vertical" | "both";
}

export interface RovingItemProps {
  ref: (el: HTMLElement | null) => void;
  tabIndex: 0 | -1;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Roving tabindex générique pour radiogroups (sélection suit le focus) :
 * flèches cycliques + Home/End. Extrait du pattern de DifficultySelector.
 */
export function useRovingTabindex({
  count,
  activeIndex,
  onActivate,
  orientation = "horizontal",
}: UseRovingTabindexOptions): { getItemProps: (index: number) => RovingItemProps } {
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const moveFocus = useCallback(
    (nextIndex: number) => {
      const target = itemsRef.current[nextIndex];
      target?.focus();
      onActivate(nextIndex);
    },
    [onActivate],
  );

  const getItemProps = useCallback(
    (index: number): RovingItemProps => ({
      ref: (el: HTMLElement | null) => {
        itemsRef.current[index] = el;
      },
      tabIndex: index === activeIndex ? 0 : -1,
      onKeyDown: (e: React.KeyboardEvent) => {
        const allowNext = orientation !== "vertical";
        const allowPrev = orientation !== "vertical";
        const allowDown = orientation !== "horizontal";
        const allowUp = orientation !== "horizontal";

        let next = index;
        if ((allowNext && e.key === "ArrowRight") || (allowDown && e.key === "ArrowDown")) {
          e.preventDefault();
          next = (index + 1) % count;
        } else if ((allowPrev && e.key === "ArrowLeft") || (allowUp && e.key === "ArrowUp")) {
          e.preventDefault();
          next = (index - 1 + count) % count;
        } else if (e.key === "Home") {
          e.preventDefault();
          next = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          next = count - 1;
        } else {
          return;
        }
        moveFocus(next);
      },
    }),
    [activeIndex, count, moveFocus, orientation],
  );

  return { getItemProps };
}
