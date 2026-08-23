import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ok, fail, handleApi, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** POST /api/upload — professor profile photo (multipart/form-data, field: file). */
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await requireRole("PROFESSOR", "ADMIN");

    // Serverless platforms (Vercel) have a read-only filesystem:
    // guide users to the image URL field instead.
    if (process.env.VERCEL) {
      return fail("در حالت استقرار ابری امکان آپلود فایل وجود ندارد؛ از گزینه آدرس تصویر استفاده کنید", 501);
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("فایلی ارسال نشده است", 422);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return fail("فرمت فایل تصویر معتبر نیست", 422);
    }
    if (file.size > MAX_SIZE_BYTES) {
      return fail("حجم فایل باید کمتر از ۲ مگابایت باشد", 422);
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

    // Persist directly on the user's avatar.
    await db.user.update({
      where: { id: user.id },
      data: { image: `/uploads/${fileName}` },
    });
    await logAction("upload.photo", { fileName }, user);

    return ok({ url: `/uploads/${fileName}` }, 201);
  });
}
