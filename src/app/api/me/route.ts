import { db } from "@/lib/db";
import { ok, fail, handleApi } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth/guards";
import { studentIdSchema } from "@/lib/validations/auth";
import { logAction } from "@/lib/logger";

/** GET current session user with fresh DB state. */
export async function GET() {
  return handleApi(async () => {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return ok(null);
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        image: true,
        suspended: true,
      },
    });
    return ok(user);
  });
}

/** PATCH own student ID (students only). */
export async function PATCH(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = studentIdSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0]?.message ?? "شناسه دانشجویی باید ۹ رقم باشد", 422);
    }
    // Ensure the ID is not already taken by another account.
    const taken = await db.user.findFirst({
      where: { studentId: parsed.data.studentId, id: { not: user.id } },
      select: { id: true },
    });
    if (taken) {
      return fail("این شناسه دانشجویی قبلاً ثبت شده است", 409);
    }
    await db.user.update({
      where: { id: user.id },
      data: { studentId: parsed.data.studentId },
    });
    await logAction("user.student_id_updated", { studentId: parsed.data.studentId }, user);
    return ok({ message: "شناسه دانشجویی با موفقیت ذخیره شد" });
  });
}
