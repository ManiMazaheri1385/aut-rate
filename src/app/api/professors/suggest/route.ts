import { ok, handleApi } from "@/lib/api";
import { suggestProfessors } from "@/lib/services/professors";
import { suggestCourses } from "@/lib/services/courses";

/** GET /api/professors/suggest?q= — autocomplete for names and course codes. */
export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return ok({ professors: [], courses: [] });
    }
    const [professors, courses] = await Promise.all([
      suggestProfessors(q),
      suggestCourses(q),
    ]);
    return ok({ professors, courses });
  });
}
