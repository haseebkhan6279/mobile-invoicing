"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { parseImeis } from "@/lib/imei";
import { toNumber, toOptionalString } from "@/lib/lookups";
import * as stockService from "@/lib/modules/stock/stock.service";
import { ServiceError } from "@/lib/api/errors";

function parseBatches(formData: FormData) {
  const products = formData.getAll("batchProduct");
  const brands = formData.getAll("batchBrand");
  const colors = formData.getAll("batchColor");
  const networks = formData.getAll("batchNetwork");
  const grades = formData.getAll("batchGrade");
  const gbp = formData.getAll("batchCostGbp");
  const eur = formData.getAll("batchCostEur");
  const imeiFields = formData.getAll("batchImeis");
  const batches = [];
  for (let i = 0; i < products.length; i += 1) {
    batches.push({
      productName: String(products[i] ?? "").trim(),
      brand: toOptionalString(brands[i]),
      color: String(colors[i] ?? "").trim(),
      network: String(networks[i] ?? "").trim(),
      grade: String(grades[i] ?? "").trim(),
      costGbp: toNumber(gbp[i]),
      costEur: toNumber(eur[i]),
      imeis: parseImeis(String(imeiFields[i] ?? "")),
    });
  }
  return batches;
}

export async function receiveStockBatches(formData: FormData, options?: { fromPo?: boolean }) {
  await requireUser();
  const supplierId = toOptionalString(formData.get("supplierId"));
  const purchaseOrderId = toOptionalString(formData.get("purchaseOrderId"));
  const postLedger = formData.get("postLedger") === "on" || Boolean(options?.fromPo);
  const batches = parseBatches(formData);
  const back = purchaseOrderId ? `/purchase-orders/${purchaseOrderId}/receive` : "/stock/add";

  let result;
  try {
    result = await stockService.receiveStockBatches({
      supplierId,
      purchaseOrderId,
      postLedger,
      batches,
    });
  } catch (err) {
    if (err instanceof ServiceError) redirect(`${back}?error=${encodeURIComponent(err.message)}`);
    throw err;
  }

  revalidatePath("/stock");
  revalidatePath("/suppliers");
  revalidatePath("/purchase-orders");
  redirect(
    purchaseOrderId
      ? `/purchase-orders/${purchaseOrderId}?ok=Stock received`
      : `/stock?ok=${result.unitsAdded} units added`,
  );
}

export async function addStock(formData: FormData) {
  await receiveStockBatches(formData);
}

export async function getAvailableImeis(
  spec: { productName: string; color: string; network: string; grade: string },
  limit = 50,
) {
  await requireUser();
  return stockService.getAvailableImeis(spec, limit);
}

export async function searchStockProducts(query: string) {
  await requireUser();
  return stockService.searchStockProducts(query);
}
