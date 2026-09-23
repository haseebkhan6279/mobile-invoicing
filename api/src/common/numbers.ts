import type { Prisma } from "@prisma/client";

export async function nextNumberTx(
  tx: Prisma.TransactionClient,
  key: string,
  prefix = "",
  separator = "-",
) {
  const row = await tx.numberCounter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  const padded = String(row.value).padStart(4, "0");
  return prefix ? `${prefix}${separator}${padded}` : padded;
}

/**
 * Documents run one number series per region. GBP/UK keeps the plain 4-digit
 * series the business has always used (0012); EUR/Europe gets an "N" prefix
 * (N0012) off its own counter, so the two never collide.
 *
 * Invoice numbers reuse gaps: deleting N00017 makes the next EUR invoice
 * N00017 again, instead of jumping to N00018. RMA numbers still only go up.
 *
 * The counter keys keep their historical `_UK`/`_NI` names on purpose: both
 * series then continue from the numbers already issued under the old dual-entity
 * model rather than restarting at 0001.
 */
export function nextDocumentNumberTx(
  tx: Prisma.TransactionClient,
  series: "INV" | "RMA",
  currency: string,
) {
  if (series === "INV") return nextInvoiceNumberTx(tx, currency);
  return currency === "EUR"
    ? nextNumberTx(tx, `${series}_NI`, "N", "")
    : nextNumberTx(tx, `${series}_UK`, "", "");
}

async function nextInvoiceNumberTx(tx: Prisma.TransactionClient, currency: string) {
  const isEur = currency === "EUR";
  const key = isEur ? "INV_NI" : "INV_UK";

  // Lock the series so two creates cannot pick the same recycled number.
  await tx.numberCounter.upsert({
    where: { key },
    create: { key, value: 0 },
    update: {},
  });
  await tx.$queryRaw`SELECT "key" FROM "NumberCounter" WHERE "key" = ${key} FOR UPDATE`;

  const invoices = await tx.invoice.findMany({
    where: { printCurrency: isEur ? "EUR" : "GBP" },
    select: { invoiceNumber: true },
  });
  const used = new Set<number>();
  const pattern = isEur ? /^N(\d+)$/i : /^(\d+)$/;
  for (const invoice of invoices) {
    const match = invoice.invoiceNumber.trim().match(pattern);
    if (match) used.add(Number(match[1]));
  }

  let next = 1;
  while (used.has(next)) next += 1;

  await tx.numberCounter.update({ where: { key }, data: { value: next } });

  const padded = String(next).padStart(4, "0");
  return isEur ? `N${padded}` : padded;
}
