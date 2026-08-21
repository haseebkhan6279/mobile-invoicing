import { formatEur, formatGbp } from "@/lib/money";

export function MoneyPair({
  gbp,
  eur,
  stacked = false,
}: {
  gbp: number;
  eur: number;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="tabular-nums">
        <div>{formatGbp(gbp)}</div>
        <div className="text-xs text-slate-500">{formatEur(eur)}</div>
      </div>
    );
  }
  return (
    <span className="tabular-nums">
      {formatGbp(gbp)}{" "}
      <span className="text-slate-400">/</span> {formatEur(eur)}
    </span>
  );
}
