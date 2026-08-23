import { z } from "zod";

const COURSE_CODE_REGEX = /^[A-Z]{2,4}-\d{3}$/;

export const courseCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(COURSE_CODE_REGEX, "کد درس باید به شکل CS-201 یا MATH-301 باشد"),
  name: z.string().trim().min(2, "نام درس را وارد کنید").max(120),
  department: z.enum(["MATH", "CS", "STATS", "OR"], {
    errorMap: () => ({ message: "دپارتمان را انتخاب کنید" }),
  }),
  credits: z.coerce.number().int().min(1, "تعداد واحد معتبر نیست").max(6),
  semester: z.string().trim().min(2, "ترم را وارد کنید").max(40),
  description: z.string().trim().max(2000).optional().default(""),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
