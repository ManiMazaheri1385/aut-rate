import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ExternalLink, Info, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import { ProfessorReviewsSection } from "@/components/professor/professor-reviews-section";
import { ProfessorAnalyticsCharts } from "@/components/charts/professor-analytics-charts";
import { getSessionUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { safe } from "@/lib/safe";
import {
  getProfessorDetail,
  getProfessorCourses,
  getProfessorTakeAgainRate,
  getRatingDistribution,
} from "@/lib/services/professors";
import { t } from "@/lib/i18n";
import { departmentLabel } from "@/lib/constants";
import { formatNumberFa, formatRatingFa, nameInitials } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const professor = await safe(() => getProfessorDetail(params.id), null);
  return { title: professor ? `${professor.name}` : t("professor.profile") };
}

export default async function ProfessorDetailPage({ params }: PageProps) {
  const professor = await getProfessorDetail(params.id);
  if (!professor) notFound();

  const [courses, takeAgainRate, distribution, sessionUser] = await Promise.all([
    safe(() => getProfessorCourses(professor.id), []),
    safe(() => getProfessorTakeAgainRate(professor.id), 0),
    safe(() => getRatingDistribution(professor.id), [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 }))),
    getSessionUser(),
  ]);

  // Professor profile of the signed-in professor (for reply permissions).
  let viewerProfessorId: string | null = null;
  if (sessionUser?.role === "PROFESSOR") {
    const prof = await safe(
      () => db.professor.findUnique({ where: { userId: sessionUser.id }, select: { id: true } }),
      null,
    );
    viewerProfessorId = prof?.id ?? null;
  }

  const stats = [
    { label: t("professor.totalReviews"), value: formatNumberFa(professor.totalReviews) },
    { label: t("professor.avgDifficulty"), value: formatRatingFa(professor.avgDifficulty) },
    { label: t("professor.takeAgainRate"), value: `${formatNumberFa(takeAgainRate)}٪` },
  ];

  return (
    <div className="container space-y-8 py-10">
      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24 border-2">
            {professor.photoUrl ? (
              <AvatarImage src={professor.photoUrl} alt={professor.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-accent text-xl text-accent-foreground">
              {nameInitials(professor.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold">{professor.name}</h1>
              <Badge variant="accent">{departmentLabel(professor.department)}</Badge>
            </div>

            <p className="max-w-2xl whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {professor.bio || t("professor.noBio")}
            </p>

            {professor.researchInterests.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">{t("professor.research")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {professor.researchInterests.map((interest) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {professor.personalLink && (
              <a
                href={professor.personalLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("professor.personalLink")}
              </a>
            )}
          </div>

          {/* Bayesian-adjusted average rating */}
          <div
            className="flex w-full shrink-0 flex-col items-center justify-center rounded-lg bg-secondary/70 p-5 text-center sm:w-48"
            title={t("professor.adjustedTooltip")}
          >
            <Info className="mb-1 h-4 w-4 cursor-help text-muted-foreground" />
            <p className="text-3xl font-extrabold text-primary">{formatRatingFa(professor.bayesianRating)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("professor.avgRating")} {t("professor.ofFive")}
            </p>
            <StarRating value={professor.bayesianRating} size="sm" className="mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stats ledger */}
      <div className="flex flex-wrap items-baseline justify-center gap-x-12 gap-y-3 rounded-lg border bg-card py-5">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-baseline gap-2.5">
            <span className="font-display text-2xl font-bold text-primary">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t("dashboard.analytics")}</h2>
        <ProfessorAnalyticsCharts
          showTrend={false}
          data={{ trend: [], distribution, totalReviews: professor.totalReviews, avgDifficulty: professor.avgDifficulty }}
        />
      </section>

      {/* Courses */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t("professor.coursesTaught")}</h2>
        </div>
        {courses.length === 0 ? (
          <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {t("professor.noCourses")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group">
                <Card className="h-full transition-colors group-hover:border-input">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold transition-colors group-hover:text-primary">
                      {course.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pb-4 text-xs text-muted-foreground">
                    <p dir="ltr" className="text-left font-medium text-primary">
                      {course.code}
                    </p>
                    <p>
                      {t("courses.credits")}: {formatNumberFa(course.credits)} · {t("courses.semester")}:{" "}
                      {course.semester}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <ProfessorReviewsSection
        professorId={professor.id}
        courses={courses.map((c) => ({ id: c.id, code: c.code, name: c.name }))}
        viewer={
          sessionUser
            ? { id: sessionUser.id, role: sessionUser.role, professorId: viewerProfessorId }
            : null
        }
        viewerStudentId={sessionUser?.studentId ?? null}
      />

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {formatNumberFa(professor.totalLikes)} {t("professor.likesReceived")}
      </p>
    </div>
  );
}
