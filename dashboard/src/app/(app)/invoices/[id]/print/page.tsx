import { notFound } from "next/navigation";
import { EmailInvoiceForm } from "@/components/email-invoice-form";
import { InvoiceDocument, type InvoiceDoc } from "@/components/invoice-document";
import { Notice } from "@/components/notice";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
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
        <Notice ok={ok} error={error} />
        <div className="flex flex-wrap items-end gap-3">
          <PrintButton />
          <EmailInvoiceForm
            invoiceId={invoice.id}
            customerEmail={invoice.customer.email}
            returnTo={`/invoices/${invoice.id}/print`}
          />
        </div>
      </div>
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
