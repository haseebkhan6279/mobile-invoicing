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
  const buyGbp = formData.getAll("lineBuyPriceGbp");
  const buyEur = formData.getAll("lineBuyPriceEur");
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
      buyPriceGbp: toNumber(buyGbp[i]),
      buyPriceEur: toNumber(buyEur[i]),
      imeis: parseImeis(String(imeis[i] ?? "")),
    });
  }
  return lines;
}

export async function createInvoice(formData: FormData) {
  const { apiToken } = await requireUser();
  const lines = parseInvoiceLines(formData);
  const appliedRmaIds = formData.getAll("appliedRmaIds").map(String).filter(Boolean);

  let invoice: { id: string };
  try {
    invoice = await apiClient.post<{ id: string }>(
      "/invoices",
      {
        customerId: String(formData.get("customerId") ?? ""),
        status: String(formData.get("status") ?? "PENDING"),
        entity: String(formData.get("entity") ?? "UK"),
        fxRate: toOptionalNumber(formData.get("fxRate")),
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        shippingLabel: toOptionalString(formData.get("shippingLabel")),
        paymentTerms: toOptionalString(formData.get("paymentTerms")),
        warrantyTerms: toOptionalString(formData.get("warrantyTerms")),
        notes: toOptionalString(formData.get("notes")),
        marginVatScheme: formData.get("marginVatScheme") === "on",
        appliedRmaIds,
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

export async function updateInvoiceShipping(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");

  try {
    await apiClient.patch(
      `/invoices/${id}/shipping`,
      {
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        shippingLabel: toOptionalString(formData.get("shippingLabel")),
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}?ok=Shipping updated`);
}

export async function updateInvoiceMarginVat(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");

  try {
    await apiClient.patch(
      `/invoices/${id}/margin-vat`,
      { marginVatScheme: formData.get("marginVatScheme") === "on" },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}?ok=Margin VAT setting updated`);
}

export async function updateInvoiceLine(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const lineId = String(formData.get("lineId") ?? "");

  try {
    await apiClient.patch(
      `/invoices/${id}/lines/${lineId}`,
      {
        productName: String(formData.get("productName") ?? "").trim(),
        color: toOptionalString(formData.get("color")),
        network: toOptionalString(formData.get("network")),
        grade: toOptionalString(formData.get("grade")),
        qty: toNumber(formData.get("qty")),
        unitPriceGbp: toNumber(formData.get("unitPriceGbp")),
        unitPriceEur: toNumber(formData.get("unitPriceEur")),
        buyPriceGbp: toNumber(formData.get("buyPriceGbp")),
        buyPriceEur: toNumber(formData.get("buyPriceEur")),
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/stock");
  redirect(`/invoices/${id}?ok=Line updated`);
}

export async function addInvoiceLine(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");

  try {
    await apiClient.post(
      `/invoices/${id}/lines`,
      {
        productName: String(formData.get("productName") ?? "").trim(),
        color: toOptionalString(formData.get("color")),
        network: toOptionalString(formData.get("network")),
        grade: toOptionalString(formData.get("grade")),
        qty: toNumber(formData.get("qty")),
        unitPriceGbp: toNumber(formData.get("unitPriceGbp")),
        unitPriceEur: toNumber(formData.get("unitPriceEur")),
        buyPriceGbp: toNumber(formData.get("buyPriceGbp")),
        buyPriceEur: toNumber(formData.get("buyPriceEur")),
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/stock");
  redirect(`/invoices/${id}?ok=Line added`);
}

export async function updateInvoiceLineImeis(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const lineId = String(formData.get("lineId") ?? "");
  const imeis = parseImeis(String(formData.get("imeis") ?? ""));

  try {
    await apiClient.patch(`/invoices/${id}/lines/${lineId}/imeis`, { imeis }, apiToken);
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/stock");
  redirect(`/invoices/${id}?ok=IMEIs updated`);
}
