import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiClient, ApiError } from "@/lib/api-client";
import type { StockImeiLookup } from "@/lib/stock-imei";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.apiAccessToken) {
    return NextResponse.json({ error: "Sign in to scan IMEIs" }, { status: 401 });
  }

  const imei = new URL(request.url).searchParams.get("imei") ?? "";
  try {
    const unit = await apiClient.get<StockImeiLookup>(
      `/stock/by-imei?imei=${encodeURIComponent(imei)}`,
      session.apiAccessToken,
    );
    return NextResponse.json({ data: unit });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
