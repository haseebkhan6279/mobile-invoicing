"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import { uploadAttachments, type AttachmentOwner } from "@/lib/attachments";

// The form posts either invoiceId or rmaId; the page to return to follows from it.
function readOwner(formData: FormData): { owner: AttachmentOwner; path: string } {
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (invoiceId) return { owner: { invoiceId }, path: `/invoices/${invoiceId}` };
  const rmaId = String(formData.get("rmaId") ?? "");
  return { owner: { rmaId }, path: `/returns/${rmaId}` };
}

export async function addAttachments(formData: FormData) {
  const { apiToken } = await requireUser();
  const { owner, path } = readOwner(formData);

  let count = 0;
  try {
    count = await uploadAttachments(owner, formData, apiToken);
  } catch (err) {
    if (err instanceof ApiError) {
      revalidatePath(path);
      redirect(`${path}?error=${encodeURIComponent(`Attachment failed: ${err.message}`)}`);
    }
    throw err;
  }

  if (count === 0) redirect(`${path}?error=${encodeURIComponent("Choose a file to attach")}`);
  revalidatePath(path);
  redirect(`${path}?ok=${count === 1 ? "File attached" : `${count} files attached`}`);
}

export async function removeAttachment(formData: FormData) {
  const { apiToken } = await requireUser();
  const { path } = readOwner(formData);
  const attachmentId = String(formData.get("attachmentId") ?? "");

  try {
    await apiClient.delete(`/attachments/${attachmentId}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError) {
      redirect(`${path}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(path);
  redirect(`${path}?ok=Attachment removed`);
}
