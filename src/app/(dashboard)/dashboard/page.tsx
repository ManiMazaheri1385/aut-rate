import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, Eye, HeartHandshake, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewCard } from "@/components/reviews/review-card";
import { DashboardTabs, StudentIdForm } from "@/components/dashboard/dashboard-tabs";
import { ProfessorProfileEditor } from "@/components/professor/professor-profile-editor";
import { ProfessorCoursesManager } from "@/components/professor/professor-courses-manager";
import { ProfessorAnalyticsCharts } from "@/components/charts/professor-analytics-charts";
import { getSessionUser, hasValidStudentId } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { safe } from "@/lib/safe";
import { getUserReviews, getUserLikedReviews } from "@/lib/services/reviews";
import { getRatingDistribution } from "@/lib/services/professors";
import { t } from "@/lib/i18n";
import { formatNumberFa } from "@/lib/utils";

export const metadata = { title: t("dashboard.title") };

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, role: true, studentId: true },
  });
  if (!user) redirect("/login");

  // ------------------------------------------------------------------
  // Professor dashboard
  // ------------------------------------------------------------------
  if (user.role === "PROFESSOR") {
    const professor = await db.professor.findUnique({
      where: { userId: user.id },
      include: { aggregate: true },
    });

    if (!professor) {
      return (
        <div className="container py-10">
          <p className="rounded-lg bg-card p-8 text-center text-sm shadow">
            پروفایل استاد برای حساب شما ساخته نشده است. با مدیر سامانه تماس بگیرید.
          </p>
        </div>
      );
    }

    const [courses, distribution] = await Promise.all([
      safe(() => db.course.findMany({ where: { professorId: professor.id }, orderBy: { semester: "desc" } }), []),
      safe(() => getRatingDistribution(professor.id), [1, 2, 3, 4, 5].map((r) => ({ rating: r, count: 0 }))),
    ]);

    const analytics = await safe(async () => {
      const reviews = await db.review.findMany({
        where: { professorId: professor.id },
        select: { rating: true, difficulty: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });
      const MONTHS_FA = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
      const buckets = new Map<string, { sum: number; count: number; y: number; m: number }>();
      for (const r of reviews) {
        const key = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
        const b = buckets.get(key) ?? { sum: 0, count: 0, y: r.createdAt.getFullYear(), m: r.createdAt.getMonth() };
        b.sum += r.rating;
        b.count += 1;
        buckets.set(key, b);
      }
      const trend = Array.from(buckets.values())
        .sort((a, b2) => a.y - b2.y || a.m - b2.m)
        .map((b) => ({ label: MONTHS_FA[b.m], rating: Number((b.sum / b.count).toFixed(2)), count: b.count }));
      return { trend };
    }, { trend: [] as { label: string; rating: number; count: number }[] });

    const agg = professor.aggregate;

    const takeAgainYes = await safe(
      () => db.review.count({ where: { professorId: professor.id, wouldTakeAgain: true } }),
      0,
    );
    const totalForTake = agg?.totalReviews ?? 0;
    const takeAgainPercent = totalForTake > 0 ? Math.round((takeAgainYes / totalForTake) * 100) : 0;

    const received = await safe(
      async () => {
        const rows = await db.review.findMany({
          where: { professorId: professor.id },
          include: {
            student: { select: { id: true, name: true, image: true } },
            course: { select: { id: true, code: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        return rows.map((r) => ({
          id: r.id,
          professorId: r.professorId,
          rating: r.rating,
          difficulty: r.difficulty,
          wouldTakeAgain: r.wouldTakeAgain,
          comment: r.comment,
          anonymous: r.anonymous,
          helpfulCount: r.helpfulCount,
          reply: r.reply,
          repliedAt: r.repliedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          author: { id: r.student.id, name: r.student.name, image: r.student.image },
          course: r.course ? { id: r.course.id, code: r.course.code, name: r.course.name } : null,
          likedByViewer: false,
          ownedByViewer: false,
        }));
      },
      [] as Awaited<ReturnType<typeof getUserReviews>>,
    );

    return (
      <div className="container space-y-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">
              {t("dashboard.welcome")}، {user.name}
            </h1>
            <Badge variant="accent" className="mt-2">{t("dashboard.professorPanel")}</Badge>
          </div>
          <Link href={`/professors/${professor.id}`} className="text-sm font-medium text-primary hover:underline">
            {t("professor.profile")} ←
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Eye className="h-5 w-5" />} label={t("professor.totalReviews")} value={formatNumberFa(agg?.totalReviews ?? 0)} />
          <StatCard icon={<ThumbsUp className="h-5 w-5" />} label={t("professor.avgRating")} value={formatNumberFa(agg?.avgRating ?? 0, 1)} />
          <StatCard icon={<BookOpen className="h-5 w-5" />} label={t("professor.avgDifficulty")} value={formatNumberFa(agg?.avgDifficulty ?? 0, 1)} />
          <StatCard icon={<HeartHandshake className="h-5 w-5" />} label={t("professor.takeAgainRate")} value={`${formatNumberFa(takeAgainPercent)}٪`} />
        </div>

        {/* Analytics */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{t("dashboard.analytics")}</h2>
          <ProfessorAnalyticsCharts
            data={{ trend: analytics.trend, distribution, totalReviews: agg?.totalReviews ?? 0, avgDifficulty: agg?.avgDifficulty ?? 0 }}
          />
        </section>

        {/* Profile editor + courses manager */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProfessorProfileEditor
            professorId={professor.id}
            initial={{
              bio: professor.bio ?? "",
              researchInterests: professor.researchInterests,
              personalLink: professor.personalLink,
              photoUrl: professor.photoUrl,
            }}
          />
          <ProfessorCoursesManager />
        </div>

        {/* Received reviews */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">{t("dashboard.myReviewsHeader")}</h2>
          {received.length === 0 ? (
            <p className="rounded-lg bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
              {t("professor.noReviews")}
            </p>
          ) : (
            <div className="space-y-4">
              {received.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  viewer={{ id: user.id, role: "PROFESSOR", professorId: professor.id }}
                  showCourse
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Student / Admin dashboard
  // ------------------------------------------------------------------
  const [myReviews, likedReviews] = await Promise.all([
    safe(() => getUserReviews(user.id), []),
    safe(() => getUserLikedReviews(user.id), []),
  ]);

  const [likesReceived, likesGiven] = await Promise.all([
    safe(() => db.like.count({ where: { review: { studentId: user.id } } }), 0),
    safe(() => db.like.count({ where: { userId: user.id } }), 0),
  ]);

  // Favorite professors: professors whose reviews this user liked most.
  const favorites = await safe(async () => {
    const likes = await db.like.findMany({
      where: { userId: user.id },
      select: { review: { select: { professorId: true } } },
    });
    const counts = new Map<string, number>();
    for (const like of likes) {
      const pid = like.review.professorId;
      if (!pid) continue;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    const topIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
    if (topIds.length === 0) return [];
    const professors = await db.professor.findMany({
      where: { id: { in: topIds } },
      include: { user: { select: { name: true } } },
    });
    return professors.map((p) => ({ id: p.id, name: p.user.name, department: p.department }));
  }, [] as { id: string; name: string; department: string }[]);

  const needsStudentId = !hasValidStudentId(user.studentId);

  return (
    <div className="container space-y-8 py-10">
      <h1 className="text-2xl font-extrabold">
        {t("dashboard.welcome")}، {user.name}
      </h1>

      {needsStudentId && (
        <Card className="border-primary/30 bg-accent/40">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-accent-foreground">{t("dashboard.studentIdBanner")}</p>
            <StudentIdForm />
          </CardContent>
        </Card>
      )}

      {/* Activity stats */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t("dashboard.tabActivity")}</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<BookOpen className="h-5 w-5" />} label={t("dashboard.statReviewsGiven")} value={formatNumberFa(myReviews.length)} />
          <StatCard icon={<HeartHandshake className="h-5 w-5" />} label={t("dashboard.statLikesReceived")} value={formatNumberFa(likesReceived)} />
          <StatCard icon={<ThumbsUp className="h-5 w-5" />} label={t("dashboard.statLikesGiven")} value={formatNumberFa(likesGiven)} />
        </div>
      </section>

      <DashboardTabs
        myReviews={myReviews}
        likedReviews={likedReviews}
        favorites={favorites}
        viewer={{ id: user.id, role: user.role }}
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">{icon}</span>
      </CardHeader>
      <CardContent className="pt-0">
        <CardTitle className="text-xl font-extrabold text-primary">{value}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
