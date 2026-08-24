import Link from "next/link";
import { notFound } from "next/navigation";
import { updateInvoiceLineImeis, updateInvoiceStatus } from "@/actions/invoices";
import { InvoiceDocument } from "@/components/invoice-document";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
    imeis: string[];
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

      <Card className="no-print">
        <h2 className="mb-3 font-medium">Line IMEIs</h2>
        <p className="mb-4 text-sm text-slate-500">
          IMEI is optional at invoice creation — add or edit it here at any time.
        </p>
        <Table>
          <THead>
            <tr>
              <Th>Product</Th>
              <Th>Qty</Th>
              <Th>IMEIs</Th>
            </tr>
          </THead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <Td>
                  {line.productName}
                  <div className="text-xs text-slate-500">
                    {line.color} · {line.network} · {line.grade}
                  </div>
                </Td>
                <Td>{line.qty}</Td>
                <Td>
                  <form
                    action={updateInvoiceLineImeis}
                    className="flex flex-col gap-2 sm:flex-row sm:items-start"
                  >
                    <input type="hidden" name="id" value={invoice.id} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <Textarea
                      name="imeis"
                      className="min-h-16 sm:flex-1"
                      placeholder="One 15-digit IMEI per line (optional)"
                      defaultValue={line.imeis.join("\n")}
                    />
                    <SubmitButton pendingText="Saving…" size="sm" variant="secondary">
                      Save IMEIs
                    </SubmitButton>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
