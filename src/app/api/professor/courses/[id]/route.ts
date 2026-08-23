import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/guards";
import { logAction } from "@/lib/logger";

interface Params {
  params: { id: string };
}

/** DELETE /api/professor/courses/[id] — owner professor or admin. */
export async function DELETE(_request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const course = await db.course.findUnique({
      where: { id: params.id },
      include: { professor: { include: { user: { select: { id: true } } } } },
    });
    if (!course) throw new ApiError("درس یافت نشد", 404);

    if (user.role !== "ADMIN" && course.professor?.user.id !== user.id) {
      throw new ApiError("شما اجازه این کار را ندارید", 403);
    }

    await db.course.delete({ where: { id: course.id } });
    await logAction("course.deleted", { courseId: course.id, code: course.code }, user);
    return ok({ message: "درس حذف شد" });
  });
}
