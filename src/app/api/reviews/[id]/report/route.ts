import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/guards";
import { reportCreateSchema } from "@/lib/validations/report";

interface Params {
  params: { id: string };
}

/** POST /api/reviews/[id]/report */
export async function POST(request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const review = await db.review.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!review) throw new ApiError("نظر یافت نشد", 404);

    const body = await request.json().catch(() => null);
    const parsed = reportCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "دلیل گزارش را انتخاب کنید", 422);
    }

    const alreadyReported = await db.report.findFirst({
      where: { reviewId: review.id, userId: user.id },
      select: { id: true },
    });
    if (alreadyReported) {
      throw new ApiError("شما قبلاً این نظر را گزارش کرده‌اید", 409);
    }

    await db.report.create({
      data: {
        reviewId: review.id,
        userId: user.id,
        reason: parsed.data.reason,
        description: parsed.data.description ?? "",
      },
    });

    return ok({ message: "گزارش شما ثبت شد و بررسی خواهد شد" }, 201);
  });
}
