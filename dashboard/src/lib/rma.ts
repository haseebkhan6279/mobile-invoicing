import { roundMoney } from "@/lib/money";

export function rmaTotals(rma: {
  items: { unitPriceGbp: number }[];
}) {
  const totalGbp = roundMoney(
    rma.items.reduce((sum, item) => sum + item.unitPriceGbp, 0),
  );
  return { totalGbp };
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
