import type { NextRequest } from "next/server";
import * as stockService from "@/lib/modules/stock/stock.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const units = await stockService.listStock({
    status: params.get("status") ?? undefined,
    grade: params.get("grade") ?? undefined,
    q: params.get("q") ?? undefined,
  });
  return ok(units);
});

// Mirrors addStock / receiveStockBatches in src/actions/stock.ts.
export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const result = await stockService.receiveStockBatches({
    supplierId: body.supplierId ?? null,
    purchaseOrderId: body.purchaseOrderId ?? null,
    postLedger: Boolean(body.postLedger),
    batches: Array.isArray(body.batches) ? body.batches : [],
  });
  return ok(result, 201);
});
