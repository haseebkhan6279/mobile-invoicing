import type { NextRequest } from "next/server";
import * as shipmentService from "@/lib/modules/shipments/shipments.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async () => {
  const shipments = await shipmentService.listShipments();
  return ok(shipments);
});

export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const shipment = await shipmentService.createShipment({
    invoiceId: String(body.invoiceId ?? ""),
    trackingNumber: body.trackingNumber ?? null,
    carrier: body.carrier ?? null,
    shippingCostGbp: body.shippingCostGbp,
    shippingCostEur: body.shippingCostEur,
    actualCostGbp: body.actualCostGbp,
    actualCostEur: body.actualCostEur,
    status: body.status ?? "PREPARING",
    notes: body.notes ?? null,
  });
  return ok(shipment, 201);
});
