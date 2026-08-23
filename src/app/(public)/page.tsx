import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Seal } from "@/components/seal";
import { SearchBar } from "@/components/search-bar";
import { ProfessorCard } from "@/components/professor/professor-card";
import { StarRating } from "@/components/star-rating";
import { db } from "@/lib/db";
import { safe } from "@/lib/safe";
import { getTopProfessors } from "@/lib/services/professors";
import { t } from "@/lib/i18n";
import { formatNumberFa, formatRatingFa, timeAgoFa } from "@/lib/utils";
import { departmentLabel } from "@/lib/constants";

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

/** The report-card artifact: real registry data typeset like an official transcript. */
function TranscriptCard({
  name,
  department,
  rating,
  reviewsCount,
  difficulty,
}: {
  name: string;
  department: string;
  rating: number;
  reviewsCount: number;
  difficulty: number;
}) {
  return (
    <div className="relative mx-auto w-full max-w-sm -rotate-2 sm:max-w-md lg:mx-0">
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-7 [box-shadow:0_28px_70px_-30px_rgba(3,31,41,0.65)]">
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-4">
          <div>
            <p className="font-display text-xl font-semibold leading-none">کارنامه ارزیابی استاد</p>
            <p className="mt-2 text-xs text-muted-foreground">{department}</p>
          </div>
          <p className="shrink-0 font-display text-4xl font-bold leading-none text-primary">
            {formatRatingFa(rating)}
            <span className="mr-1 align-top text-xs font-medium text-muted-foreground">از ۵</span>
          </p>
        </div>

        <p className="mt-4 font-display text-2xl font-semibold">{name}</p>
        <div className="mt-2">
          <StarRating value={rating} size="sm" />
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">نظرات ثبت‌شده</dt>
            <dd className="font-semibold">{formatNumberFa(reviewsCount)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">میانگین سختی</dt>
            <dd className="font-semibold">{formatRatingFa(difficulty)}</dd>
          </div>
        </dl>

        <p className="mt-6 border-t border-dashed border-border pt-3 text-[11px] leading-5 text-muted-foreground">
          گردآوری‌شده از نظرات واقعی دانشجویان دانشکده
        </p>
      </div>

      {/* The seal stamps over the card corner: one element crossing a layer boundary */}
      <Seal size={108} className="absolute -bottom-8 -left-8 rotate-[9deg]" />
    </div>
  );
}

export default async function HomePage() {
  const [topProfessors, latestReviews, stats] = await Promise.all([
    safe(() => getTopProfessors(4), []),
    getLatestReviews(),
    getStats(),
  ]);

  const featured = topProfessors[0];

  const statItems = [
    { value: stats.professors, label: t("home.statsProfessors") },
    { value: stats.courses, label: t("home.statsCourses") },
    { value: stats.reviews, label: t("home.statsReviews") },
  ];

  return (
    <div>
      {/* Hero: the ocean band owns the first screen */}
      <section className="bg-ocean relative text-primary-foreground">
        <div className="container grid items-center gap-14 py-20 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-0">
          {/* Copy */}
          <div className="max-w-2xl">
            <h1 className="font-display text-5xl font-bold leading-[1.08] sm:text-6xl">{t("home.heroTitle")}</h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-primary-foreground/75">{t("home.heroSubtitle")}</p>

            <div className="mt-8 max-w-xl rounded-lg bg-card p-1.5 [box-shadow:0_20px_50px_-24px_rgba(3,31,41,0.7)]">
              <SearchBar placeholder={t("search.placeholderFull")} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/professors"
                className="inline-flex h-11 items-center rounded-md bg-primary-foreground px-6 text-sm font-bold text-primary transition-colors active:scale-[0.98] hover:bg-white"
              >
                {t("home.ctaProfessors")}
              </Link>
              <Link href="/courses" className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground">
                {t("home.ctaCourses")}
              </Link>
            </div>
          </div>

          {/* Artifact */}
          <div className="pb-10 lg:py-20">
            <TranscriptCard
              name={featured?.name ?? "—"}
              department={featured ? departmentLabel(featured.department) : "دانشکده ریاضیات و علوم کامپیوتر"}
              rating={featured?.bayesianRating ?? 0}
              reviewsCount={featured?.totalReviews ?? 0}
              difficulty={featured?.avgDifficulty ?? 0}
            />
          </div>
        </div>
      </section>

      {/* Registry ledger strip */}
      <section className="border-b bg-card" aria-label="آمار سامانه">
        <div className="container flex flex-wrap items-baseline justify-center gap-x-12 gap-y-3 py-5">
          {statItems.map((item) => (
            <div key={item.label} className="flex items-baseline gap-2.5">
              <span className="font-display text-2xl font-bold text-primary">{formatNumberFa(item.value)}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top professors */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("home.topProfessors")}</h2>
          <Link href="/professors" className="shrink-0 text-sm font-medium text-primary hover:underline">
            {t("common.viewAll")}
          </Link>
        </div>
        {topProfessors.length === 0 ? (
          <p className="rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">{t("professor.noReviews")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topProfessors.map((p) => (
              <ProfessorCard key={p.id} professor={p} />
            ))}
          </div>
        )}
      </section>

      {/* Latest reviews */}
      <section className="container pb-20">
        <h2 className="mb-8 font-display text-3xl font-bold sm:text-4xl">{t("home.latestReviews")}</h2>
        {latestReviews.length === 0 ? (
          <p className="rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">{t("professor.noReviews")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestReviews.map((review) => (
              <Card key={review.id} className="transition-colors hover:border-input">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-[11px] text-muted-foreground">{timeAgoFa(review.createdAt)}</span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-foreground/90">{review.comment}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <Link href={`/courses/${review.courseId}`} className="font-medium hover:text-primary hover:underline">
                      {review.courseName}
                    </Link>
                    <span aria-hidden>·</span>
                    <span>استاد {review.professorName}</span>
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
