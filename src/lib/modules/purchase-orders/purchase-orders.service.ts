import { prisma } from "@/lib/prisma";
import { nextNumberTx } from "@/lib/numbers";
import { DEFAULT_FX_RATE } from "@/lib/money";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type {
  CreatePurchaseOrderInput,
  PoLineInput,
  UpdatePurchaseOrderMetaInput,
} from "./dto/purchase-order.dto";

export type { CreatePurchaseOrderInput, PoLineInput, UpdatePurchaseOrderMetaInput };

type NormalizedPoLine = {
  productName: string;
  color: string | null;
  network: string | null;
  grade: string | null;
  qty: number;
  unitCostGbp: number;
  unitCostEur: number;
};

function normalizeLines(lines: PoLineInput[]) {
  const normalized: NormalizedPoLine[] = [];
  for (const line of lines) {
    const productName = (line.productName ?? "").trim();
    const qty = Number(line.qty) || 0;
    if (!productName || qty <= 0) continue;
    normalized.push({
      productName,
      color: line.color ?? null,
      network: line.network ?? null,
      grade: line.grade ?? null,
      qty,
      unitCostGbp: Number(line.unitCostGbp) || 0,
      unitCostEur: Number(line.unitCostEur) || 0,
    });
  }
  return normalized;
}

export async function listPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: { supplier: true, lines: true, stockUnits: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, lines: true, stockUnits: true },
  });
  if (!po) throw new NotFoundError("Purchase order not found");
  return po;
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const supplierId = input.supplierId;
  const lines = normalizeLines(input.lines ?? []);
  if (!supplierId) throw new ValidationError("Select a supplier");
  if (!lines.length) throw new ValidationError("Add at least one line");

  return prisma.$transaction(async (tx) => {
    const poNumber = await nextNumberTx(tx, "PO", "PO");
    return tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: input.status ?? "ORDERED",
        notes: input.notes ?? null,
        shippingCostGbp: Number(input.shippingCostGbp) || 0,
        shippingCostEur: Number(input.shippingCostEur) || 0,
        fxRate: input.fxRate ?? DEFAULT_FX_RATE,
        orderedAt: new Date(),
        lines: { create: lines },
      },
    });
  });
}

export async function updatePurchaseOrderMeta(id: string, input: UpdatePurchaseOrderMetaInput) {
  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: input.status ?? "ORDERED",
      notes: input.notes ?? null,
      shippingCostGbp: Number(input.shippingCostGbp) || 0,
      shippingCostEur: Number(input.shippingCostEur) || 0,
      actualCostGbp: Number(input.actualCostGbp) || 0,
      actualCostEur: Number(input.actualCostEur) || 0,
      fxRate: input.fxRate ?? DEFAULT_FX_RATE,
    },
  });
}
