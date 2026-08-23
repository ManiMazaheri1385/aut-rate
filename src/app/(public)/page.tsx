import Link from "next/link";
import { GraduationCap, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/search-bar";
import { ProfessorCard } from "@/components/professor/professor-card";
import { StarRating } from "@/components/star-rating";
import { db } from "@/lib/db";
import { safe } from "@/lib/safe";
import { getTopProfessors } from "@/lib/services/professors";
import { t } from "@/lib/i18n";
import { formatNumberFa, timeAgoFa } from "@/lib/utils";

// Incremental Static Regeneration: refresh every minute.
export const revalidate = 60;

async function getStats() {
  return safe(
    async () => {
      const [professors, courses, reviews] = await Promise.all([
        db.professor.count(),
        db.course.count(),
        db.review.count(),
      ]);
      return { professors, courses, reviews };
    },
    { professors: 0, courses: 0, reviews: 0 },
  );
}

async function getLatestReviews() {
  return safe(async () => {
    const reviews = await db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        course: { select: { id: true, name: true, code: true } },
        professor: { select: { id: true, department: true, user: { select: { name: true } } } },
      },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      anonymous: r.anonymous,
      courseName: r.course.name,
      courseCode: r.course.code,
      courseId: r.course.id,
      professorId: r.professor.id,
      professorName: r.professor.user.name,
    }));
  }, []);
}

export default async function HomePage() {
  const [topProfessors, latestReviews, stats] = await Promise.all([
    safe(() => getTopProfessors(4), []),
    getLatestReviews(),
    getStats(),
  ]);

  const statItems = [
    { value: stats.professors, label: t("home.statsProfessors") },
    { value: stats.courses, label: t("home.statsCourses") },
    { value: stats.reviews, label: t("home.statsReviews") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-l from-primary/95 via-primary to-primary/90 text-primary-foreground">
        <div className="container flex flex-col items-center gap-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <GraduationCap className="h-8 w-8" />
          </span>
          <h1 className="max-w-2xl text-2xl font-extrabold leading-relaxed sm:text-3xl">
            {t("home.heroTitle")}
          </h1>
          <p className="max-w-xl text-sm leading-7 opacity-90">{t("home.heroSubtitle")}</p>

          {/* Quick search */}
          <div className="w-full max-w-xl space-y-3">
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium opacity-80">
              <Search className="h-3.5 w-3.5" />
              {t("home.quickSearchTitle")}
            </p>
            <SearchBar placeholder={t("search.placeholderFull")} />
          </div>

          <div className="flex gap-3">
            <Link
              href="/professors"
              className="inline-flex h-10 items-center rounded-md bg-white px-5 text-sm font-bold text-primary shadow transition-colors hover:bg-white/90"
            >
              {t("home.ctaProfessors")}
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-10 items-center rounded-md border border-white/40 px-4 text-sm font-medium transition-colors hover:bg-white/10"
            >
              {t("home.ctaCourses")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b bg-card">
        <div className="container grid grid-cols-3 divide-x divide-x-reverse py-6 text-center">
          {statItems.map((item) => (
            <div key={item.label}>
              <p className="text-xl font-extrabold text-primary sm:text-2xl">
                {formatNumberFa(item.value)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top professors */}
      <section className="container py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("home.topProfessors")}</h2>
          <Link href="/professors" className="text-sm font-medium text-primary hover:underline">
            {t("common.viewAll")}
          </Link>
        </div>
        {topProfessors.length === 0 ? (
          <p className="rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">
            {t("professor.noReviews")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topProfessors.map((p) => (
              <ProfessorCard key={p.id} professor={p} />
            ))}
          </div>
        )}
      </section>

      {/* Latest reviews */}
      <section className="container pb-16">
        <h2 className="mb-6 text-xl font-bold">{t("home.latestReviews")}</h2>
        {latestReviews.length === 0 ? (
          <p className="rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">
            {t("professor.noReviews")}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestReviews.map((review) => (
              <Card key={review.id} className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-[11px] text-muted-foreground">{timeAgoFa(review.createdAt)}</span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-foreground/90">{review.comment}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <Link href={`/courses/${review.courseId}`} className="font-medium hover:text-primary hover:underline">
                      {review.courseName}
                    </Link>
                    <span>—</span>
                    <span>{review.anonymous ? "کاربر ناشناس" : review.professorName}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
