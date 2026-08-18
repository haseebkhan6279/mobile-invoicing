"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { toNumber, toOptionalString } from "@/lib/lookups";

export async function createSupplier(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/suppliers/new?error=Name is required");
  const supplier = await prisma.supplier.create({
    data: {
      name,
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      address: toOptionalString(formData.get("address")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      notes: toOptionalString(formData.get("notes")),
    },
  });
  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}`);
}

export async function updateSupplier(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) redirect(`/suppliers/${id}?error=Name is required`);
  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      address: toOptionalString(formData.get("address")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      notes: toOptionalString(formData.get("notes")),
    },
  });
  revalidatePath(`/suppliers/${id}`);
  redirect(`/suppliers/${id}?ok=Saved`);
}

export async function addLedgerEntry(formData: FormData) {
  await requireUser();
  const supplierId = String(formData.get("supplierId") ?? "");
  const type = String(formData.get("type") ?? "DEBIT");
  const amountGbp = toNumber(formData.get("amountGbp"));
  const amountEur = toNumber(formData.get("amountEur"));
  if (!supplierId || amountGbp < 0 || amountEur < 0) {
    redirect(`/suppliers/${supplierId}?error=Enter valid amounts`);
  }
  if (amountGbp === 0 && amountEur === 0) {
    redirect(`/suppliers/${supplierId}?error=Amount cannot be zero`);
  }
  await prisma.supplierLedger.create({
    data: {
      supplierId,
      type: type === "CREDIT" ? "CREDIT" : "DEBIT",
      amountGbp,
      amountEur,
      date: formData.get("date")
        ? new Date(String(formData.get("date")))
        : new Date(),
      reference: toOptionalString(formData.get("reference")),
      notes: toOptionalString(formData.get("notes")),
    },
  });
  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}?ok=Hisab updated`);
}
