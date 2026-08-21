export type LedgerEntry = {
  type: string;
  amountGbp: number;
  amountEur: number;
};

export function ledgerDelta(entry: LedgerEntry) {
  const sign = entry.type === "CREDIT" ? 1 : -1;
  return {
    gbp: sign * entry.amountGbp,
    eur: sign * entry.amountEur,
  };
}

export function withRunningBalance<T extends LedgerEntry>(entries: T[]) {
  let gbp = 0;
  let eur = 0;
  return entries.map((entry) => {
    const delta = ledgerDelta(entry);
    gbp += delta.gbp;
    eur += delta.eur;
    return { ...entry, balanceGbp: gbp, balanceEur: eur };
  });
}

export function totalsFromLedger(entries: LedgerEntry[]) {
  let creditGbp = 0;
  let creditEur = 0;
  let debitGbp = 0;
  let debitEur = 0;
  for (const entry of entries) {
    if (entry.type === "CREDIT") {
      creditGbp += entry.amountGbp;
      creditEur += entry.amountEur;
    } else {
      debitGbp += entry.amountGbp;
      debitEur += entry.amountEur;
    }
  }
  return {
    creditGbp,
    creditEur,
    debitGbp,
    debitEur,
    balanceGbp: creditGbp - debitGbp,
    balanceEur: creditEur - debitEur,
  };
}
