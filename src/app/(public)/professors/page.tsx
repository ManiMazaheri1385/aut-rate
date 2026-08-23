import { SearchX } from "lucide-react";
import { ProfessorCard } from "@/components/professor/professor-card";
import { ProfessorFilters } from "@/components/professor/professor-filters";
import { getProfessorList } from "@/lib/services/professors";
import { safe } from "@/lib/safe";
import { t } from "@/lib/i18n";
import { formatNumberFa } from "@/lib/utils";

export const revalidate = 60;

export const metadata = { title: t("professors.title") };

interface PageProps {
  searchParams: { q?: string; department?: string; sort?: string; page?: string };
}

export default async function ProfessorsPage({ searchParams }: PageProps) {
  const q = searchParams.q ?? "";
  const department = searchParams.department ?? "all";
  const sort = (searchParams.sort as "highest_rated" | "most_reviewed" | "newest") ?? "highest_rated";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const result = await safe(
    () => getProfessorList({ q, department, sort, page, pageSize: 12 }),
    { items: [], total: 0 },
  );

  const totalPages = Math.max(1, Math.ceil(result.total / 12));

  return (
    <div className="container py-10">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-extrabold">{t("professors.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumberFa(result.total)} {t("professors.countSuffix")}
          {q ? ` — «${q}»` : ""}
        </p>
      </div>

      <ProfessorFilters department={department} sort={sort} />

      <div className="mt-8">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-card py-16 text-center shadow-sm">
            <SearchX className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("professors.empty")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((professor) => (
                <ProfessorCard key={professor.id} professor={professor} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/professors?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(department !== "all" ? { department } : {}),
                      sort,
                      page: String(p),
                    }).toString()}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium ${
                      p === page ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {formatNumberFa(p)}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
