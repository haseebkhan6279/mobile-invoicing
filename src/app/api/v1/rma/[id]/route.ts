import type { NextRequest } from "next/server";
import * as rmaService from "@/lib/modules/rma/rma.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const GET = apiRoute<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  const rma = await rmaService.getRma(id);
  return ok(rma);
});

// Mirrors processRma in src/actions/rma.ts — status is the only mutable field here.
export const PATCH = apiRoute<{ id: string }>(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rma = await rmaService.processRma(id, String(body.status ?? "RECEIVED"));
  return ok(rma);
});
