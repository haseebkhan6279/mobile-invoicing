import type { NextRequest } from "next/server";
import * as customerService from "@/lib/modules/customers/customers.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q");
  const customers = q ? await customerService.searchCustomers(q) : await customerService.listCustomers();
  return ok(customers);
});

export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const customer = await customerService.createCustomer({
    name: String(body.name ?? "").trim(),
    businessName: body.businessName ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    vatNumber: body.vatNumber ?? null,
    address: body.address ?? null,
    shippingAddress: body.shippingAddress ?? null,
    notes: body.notes ?? null,
  });
  return ok(customer, 201);
});
