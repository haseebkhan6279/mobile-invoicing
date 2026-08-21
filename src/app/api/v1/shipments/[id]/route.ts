import type { NextRequest } from "next/server";
import * as shipmentService from "@/lib/modules/shipments/shipments.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  const shipment = await shipmentService.getShipment(id);
  return ok(shipment);
});

export const PATCH = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const shipment = await shipmentService.updateShipment(id, {
    trackingNumber: body.trackingNumber ?? null,
    carrier: body.carrier ?? null,
    shippingCostGbp: body.shippingCostGbp,
    shippingCostEur: body.shippingCostEur,
    actualCostGbp: body.actualCostGbp,
    actualCostEur: body.actualCostEur,
    status: body.status ?? "PREPARING",
    notes: body.notes ?? null,
  });
  return ok(shipment);
});
