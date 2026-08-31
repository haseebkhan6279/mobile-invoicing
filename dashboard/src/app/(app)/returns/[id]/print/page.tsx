import { notFound } from "next/navigation";
import { CreditNoteDocument, type CreditNoteDoc } from "@/components/credit-note-document";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";

export default async function RmaPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  let rma: CreditNoteDoc;
  try {
    rma = await apiClient.get<CreditNoteDoc>(`/rma/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <PrintButton />
      </div>
      <CreditNoteDocument rma={rma} />
    </div>
  );
}
