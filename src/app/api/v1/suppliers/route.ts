import type { NextRequest } from "next/server";
import * as supplierService from "@/lib/modules/suppliers/suppliers.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async () => {
  const suppliers = await supplierService.listSuppliers();
  return ok(suppliers);
});

export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const supplier = await supplierService.createSupplier({
    name: String(body.name ?? "").trim(),
    phone: body.phone ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    vatNumber: body.vatNumber ?? null,
    notes: body.notes ?? null,
  });
  return ok(supplier, 201);
});
