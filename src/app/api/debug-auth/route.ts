import { auth, currentUser } from "@clerk/nextjs/server";
import { ok, handleApi } from "@/lib/api";

/** TEMPORARY auth diagnostic — remove before final release. */
export async function GET() {
  return handleApi(async () => {
    let userId: string | null = null;
    let authError: string | null = null;
    try {
      const s = await auth();
      userId = s.userId;
    } catch (e) {
      authError = e instanceof Error ? e.message : String(e);
    }
    let userEmail: string | null = null;
    let userError: string | null = null;
    if (userId) {
      try {
        const u = await currentUser();
        userEmail = u?.primaryEmailAddress?.emailAddress ?? null;
      } catch (e) {
        userError = e instanceof Error ? e.message : String(e);
      }
    }
    return ok({ userId, userEmail, authError, userError, hasSessionCookie: true });
  });
}
