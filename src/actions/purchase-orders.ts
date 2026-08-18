"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { nextNumberTx } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";
import { toNumber, toOptionalString } from "@/lib/lookups";
import { DEFAULT_FX_RATE } from "@/lib/money";

function parsePoLines(formData: FormData) {
  const productNames = formData.getAll("lineProduct");
  const colors = formData.getAll("lineColor");
  const networks = formData.getAll("lineNetwork");
  const grades = formData.getAll("lineGrade");
  const qtys = formData.getAll("lineQty");
  const gbp = formData.getAll("lineCostGbp");
  const eur = formData.getAll("lineCostEur");
  const lines = [];
  for (let i = 0; i < productNames.length; i += 1) {
    const productName = String(productNames[i] ?? "").trim();
    const qty = toNumber(qtys[i], 0);
    if (!productName || qty <= 0) continue;
    lines.push({
      productName,
      color: toOptionalString(colors[i]),
      network: toOptionalString(networks[i]),
      grade: toOptionalString(grades[i]),
      qty,
      unitCostGbp: toNumber(gbp[i]),
      unitCostEur: toNumber(eur[i]),
    });
  }
  return lines;
}

export async function createPurchaseOrder(formData: FormData) {
  await requireUser();
  const supplierId = String(formData.get("supplierId") ?? "");
  const lines = parsePoLines(formData);
  if (!supplierId) redirect("/purchase-orders/new?error=Select a supplier");
  if (!lines.length) redirect("/purchase-orders/new?error=Add at least one line");

  const po = await prisma.$transaction(async (tx) => {
    const poNumber = await nextNumberTx(tx, "PO", "PO");
    return tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: String(formData.get("status") ?? "ORDERED"),
        notes: toOptionalString(formData.get("notes")),
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        fxRate: toNumber(formData.get("fxRate"), DEFAULT_FX_RATE),
        orderedAt: new Date(),
        lines: { create: lines },
      },
    });
  });

  revalidatePath("/purchase-orders");
  redirect(`/purchase-orders/${po.id}`);
}

export async function updatePurchaseOrderMeta(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: String(formData.get("status") ?? "ORDERED"),
      notes: toOptionalString(formData.get("notes")),
      shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
      shippingCostEur: toNumber(formData.get("shippingCostEur")),
      actualCostGbp: toNumber(formData.get("actualCostGbp")),
      actualCostEur: toNumber(formData.get("actualCostEur")),
      fxRate: toNumber(formData.get("fxRate"), DEFAULT_FX_RATE),
    },
  });
  revalidatePath(`/purchase-orders/${id}`);
  redirect(`/purchase-orders/${id}?ok=Updated`);
}

export async function receivePurchaseOrder(formData: FormData) {
  await requireUser();
  const { receiveStockBatches } = await import("@/actions/stock");
  await receiveStockBatches(formData, { fromPo: true });
}
