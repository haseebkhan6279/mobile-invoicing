import { roundMoney } from "./money";

/** The stock status a unit should carry while it sits on an invoice. */
export function stockStatusForInvoice(status: string) {
  return status === "PAID" ? "SOLD" : "RESERVED";
}

export function invoiceTotals(invoice: {
  shippingCostGbp: number;
  paidAmountGbp?: number;
  lines: { qty: number; unitPriceGbp: number }[];
}) {
  const subGbp = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceGbp, 0),
  );
  const totalGbp = roundMoney(subGbp + invoice.shippingCostGbp);
  const paidGbp = roundMoney(invoice.paidAmountGbp ?? 0);
  return {
    subGbp,
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

export const INVOICE_TONE_COLORS: Record<
  InvoiceVisualTone,
  { bg: string; fg: string; label: string }
> = {
  unpaid: { bg: "#FEE2E2", fg: "#991B1B", label: "Unpaid" },
  overdue: { bg: "#FECACA", fg: "#7F1D1D", label: "Overdue" },
  paid: { bg: "#DCFCE7", fg: "#166534", label: "Paid" },
  cancelled: { bg: "#F1F5F9", fg: "#475569", label: "Cancelled" },
};

export function invoiceToneLabel(tone: InvoiceVisualTone, status: string) {
  if (tone === "unpaid") {
    return status === "AWAITING_PAYMENT" ? "Awaiting payment" : "Unpaid";
  }
  return INVOICE_TONE_COLORS[tone].label;
}
