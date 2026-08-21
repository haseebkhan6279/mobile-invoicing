import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { nextNumberTx } from "../common/numbers";
import { DEFAULT_FX_RATE } from "../common/money";
import { CreateInvoiceDto } from "./dto/invoice.dto";

function stockStatusForInvoice(status: string) {
  return status === "PAID" ? "SOLD" : "RESERVED";
}

type NormalizedInvoiceLine = {
  productName: string;
  color: string;
  network: string;
  grade: string;
  qty: number;
  unitPriceGbp: number;
  unitPriceEur: number;
  imeis: string[];
  sortOrder: number;
};

function normalizeLines(lines: CreateInvoiceDto["lines"]): NormalizedInvoiceLine[] {
  const normalized: NormalizedInvoiceLine[] = [];
  lines.forEach((line, i) => {
    const productName = (line.productName ?? "").trim();
    const qty = Number(line.qty) || 0;
    if (!productName || qty <= 0) return;
    normalized.push({
      productName,
      color: (line.color ?? "").toString().trim() || "Black",
      network: (line.network ?? "").toString().trim() || "Unlocked",
      grade: (line.grade ?? "").toString().trim() || "A",
      qty,
      unitPriceGbp: Number(line.unitPriceGbp) || 0,
      unitPriceEur: Number(line.unitPriceEur) || 0,
      imeis: line.imeis ?? [],
      sortOrder: i,
    });
  });
  return normalized;
}

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  listInvoices(status?: string) {
    return this.prisma.invoice.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { orderBy: { sortOrder: "asc" } },
        stockUnits: true,
        shipments: true,
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async createInvoice(input: CreateInvoiceDto) {
    const customerId = input.customerId;
    const status = input.status ?? "PENDING";
    const lines = normalizeLines(input.lines ?? []);

    if (!customerId) throw new BadRequestException("Select a customer");
    if (!lines.length) throw new BadRequestException("Add at least one line");

    for (const line of lines) {
      if (line.imeis.length !== line.qty) {
        throw new BadRequestException(
          `Line ${line.productName}: qty ${line.qty} needs ${line.qty} IMEI(s)`,
        );
      }
    }

    const allImeis = lines.flatMap((line) => line.imeis);
    if (new Set(allImeis).size !== allImeis.length) {
      throw new BadRequestException("Duplicate IMEIs on this invoice");
    }

    const units = await this.prisma.stockUnit.findMany({ where: { imei: { in: allImeis } } });
    if (units.length !== allImeis.length) {
      const found = new Set(units.map((unit) => unit.imei));
      const missing = allImeis.filter((imei) => !found.has(imei));
      throw new BadRequestException(`IMEI not in stock: ${missing.join(", ")}`);
    }
    const unavailable = units.filter((unit) => unit.status !== "IN_STOCK");
    if (unavailable.length) {
      throw new BadRequestException(`Not in stock: ${unavailable.map((u) => u.imei).join(", ")}`);
    }

    const entity = input.entity ?? "UK";

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber =
        entity === "NI"
          ? await nextNumberTx(tx, "INV_NI", "N", "")
          : await nextNumberTx(tx, "INV_UK", "", "");
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          entity,
          customerId,
          status,
          fxRate: input.fxRate ?? DEFAULT_FX_RATE,
          shippingCostGbp: Number(input.shippingCostGbp) || 0,
          shippingCostEur: Number(input.shippingCostEur) || 0,
          shippingLabel: input.shippingLabel ?? null,
          paymentTerms: input.paymentTerms ?? "Immediate",
          warrantyTerms: input.warrantyTerms ?? "3 months",
          notes: input.notes ?? null,
          paidAt: status === "PAID" ? new Date() : null,
          lines: {
            create: lines.map((line) => ({
              qty: line.qty,
              productName: line.productName,
              color: line.color,
              network: line.network,
              grade: line.grade,
              unitPriceGbp: line.unitPriceGbp,
              unitPriceEur: line.unitPriceEur,
              sortOrder: line.sortOrder,
            })),
          },
        },
        include: { lines: true },
      });

      const unitByImei = new Map(units.map((unit) => [unit.imei, unit]));
      const nextStatus = stockStatusForInvoice(status);
      for (const line of created.lines) {
        const source = lines[line.sortOrder];
        for (const imei of source.imeis) {
          const unit = unitByImei.get(imei);
          if (!unit) continue;
          await tx.stockUnit.update({
            where: { id: unit.id },
            data: { status: nextStatus, invoiceId: created.id, invoiceLineId: line.id },
          });
        }
      }
      return created;
    });
  }

  async updateInvoiceStatus(id: string, status: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { stockUnits: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: { status, paidAt: status === "PAID" ? new Date() : null },
      });
      const unitStatus = stockStatusForInvoice(status);
      for (const unit of invoice.stockUnits) {
        if (unit.status === "RMA" || unit.status === "FAULTY") continue;
        await tx.stockUnit.update({ where: { id: unit.id }, data: { status: unitStatus } });
      }
      return updated;
    });
  }
}
