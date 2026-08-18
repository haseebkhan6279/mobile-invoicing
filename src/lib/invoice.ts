import { roundMoney } from "@/lib/money";

export function invoiceTotals(invoice: {
  shippingCostGbp: number;
  shippingCostEur: number;
  lines: { qty: number; unitPriceGbp: number; unitPriceEur: number }[];
}) {
  const subGbp = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceGbp, 0),
  );
  const subEur = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceEur, 0),
  );
  return {
    subGbp,
    subEur,
    shippingGbp: invoice.shippingCostGbp,
    shippingEur: invoice.shippingCostEur,
    totalGbp: roundMoney(subGbp + invoice.shippingCostGbp),
    totalEur: roundMoney(subEur + invoice.shippingCostEur),
  };
}
