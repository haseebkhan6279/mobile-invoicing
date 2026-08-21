import type { NextRequest } from "next/server";
import * as supplierService from "@/lib/modules/suppliers/suppliers.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  const supplier = await supplierService.getSupplier(id);
  return ok(supplier);
});

export const PATCH = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const supplier = await supplierService.updateSupplier(id, {
    name: String(body.name ?? "").trim(),
    phone: body.phone ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    vatNumber: body.vatNumber ?? null,
    notes: body.notes ?? null,
  });
  return ok(supplier);
});

export const DELETE = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  await supplierService.deleteSupplier(id);
  return ok({ deleted: true });
});
