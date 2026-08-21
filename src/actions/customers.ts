"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toOptionalString } from "@/lib/lookups";
import * as customerService from "@/lib/modules/customers/customers.service";
import { ServiceError } from "@/lib/api/errors";

export async function searchCustomers(query: string) {
  await requireUser();
  return customerService.searchCustomers(query);
}

export async function createCustomer(formData: FormData) {
  await requireUser();
  const returnTo = toOptionalString(formData.get("returnTo"));

  let customer;
  try {
    customer = await customerService.createCustomer({
      name: String(formData.get("name") ?? "").trim(),
      businessName: toOptionalString(formData.get("businessName")),
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      address: toOptionalString(formData.get("address")),
      shippingAddress: toOptionalString(formData.get("shippingAddress")),
      notes: toOptionalString(formData.get("notes")),
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      redirect(
        `/customers/new?error=${encodeURIComponent(err.message)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`,
      );
    }
    throw err;
  }

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

  try {
    await customerService.updateCustomer(id, {
      name: String(formData.get("name") ?? "").trim(),
      businessName: toOptionalString(formData.get("businessName")),
      phone: toOptionalString(formData.get("phone")),
      email: toOptionalString(formData.get("email")),
      vatNumber: toOptionalString(formData.get("vatNumber")),
      address: toOptionalString(formData.get("address")),
      shippingAddress: toOptionalString(formData.get("shippingAddress")),
      notes: toOptionalString(formData.get("notes")),
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      redirect(`/customers/${id}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}?ok=Saved`);
}
