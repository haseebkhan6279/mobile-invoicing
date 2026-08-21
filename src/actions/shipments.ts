"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toNumber, toOptionalString } from "@/lib/lookups";
import * as shipmentService from "@/lib/modules/shipments/shipments.service";
import { ServiceError } from "@/lib/api/errors";

export async function createShipment(formData: FormData) {
  await requireUser();

  let shipment;
  try {
    shipment = await shipmentService.createShipment({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      trackingNumber: toOptionalString(formData.get("trackingNumber")),
      carrier: toOptionalString(formData.get("carrier")),
      shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
      shippingCostEur: toNumber(formData.get("shippingCostEur")),
      actualCostGbp: toNumber(formData.get("actualCostGbp")),
      actualCostEur: toNumber(formData.get("actualCostEur")),
      status: String(formData.get("status") ?? "PREPARING"),
      notes: toOptionalString(formData.get("notes")),
    });
  } catch (err) {
    if (err instanceof ServiceError) redirect(`/shipments/new?error=${encodeURIComponent(err.message)}`);
    throw err;
  }

  revalidatePath("/shipments");
  redirect(`/shipments/${shipment.id}?ok=Shipment added`);
}

export async function updateShipment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  await shipmentService.updateShipment(id, {
    trackingNumber: toOptionalString(formData.get("trackingNumber")),
    carrier: toOptionalString(formData.get("carrier")),
    shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
    shippingCostEur: toNumber(formData.get("shippingCostEur")),
    actualCostGbp: toNumber(formData.get("actualCostGbp")),
    actualCostEur: toNumber(formData.get("actualCostEur")),
    status: String(formData.get("status") ?? "PREPARING"),
    notes: toOptionalString(formData.get("notes")),
  });
  revalidatePath(`/shipments/${id}`);
  redirect(`/shipments/${id}?ok=Updated`);
}
