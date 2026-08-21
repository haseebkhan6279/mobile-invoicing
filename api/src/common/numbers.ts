import type { Prisma } from "@prisma/client";

export async function nextNumberTx(tx: Prisma.TransactionClient, key: string, prefix: string) {
  const row = await tx.numberCounter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${String(row.value).padStart(4, "0")}`;
}
