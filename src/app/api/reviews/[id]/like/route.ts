import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/guards";
import { recomputeProfessorAggregate } from "@/lib/aggregates";

interface Params {
  params: { id: string };
}

/** POST /api/reviews/[id]/like — toggles the like for the signed-in user. */
export async function POST(_request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const review = await db.review.findUnique({
      where: { id: params.id },
      select: { id: true, professorId: true },
    });
    if (!review) throw new ApiError("نظر یافت نشد", 404);

    const existingLike = await db.like.findUnique({
      where: { reviewId_userId: { reviewId: review.id, userId: user.id } },
      select: { id: true },
    });

    let liked: boolean;
    if (existingLike) {
      await db.like.delete({ where: { id: existingLike.id } });
      await db.review.update({
        where: { id: review.id },
        data: { helpfulCount: { decrement: 1 } },
      });
      liked = false;
    } else {
      await db.like.create({ data: { reviewId: review.id, userId: user.id } });
      await db.review.update({
        where: { id: review.id },
        data: { helpfulCount: { increment: 1 } },
      });
      liked = true;
    }

    const helpfulCount = await db.like.count({ where: { reviewId: review.id } });
    await recomputeProfessorAggregate(review.professorId);

    return ok({ liked, helpfulCount });
  });
}
