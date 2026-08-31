export type LedgerEntry = {
  type: string;
  amountGbp: number;
};

export function ledgerDelta(entry: LedgerEntry) {
  const sign = entry.type === "CREDIT" ? 1 : -1;
  return {
    gbp: sign * entry.amountGbp,
  };
}

export function withRunningBalance<T extends LedgerEntry>(entries: T[]) {
  let gbp = 0;
  return entries.map((entry) => {
    const delta = ledgerDelta(entry);
    gbp += delta.gbp;
    return { ...entry, balanceGbp: gbp };
  });
}

export function totalsFromLedger(entries: LedgerEntry[]) {
  let creditGbp = 0;
  let debitGbp = 0;
  for (const entry of entries) {
    if (entry.type === "CREDIT") {
      creditGbp += entry.amountGbp;
    } else {
      debitGbp += entry.amountGbp;
    }
  }
  return {
    creditGbp,
    debitGbp,
    balanceGbp: creditGbp - debitGbp,
  };
}
