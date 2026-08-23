import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Persist an audit entry shown in the admin "لاگ سیستم" tab.
 * Never throws — logging must not break the main flow.
 */
export async function logAction(
  action: string,
  meta?: Record<string, unknown>,
  actor?: { id?: string | null; name?: string | null },
): Promise<void> {
  try {
    await db.systemLog.create({
      data: {
        action,
        meta: (meta ?? undefined) as Prisma.InputJsonValue | undefined,
        actorId: actor?.id ?? undefined,
        actorName: actor?.name ?? undefined,
      },
    });
  } catch (error) {
    console.error("[logger] failed to persist system log:", error);
  }
}
