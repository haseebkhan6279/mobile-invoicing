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
  const paidGbp = roundMoney(invoice.paidAmountGbp ?? 0);
  return {
    subGbp,
    shippingGbp: invoice.shippingCostGbp,
    totalGbp,
    paidGbp,
    dueGbp: roundMoney(totalGbp - paidGbp),
  };
}
