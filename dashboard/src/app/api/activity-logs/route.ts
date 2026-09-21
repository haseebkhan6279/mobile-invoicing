import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api-client";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.apiAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await apiClient.post("/activity-logs", body, session.apiAccessToken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: true });
  }
}
