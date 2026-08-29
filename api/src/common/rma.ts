import type { Prisma } from "@prisma/client";
import { invoiceTotals } from "./invoice";
import { roundMoney } from "./money";

export async function applyCreditToInvoiceTx(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  amountGbp: number,
  amountEur: number,
) {
  const target = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!target) return null;

  const newPaidGbp = target.paidAmountGbp + amountGbp;
  const newPaidEur = target.paidAmountEur + amountEur;
  const totals = invoiceTotals({ ...target, paidAmountGbp: newPaidGbp, paidAmountEur: newPaidEur });
  const nextStatus =
    totals.dueGbp <= 0 && totals.dueEur <= 0
      ? "PAID"
      : target.status === "PENDING"
        ? "AWAITING_PAYMENT"
        : target.status;

  return tx.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmountGbp: newPaidGbp,
      paidAmountEur: newPaidEur,
      status: nextStatus,
      paidAt: nextStatus === "PAID" ? new Date() : target.paidAt,
    },
  });
}

export function rmaTotals(rma: { items: { unitPriceGbp: number; unitPriceEur: number }[] }) {
  const totalGbp = roundMoney(rma.items.reduce((sum, item) => sum + item.unitPriceGbp, 0));
  const totalEur = roundMoney(rma.items.reduce((sum, item) => sum + item.unitPriceEur, 0));
  return { totalGbp, totalEur };
}

export function groupRmaSummary(
  items: {
    stockUnit: { productName: string; color: string; grade: string } | null;
    productName?: string | null;
    color?: string | null;
    grade?: string | null;
  }[],
) {
  const groups = new Map<string, { productName: string; color: string; grade: string; qty: number }>();
  for (const item of items) {
    const productName = item.stockUnit?.productName ?? item.productName ?? "Unknown item";
    const color = item.stockUnit?.color ?? item.color ?? "";
    const grade = item.stockUnit?.grade ?? item.grade ?? "";
    const key = `${productName}__${color}__${grade}`;
    const existing = groups.get(key);
    if (existing) {
      existing.qty += 1;
    } else {
      groups.set(key, { productName, color, grade, qty: 1 });
    }
  }
  return Array.from(groups.values());
}
