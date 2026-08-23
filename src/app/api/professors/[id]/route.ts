import { db } from "@/lib/db";
import { ok, fail, handleApi, ApiError } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth/guards";
import { professorProfileSchema } from "@/lib/validations/professor";
import { getProfessorDetail, getProfessorCourses } from "@/lib/services/professors";
import { logAction } from "@/lib/logger";

interface Params {
  params: { id: string };
}

/** GET /api/professors/[id] */
export async function GET(_request: Request, { params }: Params) {
  return handleApi(async () => {
    const detail = await getProfessorDetail(params.id);
    if (!detail) throw new ApiError("استاد یافت نشد", 404);
    const courses = await getProfessorCourses(params.id);
    return ok({ professor: detail, courses });
  });
}

/** PATCH /api/professors/[id] — professor edits own profile (or admin). */
export async function PATCH(request: Request, { params }: Params) {
  return handleApi(async () => {
    const user = await requireUser();
    const professor = await db.professor.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true } } },
    });
    if (!professor) throw new ApiError("استاد یافت نشد", 404);
    if (professor.userId !== user.id && user.role !== "ADMIN") {
      throw new ApiError("شما اجازه این کار را ندارید", 403);
    }

    const body = await request.json().catch(() => null);
    const parsed = professorProfileSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0]?.message ?? "اطلاعات وارد شده معتبر نیست", 422);
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
    if (parsed.data.researchInterests !== undefined) data.researchInterests = parsed.data.researchInterests;
    if (parsed.data.personalLink !== undefined) data.personalLink = parsed.data.personalLink || null;
    if (parsed.data.photoUrl !== undefined) data.photoUrl = parsed.data.photoUrl || null;

    await db.professor.update({ where: { id: professor.id }, data });
    await logAction("professor.profile_updated", { professorId: professor.id }, user);
    return ok({ message: "پروفایل با موفقیت بروزرسانی شد" });
  });
}

/** GET helper used by the professor's own dashboard. */
export async function OPTIONS() {
  return handleApi(async () => {
    const user = await getSessionUser();
    return ok(user ? { authenticated: true } : { authenticated: false });
  });
}
