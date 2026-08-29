import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guard";

function baseUrl() {
  return process.env.API_URL ?? "http://localhost:4000/api/v1";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { apiToken } = await requireUser();
  const { id } = await params;

  const res = await fetch(`${baseUrl()}/purchase-orders/${id}/attachment`, {
    headers: { Authorization: `Bearer ${apiToken}` },
    cache: "no-store",
  });

  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Attachment not found" }, { status: res.status || 404 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? "inline",
    },
  });
}
