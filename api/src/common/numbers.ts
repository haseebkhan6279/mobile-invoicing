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

  // Lowest unused integer in SQL so we do not pull every invoice row into Node.
  // invoiceNumber is unique across the table, so both series scan all numbers
  // (older Atlantic N#### rows may still be stored as GBP).
  const rows = isEur
    ? await tx.$queryRaw<{ n: bigint | number }[]>`
        WITH nums AS (
          SELECT UPPER(TRIM("invoiceNumber")) AS num FROM "Invoice"
        ),
        used AS (
          SELECT CAST(substring(num FROM '^N([0-9]+)$') AS INTEGER) AS n
          FROM nums
          WHERE num ~ '^N[0-9]+$'
        ),
        bounds AS (
          SELECT COALESCE(MAX(n), 0) AS max_n FROM used
        )
        SELECT s.n
        FROM bounds
        CROSS JOIN LATERAL generate_series(1, bounds.max_n + 1) AS s(n)
        WHERE NOT EXISTS (SELECT 1 FROM used u WHERE u.n = s.n)
          AND NOT EXISTS (
            SELECT 1 FROM nums WHERE num = 'N' || LPAD(s.n::text, 4, '0')
          )
        ORDER BY s.n
        LIMIT 1
      `
    : await tx.$queryRaw<{ n: bigint | number }[]>`
        WITH nums AS (
          SELECT UPPER(TRIM("invoiceNumber")) AS num FROM "Invoice"
        ),
        used AS (
          SELECT CAST(num AS INTEGER) AS n
          FROM nums
          WHERE num ~ '^[0-9]+$'
        ),
        bounds AS (
          SELECT COALESCE(MAX(n), 0) AS max_n FROM used
        )
        SELECT s.n
        FROM bounds
        CROSS JOIN LATERAL generate_series(1, bounds.max_n + 1) AS s(n)
        WHERE NOT EXISTS (SELECT 1 FROM used u WHERE u.n = s.n)
          AND NOT EXISTS (
            SELECT 1 FROM nums WHERE num = LPAD(s.n::text, 4, '0')
          )
        ORDER BY s.n
        LIMIT 1
      `;

  const next = Number(rows[0]?.n ?? 1);
  await tx.numberCounter.update({ where: { key }, data: { value: next } });

  const padded = String(next).padStart(4, "0");
  return isEur ? `N${padded}` : padded;
}
