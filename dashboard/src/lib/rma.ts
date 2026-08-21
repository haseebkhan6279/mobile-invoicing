import { roundMoney } from "@/lib/money";

export function rmaTotals(rma: {
  items: { unitPriceGbp: number; unitPriceEur: number }[];
}) {
  const totalGbp = roundMoney(
    rma.items.reduce((sum, item) => sum + item.unitPriceGbp, 0),
  );
  const totalEur = roundMoney(
    rma.items.reduce((sum, item) => sum + item.unitPriceEur, 0),
  );
  return { totalGbp, totalEur };
}

export function groupRmaSummary(
  items: {
    stockUnit: { productName: string; color: string; grade: string };
  }[],
) {
  const groups = new Map<string, { productName: string; color: string; grade: string; qty: number }>();
  for (const item of items) {
    const { productName, color, grade } = item.stockUnit;
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
