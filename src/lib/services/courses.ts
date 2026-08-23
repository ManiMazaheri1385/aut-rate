import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizePersian } from "@/lib/utils";
import { safe } from "@/lib/safe";
import type { CourseDto, Paginated, SuggestItem } from "@/types";

/**
 * Course read services.
 */

const courseInclude = {
  professor: { include: { user: { select: { name: true } } }, select: false as never },
} as const;

export async function getCourseList(opts: {
  q?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<CourseDto>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 12;

  const where: Prisma.CourseWhereInput = {};
  if (opts.department && opts.department !== "all") {
    where.department = opts.department as never;
  }
  const q = opts.q ? normalizePersian(opts.q) : "";
  if (q) {
    where.OR = [
      { code: { contains: q.toUpperCase() } },
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const [total, courses] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      orderBy: [{ semester: "desc" }, { code: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        professor: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { reviews: true } },
        reviews: { select: { rating: true } },
      },
    }),
  ]);

  return {
    items: courses.map(mapCourse),
    total,
  };
}

type CourseWithMeta = Prisma.CourseGetPayload<{
  include: {
    professor: { select: { id: true; user: { select: { name: true } } } };
    _count: { select: { reviews: true } };
    reviews: { select: { rating: true } };
  };
}>;

function mapCourse(c: CourseWithMeta): CourseDto {
  const avg =
    c.reviews.length > 0
      ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length
      : 0;
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    department: c.department,
    credits: c.credits,
    description: c.description,
    semester: c.semester,
    professorId: c.professor?.id ?? null,
    professorName: c.professor?.user.name ?? null,
    totalReviews: c._count.reviews,
    avgRating: avg,
  };
}

export async function getCourseDetail(id: string): Promise<CourseDto | null> {
  const course = await db.course.findUnique({
    where: { id },
    include: {
      professor: { select: { id: true, user: { select: { name: true } } } },
      _count: { select: { reviews: true } },
      reviews: { select: { rating: true } },
    },
  });
  void courseInclude;
  return course ? mapCourse(course) : null;
}

/** Professors teaching the same-named/same-department courses ("استادان مرتبط"). */
export async function getRelatedProfessors(courseId: string, limit = 4) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { department: true },
  });
  if (!course) return [];
  const professors = await db.professor.findMany({
    where: { department: course.department },
    include: {
      user: { select: { name: true, image: true } },
      aggregate: true,
    },
    take: limit + 1,
  });
  return professors.map((p) => ({
    id: p.id,
    name: p.user.name,
    image: p.user.image,
    totalReviews: p.aggregate?.totalReviews ?? 0,
  }));
}

export async function suggestCourses(q: string, limit = 5): Promise<SuggestItem[]> {
  const normalized = normalizePersian(q);
  if (!normalized) return [];
  const courses = await db.course.findMany({
    where: {
      OR: [
        { code: { contains: normalized.toUpperCase() } },
        { name: { contains: normalized } },
      ],
    },
    select: { id: true, code: true, name: true, semester: true },
    take: limit,
  });
  return courses.map((c) => ({
    id: c.id,
    title: `${c.name} (${c.code})`,
    subtitle: c.semester,
  }));
}

/** Home page latest reviews. */
export async function safeLatestReviews(limit = 6) {
  return safe(async () => {
    return db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        course: { select: { id: true, code: true, name: true } },
        professor: {
          select: {
            id: true,
            user: { select: { name: true } },
            department: true,
          },
        },
      },
    });
  }, []);
}
