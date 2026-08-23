import { z } from "zod";

const ratingField = z.coerce
  .number({ invalid_type_error: "امتیاز بین ۱ تا ۵ باید باشد" })
  .int("امتیاز بین ۱ تا ۵ باید باشد")
  .min(1, "امتیاز بین ۱ تا ۵ باید باشد")
  .max(5, "امتیاز بین ۱ تا ۵ باید باشد");

const difficultyField = z.coerce
  .number({ invalid_type_error: "سطح دشواری بین ۱ تا ۵ باید باشد" })
  .int("سطح دشواری بین ۱ تا ۵ باید باشد")
  .min(1, "سطح دشواری بین ۱ تا ۵ باید باشد")
  .max(5, "سطح دشواری بین ۱ تا ۵ باید باشد");

export const reviewCreateSchema = z.object({
  professorId: z.string().cuid("استاد را انتخاب کنید"),
  courseId: z.string().cuid("درس را انتخاب کنید"),
  rating: ratingField,
  difficulty: difficultyField,
  wouldTakeAgain: z.boolean(),
  comment: z.string().trim().min(20, "حداقل ۲۰ کاراکتر وارد کنید").max(4000),
  anonymous: z.boolean().default(false),
});

export const reviewUpdateSchema = reviewCreateSchema.omit({ professorId: true, courseId: true }).partial();

export const replySchema = z.object({
  reply: z.string().trim().min(2, "پاسخ را بنویسید").max(2000),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "متن دیدگاه را بنویسید").max(1000),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
