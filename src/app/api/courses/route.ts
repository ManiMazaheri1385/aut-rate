import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import { courseCreateSchema } from "@/lib/validations/course";
import { getCourseList } from "@/lib/services/courses";
import { logAction } from "@/lib/logger";

/** GET /api/courses?q=&department=&page= */
export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const result = await getCourseList({
      q: url.searchParams.get("q") ?? undefined,
      department: url.searchParams.get("department") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1") || 1,
      pageSize: Number(url.searchParams.get("pageSize") ?? "12") || 12,
    });
    return ok(result);
  });
}

/** POST /api/courses — professors add their own courses; admins can too. */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireRole("PROFESSOR", "ADMIN");
    const body = await request.json().catch(() => null);
    const parsed = courseCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "اطلاعات وارد شده معتبر نیست", 422);
    }

    let professorId: string;
    if (user.role === "ADMIN") {
      // Admins must specify the owning professor explicitly.
      const explicit = (body as Record<string, unknown> | null)?.professorId;
      if (typeof explicit !== "string" || !explicit) {
        throw new ApiError("شناسه استاد ارائه‌دهنده را مشخص کنید", 422);
      }
      professorId = explicit;
    } else {
      const professor = await db.professor.findUnique({ where: { userId: user.id } });
      if (!professor) throw new ApiError("پروفایل استاد یافت نشد", 404);
      professorId = professor.id;
    }

    const exists = await db.course.findUnique({
      where: {
        code_semester: { code: parsed.data.code, semester: parsed.data.semester },
      },
      select: { id: true },
    });
    if (exists) throw new ApiError("این درس با همین کد و ترم قبلاً ثبت شده است", 409);

    const course = await db.course.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        department: parsed.data.department,
        credits: parsed.data.credits,
        semester: parsed.data.semester,
        description: parsed.data.description ?? "",
        professorId,
      },
    });
    await logAction("course.created", { courseId: course.id, code: course.code }, user);
    return ok({ id: course.id });
  });
}
