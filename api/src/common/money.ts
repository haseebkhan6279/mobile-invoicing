export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(amount));
}
