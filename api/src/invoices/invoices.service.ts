import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { nextNumberTx } from "../common/numbers";
import { DEFAULT_FX_RATE } from "../common/money";
import { applyCreditToInvoiceTx, rmaTotals } from "../common/rma";
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
    const imeis = (line.imeis ?? []).map((imei) => imei.trim()).filter(Boolean);
    normalized.push({
      productName,
      color: (line.color ?? "").toString().trim() || "Black",
      network: (line.network ?? "").toString().trim() || "Unlocked",
      grade: (line.grade ?? "").toString().trim() || "A",
      qty,
      unitPriceGbp: Number(line.unitPriceGbp) || 0,
      unitPriceEur: Number(line.unitPriceEur) || 0,
      imeis,
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
      if (line.imeis.length > line.qty) {
        throw new BadRequestException(
          `Line ${line.productName}: cannot list more IMEIs than the qty (${line.qty})`,
        );
      }
    }

    const allImeis = lines.flatMap((line) => line.imeis);
    if (new Set(allImeis).size !== allImeis.length) {
      throw new BadRequestException("Duplicate IMEIs on this invoice");
    }

    // Stock levels are not a hard gate here: an invoice can be created even
    // when the product is out of stock or an IMEI isn't recognised yet.
    // Any IMEI that does match a real, available StockUnit is still linked
    // below for inventory tracking (best effort, never blocking).
    const units = allImeis.length
      ? await this.prisma.stockUnit.findMany({ where: { imei: { in: allImeis } } })
      : [];

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
              imeis: line.imeis,
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
          // Best effort only: an IMEI with no matching stock unit, or one
          // that isn't currently IN_STOCK, is still saved on the line but
          // simply isn't linked for inventory tracking.
          if (!unit || unit.status !== "IN_STOCK") continue;
          await tx.stockUnit.update({
            where: { id: unit.id },
            data: { status: nextStatus, invoiceId: created.id, invoiceLineId: line.id },
          });
        }
      }

      const appliedRmaIds = (input.appliedRmaIds ?? []).filter(Boolean);
      for (const rmaId of appliedRmaIds) {
        const rma = await tx.rma.findUnique({ where: { id: rmaId }, include: { items: true } });
        if (!rma || rma.customerId !== customerId || rma.paymentType !== "PENDING") continue;
        const credit = rmaTotals(rma);
        await tx.rma.update({
          where: { id: rmaId },
          data: {
            paymentType: "APPLIED_TO_INVOICE",
            appliedInvoiceId: created.id,
            paymentAmountGbp: credit.totalGbp,
            paymentAmountEur: credit.totalEur,
            paymentDate: new Date(),
          },
        });
        await applyCreditToInvoiceTx(tx, created.id, credit.totalGbp, credit.totalEur);
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

  async updateInvoiceLineImeis(invoiceId: string, lineId: string, imeis: string[]) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    const line = await this.prisma.invoiceLine.findUnique({ where: { id: lineId } });
    if (!line || line.invoiceId !== invoiceId) throw new NotFoundException("Invoice line not found");

    const cleaned = Array.from(new Set(imeis.map((imei) => imei.trim()).filter(Boolean)));
    if (cleaned.length > line.qty) {
      throw new BadRequestException(`Cannot list more IMEIs than the qty (${line.qty})`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Release any previously linked stock units that are no longer on this line.
      await tx.stockUnit.updateMany({
        where: { invoiceLineId: lineId, imei: { notIn: cleaned } },
        data: { status: "IN_STOCK", invoiceId: null, invoiceLineId: null },
      });

      const updated = await tx.invoiceLine.update({
        where: { id: lineId },
        data: { imeis: cleaned },
      });

      // Best effort link: only IMEIs matching a real, IN_STOCK unit get tied
      // to this invoice for inventory tracking; anything else is still saved
      // as plain text on the line.
      if (cleaned.length) {
        const units = await tx.stockUnit.findMany({ where: { imei: { in: cleaned } } });
        const nextStatus = stockStatusForInvoice(invoice.status);
        for (const unit of units) {
          if (unit.status !== "IN_STOCK") continue;
          await tx.stockUnit.update({
            where: { id: unit.id },
            data: { status: nextStatus, invoiceId, invoiceLineId: lineId },
          });
        }
      }

      return updated;
    });
  }
}
