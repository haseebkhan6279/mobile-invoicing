import { notFound } from "next/navigation";
import { InvoiceDocument, type InvoiceDoc } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  let invoice: InvoiceDoc;
  try {
    invoice = await apiClient.get<InvoiceDoc>(`/invoices/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div>
      <div className="no-print mb-4">
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
