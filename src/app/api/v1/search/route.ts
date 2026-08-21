import type { NextRequest } from "next/server";
import { globalSearch } from "@/lib/modules/search/search.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await globalSearch(q);
  return ok(results);
});
