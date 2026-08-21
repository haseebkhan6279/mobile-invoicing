import type { NextRequest } from "next/server";
import * as invoiceService from "@/lib/modules/invoices/invoices.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const invoices = await invoiceService.listInvoices(status);
  return ok(invoices);
});

export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const invoice = await invoiceService.createInvoice({
    customerId: String(body.customerId ?? ""),
    status: body.status ?? "PENDING",
    fxRate: body.fxRate,
    shippingCostGbp: body.shippingCostGbp,
    shippingCostEur: body.shippingCostEur,
    shippingLabel: body.shippingLabel ?? null,
    paymentTerms: body.paymentTerms ?? null,
    warrantyTerms: body.warrantyTerms ?? null,
    notes: body.notes ?? null,
    lines: Array.isArray(body.lines) ? body.lines : [],
  });
  return ok(invoice, 201);
});
