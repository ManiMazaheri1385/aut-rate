"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ReviewCard, type ViewerInfo } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";
import type { Paginated, ReviewDto } from "@/types";

interface CourseOption {
  id: string;
  code: string;
  name: string;
}

interface ProfessorReviewsSectionProps {
  professorId: string;
  courses: CourseOption[];
  viewer: ViewerInfo | null;
  viewerStudentId?: string | null;
}

/** Reviews list + review form on the professor profile page. */
export function ProfessorReviewsSection({
  professorId,
  courses,
  viewer,
  viewerStudentId,
}: ProfessorReviewsSectionProps) {
  const router = useRouter();
  const [take, setTake] = React.useState(10);

  const { data, isLoading } = useQuery<Paginated<ReviewDto>>({
    queryKey: ["reviews", professorId],
    queryFn: () =>
      apiFetch(`/api/reviews?professorId=${encodeURIComponent(professorId)}&take=100`),
  });

  // Form gating messages (all Persian)
  let disabledReason: string | null = null;
  if (!viewer) {
    disabledReason = t("review.loginRequired");
  } else if (viewer.role === "STUDENT" && !/^\d{9}$/.test(viewerStudentId ?? "")) {
    disabledReason = t("review.studentIdRequired");
  }

  const reviews = data?.items ?? [];

  return (
    <section id="reviews" className="space-y-6">
      <h2 className="text-xl font-bold">{t("professor.reviewsSection")}</h2>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* List */}
        <div className="order-2 space-y-4 lg:order-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-md bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              {t("professor.noReviews")}
            </p>
          ) : (
            <>
              {reviews.slice(0, take).map((review) => (
                <ReviewCard key={review.id} review={review} viewer={viewer} showCourse />
              ))}
              {reviews.length > take && (
                <Button variant="outline" onClick={() => setTake((v) => v + 10)}>
                  {t("common.viewAll")}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Form */}
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <ReviewForm
              professorId={professorId}
              courses={courses}
              disabledReason={disabledReason}
            />
            {!viewer && (
              <p className="mt-3 text-center text-sm">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  {t("nav.login")}
                </Link>
              </p>
            )}
            {viewer && viewer.role === "STUDENT" && !disabledReason && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                <button
                  className="hover:text-primary hover:underline"
                  onClick={() => router.refresh()}
                >
                  {t("common.retry")}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
