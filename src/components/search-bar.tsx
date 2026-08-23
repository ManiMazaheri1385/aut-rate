"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, GraduationCap, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

interface SuggestItem {
  id: string;
  title: string;
  subtitle: string;
}

interface Suggestions {
  professors: SuggestItem[];
  courses: SuggestItem[];
}

const EMPTY: Suggestions = { professors: [], courses: [] };

/** Global search box with debounced autocomplete for professors and courses. */
export function SearchBar({ placeholder, className }: { placeholder?: string; className?: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestions>(EMPTY);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced autocomplete fetch
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/professors/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setSuggestions(json.data ?? EMPTY);
          setOpen(true);
        }
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
      setLoading(false);
    };
  }, [query]);

  // Close on outside click
  React.useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function submitSearch() {
    setOpen(false);
    router.push(`/professors?q=${encodeURIComponent(query.trim())}`);
  }

  const hasAny = suggestions.professors.length > 0 || suggestions.courses.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className ?? ""}`}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.professors.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          placeholder={placeholder ?? t("search.placeholderFull")}
          className="pr-9"
          aria-label={t("common.search")}
        />
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-md border bg-card [box-shadow:0_10px_28px_-14px_rgba(3,31,41,0.4)]">
          {loading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : hasAny ? (
            <div className="max-h-80 overflow-y-auto p-1.5">
              {suggestions.professors.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                    {t("search.professorsSection")}
                  </p>
                  {suggestions.professors.map((item) => (
                    <button
                      key={`p-${item.id}`}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-right text-sm hover:bg-secondary"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/professors/${item.id}`);
                      }}
                    >
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>{item.title}</span>
                    </button>
                  ))}
                </>
              )}
              {suggestions.courses.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                    {t("search.coursesSection")}
                  </p>
                  {suggestions.courses.map((item) => (
                    <button
                      key={`c-${item.id}`}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-right text-sm hover:bg-secondary"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/courses/${item.id}`);
                      }}
                    >
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>
                        {item.title}
                        <span className="mr-2 text-xs text-muted-foreground">{item.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">{t("search.noSuggestions")}</p>
          )}
        </div>
      )}
    </div>
  );
}
