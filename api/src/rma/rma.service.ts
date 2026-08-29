import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { applyCreditToInvoiceTx } from "../common/rma";
import { nextNumberTx } from "../common/numbers";
import { ApplyRmaCreditDto, CreateRmaDto } from "./dto/rma.dto";

@Injectable()
export class RmaService {
  constructor(private prisma: PrismaService) {}

  listRmas(customerId?: string) {
    return this.prisma.rma.findMany({
      where: customerId ? { customerId } : undefined,
      include: { customer: true, invoice: true, items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRma(id: string) {
    const rma = await this.prisma.rma.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true,
        appliedInvoice: true,
        items: { include: { stockUnit: true } },
      },
    });
    if (!rma) throw new NotFoundException("RMA not found");
    return rma;
  }

  async createRma(input: CreateRmaDto) {
    const invoiceId = input.invoiceId;
    const reason = input.reason ?? null;
    const items = input.items ?? [];
    const unitIds = items.map((item) => item.stockUnitId).filter(Boolean);
    const manualItems = (input.manualItems ?? []).filter((item) =>
      (item.productName ?? "").trim(),
    );

    if (!invoiceId || (!unitIds.length && !manualItems.length)) {
      throw new BadRequestException("Select an invoice and at least one IMEI or manual item");
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { stockUnits: { include: { invoiceLine: true } }, customer: true },
    });
    if (!invoice) throw new BadRequestException("Invoice not found");

    const allowed = new Set(invoice.stockUnits.map((unit) => unit.id));
    if (unitIds.some((id) => !allowed.has(id))) {
      throw new BadRequestException("IMEI does not belong to this invoice");
    }

    const unitById = new Map(invoice.stockUnits.map((unit) => [unit.id, unit]));
    const itemByUnitId = new Map(items.map((item) => [item.stockUnitId, item]));

    return this.prisma.$transaction(async (tx) => {
      const rmaNumber =
        invoice.entity === "NI"
          ? await nextNumberTx(tx, "RMA_NI", "N", "")
          : await nextNumberTx(tx, "RMA_UK", "", "");
      const created = await tx.rma.create({
        data: {
          rmaNumber,
          invoiceId,
          customerId: invoice.customerId,
          reason,
          notes: input.notes ?? null,
          status: "OPEN",
          items: {
            create: [
              ...unitIds.map((stockUnitId) => {
                const unit = unitById.get(stockUnitId);
                const item = itemByUnitId.get(stockUnitId);
                return {
                  stockUnitId,
                  invoiceNumber: invoice.invoiceNumber,
                  action: item?.action || "RESTOCK",
                  reason: item?.reason ?? null,
                  unitPriceGbp: unit?.invoiceLine?.unitPriceGbp ?? 0,
                  unitPriceEur: unit?.invoiceLine?.unitPriceEur ?? 0,
                };
              }),
              ...manualItems.map((item) => ({
                invoiceNumber: (item.invoiceNumber ?? "").trim() || invoice.invoiceNumber,
                productName: (item.productName ?? "").trim(),
                imei: (item.imei ?? "").trim() || null,
                color: (item.color ?? "").trim() || null,
                grade: (item.grade ?? "").trim() || null,
                action: item.action || "RESTOCK",
                reason: item.reason ?? null,
                unitPriceGbp: Number(item.unitPriceGbp) || 0,
                unitPriceEur: Number(item.unitPriceEur) || 0,
              })),
            ],
          },
        },
      });
      if (unitIds.length) {
        await tx.stockUnit.updateMany({ where: { id: { in: unitIds } }, data: { status: "RMA" } });
      }
      return created;
    });
  }

  async applyRmaCredit(rmaId: string, input: ApplyRmaCreditDto) {
    if (!rmaId) throw new NotFoundException("RMA not found");
    const paymentType = input.paymentType ?? "PENDING";
    const appliedInvoiceId = input.appliedInvoiceId || null;
    const paymentAmountGbp = Number(input.paymentAmountGbp) || 0;
    const paymentAmountEur = Number(input.paymentAmountEur) || 0;
    const paymentDateRaw = input.paymentDate || null;

    if (paymentType === "APPLIED_TO_INVOICE" && !appliedInvoiceId) {
      throw new BadRequestException("Select an invoice to apply the credit to");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.rma.update({
        where: { id: rmaId },
        data: {
          paymentType,
          paymentDate: paymentDateRaw ? new Date(paymentDateRaw) : new Date(),
          paymentAmountGbp,
          paymentAmountEur,
          appliedInvoiceId: paymentType === "APPLIED_TO_INVOICE" ? appliedInvoiceId : null,
        },
      });

      if (paymentType === "APPLIED_TO_INVOICE" && appliedInvoiceId) {
        const target = await applyCreditToInvoiceTx(
          tx,
          appliedInvoiceId,
          paymentAmountGbp,
          paymentAmountEur,
        );
        if (!target) throw new BadRequestException("Invoice not found");
      }

      return updated;
    });
  }

  async processRma(id: string, status: string) {
    const rma = await this.prisma.rma.findUnique({
      where: { id },
      include: { items: { include: { stockUnit: true } } },
    });
    if (!rma) throw new NotFoundException("RMA not found");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.rma.update({ where: { id }, data: { status } });
      if (status === "RECEIVED" || status === "CLOSED" || status === "REFUNDED") {
        for (const item of rma.items) {
          if (!item.stockUnitId) continue;
          const data: { status: string; invoiceId?: null; invoiceLineId?: null } = { status: "RMA" };
          if (item.action === "RESTOCK") {
            data.status = "IN_STOCK";
            data.invoiceId = null;
            data.invoiceLineId = null;
          } else {
            data.status = "FAULTY";
          }
          await tx.stockUnit.update({ where: { id: item.stockUnitId }, data });
        }
      }
      return updated;
    });
  }
}
