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

/**
 * What has come off the grand total, split so the invoice can show each credit
 * note on its own line. A credit note is spent as a Payment row with an RMA on
 * it; anything else paid is grouped as "payments received". The rest of
 * paidGbp (not matched to a payment row) also counts as received, so the lines
 * always add up to the balance shown.
 */
export function invoiceDeductions(invoice: {
  paidAmountGbp?: number;
  payments?: { amountGbp: number; rma?: { rmaNumber: string } | null }[];
}) {
  const byCreditNote = new Map<string, number>();
  for (const payment of invoice.payments ?? []) {
    if (!payment.rma) continue;
    const key = payment.rma.rmaNumber;
    byCreditNote.set(key, (byCreditNote.get(key) ?? 0) + payment.amountGbp);
  }
  const credits = [...byCreditNote]
    .map(([rmaNumber, amountGbp]) => ({ rmaNumber, amountGbp: roundMoney(amountGbp) }))
    .filter((row) => row.amountGbp > 0);
  const creditGbp = roundMoney(credits.reduce((sum, row) => sum + row.amountGbp, 0));
  const receivedGbp = Math.max(0, roundMoney((invoice.paidAmountGbp ?? 0) - creditGbp));
  return { credits, creditGbp, receivedGbp };
}
