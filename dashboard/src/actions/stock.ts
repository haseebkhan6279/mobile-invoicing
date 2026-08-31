"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { parseImeis } from "@/lib/imei";
import { toNumber, toOptionalString } from "@/lib/lookups";
import { apiClient, ApiError } from "@/lib/api-client";

function parseBatches(formData: FormData) {
  const products = formData.getAll("batchProduct");
  const brands = formData.getAll("batchBrand");
  const colors = formData.getAll("batchColor");
  const networks = formData.getAll("batchNetwork");
  const grades = formData.getAll("batchGrade");
  const gbp = formData.getAll("batchCostGbp");
  const imeiFields = formData.getAll("batchImeis");
  const qtys = formData.getAll("batchQty");
  const batches = [];
  for (let i = 0; i < products.length; i += 1) {
    batches.push({
      productName: String(products[i] ?? "").trim(),
      brand: toOptionalString(brands[i]),
      color: String(colors[i] ?? "").trim(),
      network: String(networks[i] ?? "").trim(),
      grade: String(grades[i] ?? "").trim(),
      costGbp: toNumber(gbp[i]),
      imeis: parseImeis(String(imeiFields[i] ?? "")),
      qty: toNumber(qtys[i]),
    });
  }
  return batches;
}

export async function receiveStockBatches(formData: FormData, options?: { fromPo?: boolean }) {
  const { apiToken } = await requireUser();
  const supplierId = toOptionalString(formData.get("supplierId"));
  const purchaseOrderId = toOptionalString(formData.get("purchaseOrderId"));
  const postLedger = formData.get("postLedger") === "on" || Boolean(options?.fromPo);
  const batches = parseBatches(formData);
  const back = purchaseOrderId ? `/purchase-orders/${purchaseOrderId}/receive` : "/stock/add";

  let result: { unitsAdded: number };
  try {
    result = await apiClient.post<{ unitsAdded: number }>(
      "/stock",
      { supplierId, purchaseOrderId, postLedger, batches },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) redirect(`${back}?error=${encodeURIComponent(err.message)}`);
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
  const { apiToken } = await requireUser();
  const params = new URLSearchParams({ ...spec, limit: String(limit) });
  return apiClient.get<string[]>(`/stock/available-imeis?${params}`, apiToken);
}

export async function updateStockUnitImei(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const imei = String(formData.get("imei") ?? "").trim();

  try {
    await apiClient.patch(`/stock/${id}/imei`, { imei }, apiToken);
  } catch (err) {
    if (err instanceof ApiError) redirect(`/stock?error=${encodeURIComponent(err.message)}`);
    throw err;
  }

  revalidatePath("/stock");
  redirect("/stock?ok=IMEI updated");
}

export async function searchStockProducts(query: string) {
  const { apiToken } = await requireUser();
  const params = new URLSearchParams({ q: query });
  return apiClient.get<
    { productName: string; color: string; network: string; grade: string; count: number; costGbp: number }[]
  >(`/stock/search-products?${params}`, apiToken);
}
