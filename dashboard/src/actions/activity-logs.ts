"use server";

import { requireUser } from "@/lib/auth-guard";
import { apiClient } from "@/lib/api-client";

export type ActivityLogRow = {
  id: string;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  type: string;
  method: string | null;
  path: string;
  title: string;
  status: number | null;
  message: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type ActivityLogSummary = {
  errorCount: number;
  loginCount: number;
  opensToday: number;
  errorsToday: number;
  uniqueUsersToday: number;
};

export async function getActivityLogs(filters: { type?: string; q?: string } = {}) {
  const { apiToken } = await requireUser();
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.q) params.set("q", filters.q);
  params.set("take", "150");
  const qs = params.toString();
  return apiClient.get<{ items: ActivityLogRow[]; summary: ActivityLogSummary }>(
    `/activity-logs?${qs}`,
    apiToken,
  );
}
