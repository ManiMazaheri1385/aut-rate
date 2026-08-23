"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn, formatRatingFa } from "@/lib/utils";

interface StarRatingProps {
  /** Rating value 0..5 (supports halves for display). */
  value: number;
  /** When provided the component becomes an interactive input. */
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

/**
 * Persian star rating: half-star display via a clipped filled overlay,
 * half-star input by clicking near the middle of a star.
 */
export function StarRating({ value, onChange, size = "md", showValue = false, className }: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const displayValue = hoverValue ?? value;
  const fillPercent = Math.max(0, Math.min(100, (displayValue / 5) * 100));

  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  function handleStarClick(index: number, event: React.MouseEvent<HTMLButtonElement>) {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left; // stars are laid out LTR for consistent rating UX
    const picked = offset < rect.width / 2 ? index + 0.5 : index + 1;
    setHoverValue(null);
    onChange?.(Math.max(1, Math.min(5, picked)));
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span
        dir="ltr"
        className="relative inline-flex"
        role={interactive ? "radiogroup" : undefined}
        aria-label="امتیاز دهید"
        onMouseLeave={() => setHoverValue(null)}
      >
        {/* Filled overlay (clipped to the current percentage) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 flex gap-0.5 overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={cn(sizeClass, "shrink-0 fill-primary text-primary")} />
          ))}
        </span>
        {/* Base row / buttons */}
        <span className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) =>
            interactive ? (
              <button
                key={i}
                type="button"
                aria-label={`امتیاز ${i + 1}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverValue(i + 1)}
                onClick={(e) => handleStarClick(i, e)}
              >
                <Star className={cn(sizeClass, "text-muted-foreground/40 transition-colors hover:text-primary/60")} />
              </button>
            ) : (
              <Star key={i} className={cn(sizeClass, "text-muted-foreground/40")} />
            ),
          )}
        </span>
      </span>
      {showValue && (
        <span dir="rtl" className="text-sm font-medium text-foreground">
          {formatRatingFa(displayValue)}
        </span>
      )}
    </span>
  );
}
