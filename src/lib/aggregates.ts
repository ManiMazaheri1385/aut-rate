import { db } from "@/lib/db";
import { cacheDelete } from "@/lib/cache";

/**
 * Recomputes the ProfessorAggregate cache row after any review/like mutation.
 * Displayed averages apply the Bayesian correction at read time.
 */
export async function recomputeProfessorAggregate(professorId: string): Promise<void> {
  const [agg, totalLikes] = await Promise.all([
    db.review.aggregate({
      where: { professorId },
      _avg: { rating: true, difficulty: true },
      _count: { _all: true },
    }),
    db.like.count({ where: { review: { professorId } } }),
  ]);

  const avgRating = agg._avg.rating ?? 0;
  const avgDifficulty = agg._avg.difficulty ?? 0;
  const totalReviews = agg._count._all;

  await db.professorAggregate.upsert({
    where: { professorId },
    update: {
      avgRating,
      avgDifficulty,
      totalReviews,
      totalLikes,
    },
    create: {
      professorId,
      avgRating,
      avgDifficulty,
      totalReviews,
      totalLikes,
    },
  });

  // Invalidate cached list endpoints that embed aggregate data.
  await cacheDelete("professors:list");
}
