"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { parseImeis } from "@/lib/imei";
import { toNumber, toOptionalNumber, toOptionalString } from "@/lib/lookups";
import { apiClient, ApiError } from "@/lib/api-client";

function parseInvoiceLines(formData: FormData) {
  const products = formData.getAll("lineProduct");
  const colors = formData.getAll("lineColor");
  const networks = formData.getAll("lineNetwork");
  const grades = formData.getAll("lineGrade");
  const qtys = formData.getAll("lineQty");
  const gbp = formData.getAll("linePriceGbp");
  const eur = formData.getAll("linePriceEur");
  const imeis = formData.getAll("lineImeis");
  const lines = [];
  for (let i = 0; i < products.length; i += 1) {
    lines.push({
      productName: String(products[i] ?? "").trim(),
      color: String(colors[i] ?? "").trim(),
      network: String(networks[i] ?? "").trim(),
      grade: String(grades[i] ?? "").trim(),
      qty: toNumber(qtys[i], 0),
      unitPriceGbp: toNumber(gbp[i]),
      unitPriceEur: toNumber(eur[i]),
      imeis: parseImeis(String(imeis[i] ?? "")),
    });
  }
  return lines;
}

export async function createInvoice(formData: FormData) {
  const { apiToken } = await requireUser();
  const lines = parseInvoiceLines(formData);

  let invoice: { id: string };
  try {
    invoice = await apiClient.post<{ id: string }>(
      "/invoices",
      {
        customerId: String(formData.get("customerId") ?? ""),
        status: String(formData.get("status") ?? "PENDING"),
        fxRate: toOptionalNumber(formData.get("fxRate")),
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        shippingLabel: toOptionalString(formData.get("shippingLabel")),
        paymentTerms: toOptionalString(formData.get("paymentTerms")),
        warrantyTerms: toOptionalString(formData.get("warrantyTerms")),
        notes: toOptionalString(formData.get("notes")),
        lines,
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/new?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath("/invoices");
  revalidatePath("/stock");
  redirect(`/invoices/${invoice.id}?ok=Invoice created`);
}

export async function updateInvoiceStatus(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PENDING");

  try {
    await apiClient.patch(`/invoices/${id}`, { status }, apiToken);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) redirect("/invoices");
      redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/stock");
  redirect(`/invoices/${id}?ok=Status updated`);
}
