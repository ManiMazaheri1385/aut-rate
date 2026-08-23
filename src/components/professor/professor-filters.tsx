"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";
import { DEPARTMENTS, SORT_OPTIONS } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Department filter chips + sort select for the professors list. */
export function ProfessorFilters({ department, sort }: { department: string; sort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) params.delete(key);
    else params.set(key, value);
    router.push(`/professors?${params.toString()}`);
  }

  const chips = [{ value: "all", label: t("professors.allDepartments") }, ...DEPARTMENTS];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => updateParam("department", chip.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              department === chip.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card hover:bg-secondary",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted-foreground">{t("professors.sortBy")}:</span>
        <Select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="h-9 w-44 text-xs"
          aria-label={t("professors.sortBy")}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
