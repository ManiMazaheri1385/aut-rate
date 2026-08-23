import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/guards";
import { reviewUpdateSchema } from "@/lib/validations/review";
import { recomputeProfessorAggregate } from "@/lib/aggregates";
import { logAction } from "@/lib/logger";

const EDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface Params {
  params: { id: string };
}

/** PATCH /api/reviews/[id] — owner within 30 days, or admin. */
export async function PATCH(request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const review = await db.review.findUnique({ where: { id: params.id } });
    if (!review) throw new ApiError("نظر یافت نشد", 404);

    const isOwner = review.studentId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) throw new ApiError("امکان ویرایش نظر دیگران وجود ندارد", 403);
    if (isOwner && !isAdmin && Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new ApiError("مهلت ویرایش این نظر گذشته است", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = reviewUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "اطلاعات وارد شده معتبر نیست", 422);
    }

    await db.review.update({
      where: { id: review.id },
      data: {
        ...(parsed.data.rating !== undefined ? { rating: parsed.data.rating } : {}),
        ...(parsed.data.difficulty !== undefined ? { difficulty: parsed.data.difficulty } : {}),
        ...(parsed.data.wouldTakeAgain !== undefined
          ? { wouldTakeAgain: parsed.data.wouldTakeAgain }
          : {}),
        ...(parsed.data.comment !== undefined ? { comment: parsed.data.comment } : {}),
        ...(parsed.data.anonymous !== undefined ? { anonymous: parsed.data.anonymous } : {}),
      },
    });
    await recomputeProfessorAggregate(review.professorId);
    await logAction("review.updated", { reviewId: review.id }, user);
    return ok({ message: "نظر با موفقیت ویرایش شد" });
  });
}

/** DELETE /api/reviews/[id] — owner within 30 days, or admin/moderator. */
export async function DELETE(_request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const review = await db.review.findUnique({ where: { id: params.id } });
    if (!review) throw new ApiError("نظر یافت نشد", 404);

    const isOwner = review.studentId === user.id;
    const isModerator = user.role === "ADMIN";
    if (!isOwner && !isModerator) throw new ApiError("شما اجازه این کار را ندارید", 403);
    if (isOwner && !isModerator && Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      throw new ApiError("مهلت حذف این نظر گذشته است", 403);
    }

    await db.review.delete({ where: { id: review.id } });
    await recomputeProfessorAggregate(review.professorId);
    await logAction(
      "review.deleted",
      { reviewId: review.id, byOwner: isOwner },
      user,
    );
    return ok({ message: "نظر حذف شد" });
  });
}
