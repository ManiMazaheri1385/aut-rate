"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { DEPARTMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Client filter bar for the courses list ("جستجوی درس...", department chips). */
export function CourseFilters({ q, department }: { q: string; department: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(q);

  // Debounced push on typing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (value === current) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.push(`/courses?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [value, router, searchParams]);

  function setDepartment(dept: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (dept === "all") params.delete("department");
    else params.set("department", dept);
    router.push(`/courses?${params.toString()}`);
  }

  const chips = [{ value: "all", label: t("courses.filterAll") }, ...DEPARTMENTS];

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("courses.searchPlaceholder")}
          className="pr-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setDepartment(chip.value)}
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
    </div>
  );
}
