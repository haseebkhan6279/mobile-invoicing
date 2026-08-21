export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function eurFromGbp(gbp: number, fxRate: number) {
  return roundMoney(gbp * fxRate);
}

export const DEFAULT_FX_RATE = 1.15;
