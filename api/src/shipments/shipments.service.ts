import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { nextNumberTx } from "../common/numbers";
import { CreateShipmentDto, UpdateShipmentDto } from "./dto/shipment.dto";

function shipmentDates(status: string) {
  return {
    shippedAt: ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(status) ? new Date() : null,
    deliveredAt: status === "DELIVERED" ? new Date() : null,
  };
}

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  listShipments() {
    return this.prisma.shipment.findMany({
      include: { invoice: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getShipment(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { invoice: { include: { customer: true } } },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  createShipment(input: CreateShipmentDto) {
    const invoiceId = input.invoiceId ?? "";
    if (!invoiceId) throw new BadRequestException("Select an invoice");
    const status = input.status ?? "PREPARING";

    return this.prisma.$transaction(async (tx) => {
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

  updateShipment(id: string, input: UpdateShipmentDto) {
    const status = input.status ?? "PREPARING";
    return this.prisma.shipment.update({
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
}
