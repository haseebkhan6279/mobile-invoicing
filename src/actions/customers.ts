"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toOptionalString } from "@/lib/lookups";
import { nextNumberTx } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";

export async function searchCustomers(query: string) {
  await requireUser();
  const q = query.trim();
  if (!q) return [];
  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { businessName: { contains: q } },
        { clientId: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ],
    },
    orderBy: { name: "asc" },
    take: 8,
  });
}

export async function createCustomer(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const returnTo = toOptionalString(formData.get("returnTo"));
  if (!name) {
    redirect(
      `/customers/new?error=Name is required${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`,
    );
  }
  const customer = await prisma.$transaction(async (tx) => {
    const clientId = await nextNumberTx(tx, "CL", "CL");
    return tx.customer.create({
      data: {
        clientId,
        name,
        businessName: toOptionalString(formData.get("businessName")),
        phone: toOptionalString(formData.get("phone")),
        email: toOptionalString(formData.get("email")),
        vatNumber: toOptionalString(formData.get("vatNumber")),
        address: toOptionalString(formData.get("address")),
        shippingAddress: toOptionalString(formData.get("shippingAddress")),
        notes: toOptionalString(formData.get("notes")),
      },
    });
  });
  revalidatePath("/customers");
  if (returnTo) {
    const url = new URL(returnTo, "http://internal");
    url.searchParams.set("customerId", customer.id);
    redirect(`${url.pathname}${url.search}`);
  }
  redirect(`/customers/${customer.id}?ok=Customer added`);
}

export async function updateCustomer(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) redirect(`/customers/${id}?error=Name is required`);
  await prisma.customer.update({
    where: { id },
    data: {
      name,
      businessName: toOptionalString(formData.get("businessName")),
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      address: toOptionalString(formData.get("address")),
      shippingAddress: toOptionalString(formData.get("shippingAddress")),
      notes: toOptionalString(formData.get("notes")),
    },
  });
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}?ok=Saved`);
}
