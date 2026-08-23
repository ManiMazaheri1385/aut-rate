import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { RoleValue } from "@/lib/constants";

const AUT_DOMAIN = "@aut.ac.ir";

/**
 * Auth guards over Clerk. The exported API mirrors the previous NextAuth-based
 * guards so route handlers and pages keep working unchanged.
 *
 * Users are mirrored into our PostgreSQL `User` table:
 * - New Clerk users get a fresh row on first authenticated request.
 * - Existing rows with a matching email (e.g. seeded professors/students/admin)
 *   are claimed by setting `clerkId`, preserving all related data.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleValue;
  studentId: string | null;
  image: string | null;
  suspended: boolean;
}

/** Current signed-in user (mirrored from Clerk) or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  let userId: string | null = null;
  let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    const authState = await auth();
    userId = authState.userId;
    if (userId) clerkUser = await currentUser();
  } catch {
    // Clerk not configured (missing keys) or unreachable: treat as signed out.
    return null;
  }
  if (!userId) return null;

  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase().trim();

  // Hard server-side restriction: only university emails may act on this app.
  if (!clerkUser || !email || !email.endsWith(AUT_DOMAIN)) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    email.split("@")[0];
  const image = clerkUser.imageUrl || null;

  let user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    const byEmail = await db.user.findUnique({ where: { email } });
    user = byEmail
      ? await db.user.update({
          where: { id: byEmail.id },
          data: { clerkId: userId, name, image },
        })
      : await db.user.create({
          data: { clerkId: userId, email, name, image },
        });
  }

  // Keep the mirrored profile fresh.
  if (user.name !== name || (user.image ?? null) !== image) {
    user = await db.user.update({ where: { id: user.id }, data: { name, image } });
  }

  // Auto-promote the configured administrator email.
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail && email === adminEmail && user.role !== "ADMIN") {
    user = await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }

  return {
    id: user.id,
    name: user.name,
    email,
    role: user.role,
    studentId: user.studentId,
    image: user.image,
    suspended: user.suspended,
  };
}

/** Throws 401 when not signed in, 403 when the account is suspended. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError("ابتدا وارد حساب کاربری شوید", 401);
  if (user.suspended) throw new ApiError("حساب کاربری شما تعلیق شده است", 403);
  return user;
}

/** Throws 403 unless the user has one of the given roles. */
export async function requireRole(...roles: RoleValue[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ApiError("شما اجازه این کار را ندارید", 403);
  return user;
}

/** Students must have a verified 9-digit student ID to post reviews. */
export function hasValidStudentId(studentId?: string | null): boolean {
  return typeof studentId === "string" && /^\d{9}$/.test(studentId);
}
