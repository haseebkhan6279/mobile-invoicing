import type { NextRequest } from "next/server";
import * as supplierService from "@/lib/modules/suppliers/suppliers.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

// Mirrors addLedgerEntry in src/actions/suppliers.ts.
export const POST = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const entry = await supplierService.addLedgerEntry(id, {
    type: body.type ?? "DEBIT",
    amountGbp: body.amountGbp,
    amountEur: body.amountEur,
    date: body.date ?? null,
    reference: body.reference ?? null,
    notes: body.notes ?? null,
  });
  return ok(entry, 201);
});
