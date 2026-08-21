"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { parseImeis } from "@/lib/imei";
import { toNumber, toOptionalNumber, toOptionalString } from "@/lib/lookups";
import * as invoiceService from "@/lib/modules/invoices/invoices.service";
import { NotFoundError, ServiceError } from "@/lib/api/errors";

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
  await requireUser();
  const lines = parseInvoiceLines(formData);

  let invoice;
  try {
    invoice = await invoiceService.createInvoice({
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
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      redirect(`/invoices/new?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath("/invoices");
  revalidatePath("/stock");
  redirect(`/invoices/${invoice.id}?ok=Invoice created`);
}

export async function updateInvoiceStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PENDING");

  try {
    await invoiceService.updateInvoiceStatus(id, status);
  } catch (err) {
    if (err instanceof NotFoundError) redirect("/invoices");
    if (err instanceof ServiceError) redirect(`/invoices/${id}?error=${encodeURIComponent(err.message)}`);
    throw err;
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/stock");
  redirect(`/invoices/${id}?ok=Status updated`);
}
