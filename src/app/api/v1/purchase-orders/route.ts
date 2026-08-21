import type { NextRequest } from "next/server";
import * as poService from "@/lib/modules/purchase-orders/purchase-orders.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async () => {
  const orders = await poService.listPurchaseOrders();
  return ok(orders);
});

export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const po = await poService.createPurchaseOrder({
    supplierId: String(body.supplierId ?? ""),
    status: body.status ?? "ORDERED",
    notes: body.notes ?? null,
    shippingCostGbp: body.shippingCostGbp,
    shippingCostEur: body.shippingCostEur,
    fxRate: body.fxRate,
    lines: Array.isArray(body.lines) ? body.lines : [],
  });
  return ok(po, 201);
});
