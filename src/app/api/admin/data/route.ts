import { db } from "@/lib/db";
import { ok, handleApi } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";

/**
 * GET /api/admin/data?section=users|reviews|reports|logs
 * Single read endpoint powering the admin panel tabs.
 */
export async function GET(request: Request) {
  return handleApi(async () => {
    await requireRole("ADMIN");
    const url = new URL(request.url);
    const section = url.searchParams.get("section") ?? "users";

    switch (section) {
      case "reviews": {
        const reviews = await db.review.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            student: { select: { name: true, email: true } },
            course: { select: { code: true, name: true } },
            professor: { include: { user: { select: { name: true } } } },
          },
        });
        return ok(
          reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            difficulty: r.difficulty,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            studentName: r.student.name,
            studentEmail: r.student.email,
            courseCode: r.course.code,
            courseName: r.course.name,
            professorName: r.professor.user.name,
          })),
        );
      }
      case "reports": {
        const reports = await db.report.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            review: {
              select: { comment: true, rating: true },
            },
            user: { select: { name: true, email: true } },
          },
        });
        return ok(
          reports.map((r) => ({
            id: r.id,
            reason: r.reason,
            description: r.description,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            reporterName: r.user.name,
            reporterEmail: r.user.email,
            reviewComment: r.review?.comment ?? null,
            reviewId: r.reviewId,
          })),
        );
      }
      case "courses": {
        const courses = await db.course.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          include: {
            professor: { include: { user: { select: { name: true } } } },
            _count: { select: { reviews: true } },
          },
        });
        return ok(
          courses.map((c) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            semester: c.semester,
            credits: c.credits,
            department: c.department,
            professorName: c.professor?.user.name ?? null,
            reviewsCount: c._count.reviews,
          })),
        );
      }
      case "users": {
        const users = await db.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            studentId: true,
            suspended: true,
            createdAt: true,
            _count: { select: { reviews: true } },
          },
        });
        return ok(
          users.map((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            reviewsCount: u._count.reviews,
          })),
        );
      }
      default: {
        // section === "logs"
        const logs = await db.systemLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        });
        return ok(
          logs.map((l) => ({
            id: l.id,
            action: l.action,
            meta: l.meta,
            actorName: l.actorName,
            createdAt: l.createdAt.toISOString(),
          })),
        );
      }
    }
  });
}
