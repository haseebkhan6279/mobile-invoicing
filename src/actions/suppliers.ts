"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toNumber, toOptionalString } from "@/lib/lookups";
import * as supplierService from "@/lib/modules/suppliers/suppliers.service";
import { NotFoundError, ServiceError } from "@/lib/api/errors";

export async function createSupplier(formData: FormData) {
  await requireUser();
  let supplier;
  try {
    supplier = await supplierService.createSupplier({
      name: String(formData.get("name") ?? "").trim(),
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      address: toOptionalString(formData.get("address")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      notes: toOptionalString(formData.get("notes")),
    });
  } catch (err) {
    if (err instanceof ServiceError) redirect(`/suppliers/new?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}?ok=Supplier added`);
}

export async function updateSupplier(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    await supplierService.updateSupplier(id, {
      name: String(formData.get("name") ?? "").trim(),
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      address: toOptionalString(formData.get("address")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      notes: toOptionalString(formData.get("notes")),
    });
  } catch (err) {
    if (err instanceof ServiceError) redirect(`/suppliers/${id}?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath(`/suppliers/${id}`);
  redirect(`/suppliers/${id}?ok=Saved`);
}

export async function deleteSupplier(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    await supplierService.deleteSupplier(id);
  } catch (err) {
    if (err instanceof NotFoundError) redirect("/suppliers");
    if (err instanceof ServiceError) redirect(`/suppliers/${id}?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/suppliers");
  redirect("/suppliers?ok=Supplier deleted");
}

export async function addLedgerEntry(formData: FormData) {
  await requireUser();
  const supplierId = String(formData.get("supplierId") ?? "");
  try {
    await supplierService.addLedgerEntry(supplierId, {
      type: String(formData.get("type") ?? "DEBIT"),
      amountGbp: toNumber(formData.get("amountGbp")),
      amountEur: toNumber(formData.get("amountEur")),
      date: toOptionalString(formData.get("date")),
      reference: toOptionalString(formData.get("reference")),
      notes: toOptionalString(formData.get("notes")),
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      redirect(`/suppliers/${supplierId}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }
  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}?ok=Hisab updated`);
}
