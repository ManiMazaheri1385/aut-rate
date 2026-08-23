import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import { replySchema } from "@/lib/validations/review";

interface Params {
  params: { id: string };
}

/** POST /api/reviews/[id]/reply — the reviewed professor answers a review. */
export async function POST(request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireRole("PROFESSOR", "ADMIN");

    const review = await db.review.findUnique({
      where: { id: params.id },
      include: { professor: { include: { user: { select: { id: true } } } } },
    });
    if (!review) throw new ApiError("نظر یافت نشد", 404);

    if (
      user.role !== "ADMIN" &&
      review.professor.user.id !== user.id
    ) {
      throw new ApiError("شما اجازه این کار را ندارید", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "پاسخ را بنویسید", 422);
    }

    await db.review.update({
      where: { id: review.id },
      data: { reply: parsed.data.reply, repliedAt: new Date() },
    });

    return ok({ message: "پاسخ شما ثبت شد" });
  });
}
