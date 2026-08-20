"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toNumber, toOptionalString } from "@/lib/lookups";
import { nextNumberTx } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";

export async function createShipment(formData: FormData) {
  await requireUser();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) redirect("/shipments/new?error=Select an invoice");
  const status = String(formData.get("status") ?? "PREPARING");

  const shipment = await prisma.$transaction(async (tx) => {
    const shipmentNumber = await nextNumberTx(tx, "SHP", "SHP");
    return tx.shipment.create({
      data: {
        shipmentNumber,
        invoiceId,
        trackingNumber: toOptionalString(formData.get("trackingNumber")),
        carrier: toOptionalString(formData.get("carrier")),
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        actualCostGbp: toNumber(formData.get("actualCostGbp")),
        actualCostEur: toNumber(formData.get("actualCostEur")),
        status,
        notes: toOptionalString(formData.get("notes")),
        shippedAt: ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(status)
          ? new Date()
          : null,
        deliveredAt: status === "DELIVERED" ? new Date() : null,
      },
    });
  });

  revalidatePath("/shipments");
  redirect(`/shipments/${shipment.id}?ok=Shipment added`);
}

export async function updateShipment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PREPARING");
  await prisma.shipment.update({
    where: { id },
    data: {
      trackingNumber: toOptionalString(formData.get("trackingNumber")),
      carrier: toOptionalString(formData.get("carrier")),
      shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
      shippingCostEur: toNumber(formData.get("shippingCostEur")),
      actualCostGbp: toNumber(formData.get("actualCostGbp")),
      actualCostEur: toNumber(formData.get("actualCostEur")),
      status,
      notes: toOptionalString(formData.get("notes")),
      shippedAt: ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(status)
        ? new Date()
        : null,
      deliveredAt: status === "DELIVERED" ? new Date() : null,
    },
  });
  revalidatePath(`/shipments/${id}`);
  redirect(`/shipments/${id}?ok=Updated`);
}
