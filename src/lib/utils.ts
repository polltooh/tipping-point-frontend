import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number, fractionDigits = 2): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${value < 0 ? "-" : ""}$${formatted}`;
}

export function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return formatUsd(value, 0);
}

/**
 * Smoothly interpolates a numeric value using cubic ease-out (1 - (1 - t)^3) over durationMs.
 */
export function useAnimatedNumber(target: number, durationMs = 320): number {
  const [current, setCurrent] = useState(target);
  const startValRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = current;
    if (Math.abs(target - from) < 0.01) {
      setCurrent(target);
      return;
    }

    startValRef.current = from;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextVal = startValRef.current + (target - startValRef.current) * eased;
      setCurrent(nextVal);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return current;
}
