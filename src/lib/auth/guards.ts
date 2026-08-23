import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { ApiError } from "@/lib/api";
import type { RoleValue } from "@/lib/constants";

/** Current session user or null (never throws). */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** Throws 401 when not signed in. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError("ابتدا وارد حساب کاربری شوید", 401);
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
