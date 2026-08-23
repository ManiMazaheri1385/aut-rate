import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import type { RatingDistributionBucket, TrendPoint } from "@/types";

const MONTH_NAMES_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** GET /api/professor/analytics — rating trend + distribution for own profile. */
export async function GET() {
  return handleApi(async () => {
    const user = await requireRole("PROFESSOR", "ADMIN");
    const professor = await db.professor.findUnique({ where: { userId: user.id } });
    if (!professor) throw new ApiError("پروفایل استاد یافت نشد", 404);

    const reviews = await db.review.findMany({
      where: { professorId: professor.id },
      select: { rating: true, difficulty: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Monthly average rating trend (Gregorian month buckets, Persian labels).
    const monthBuckets = new Map<string, { sum: number; count: number; year: number; month: number }>();
    for (const r of reviews) {
      const key = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
      const bucket = monthBuckets.get(key) ?? {
        sum: 0,
        count: 0,
        year: r.createdAt.getFullYear(),
        month: r.createdAt.getMonth(),
      };
      bucket.sum += r.rating;
      bucket.count += 1;
      monthBuckets.set(key, bucket);
    }

    const trend: TrendPoint[] = Array.from(monthBuckets.values())
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((b) => ({
        label: MONTH_NAMES_FA[b.month],
        rating: Number((b.sum / b.count).toFixed(2)),
        count: b.count,
      }));

    // Distribution over 1..5.
    const counts = new Array(5).fill(0) as number[];
    for (const r of reviews) counts[r.rating - 1] += 1;
    const distribution: RatingDistributionBucket[] = counts.map((count, i) => ({
      rating: i + 1,
      count,
    }));

    const totalReviews = reviews.length;
    const avgDifficulty =
      totalReviews > 0
        ? reviews.reduce((s, r) => s + r.difficulty, 0) / totalReviews
        : 0;

    return ok({ trend, distribution, totalReviews, avgDifficulty });
  });
}
