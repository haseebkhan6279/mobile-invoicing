"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toOptionalNumber } from "@/lib/lookups";
import { apiClient, ApiError } from "@/lib/api-client";

export async function createColor(formData: FormData) {
  const { apiToken } = await requireUser();
  try {
    await apiClient.post(
      "/lookups/colors",
      { name: String(formData.get("name") ?? "").trim() },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) redirect(`/settings?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/settings");
  redirect("/settings?ok=Color added");
}

export async function deleteColor(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    await apiClient.delete(`/lookups/colors/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError) redirect(`/settings?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/settings");
  redirect("/settings?ok=Color removed");
}

export async function createGrade(formData: FormData) {
  const { apiToken } = await requireUser();
  try {
    await apiClient.post(
      "/lookups/grades",
      {
        code: String(formData.get("code") ?? "").trim(),
        label: String(formData.get("label") ?? "").trim(),
        sortOrder: toOptionalNumber(formData.get("sortOrder")),
      },
      apiToken,
    );
  } catch (err) {
    if (err instanceof ApiError) redirect(`/settings?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/settings");
  redirect("/settings?ok=Grade added");
}

export async function deleteGrade(formData: FormData) {
  const { apiToken } = await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    await apiClient.delete(`/lookups/grades/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError) redirect(`/settings?error=${encodeURIComponent(err.message)}`);
    throw err;
  }
  revalidatePath("/settings");
  redirect("/settings?ok=Grade removed");
}
