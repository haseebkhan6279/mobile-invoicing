import type { Prisma } from "@prisma/client";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { invoiceTotals } from "./invoice";
import { roundMoney } from "./money";

export async function recordPaymentTx(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  input: {
    amountGbp: number;
    method?: string | null;
    notes?: string | null;
    paidAt?: Date;
    installmentId?: string;
  },
) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice) throw new NotFoundException("Invoice not found");
  if (invoice.status === "CANCELLED") {
    throw new BadRequestException("Cannot record a payment on a cancelled invoice");
  }

  const payment = await tx.payment.create({
    data: {
      invoiceId,
      amountGbp: roundMoney(input.amountGbp),
      method: input.method ?? null,
      notes: input.notes ?? null,
      paidAt: input.paidAt ?? new Date(),
      installmentId: input.installmentId,
    },
  });

  const newPaidGbp = roundMoney(invoice.paidAmountGbp + input.amountGbp);
  const totals = invoiceTotals({ ...invoice, paidAmountGbp: newPaidGbp });
  const nextStatus =
    totals.dueGbp <= 0 ? "PAID" : invoice.status === "PENDING" ? "AWAITING_PAYMENT" : invoice.status;

  const updatedInvoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmountGbp: newPaidGbp,
      status: nextStatus,
      paidAt: nextStatus === "PAID" ? new Date() : invoice.paidAt,
    },
  });

  if (input.installmentId) {
    await tx.installment.update({
      where: { id: input.installmentId },
      data: { status: "PAID" },
    });
  }

  return { payment, invoice: updatedInvoice };
}

export function buildEvenInstallments(
  remainingGbp: number,
  count: number,
  startDate: Date,
  intervalDays: number,
) {
  const base = Math.floor((remainingGbp / count) * 100) / 100;
  const rows: { dueDate: Date; amountGbp: number; sortOrder: number }[] = [];
  let allocated = 0;
  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1;
    const amount = isLast ? roundMoney(remainingGbp - allocated) : base;
    allocated = roundMoney(allocated + amount);
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + i * intervalDays);
    rows.push({ dueDate, amountGbp: amount, sortOrder: i });
  }
  return rows;
}
