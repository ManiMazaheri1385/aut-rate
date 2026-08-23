import { createHash } from "crypto";
import { db } from "@/lib/db";
import { ok, fail, handleApi, ApiError } from "@/lib/api";
import { sendOtpEmail } from "@/lib/auth/mailer";
import { otpRequestSchema } from "@/lib/validations/auth";
import { cacheGet, cacheSet } from "@/lib/cache";

/**
 * Issues a 6-digit one-time code for @aut.ac.ir emails.
 * In development without SMTP the code is printed to the server console
 * and also returned as `devCode` so the flow is testable.
 */

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function rateLimit(email: string): Promise<void> {
  const key = `otp:req:${email}`;
  const count = ((await cacheGet<number>(key)) ?? 0) + 1;
  if (count > 3) {
    throw new ApiError("تعداد درخواست‌ها بیش از حد مجاز است. چند دقیقه بعد تلاش کنید", 429);
  }
  await cacheSet(key, count, 300); // 3 requests per 5 minutes
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const body = await request.json().catch(() => null);
    const parsed = otpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0]?.message ?? "ایمیل وارد شده معتبر نیست", 422);
    }
    const email = parsed.data.email;

    // Pre-existing suspended accounts are blocked early.
    const existing = await db.user.findUnique({ where: { email } });
    if (existing?.suspended) {
      return fail("حساب کاربری شما تعلیق شده است", 403);
    }

    await rateLimit(email);

    // Invalidate previous unconsumed codes for this address.
    await db.otpCode.updateMany({
      where: { email, consumed: false },
      data: { consumed: true },
    });

    const code = generateCode();
    const codeHash = createHash("sha256")
      .update(`${email}:${code}:${process.env.NEXTAUTH_SECRET}`)
      .digest("hex");

    await db.otpCode.create({
      data: {
        email,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const sent = await sendOtpEmail(email, code);

    // Create the account on first request so authorize() can find it.
    // An email listed in ADMIN_ENV var ADMIN_EMAIL is always granted ADMIN.
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdminEmail = Boolean(adminEmail && email === adminEmail);

    await db.user.upsert({
      where: { email },
      update: isAdminEmail ? { role: "ADMIN" } : {},
      create: {
        email,
        name: email.split("@")[0],
        role: isAdminEmail || existing?.role === "ADMIN" ? "ADMIN" : "STUDENT",
      },
    });

    // Without SMTP (dev), expose the code only in development mode.
    const devCode = process.env.NODE_ENV === "development" && !sent ? code : undefined;
    return ok({ message: "کد تایید به ایمیل شما ارسال شد", devCode });
  });
}
