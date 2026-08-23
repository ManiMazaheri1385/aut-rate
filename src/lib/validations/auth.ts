import { z } from "zod";

// All validation messages are Persian.

export const AUT_EMAIL_DOMAIN = "@aut.ac.ir";

export const otpRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "ایمیل وارد شده معتبر نیست")
    .email("ایمیل وارد شده معتبر نیست")
    .refine((v) => v.endsWith(AUT_EMAIL_DOMAIN), {
      message: "فقط ایمیل‌های دانشگاهی @aut.ac.ir پذیرفته می‌شود",
    }),
});

export const otpVerifySchema = z.object({
  email: otpRequestSchema.shape.email,
  code: z.string().regex(/^\d{6}$/, "کد تایید باید ۶ رقم باشد"),
});

export const studentIdSchema = z.object({
  studentId: z.string().trim().regex(/^\d{9}$/, "شناسه دانشجویی باید ۹ رقم باشد"),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
