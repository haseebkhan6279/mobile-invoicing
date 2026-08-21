import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInvoiceStatus } from "@/actions/invoices";
import { InvoiceDocument } from "@/components/invoice-document";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import { INVOICE_STATUSES } from "@/lib/status";

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  entity: string;
  status: string;
  issuedAt: string;
  fxRate: number;
  shippingCostGbp: number;
  shippingCostEur: number;
  shippingLabel: string | null;
  paymentTerms: string | null;
  warrantyTerms: string | null;
  paidAmountGbp: number;
  paidAmountEur: number;
  notes: string | null;
  customer: {
    clientId: string;
    name: string;
    businessName: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
    address: string | null;
    shippingAddress: string | null;
  };
  lines: {
    id: string;
    qty: number;
    productName: string;
    color: string;
    network: string;
    grade: string;
    unitPriceGbp: number;
    unitPriceEur: number;
  }[];
  stockUnits: { imei: string; invoiceLineId: string | null }[];
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { ok } = await searchParams;
  let invoice: InvoiceDetail;
  try {
    invoice = await apiClient.get<InvoiceDetail>(`/invoices/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={invoice.invoiceNumber} description={invoice.customer.name} />
      <Notice ok={ok} />
      <div className="no-print flex flex-wrap items-end gap-3">
        <form action={updateInvoiceStatus} className="flex items-end gap-2">
          <input type="hidden" name="id" value={invoice.id} />
          <div>
            <Select name="status" defaultValue={invoice.status}>
              {INVOICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <SubmitButton pendingText="Updating…">Update status</SubmitButton>
        </form>
        <Link
          href={`/invoices/${invoice.id}/print`}
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200"
        >
          Format / print
        </Link>
        <Link
          href={`/returns/new?invoiceId=${invoice.id}`}
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200"
        >
          Create RMA
        </Link>
        <Link
          href={`/shipments/new?invoiceId=${invoice.id}`}
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200"
        >
          Add shipment
        </Link>
      </div>
      <Card className="p-0">
        <InvoiceDocument invoice={invoice} />
      </Card>
    </div>
  );
}
