import type { NextRequest } from "next/server";
import * as customerService from "@/lib/modules/customers/customers.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  const customer = await customerService.getCustomer(id);
  return ok(customer);
});

export const PATCH = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const customer = await customerService.updateCustomer(id, {
    name: String(body.name ?? "").trim(),
    businessName: body.businessName ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    vatNumber: body.vatNumber ?? null,
    address: body.address ?? null,
    shippingAddress: body.shippingAddress ?? null,
    notes: body.notes ?? null,
  });
  return ok(customer);
});
