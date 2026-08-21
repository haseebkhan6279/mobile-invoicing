import type { NextRequest } from "next/server";
import * as rmaService from "@/lib/modules/rma/rma.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute(async () => {
  const rmas = await rmaService.listRmas();
  return ok(rmas);
});

export const POST = apiRoute(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const rma = await rmaService.createRma({
    invoiceId: String(body.invoiceId ?? ""),
    reason: body.reason ?? null,
    notes: body.notes ?? null,
    items: Array.isArray(body.items) ? body.items : [],
  });
  return ok(rma, 201);
});
