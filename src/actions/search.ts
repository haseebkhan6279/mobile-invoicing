"use server";

import { requireUser } from "@/lib/auth-guard";
import { globalSearch as globalSearchService } from "@/lib/modules/search/search.service";

export async function globalSearch(query: string) {
  await requireUser();
  return globalSearchService(query);
}
