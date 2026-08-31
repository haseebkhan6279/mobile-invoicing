import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { nextNumberTx } from "../common/numbers";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderMetaDto } from "./dto/purchase-order.dto";

type NormalizedPoLine = {
  productName: string;
  color: string | null;
  network: string | null;
  grade: string | null;
  qty: number;
  unitCostGbp: number;
};

function normalizeLines(lines: CreatePurchaseOrderDto["lines"]): NormalizedPoLine[] {
  const normalized: NormalizedPoLine[] = [];
  for (const line of lines) {
    const productName = (line.productName ?? "").trim();
    const qty = Number(line.qty) || 0;
    if (!productName || qty <= 0) continue;
    normalized.push({
      productName,
      color: line.color ?? null,
      network: line.network ?? null,
      grade: line.grade ?? null,
      qty,
      unitCostGbp: Number(line.unitCostGbp) || 0,
    });
  }
  return normalized;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  listPurchaseOrders() {
    return this.prisma.purchaseOrder.findMany({
      include: { supplier: true, lines: true, stockUnits: true },
      omit: { attachmentData: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, lines: true, stockUnits: true },
      omit: { attachmentData: true },
    });
    if (!po) throw new NotFoundException("Purchase order not found");
    return po;
  }

  async getAttachment(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      select: { attachmentFilename: true, attachmentMimeType: true, attachmentData: true },
    });
    if (!po) throw new NotFoundException("Purchase order not found");
    if (!po.attachmentData) throw new NotFoundException("No attachment on this purchase order");
    return {
      filename: po.attachmentFilename ?? "attachment",
      mimeType: po.attachmentMimeType ?? "application/octet-stream",
      data: po.attachmentData,
    };
  }

  async setAttachment(id: string, file: { filename: string; mimeType: string; data: Buffer }) {
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Purchase order not found");

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        attachmentFilename: file.filename,
        attachmentMimeType: file.mimeType,
        attachmentData: new Uint8Array(file.data),
      },
      omit: { attachmentData: true },
    });
  }

  async removeAttachment(id: string) {
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Purchase order not found");

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { attachmentFilename: null, attachmentMimeType: null, attachmentData: null },
      omit: { attachmentData: true },
    });
  }

  createPurchaseOrder(input: CreatePurchaseOrderDto) {
    const supplierId = input.supplierId;
    const lines = normalizeLines(input.lines ?? []);
    if (!supplierId) throw new BadRequestException("Select a supplier");
    if (!lines.length) throw new BadRequestException("Add at least one line");

    return this.prisma.$transaction(async (tx) => {
      const poNumber = await nextNumberTx(tx, "PO", "PO");
      return tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          status: input.status ?? "ORDERED",
          notes: input.notes ?? null,
          shippingCostGbp: Number(input.shippingCostGbp) || 0,
          orderedAt: new Date(),
          lines: { create: lines },
        },
      });
    });
  }

  async updatePurchaseOrderMeta(id: string, input: UpdatePurchaseOrderMetaDto) {
    const existing = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Purchase order not found");

    const lines = input.lines ? normalizeLines(input.lines) : null;
    if (lines && !lines.length) throw new BadRequestException("Add at least one line");

    return this.prisma.$transaction(async (tx) => {
      if (lines) {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: input.status ?? "ORDERED",
          notes: input.notes ?? null,
          shippingCostGbp: Number(input.shippingCostGbp) || 0,
          actualCostGbp: Number(input.actualCostGbp) || 0,
          ...(lines ? { lines: { create: lines } } : {}),
        },
        include: { lines: true },
      });
    });
  }
}
