import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseReviewsSection } from "@/components/course/course-reviews-section";
import { getCourseDetail, getRelatedProfessors, safeLatestReviews } from "@/lib/services/courses";
import { t } from "@/lib/i18n";
import { departmentLabel } from "@/lib/constants";
import { formatNumberFa, formatRatingFa } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  void safeLatestReviews;
  const course = await getCourseDetail(params.id).catch(() => null);
  return { title: course ? `${course.name} (${course.code})` : t("courses.title") };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const course = await getCourseDetail(params.id);
  if (!course) notFound();

  const related = await getRelatedProfessors(course.id).catch(() => []);

  const infoRows = [
    { label: t("courses.code"), value: <span dir="ltr">{course.code}</span> },
    { label: t("courses.credits"), value: formatNumberFa(course.credits) },
    { label: t("courses.semester"), value: course.semester },
    {
      label: t("courses.provider"),
      value: course.professorId ? (
        <Link href={`/professors/${course.professorId}`} className="font-medium text-primary hover:underline">
          {course.professorName}
        </Link>
      ) : (
        <span className="text-muted-foreground">{t("courses.noProvider")}</span>
      ),
    },
    { label: "دپارتمان", value: departmentLabel(course.department) },
    {
      label: t("common.rating"),
      value: `${formatRatingFa(course.avgRating)} ${t("professor.ofFive")} (${formatNumberFa(
        course.totalReviews,
      )} ${t("professors.reviewsSuffix")})`,
    },
  ];

  return (
    <div className="container space-y-8 py-10">
      {/* Course info */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <BookOpen className="h-6 w-6 shrink-0 text-primary" />
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{course.name}</h1>
          <Badge dir="ltr" variant="outline">
            {course.code}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("courses.info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {infoRows.map((row) => (
                <div key={row.label} className="rounded-md bg-secondary/60 px-3 py-2">
                  <dt className="text-[11px] text-muted-foreground">{row.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{row.value}</dd>
                </div>
              ))}
            </dl>
            {course.description && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("courses.description")}</p>
                <p className="text-sm leading-7 text-foreground/90">{course.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Related professors */}
      {related.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{t("courses.relatedProfessors")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related
              .filter((p) => p.id !== course.professorId)
              .slice(0, 4)
              .map((professor) => (
                <Link key={professor.id} href={`/professors/${professor.id}`} className="group">
                  <Card className="transition-colors group-hover:border-input">
                    <CardContent className="flex items-center justify-between p-4">
                      <span className="text-sm font-bold transition-colors group-hover:text-primary">
                        {professor.name}
                      </span>
                      <span dir="rtl" className="text-xs text-muted-foreground">
                        {formatNumberFa(professor.totalReviews)} نظر
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <CourseReviewsSection courseId={course.id} />
    </div>
  );
}
