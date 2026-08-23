import { db } from "@/lib/db";
import { ok, fail, handleApi, ApiError } from "@/lib/api";
import { getSessionUser, requireUser, hasValidStudentId } from "@/lib/auth/guards";
import { reviewCreateSchema } from "@/lib/validations/review";
import { getReviews } from "@/lib/services/reviews";
import { recomputeProfessorAggregate } from "@/lib/aggregates";
import { logAction } from "@/lib/logger";

/** GET /api/reviews?professorId=&courseId=&take=&skip= */
export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const user = await getSessionUser();
    const result = await getReviews({
      professorId: url.searchParams.get("professorId") ?? undefined,
      courseId: url.searchParams.get("courseId") ?? undefined,
      viewerId: user?.id,
      take: Math.min(Number(url.searchParams.get("take") ?? "20") || 20, 50),
      skip: Number(url.searchParams.get("skip") ?? "0") || 0,
      orderBy: url.searchParams.get("orderBy") === "helpful" ? "helpful" : "newest",
    });
    return ok(result);
  });
}

/** POST /api/reviews — students with a verified 9-digit student ID. */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();

    if (user.role === "PROFESSOR") {
      throw new ApiError("اساتید امکان ثبت نظر ندارند", 403);
    }
    if (!hasValidStudentId(user.studentId)) {
      throw new ApiError(
        "برای ثبت نظر باید شناسه دانشجویی ۹ رقمی خود را در داشبورد وارد کنید",
        403,
      );
    }

    // Suspended check against fresh DB state.
    const fresh = await db.user.findUnique({
      where: { id: user.id },
      select: { suspended: true },
    });
    if (fresh?.suspended) throw new ApiError("حساب کاربری شما تعلیق شده است", 403);

    const body = await request.json().catch(() => null);
    const parsed = reviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0]?.message ?? "اطلاعات وارد شده معتبر نیست", 422);
    }
    const input = parsed.data;

    const [course, professor] = await Promise.all([
      db.course.findUnique({ where: { id: input.courseId }, select: { id: true, professorId: true } }),
      db.professor.findUnique({ where: { id: input.professorId }, select: { id: true } }),
    ]);
    if (!course) throw new ApiError("درس یافت نشد", 404);
    if (!professor) throw new ApiError("استاد یافت نشد", 404);

    // The review's course must belong to the selected professor.
    if (course.professorId !== professor.id) {
      throw new ApiError("این درس با استاد انتخاب‌شده همخوانی ندارد", 422);
    }

    const duplicate = await db.review.findUnique({
      where: {
        studentId_courseId_professorId: {
          studentId: user.id,
          courseId: input.courseId,
          professorId: input.professorId,
        },
      },
      select: { id: true },
    });
    if (duplicate) throw new ApiError("قبلاً برای این درس نظر ثبت کرده‌اید", 409);

    const review = await db.review.create({
      data: {
        studentId: user.id,
        courseId: input.courseId,
        professorId: input.professorId,
        rating: input.rating,
        difficulty: input.difficulty,
        wouldTakeAgain: input.wouldTakeAgain,
        comment: input.comment,
        anonymous: input.anonymous,
      },
    });

    await recomputeProfessorAggregate(input.professorId);
    await logAction("review.created", { reviewId: review.id }, user);

    return ok({ id: review.id }, 201);
  });
}
