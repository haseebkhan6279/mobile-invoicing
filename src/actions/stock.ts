"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { validateImeis } from "@/lib/imei";
import { toNumber, toOptionalString } from "@/lib/lookups";
import { roundMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type Batch = {
  productName: string;
  brand: string | null;
  color: string;
  network: string;
  grade: string;
  costGbp: number;
  costEur: number;
  imeis: string[];
};

function parseBatches(formData: FormData): { batches: Batch[]; error?: string } {
  const products = formData.getAll("batchProduct");
  const brands = formData.getAll("batchBrand");
  const colors = formData.getAll("batchColor");
  const networks = formData.getAll("batchNetwork");
  const grades = formData.getAll("batchGrade");
  const gbp = formData.getAll("batchCostGbp");
  const eur = formData.getAll("batchCostEur");
  const imeiFields = formData.getAll("batchImeis");
  const batches: Batch[] = [];

  for (let i = 0; i < products.length; i += 1) {
    const productName = String(products[i] ?? "").trim();
    const rawImeis = String(imeiFields[i] ?? "");
    if (!productName && !rawImeis.trim()) continue;
    const parsed = validateImeis(rawImeis);
    if ("error" in parsed) return { batches: [], error: parsed.error };
    if (!productName) return { batches: [], error: "Product name is required for each grade batch." };
    if (!parsed.imeis?.length) return { batches: [], error: "Enter at least one IMEI per batch." };
    batches.push({
      productName,
      brand: toOptionalString(brands[i]),
      color: String(colors[i] ?? "").trim() || "Black",
      network: String(networks[i] ?? "").trim() || "Unlocked",
      grade: String(grades[i] ?? "").trim() || "A",
      costGbp: toNumber(gbp[i]),
      costEur: toNumber(eur[i]),
      imeis: parsed.imeis,
    });
  }
  return { batches };
}

export async function receiveStockBatches(
  formData: FormData,
  options?: { fromPo?: boolean },
) {
  await requireUser();
  const supplierId = toOptionalString(formData.get("supplierId"));
  const purchaseOrderId = toOptionalString(formData.get("purchaseOrderId"));
  const postLedger = formData.get("postLedger") === "on" || options?.fromPo;
  const { batches, error } = parseBatches(formData);
  const back = purchaseOrderId
    ? `/purchase-orders/${purchaseOrderId}/receive`
    : "/stock/add";

  if (error) redirect(`${back}?error=${encodeURIComponent(error)}`);
  if (!batches.length) {
    redirect(`${back}?error=${encodeURIComponent("Add at least one grade batch")}`);
  }

  const allImeis = batches.flatMap((batch) => batch.imeis);
  if (new Set(allImeis).size !== allImeis.length) {
    redirect(`${back}?error=${encodeURIComponent("Duplicate IMEIs across batches")}`);
  }

  const existing = await prisma.stockUnit.findMany({
    where: { imei: { in: allImeis } },
    select: { imei: true },
  });
  if (existing.length) {
    redirect(
      `${back}?error=${encodeURIComponent(`IMEI already in stock: ${existing.map((u) => u.imei).join(", ")}`)}`,
    );
  }

  const goodsGbp = roundMoney(
    batches.reduce((sum, batch) => sum + batch.costGbp * batch.imeis.length, 0),
  );
  const goodsEur = roundMoney(
    batches.reduce((sum, batch) => sum + batch.costEur * batch.imeis.length, 0),
  );

  await prisma.$transaction(async (tx) => {
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
        const units = await tx.stockUnit.findMany({
          where: { purchaseOrderId },
        });
        const ordered = po.lines.reduce((sum, line) => sum + line.qty, 0);
        const received = units.length;
        const receivedGbp = roundMoney(
          units.reduce((sum, unit) => sum + unit.costGbp, 0),
        );
        const receivedEur = roundMoney(
          units.reduce((sum, unit) => sum + unit.costEur, 0),
        );
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
  });

  revalidatePath("/stock");
  revalidatePath("/suppliers");
  revalidatePath("/purchase-orders");
  redirect(
    purchaseOrderId
      ? `/purchase-orders/${purchaseOrderId}?ok=Stock received`
      : `/stock?ok=${allImeis.length} units added`,
  );
}

export async function addStock(formData: FormData) {
  await receiveStockBatches(formData);
}
