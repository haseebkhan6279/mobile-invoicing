import { prisma } from "@/lib/prisma";
import { nextNumberTx } from "@/lib/numbers";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { ShipmentInput } from "./dto/shipment.dto";

export type { ShipmentInput };

function shipmentDates(status: string) {
  return {
    shippedAt: ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(status) ? new Date() : null,
    deliveredAt: status === "DELIVERED" ? new Date() : null,
  };
}

export async function listShipments() {
  return prisma.shipment.findMany({
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getShipment(id: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { invoice: { include: { customer: true } } },
  });
  if (!shipment) throw new NotFoundError("Shipment not found");
  return shipment;
}

export async function createShipment(input: ShipmentInput) {
  const invoiceId = input.invoiceId ?? "";
  if (!invoiceId) throw new ValidationError("Select an invoice");
  const status = input.status ?? "PREPARING";

  return prisma.$transaction(async (tx) => {
    const shipmentNumber = await nextNumberTx(tx, "SHP", "SHP");
    return tx.shipment.create({
      data: {
        shipmentNumber,
        invoiceId,
        trackingNumber: input.trackingNumber ?? null,
        carrier: input.carrier ?? null,
        shippingCostGbp: Number(input.shippingCostGbp) || 0,
        shippingCostEur: Number(input.shippingCostEur) || 0,
        actualCostGbp: Number(input.actualCostGbp) || 0,
        actualCostEur: Number(input.actualCostEur) || 0,
        status,
        notes: input.notes ?? null,
        ...shipmentDates(status),
      },
    });
  });
}

export async function updateShipment(id: string, input: ShipmentInput) {
  const status = input.status ?? "PREPARING";
  return prisma.shipment.update({
    where: { id },
    data: {
      trackingNumber: input.trackingNumber ?? null,
      carrier: input.carrier ?? null,
      shippingCostGbp: Number(input.shippingCostGbp) || 0,
      shippingCostEur: Number(input.shippingCostEur) || 0,
      actualCostGbp: Number(input.actualCostGbp) || 0,
      actualCostEur: Number(input.actualCostEur) || 0,
      status,
      notes: input.notes ?? null,
      ...shipmentDates(status),
    },
  });
}
