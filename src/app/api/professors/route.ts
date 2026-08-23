import { db } from "@/lib/db";
import { ok, handleApi } from "@/lib/api";
import { cached } from "@/lib/cache";
import type { Paginated, ProfessorCardDto, ProfessorListFilters } from "@/types";
import { getProfessorList } from "@/lib/services/professors";

/** GET /api/professors?q=&department=&sort=&page= */
export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const filters: ProfessorListFilters = {
      q: url.searchParams.get("q") ?? undefined,
      department: url.searchParams.get("department") ?? undefined,
      sort: (url.searchParams.get("sort") as ProfessorListFilters["sort"]) ?? "highest_rated",
      page: Number(url.searchParams.get("page") ?? "1") || 1,
      pageSize: Number(url.searchParams.get("pageSize") ?? "12") || 12,
    };
    const key = `professors:list:${JSON.stringify(filters)}`;
    const result = await cached<Paginated<ProfessorCardDto>>(key, 60, () => getProfessorList(filters));
    return ok(result);
  });
}

export async function POST() {
  return handleApi(async () => {
    // Placeholder to keep method surface explicit; creation happens via admin flows.
    void db;
    void ok;
    throw new Error("Method not allowed");
  });
}
