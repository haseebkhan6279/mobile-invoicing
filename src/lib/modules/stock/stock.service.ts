import { prisma } from "@/lib/prisma";
import { validateImeiList } from "@/lib/imei";
import { roundMoney } from "@/lib/money";
import { ConflictError, ValidationError } from "@/lib/api/errors";
import type { ReceiveStockInput, StockBatchInput } from "./dto/stock.dto";

export type { ReceiveStockInput, StockBatchInput };

type NormalizedBatch = {
  productName: string;
  brand: string | null;
  color: string;
  network: string;
  grade: string;
  costGbp: number;
  costEur: number;
  imeis: string[];
};

function normalizeBatches(batches: StockBatchInput[]): NormalizedBatch[] {
  const normalized: NormalizedBatch[] = [];
  for (const batch of batches) {
    const productName = (batch.productName ?? "").trim();
    const imeis = batch.imeis ?? [];
    if (!productName && !imeis.length) continue;

    const parsed = validateImeiList(imeis);
    if ("error" in parsed) throw new ValidationError(parsed.error ?? "Invalid IMEI list");
    if (!productName) throw new ValidationError("Product name is required for each grade batch.");
    if (!parsed.imeis?.length) throw new ValidationError("Enter at least one IMEI per batch.");

    normalized.push({
      productName,
      brand: batch.brand ?? null,
      color: (batch.color ?? "").toString().trim() || "Black",
      network: (batch.network ?? "").toString().trim() || "Unlocked",
      grade: (batch.grade ?? "").toString().trim() || "A",
      costGbp: Number(batch.costGbp) || 0,
      costEur: Number(batch.costEur) || 0,
      imeis: parsed.imeis,
    });
  }
  return normalized;
}

export async function listStock(filters: { status?: string; grade?: string; q?: string }) {
  const { status, grade, q } = filters;
  return prisma.stockUnit.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(grade ? { grade } : {}),
      ...(q
        ? {
            OR: [{ imei: { contains: q } }, { productName: { contains: q } }],
          }
        : {}),
    },
    include: { supplier: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function receiveStockBatches(input: ReceiveStockInput) {
  const supplierId = input.supplierId ?? null;
  const purchaseOrderId = input.purchaseOrderId ?? null;
  const postLedger = Boolean(input.postLedger);
  const batches = normalizeBatches(input.batches ?? []);

  if (!batches.length) throw new ValidationError("Add at least one grade batch");

  const allImeis = batches.flatMap((batch) => batch.imeis);
  if (new Set(allImeis).size !== allImeis.length) {
    throw new ValidationError("Duplicate IMEIs across batches");
  }

  const existing = await prisma.stockUnit.findMany({
    where: { imei: { in: allImeis } },
    select: { imei: true },
  });
  if (existing.length) {
    throw new ConflictError(`IMEI already in stock: ${existing.map((u) => u.imei).join(", ")}`);
  }

  const goodsGbp = roundMoney(
    batches.reduce((sum, batch) => sum + batch.costGbp * batch.imeis.length, 0),
  );
  const goodsEur = roundMoney(
    batches.reduce((sum, batch) => sum + batch.costEur * batch.imeis.length, 0),
  );

  return prisma.$transaction(async (tx) => {
    for (const batch of batches) {
      await tx.stockUnit.createMany({
        data: batch.imeis.map((imei) => ({
          imei,
          productName: batch.productName,
          brand: batch.brand,
          color: batch.color,
          network: batch.network,
          grade: batch.grade,
          costGbp: batch.costGbp,
          costEur: batch.costEur,
          status: "IN_STOCK",
          supplierId,
          purchaseOrderId,
        })),
      });
    }

    if (purchaseOrderId) {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: { lines: true },
      });
      if (po) {
        const units = await tx.stockUnit.findMany({ where: { purchaseOrderId } });
        const ordered = po.lines.reduce((sum, line) => sum + line.qty, 0);
        const received = units.length;
        const receivedGbp = roundMoney(units.reduce((sum, unit) => sum + unit.costGbp, 0));
        const receivedEur = roundMoney(units.reduce((sum, unit) => sum + unit.costEur, 0));
        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: {
            status:
              received >= ordered && ordered > 0
                ? "RECEIVED"
                : received > 0
                  ? "PARTIAL"
                  : po.status,
            receivedAt: new Date(),
            actualCostGbp: roundMoney(receivedGbp + po.shippingCostGbp),
            actualCostEur: roundMoney(receivedEur + po.shippingCostEur),
          },
        });
      }
    }

    if (postLedger && supplierId && (goodsGbp > 0 || goodsEur > 0)) {
      await tx.supplierLedger.create({
        data: {
          supplierId,
          type: "CREDIT",
          amountGbp: goodsGbp,
          amountEur: goodsEur,
          reference: purchaseOrderId
            ? (await tx.purchaseOrder.findUnique({ where: { id: purchaseOrderId } }))?.poNumber
            : "Stock intake",
          notes: `Goods received (${allImeis.length} units)`,
          purchaseOrderId,
        },
      });
    }

    return { unitsAdded: allImeis.length, purchaseOrderId };
  });
}

export async function getAvailableImeis(
  spec: { productName: string; color: string; network: string; grade: string },
  limit = 50,
) {
  const units = await prisma.stockUnit.findMany({
    where: { status: "IN_STOCK", ...spec },
    select: { imei: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return units.map((u) => u.imei);
}

export async function searchStockProducts(query: string) {
  const q = query.trim();
  if (!q) return [];
  const groups = await prisma.stockUnit.groupBy({
    by: ["productName", "color", "network", "grade"],
    where: { status: "IN_STOCK", productName: { contains: q, mode: "insensitive" } },
    _count: { _all: true },
    _avg: { costGbp: true, costEur: true },
    orderBy: { productName: "asc" },
    take: 10,
  });
  return groups.map((g) => ({
    productName: g.productName,
    color: g.color,
    network: g.network,
    grade: g.grade,
    count: g._count._all,
    costGbp: roundMoney(g._avg.costGbp ?? 0),
    costEur: roundMoney(g._avg.costEur ?? 0),
  }));
}
