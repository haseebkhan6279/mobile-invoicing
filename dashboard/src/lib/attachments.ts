import { apiClient } from "@/lib/api-client";

export type AttachmentOwner = { invoiceId: string } | { rmaId: string };

export type AttachmentSummary = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

/**
 * Uploads every file picked in the form's `attachments` input, one request
 * each so a single file stays under the API's 4MB cap. Empty inputs are a no-op.
 */
export async function uploadAttachments(
  owner: AttachmentOwner,
  formData: FormData,
  apiToken: string | null,
) {
  const files = formData
    .getAll("attachments")
    .filter((file): file is File => file instanceof File && file.size > 0);

  for (const file of files) {
    const uploadForm = new FormData();
    for (const [key, value] of Object.entries(owner)) uploadForm.set(key, value);
    uploadForm.set("file", file, file.name);
    await apiClient.post("/attachments", uploadForm, apiToken);
  }
  return files.length;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
