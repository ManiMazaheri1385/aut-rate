"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ReviewCard, type ViewerInfo } from "@/components/reviews/review-card";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";
import type { Paginated, ReviewDto } from "@/types";

/** Reviews of a specific course ("نظرات این درس"). */
export function CourseReviewsSection({ courseId }: { courseId: string }) {
  const [viewer, setViewer] = React.useState<ViewerInfo | null>(null);
  const [viewerLoaded, setViewerLoaded] = React.useState(false);

  React.useEffect(() => {
    apiFetch<{ id: string; role: string } | null>("/api/me")
      .then((user) => setViewer(user ? { id: user.id, role: user.role } : null))
      .catch(() => setViewer(null))
      .finally(() => setViewerLoaded(true));
  }, []);

  const { data, isLoading } = useQuery<Paginated<ReviewDto>>({
    queryKey: ["reviews", courseId],
    queryFn: () => apiFetch(`/api/reviews?courseId=${encodeURIComponent(courseId)}&take=50`),
  });

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{t("courses.reviewsSection")}</h2>
      {isLoading || !viewerLoaded ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
          {t("courses.noReviews")}
        </p>
      ) : (
        <div className="space-y-4">
          {data.items.map((review) => (
            <ReviewCard key={review.id} review={review} viewer={viewer} />
          ))}
        </div>
      )}
    </section>
  );
}
