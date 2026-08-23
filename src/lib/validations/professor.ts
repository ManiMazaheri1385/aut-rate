import { z } from "zod";

export const professorProfileSchema = z.object({
  bio: z.string().trim().max(4000, "متن بیوگرافی طولانی‌تر از حد مجاز است").optional(),
  researchInterests: z.array(z.string().trim().min(1)).max(15).optional(),
  personalLink: z
    .string()
    .trim()
    .url("آدرس لینک معتبر نیست")
    .or(z.literal(""))
    .optional(),
  photoUrl: z
    .string()
    .trim()
    .url("آدرس تصویر معتبر نیست")
    .or(z.literal(""))
    .optional(),
});

export type ProfessorProfileInput = z.infer<typeof professorProfileSchema>;
