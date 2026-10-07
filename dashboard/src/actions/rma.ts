"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toNumber, toOptionalString } from "@/lib/lookups";
import { apiClient, ApiError } from "@/lib/api-client";
import { rmaRemainingCredit } from "@/lib/rma";

export type AvailableRmaCredit = {
  id: string;
  rmaNumber: string;
  status: string;
  invoice: { invoiceNumber: string };
  items: { unitPriceGbp: number }[];
  payments: { amountGbp: number }[];
};

export async function getAvailableRmaCredits(customerId: string) {
  if (!customerId) return [];
  const { apiToken } = await requireUser();
  const rmas = await apiClient.get<
    (AvailableRmaCredit & { paymentType: string })[]
  >(`/rma?customerId=${encodeURIComponent(customerId)}`, apiToken);
  return rmas.filter((rma) => rma.paymentType === "PENDING" && rmaRemainingCredit(rma) > 0);
}

// The IMEI checkboxes and manual-item rows shared by the create and add-items forms.
function readRmaItems(formData: FormData) {
  const unitIds = formData.getAll("stockUnitId").map(String).filter(Boolean);

  const manualInvoiceNumbers = formData.getAll("manualInvoiceNumber");
  const manualProductNames = formData.getAll("manualProductName");
  const manualImeis = formData.getAll("manualImei");
  const manualColors = formData.getAll("manualColor");
  const manualGrades = formData.getAll("manualGrade");
  const manualPriceGbp = formData.getAll("manualPriceGbp");
  const manualActions = formData.getAll("manualAction");
  const manualReasons = formData.getAll("manualReason");
  const manualItems = manualProductNames
    .map((_, i) => ({
      invoiceNumber: toOptionalString(manualInvoiceNumbers[i]),
      productName: String(manualProductNames[i] ?? "").trim(),
      imei: toOptionalString(manualImeis[i]),
      color: toOptionalString(manualColors[i]),
      grade: toOptionalString(manualGrades[i]),
      unitPriceGbp: toNumber(manualPriceGbp[i]),
      action: String(manualActions[i] || "RESTOCK"),
      reason: toOptionalString(manualReasons[i]),
    }))
    .filter((item) => item.productName);

  return {
    items: unitIds.map((stockUnitId) => ({
      stockUnitId,
      action: String(formData.get(`action-${stockUnitId}`) || "RESTOCK"),
      reason: toOptionalString(formData.get(`reason-${stockUnitId}`)),
    })),
    manualItems,
  };
}

export async function createRma(formData: FormData) {
  const { apiToken } = await requireUser();

  let rma: { id: string };
  try {
    rma = await apiClient.post<{ id: string }>(
      "/rma",
      {
        invoiceId: String(formData.get("invoiceId") ?? ""),
        reason: toOptionalString(formData.get("reason")),
        notes: toOptionalString(formData.get("notes")),
        ...readRmaItems(formData),
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    throw err;
  }

  revalidatePath("/returns");
  revalidatePath("/stock");
  redirect(`/returns/${rma.id}?ok=RMA created`);
}

export async function applyRmaCredit(formData: FormData) {
  const { apiToken } = await requireUser();
  const rmaId = String(formData.get("rmaId") ?? "");
  const appliedInvoiceId = toOptionalString(formData.get("appliedInvoiceId"));

  try {
    await apiClient.post(
      `/rma/${rmaId}/credit`,
      {
        paymentType: String(formData.get("paymentType") ?? "PENDING"),
        appliedInvoiceId,
        paymentAmountGbp: toNumber(formData.get("paymentAmountGbp")),
        paymentDate: toOptionalString(formData.get("paymentDate")),
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) redirect("/returns");
      redirect(`/returns/${rmaId}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/returns/${rmaId}`);
  if (appliedInvoiceId) revalidatePath(`/invoices/${appliedInvoiceId}`);
  revalidatePath("/invoices");
  redirect(`/returns/${rmaId}?ok=Credit updated`);
}

export async function applyRmaCreditToInvoice(formData: FormData) {
  const { apiToken } = await requireUser();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const rmaId = String(formData.get("rmaId") ?? "");

  try {
    await apiClient.post(
      `/invoices/${invoiceId}/payments`,
      {
        amountGbp: toNumber(formData.get("amountGbp")),
        rmaId,
        method: "RMA credit",
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`/invoices/${invoiceId}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/returns");
  redirect(`/invoices/${invoiceId}?ok=RMA credit applied`);
}

export async function processRma(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "RECEIVED");

  try {
    await apiClient.patch(`/rma/${id}`, { status }, apiToken);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) redirect("/returns");
      redirect(`/returns/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/returns/${id}`);
  revalidatePath("/stock");
  redirect(`/returns/${id}?ok=RMA updated`);
}

export async function deleteRma(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");

  try {
    await apiClient.delete(`/rma/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) redirect("/returns");
      redirect(`/returns/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath("/returns");
  revalidatePath("/stock");
  redirect("/returns?ok=RMA deleted");
}

function rmaErrorRedirect(id: string, err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 404) redirect("/returns");
    redirect(`/returns/${id}?error=${encodeURIComponent(err.message)}`);
  }
  throw err;
}

export async function updateRmaDetails(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");

  try {
    await apiClient.patch(
      `/rma/${id}/details`,
      {
        reason: toOptionalString(formData.get("reason")) ?? null,
        notes: toOptionalString(formData.get("notes")) ?? null,
      },
      apiToken,
    );
  } catch (err) {
    rmaErrorRedirect(id, err);
  }

  revalidatePath(`/returns/${id}`);
  revalidatePath("/returns");
  redirect(`/returns/${id}?ok=RMA details updated`);
}

// Saves every row of the items table in one go. Product fields are only sent
// for manual items; a tracked unit's details come from its stock record.
export async function updateRmaItems(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const itemIds = String(formData.get("itemIds") ?? "")
    .split(",")
    .filter(Boolean);

  try {
    for (const itemId of itemIds) {
      const manual = formData.has(`productName-${itemId}`);
      await apiClient.patch(
        `/rma/${id}/items/${itemId}`,
        {
          action: String(formData.get(`action-${itemId}`) || "RESTOCK"),
          reason: toOptionalString(formData.get(`reason-${itemId}`)) ?? null,
          unitPriceGbp: toNumber(formData.get(`unitPriceGbp-${itemId}`)),
          ...(manual
            ? {
                invoiceNumber: toOptionalString(formData.get(`invoiceNumber-${itemId}`)) ?? null,
                productName: String(formData.get(`productName-${itemId}`) ?? ""),
                imei: toOptionalString(formData.get(`imei-${itemId}`)) ?? null,
                color: toOptionalString(formData.get(`color-${itemId}`)) ?? null,
                grade: toOptionalString(formData.get(`grade-${itemId}`)) ?? null,
              }
            : {}),
        },
        apiToken,
      );
    }
  } catch (err) {
    rmaErrorRedirect(id, err);
  }

  revalidatePath(`/returns/${id}`);
  revalidatePath("/returns");
  revalidatePath("/stock");
  redirect(`/returns/${id}?ok=${itemIds.length === 1 ? "Item updated" : "Items updated"}`);
}

export async function deleteRmaItem(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const itemId = String(formData.get("itemId") ?? "");

  try {
    await apiClient.delete(`/rma/${id}/items/${itemId}`, apiToken);
  } catch (err) {
    rmaErrorRedirect(id, err);
  }

  revalidatePath(`/returns/${id}`);
  revalidatePath("/returns");
  revalidatePath("/stock");
  redirect(`/returns/${id}?ok=Item removed`);
}

export async function addRmaItems(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");

  try {
    await apiClient.post(`/rma/${id}/items`, readRmaItems(formData), apiToken);
  } catch (err) {
    rmaErrorRedirect(id, err);
  }

  revalidatePath(`/returns/${id}`);
  revalidatePath("/returns");
  revalidatePath("/stock");
  redirect(`/returns/${id}?ok=Items added`);
}

// Credit spent from this RMA lives as payments on the invoices it was applied
// to, so editing it goes through those invoices' payment endpoints.
export async function updateRmaCreditPayments(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const payments = String(formData.get("payments") ?? "")
    .split(",")
    .filter(Boolean)
    .map((pair) => {
      const [invoiceId, paymentId] = pair.split(":");
      return { invoiceId, paymentId };
    });

  try {
    for (const { invoiceId, paymentId } of payments) {
      await apiClient.patch(
        `/invoices/${invoiceId}/payments/${paymentId}`,
        {
          amountGbp: toNumber(formData.get(`amountGbp-${paymentId}`)),
          paidAt: toOptionalString(formData.get(`paidAt-${paymentId}`)),
        },
        apiToken,
      );
    }
  } catch (err) {
    rmaErrorRedirect(id, err);
  }

  revalidatePath(`/returns/${id}`);
  for (const { invoiceId } of payments) revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  redirect(`/returns/${id}?ok=Applied credit updated`);
}

export async function deleteRmaCreditPayment(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const paymentId = String(formData.get("paymentId") ?? "");

  try {
    await apiClient.delete(`/invoices/${invoiceId}/payments/${paymentId}`, apiToken);
  } catch (err) {
    rmaErrorRedirect(id, err);
  }

  revalidatePath(`/returns/${id}`);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  redirect(`/returns/${id}?ok=Credit removed from invoice — it can be spent again`);
}
