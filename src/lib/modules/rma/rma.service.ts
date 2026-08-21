import { prisma } from "@/lib/prisma";
import { invoiceTotals } from "@/lib/invoice";
import { nextNumberTx } from "@/lib/numbers";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { ApplyRmaCreditInput, CreateRmaInput } from "./dto/rma.dto";

export type { ApplyRmaCreditInput, CreateRmaInput };

export async function listRmas() {
  return prisma.rma.findMany({
    include: { customer: true, invoice: true, items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRma(id: string) {
  const rma = await prisma.rma.findUnique({
    where: { id },
    include: {
      customer: true,
      invoice: true,
      appliedInvoice: true,
      items: { include: { stockUnit: true } },
    },
  });
  if (!rma) throw new NotFoundError("RMA not found");
  return rma;
}

export async function createRma(input: CreateRmaInput) {
  const invoiceId = input.invoiceId;
  const reason = input.reason ?? null;
  const items = input.items ?? [];
  const unitIds = items.map((item) => item.stockUnitId).filter(Boolean);

  if (!invoiceId || !unitIds.length) {
    throw new ValidationError("Select an invoice and at least one IMEI");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { stockUnits: { include: { invoiceLine: true } }, customer: true },
  });
  if (!invoice) throw new ValidationError("Invoice not found");

  const allowed = new Set(invoice.stockUnits.map((unit) => unit.id));
  if (unitIds.some((id) => !allowed.has(id))) {
    throw new ValidationError("IMEI does not belong to this invoice");
  }

  const unitById = new Map(invoice.stockUnits.map((unit) => [unit.id, unit]));
  const itemByUnitId = new Map(items.map((item) => [item.stockUnitId, item]));

  return prisma.$transaction(async (tx) => {
    const rmaNumber = await nextNumberTx(tx, "RMA", "RMA");
    const created = await tx.rma.create({
      data: {
        rmaNumber,
        invoiceId,
        customerId: invoice.customerId,
        reason,
        notes: input.notes ?? null,
        status: "OPEN",
        items: {
          create: unitIds.map((stockUnitId) => {
            const unit = unitById.get(stockUnitId);
            const item = itemByUnitId.get(stockUnitId);
            return {
              stockUnitId,
              action: item?.action || "RESTOCK",
              reason: item?.reason ?? null,
              unitPriceGbp: unit?.invoiceLine?.unitPriceGbp ?? 0,
              unitPriceEur: unit?.invoiceLine?.unitPriceEur ?? 0,
            };
          }),
        },
      },
    });
    await tx.stockUnit.updateMany({ where: { id: { in: unitIds } }, data: { status: "RMA" } });
    return created;
  });
}

export async function applyRmaCredit(rmaId: string, input: ApplyRmaCreditInput) {
  if (!rmaId) throw new NotFoundError("RMA not found");
  const paymentType = input.paymentType ?? "PENDING";
  const appliedInvoiceId = input.appliedInvoiceId || null;
  const paymentAmountGbp = Number(input.paymentAmountGbp) || 0;
  const paymentAmountEur = Number(input.paymentAmountEur) || 0;
  const paymentDateRaw = input.paymentDate || null;

  if (paymentType === "APPLIED_TO_INVOICE" && !appliedInvoiceId) {
    throw new ValidationError("Select an invoice to apply the credit to");
  }

  return prisma.$transaction(async (tx) => {
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
      const target = await tx.invoice.findUnique({
        where: { id: appliedInvoiceId },
        include: { lines: true },
      });
      if (!target) throw new ValidationError("Invoice not found");

      const newPaidGbp = target.paidAmountGbp + paymentAmountGbp;
      const newPaidEur = target.paidAmountEur + paymentAmountEur;
      const totals = invoiceTotals({ ...target, paidAmountGbp: newPaidGbp, paidAmountEur: newPaidEur });
      const nextStatus =
        totals.dueGbp <= 0 && totals.dueEur <= 0
          ? "PAID"
          : target.status === "PENDING"
            ? "AWAITING_PAYMENT"
            : target.status;

      await tx.invoice.update({
        where: { id: appliedInvoiceId },
        data: {
          paidAmountGbp: newPaidGbp,
          paidAmountEur: newPaidEur,
          status: nextStatus,
          paidAt: nextStatus === "PAID" ? new Date() : target.paidAt,
        },
      });
    }

    return updated;
  });
}

export async function processRma(id: string, status: string) {
  const rma = await prisma.rma.findUnique({
    where: { id },
    include: { items: { include: { stockUnit: true } } },
  });
  if (!rma) throw new NotFoundError("RMA not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.rma.update({ where: { id }, data: { status } });
    if (status === "RECEIVED" || status === "CLOSED" || status === "REFUNDED") {
      for (const item of rma.items) {
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
