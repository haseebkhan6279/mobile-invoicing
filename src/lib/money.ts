export function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatEur(amount: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatMoneyPair(gbp: number, eur: number) {
  return `${formatGbp(gbp)} / ${formatEur(eur)}`;
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function eurFromGbp(gbp: number, fxRate: number) {
  return roundMoney(gbp * fxRate);
}

export const DEFAULT_FX_RATE = 1.15;
