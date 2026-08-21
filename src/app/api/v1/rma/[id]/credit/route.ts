import type { NextRequest } from "next/server";
import * as rmaService from "@/lib/modules/rma/rma.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

// Mirrors applyRmaCredit in src/actions/rma.ts.
export const POST = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rma = await rmaService.applyRmaCredit(id, {
    paymentType: body.paymentType ?? "PENDING",
    appliedInvoiceId: body.appliedInvoiceId ?? null,
    paymentAmountGbp: body.paymentAmountGbp,
    paymentAmountEur: body.paymentAmountEur,
    paymentDate: body.paymentDate ?? null,
  });
  return ok(rma);
});
