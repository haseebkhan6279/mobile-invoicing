import type { NextRequest } from "next/server";
import * as invoiceService from "@/lib/modules/invoices/invoices.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  const invoice = await invoiceService.getInvoice(id);
  return ok(invoice);
});

// Mirrors updateInvoiceStatus in src/actions/invoices.ts — status is the only mutable field.
export const PATCH = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const invoice = await invoiceService.updateInvoiceStatus(id, String(body.status ?? "PENDING"));
  return ok(invoice);
});
