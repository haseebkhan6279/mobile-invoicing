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
