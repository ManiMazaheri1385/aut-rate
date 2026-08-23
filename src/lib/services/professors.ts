import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cached } from "@/lib/cache";
import { bayesianAverage } from "@/lib/constants";
import { normalizePersian } from "@/lib/utils";
import { safe } from "@/lib/safe";
import type { Paginated, ProfessorCardDto, ProfessorListFilters, SuggestItem } from "@/types";

/**
 * Professor read services. Used by server components (ISR pages) and API routes.
 */

const professorInclude = {
  user: { select: { id: true, name: true, image: true } },
  aggregate: true,
} satisfies Prisma.ProfessorInclude;

type ProfessorWithAggregate = Prisma.ProfessorGetPayload<{ include: typeof professorInclude }>;

export function toProfessorCardDto(p: ProfessorWithAggregate): ProfessorCardDto {
  const avgRating = p.aggregate?.avgRating ?? 0;
  const totalReviews = p.aggregate?.totalReviews ?? 0;
  return {
    id: p.id,
    userId: p.user.id,
    name: p.user.name,
    image: p.user.image,
    department: p.department,
    bio: p.bio || null,
    photoUrl: p.photoUrl,
    researchInterests: p.researchInterests,
    personalLink: p.personalLink,
    avgRating,
    bayesianRating: bayesianAverage(avgRating, totalReviews),
    avgDifficulty: p.aggregate?.avgDifficulty ?? 0,
    totalReviews,
    totalLikes: p.aggregate?.totalLikes ?? 0,
  };
}

/** Persian-aware full-text search over professor names + taught course names/codes. */
async function searchProfessorUserIds(query: string): Promise<string[] | null> {
  const q = normalizePersian(query);
  if (!q) return null;
  try {
    const rows = await db.$queryRaw<{ userId: string }[]>(Prisma.sql`
      SELECT DISTINCT u.id AS "userId"
      FROM "Professor" p
      JOIN "User" u ON u."id" = p."userId"
      LEFT JOIN "Course" c ON c."professorId" = p."id"
      WHERE
        to_tsvector('persian', u.name) @@ plainto_tsquery('persian', ${q})
        OR u.name ILIKE ${"%" + q + "%"}
        OR c.code ILIKE ${"%" + q.toUpperCase() + "%"}
        OR c.name ILIKE ${"%" + q + "%"}
      LIMIT 200
    `);
    return rows.map((r) => r.userId);
  } catch (error) {
    // Fallback (e.g. missing DB extension support): simple contains match.
    console.error("[professors] full-text search failed, falling back:", error);
    const users = await db.user.findMany({
      where: { name: { contains: q } },
      select: { id: true },
      take: 200,
    });
    return users.map((u) => u.id);
  }
}

export async function getProfessorList(filters: ProfessorListFilters): Promise<Paginated<ProfessorCardDto>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;

  const where: Prisma.ProfessorWhereInput = {};
  if (filters.department && filters.department !== "all") {
    where.department = filters.department as never;
  }

  let userIds: string[] | null = null;
  if (filters.q && filters.q.trim()) {
    userIds = await searchProfessorUserIds(filters.q);
    if (userIds !== null && userIds.length === 0) {
      return { items: [], total: 0 };
    }
    where.userId = { in: userIds ?? undefined };
  }

  // Faculty-scale dataset: in-memory sort keeps ranking logic (Bayesian) simple.
  const professors = await db.professor.findMany({
    where,
    include: professorInclude,
    take: 500,
  });

  let dtos = professors.map(toProfessorCardDto);

  switch (filters.sort) {
    case "most_reviewed":
      dtos.sort((a, b) => b.totalReviews - a.totalReviews);
      break;
    case "newest":
      dtos.sort((a, b) => b.totalReviews - a.totalReviews); // placeholder ordering; refined below by createdAt
      break;
    case "highest_rated":
    default:
      dtos.sort(
        (a, b) =>
          b.bayesianRating - a.bayesianRating ||
          b.totalReviews - a.totalReviews,
      );
      break;
  }

  if (filters.sort === "newest") {
    const withCreated = await db.professor.findMany({
      where,
      select: { id: true, createdAt: true },
    });
    const createdMap = new Map(withCreated.map((p) => [p.id, p.createdAt.getTime()]));
    dtos.sort((a, b) => (createdMap.get(b.id) ?? 0) - (createdMap.get(a.id) ?? 0));
  }

  const total = dtos.length;
  const start = (page - 1) * pageSize;
  return { items: dtos.slice(start, start + pageSize), total };
}

export async function getTopProfessors(limit = 4): Promise<ProfessorCardDto[]> {
  const key = `professors:list:top:${limit}`;
  return cached(key, 120, async () => {
    const professors = await db.professor.findMany({ include: professorInclude });
    return professors
      .map(toProfessorCardDto)
      .filter((p) => p.totalReviews > 0)
      .sort(
        (a, b) =>
          b.bayesianRating - a.bayesianRating || b.totalReviews - a.totalReviews,
      )
      .slice(0, limit);
  });
}

export async function getProfessorDetail(id: string): Promise<ProfessorCardDto | null> {
  const professor = await db.professor.findUnique({ where: { id }, include: professorInclude });
  return professor ? toProfessorCardDto(professor) : null;
}

export async function getProfessorCourses(professorId: string) {
  return db.course.findMany({
    where: { professorId },
    orderBy: [{ semester: "desc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      credits: true,
      semester: true,
      description: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function suggestProfessors(q: string, limit = 5): Promise<SuggestItem[]> {
  const normalized = normalizePersian(q);
  if (!normalized) return [];
  const users = await searchProfessorUserIds(normalized);
  if (users !== null && users.length === 0) return [];
  const professors = await db.professor.findMany({
    where: users ? { userId: { in: users } } : {},
    include: professorInclude,
    take: limit * 2,
  });
  return professors
    .map(toProfessorCardDto)
    .filter((p) => p.name.includes(normalized) || !users)
    .slice(0, limit)
    .map((p) => ({ id: p.id, title: p.name, subtitle: p.department }));
}

/** Percentage of reviewers who would take the course again (detail page stat). */
export async function getProfessorTakeAgainRate(professorId: string): Promise<number> {
  const [total, yes] = await Promise.all([
    db.review.count({ where: { professorId } }),
    db.review.count({ where: { professorId, wouldTakeAgain: true } }),
  ]);
  return total > 0 ? Math.round((yes / total) * 100) : 0;
}

/** Rating histogram (1..5 buckets) used by the distribution chart. */
export async function getRatingDistribution(professorId: string) {
  const reviews = await db.review.groupBy({
    by: ["rating"],
    where: { professorId },
    _count: { _all: true },
  });
  const counts = new Map(reviews.map((r) => [r.rating, r._count._all]));
  return [1, 2, 3, 4, 5].map((rating) => ({ rating, count: counts.get(rating) ?? 0 }));
}
