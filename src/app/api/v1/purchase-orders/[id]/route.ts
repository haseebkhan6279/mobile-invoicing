import type { NextRequest } from "next/server";
import * as poService from "@/lib/modules/purchase-orders/purchase-orders.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  const po = await poService.getPurchaseOrder(id);
  return ok(po);
});

export const PATCH = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const po = await poService.updatePurchaseOrderMeta(id, {
    status: body.status ?? "ORDERED",
    notes: body.notes ?? null,
    shippingCostGbp: body.shippingCostGbp,
    shippingCostEur: body.shippingCostEur,
    actualCostGbp: body.actualCostGbp,
    actualCostEur: body.actualCostEur,
    fxRate: body.fxRate,
  });
  return ok(po);
});
