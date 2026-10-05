import { roundMoney } from "@/lib/money";

export function invoiceTotals(invoice: {
  shippingCostGbp: number;
  paidAmountGbp?: number;
  lines: { qty: number; unitPriceGbp: number }[];
}) {
  const subGbp = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceGbp, 0),
  );
  const totalGbp = roundMoney(subGbp + invoice.shippingCostGbp);
  // Devices on the invoice; the shipping charge is not a unit.
  const totalQty = invoice.lines.reduce((sum, line) => sum + line.qty, 0);
  const paidGbp = roundMoney(invoice.paidAmountGbp ?? 0);
  return {
    subGbp,
    totalQty,
    shippingGbp: invoice.shippingCostGbp,
    totalGbp,
    paidGbp,
    dueGbp: roundMoney(totalGbp - paidGbp),
  };
}

export type InvoiceVisualTone = "paid" | "unpaid" | "overdue" | "cancelled";

export function invoiceDueDate(invoice: {
  issuedAt: Date | string;
  installments?: { dueDate: Date | string; status: string }[];
}) {
  const pending = (invoice.installments ?? [])
    .filter((row) => row.status !== "PAID")
    .map((row) => new Date(row.dueDate))
    .sort((a, b) => a.getTime() - b.getTime());
  if (pending[0]) return pending[0];
  return typeof invoice.issuedAt === "string" ? new Date(invoice.issuedAt) : invoice.issuedAt;
}

export function invoiceVisualTone(
  status: string,
  dueGbp: number,
  dueDate: Date,
): InvoiceVisualTone {
  if (status === "CANCELLED") return "cancelled";
  if (status === "PAID" || dueGbp <= 0) return "paid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  if (due < today) return "overdue";
  return "unpaid";
}

/**
 * Customer-facing invoice number: white on a solid navy chip. Navy text on a
 * pale tint printed almost the same as the black body text, so the fill is
 * what makes it stand out on paper without looking like a warning.
 */
export const INVOICE_NUMBER_FG = "#FFFFFF";
export const INVOICE_NUMBER_BG = "#0B3A6E";
export const INVOICE_NUMBER_CLASSES =
  "inline-block rounded-md bg-[#0B3A6E] px-3 py-1.5 font-mono text-3xl font-bold leading-none tracking-wide text-white print:bg-[#0B3A6E] print:text-white";
export const INVOICE_NUMBER_INLINE_CLASSES =
  "rounded-sm bg-[#0B3A6E] px-1.5 py-0.5 font-mono font-bold text-white print:bg-[#0B3A6E] print:text-white";

export const INVOICE_TONE_CLASSES: Record<InvoiceVisualTone, string> = {
  unpaid: "bg-red-100 text-red-800 print:bg-red-100 print:text-red-800",
  overdue: "bg-red-200 text-red-950 ring-1 ring-red-600 print:bg-red-200 print:text-red-950",
  paid: "bg-emerald-100 text-emerald-800 print:bg-emerald-100 print:text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700 print:bg-slate-200 print:text-slate-700",
};

export function invoiceToneLabel(tone: InvoiceVisualTone, status: string) {
  if (tone === "unpaid") {
    return status === "AWAITING_PAYMENT" ? "Awaiting payment" : "Unpaid";
  }
  if (tone === "overdue") return "Overdue";
  if (tone === "paid") return "Paid";
  return "Cancelled";
}

/**
 * What the invoice actually earned. Shipping is deliberately left out of both
 * sides: what the customer is charged for it has no buying price to net off
 * against, so folding it in would overstate the profit.
 */
export function invoiceProfit(invoice: {
  lines: { qty: number; unitPriceGbp: number; buyPriceGbp?: number }[];
}) {
  const salesGbp = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceGbp, 0),
  );
  const costGbp = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * (line.buyPriceGbp ?? 0), 0),
  );
  const profitGbp = roundMoney(salesGbp - costGbp);
  return {
    salesGbp,
    costGbp,
    profitGbp,
    // With no cost entered the margin would read as a flat 100%, which is a
    // lie rather than a number, so it is reported as unknown instead.
    profitPct: salesGbp > 0 && costGbp > 0 ? (profitGbp / salesGbp) * 100 : null,
  };
}
