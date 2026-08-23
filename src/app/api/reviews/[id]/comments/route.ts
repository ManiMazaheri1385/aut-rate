import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/guards";
import { commentSchema } from "@/lib/validations/review";

interface Params {
  params: { id: string };
}

/** GET /api/reviews/[id]/comments */
export async function GET(_request: Request, { params }: Params) {
  return handleApi(async () => {
    const comments = await db.comment.findMany({
      where: { reviewId: params.id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    return ok(
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: { id: c.user.id, name: c.user.name, image: c.user.image },
      })),
    );
  });
}

/** POST /api/reviews/[id]/comments */
export async function POST(request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const review = await db.review.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!review) throw new ApiError("نظر یافت نشد", 404);

    const body = await request.json().catch(() => null);
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "متن دیدگاه را بنویسید", 422);
    }

    const comment = await db.comment.create({
      data: {
        reviewId: review.id,
        userId: user.id,
        content: parsed.data.content,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return ok(
      {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.user.id,
          name: comment.user.name,
          image: comment.user.image,
        },
      },
      201,
    );
  });
}
