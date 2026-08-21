"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toNumber, toOptionalNumber, toOptionalString } from "@/lib/lookups";
import { apiClient, ApiError } from "@/lib/api-client";

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
    lines.push({
      productName: String(productNames[i] ?? "").trim(),
      color: toOptionalString(colors[i]),
      network: toOptionalString(networks[i]),
      grade: toOptionalString(grades[i]),
      qty: toNumber(qtys[i], 0),
      unitCostGbp: toNumber(gbp[i]),
      unitCostEur: toNumber(eur[i]),
    });
  }
  return lines;
}

export async function createPurchaseOrder(formData: FormData) {
  const { apiToken } = await requireUser();
  const lines = parsePoLines(formData);

  let po: { id: string };
  try {
    po = await apiClient.post<{ id: string }>(
      "/purchase-orders",
      {
        supplierId: String(formData.get("supplierId") ?? ""),
        status: String(formData.get("status") ?? "ORDERED"),
        notes: toOptionalString(formData.get("notes")),
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        fxRate: toOptionalNumber(formData.get("fxRate")),
        lines,
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/purchase-orders/new?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath("/purchase-orders");
  redirect(`/purchase-orders/${po.id}?ok=Purchase order created`);
}

export async function updatePurchaseOrderMeta(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await apiClient.patch(
    `/purchase-orders/${id}`,
    {
      status: String(formData.get("status") ?? "ORDERED"),
      notes: toOptionalString(formData.get("notes")),
      shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
      shippingCostEur: toNumber(formData.get("shippingCostEur")),
      actualCostGbp: toNumber(formData.get("actualCostGbp")),
      actualCostEur: toNumber(formData.get("actualCostEur")),
      fxRate: toOptionalNumber(formData.get("fxRate")),
    },
    apiToken,
  );
  revalidatePath(`/purchase-orders/${id}`);
  redirect(`/purchase-orders/${id}?ok=Updated`);
}

export async function receivePurchaseOrder(formData: FormData) {
  const { receiveStockBatches } = await import("@/actions/stock");
  await receiveStockBatches(formData, { fromPo: true });
}
