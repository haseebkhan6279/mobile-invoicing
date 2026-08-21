import type { NextRequest } from "next/server";
import * as stockService from "@/lib/modules/stock/stock.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

// Mirrors receivePurchaseOrder in src/actions/purchase-orders.ts, which forwards to
// receiveStockBatches with postLedger forced on (fromPo: true).
export const POST = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = await stockService.receiveStockBatches({
    supplierId: body.supplierId ?? null,
    purchaseOrderId: id,
    postLedger: true,
    batches: Array.isArray(body.batches) ? body.batches : [],
  });
  return ok(result, 201);
});
