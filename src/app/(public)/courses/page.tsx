import Link from "next/link";
import { SearchX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseFilters } from "@/components/course/course-filters";
import { getCourseList } from "@/lib/services/courses";
import { safe } from "@/lib/safe";
import { t } from "@/lib/i18n";
import { departmentLabel } from "@/lib/constants";
import { formatNumberFa, formatRatingFa } from "@/lib/utils";

export const revalidate = 60;
export const metadata = { title: t("courses.title") };

interface PageProps {
  searchParams: { q?: string; department?: string };
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const q = searchParams.q ?? "";
  const department = searchParams.department ?? "all";

  const result = await safe(() => getCourseList({ q, department, pageSize: 24 }), {
    items: [],
    total: 0,
  });

  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">{t("courses.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatNumberFa(result.total)} {t("common.course")}
        </p>
      </div>

      <CourseFilters q={q} department={department} />

      <div className="mt-8">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-card py-16 text-center shadow-sm">
            <SearchX className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("courses.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block">
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight">{course.name}</h3>
                      <Badge dir="ltr" variant="outline" className="shrink-0">
                        {course.code}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        {t("courses.credits")}: {formatNumberFa(course.credits)} — {t("courses.semester")}:{" "}
                        {course.semester}
                      </p>
                      <p>
                        {t("courses.provider")}:{" "}
                        {course.professorName ? (
                          course.professorName
                        ) : (
                          <span>{t("courses.noProvider")}</span>
                        )}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
                      <Badge variant="accent">{departmentLabel(course.department)}</Badge>
                      <span className="text-muted-foreground">
                        ⭐ {formatRatingFa(course.avgRating)} · {formatNumberFa(course.totalReviews)}{" "}
                        {t("professors.reviewsSuffix")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
