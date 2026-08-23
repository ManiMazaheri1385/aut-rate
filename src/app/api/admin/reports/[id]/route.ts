import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handleApi, ApiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import { recomputeProfessorAggregate } from "@/lib/aggregates";
import { logAction } from "@/lib/logger";

const patchSchema = z.object({
  action: z.enum(["resolve", "reject"]),
});

interface Params {
  params: { id: string };
}

/**
 * PATCH /api/admin/reports/[id]
 * - resolve: mark resolved AND delete the offending review
 * - reject:  mark rejected, review stays
 */
export async function PATCH(request: Request, { params }: Params) {
  return handleApi(async () => {
    const admin = await requireRole("ADMIN");
    const report = await db.report.findUnique({
      where: { id: params.id },
      include: { review: { select: { id: true, professorId: true } } },
    });
    if (!report) throw new ApiError("گزارش یافت نشد", 404);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("درخواست نامعتبر است", 422);

    if (parsed.data.action === "resolve") {
      if (report.review) {
        await db.review.delete({ where: { id: report.review.id } });
        await recomputeProfessorAggregate(report.review.professorId);
      }
      await db.report.update({
        where: { id: report.id },
        data: { status: "RESOLVED" },
      });
      await logAction("admin.report_resolved", { reportId: report.id }, admin);
      return ok({ message: "گزارش تایید و نظر حذف شد" });
    }

    await db.report.update({ where: { id: report.id }, data: { status: "REJECTED" } });
    await logAction("admin.report_rejected", { reportId: report.id }, admin);
    return ok({ message: "گزارش رد شد" });
  });
}
