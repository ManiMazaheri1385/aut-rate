import { db } from "@/lib/db";
import { ok, handleApi } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guards";

/**
 * GET /api/dashboard — aggregated data for the student/professor dashboard.
 * Returns null when the visitor is not signed in.
 */
export async function GET() {
  return handleApi(async () => {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return ok(null);

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        image: true,
      },
    });
    if (!user) return ok(null);

    const [myReviewsCount, likesReceived, likesGiven] = await Promise.all([
      db.review.count({ where: { studentId: user.id } }),
      db.like.count({ where: { review: { studentId: user.id } } }),
      db.like.count({ where: { userId: user.id } }),
    ]);

    // Favorite professors: professors whose reviews the user liked most.
    const favoriteLikes = await db.like.findMany({
      where: { userId: user.id },
      select: { review: { select: { professorId: true } } },
    });
    const favCounts = new Map<string, number>();
    for (const l of favoriteLikes) {
      if (!l.review.professorId) continue;
      favCounts.set(l.review.professorId, (favCounts.get(l.review.professorId) ?? 0) + 1);
    }
    const topFavIds = Array.from(favCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);

    let favorites: { id: string; name: string; department: string }[] = [];
    if (topFavIds.length > 0) {
      const professors = await db.professor.findMany({
        where: { id: { in: topFavIds } },
        include: { user: { select: { name: true } } },
      });
      favorites = professors.map((p) => ({
        id: p.id,
        name: p.user.name,
        department: p.department,
      }));
    }

    // Professor-specific extras.
    let professorProfileId: string | null = null;
    if (user.role === "PROFESSOR") {
      const prof = await db.professor.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      professorProfileId = prof?.id ?? null;
    }

    return ok({
      user,
      stats: {
        reviewsGiven: myReviewsCount,
        likesReceived,
        likesGiven,
      },
      favorites,
      professorProfileId,
    });
  });
}
