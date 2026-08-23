import { z } from "zod";

export const reportCreateSchema = z.object({
  reason: z.enum(["SPAM", "OFFENSIVE", "INACCURATE", "OTHER"], {
    errorMap: () => ({ message: "دلیل گزارش را انتخاب کنید" }),
  }),
  description: z.string().trim().max(1000).optional().default(""),
});

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
