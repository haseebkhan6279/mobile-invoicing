import { roundMoney } from "./money";

export function invoiceTotals(invoice: {
  shippingCostGbp: number;
  shippingCostEur: number;
  paidAmountGbp?: number;
  paidAmountEur?: number;
  lines: { qty: number; unitPriceGbp: number; unitPriceEur: number }[];
}) {
  const subGbp = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceGbp, 0),
  );
  const subEur = roundMoney(
    invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPriceEur, 0),
  );
  const totalGbp = roundMoney(subGbp + invoice.shippingCostGbp);
  const totalEur = roundMoney(subEur + invoice.shippingCostEur);
  const paidGbp = roundMoney(invoice.paidAmountGbp ?? 0);
  const paidEur = roundMoney(invoice.paidAmountEur ?? 0);
  return {
    subGbp,
    subEur,
    shippingGbp: invoice.shippingCostGbp,
    shippingEur: invoice.shippingCostEur,
    totalGbp,
    totalEur,
    paidGbp,
    paidEur,
    dueGbp: roundMoney(totalGbp - paidGbp),
    dueEur: roundMoney(totalEur - paidEur),
  };
}
