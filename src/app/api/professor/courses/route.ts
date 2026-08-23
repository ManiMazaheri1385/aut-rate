import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import { courseCreateSchema } from "@/lib/validations/course";
import { getProfessorCourses } from "@/lib/services/professors";
import { logAction } from "@/lib/logger";

/** GET /api/professor/courses — courses of the signed-in professor. */
export async function GET() {
  return handleApi(async () => {
    const user = await requireRole("PROFESSOR", "ADMIN");
    const professor = await db.professor.findUnique({ where: { userId: user.id } });
    if (!professor) throw new ApiError("پروفایل استاد یافت نشد", 404);
    const courses = await getProfessorCourses(professor.id);
    return ok(courses);
  });
}

/** POST /api/professor/courses — add a new taught course. */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireRole("PROFESSOR", "ADMIN");
    const professor = await db.professor.findUnique({ where: { userId: user.id } });
    if (!professor) throw new ApiError("پروفایل استاد یافت نشد", 404);

    const body = await request.json().catch(() => null);
    const parsed = courseCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "اطلاعات وارد شده معتبر نیست", 422);
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
        professorId: professor.id,
      },
    });
    await logAction("course.created", { courseId: course.id }, user);
    return ok({ id: course.id }, 201);
  });
}
