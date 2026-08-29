import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addInvoiceLine,
  updateInvoiceLine,
  updateInvoiceLineImeis,
  updateInvoiceMarginVat,
  updateInvoiceShipping,
  updateInvoiceStatus,
} from "@/actions/invoices";
import { InvoiceDocument } from "@/components/invoice-document";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import { getLookups } from "@/lib/lookups";
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
  marginVatScheme: boolean;
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
    buyPriceGbp: number;
    buyPriceEur: number;
    imeis: string[];
  }[];
  stockUnits: { imei: string; invoiceLineId: string | null }[];
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
  let invoice: InvoiceDetail;
  try {
    invoice = await apiClient.get<InvoiceDetail>(`/invoices/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const lookups = await getLookups(apiToken);

  return (
    <div className="space-y-6">
      <PageHeader title={invoice.invoiceNumber} description={invoice.customer.name} />
      <Notice ok={ok} error={error} />
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
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
        >
          Format / print
        </Link>
        <Link
          href={`/returns/new?invoiceId=${invoice.id}`}
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
        >
          Create RMA
        </Link>
        <Link
          href={`/shipments/new?invoiceId=${invoice.id}`}
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
        >
          Add shipment
        </Link>
      </div>
      <Card className="p-0">
        <InvoiceDocument invoice={invoice} />
      </Card>

      <Card className="no-print">
        <h2 className="mb-3 font-medium">Margin VAT scheme</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          When on, a Margin VAT Scheme notice is shown prominently at the top of the printed
          invoice.
        </p>
        <form action={updateInvoiceMarginVat} className="flex items-center gap-3">
          <input type="hidden" name="id" value={invoice.id} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="marginVatScheme"
              defaultChecked={invoice.marginVatScheme}
              className="rounded"
            />
            Sold under the Margin VAT Scheme
          </label>
          <SubmitButton pendingText="Saving…" size="sm">
            Save
          </SubmitButton>
        </form>
      </Card>

      <Card className="no-print">
        <h2 className="mb-3 font-medium">Shipping</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          This is the shipping cost that appears on the printed invoice total — separate from the
          courier tracking added via "Add shipment".
        </p>
        <form action={updateInvoiceShipping} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="id" value={invoice.id} />
          <div>
            <Label>Shipping cost GBP</Label>
            <Input
              name="shippingCostGbp"
              type="number"
              step="0.01"
              defaultValue={invoice.shippingCostGbp}
            />
          </div>
          <div>
            <Label>Shipping cost EUR</Label>
            <Input
              name="shippingCostEur"
              type="number"
              step="0.01"
              defaultValue={invoice.shippingCostEur}
            />
          </div>
          <div>
            <Label>Shipping line description</Label>
            <Input
              name="shippingLabel"
              placeholder="UPS Express Saver / Postage &amp; Packaging"
              defaultValue={invoice.shippingLabel ?? ""}
            />
          </div>
          <div className="flex items-end sm:col-span-3 sm:justify-end">
            <SubmitButton pendingText="Saving…" size="sm">
              Save shipping
            </SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="no-print">
        <h2 className="mb-3 font-medium">Edit invoice lines</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Change product details, quantity, or price on an existing line.
        </p>
        <div className="space-y-3">
          {invoice.lines.map((line) => (
            <form
              key={line.id}
              action={updateInvoiceLine}
              className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-6"
            >
              <input type="hidden" name="id" value={invoice.id} />
              <input type="hidden" name="lineId" value={line.id} />
              <div className="sm:col-span-2">
                <Label>Product name</Label>
                <Input name="productName" defaultValue={line.productName} required />
              </div>
              <div>
                <Label>Color</Label>
                <Input name="color" list={`colors-${line.id}`} defaultValue={line.color} />
                <datalist id={`colors-${line.id}`}>
                  {lookups.colors.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Network</Label>
                <Input name="network" list={`networks-${line.id}`} defaultValue={line.network} />
                <datalist id={`networks-${line.id}`}>
                  {lookups.networks.map((n) => (
                    <option key={n.id} value={n.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Grade</Label>
                <Input name="grade" list={`grades-${line.id}`} defaultValue={line.grade} />
                <datalist id={`grades-${line.id}`}>
                  {lookups.grades.map((g) => (
                    <option key={g.id} value={g.code} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Qty</Label>
                <Input name="qty" type="number" min={1} defaultValue={line.qty} required />
              </div>
              <div>
                <Label>Buying price GBP</Label>
                <Input
                  name="buyPriceGbp"
                  type="number"
                  step="0.01"
                  defaultValue={line.buyPriceGbp}
                />
              </div>
              <div>
                <Label>Buying price EUR</Label>
                <Input
                  name="buyPriceEur"
                  type="number"
                  step="0.01"
                  defaultValue={line.buyPriceEur}
                />
              </div>
              <div>
                <Label>Selling price GBP</Label>
                <Input
                  name="unitPriceGbp"
                  type="number"
                  step="0.01"
                  defaultValue={line.unitPriceGbp}
                />
              </div>
              <div>
                <Label>Selling price EUR</Label>
                <Input
                  name="unitPriceEur"
                  type="number"
                  step="0.01"
                  defaultValue={line.unitPriceEur}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-6">
                Buying price is for internal reference only and never appears on the printed invoice.
              </p>
              <div className="flex items-end sm:col-span-6 sm:justify-end">
                <SubmitButton pendingText="Saving…" size="sm">
                  Save line details
                </SubmitButton>
              </div>
            </form>
          ))}

          <form
            action={addInvoiceLine}
            className="grid gap-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700 sm:grid-cols-6"
          >
            <input type="hidden" name="id" value={invoice.id} />
            <div className="sm:col-span-2">
              <Label>Product name</Label>
              <Input name="productName" required />
            </div>
            <div>
              <Label>Color</Label>
              <Input name="color" list="colors-new" />
              <datalist id="colors-new">
                {lookups.colors.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Network</Label>
              <Input name="network" list="networks-new" />
              <datalist id="networks-new">
                {lookups.networks.map((n) => (
                  <option key={n.id} value={n.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Grade</Label>
              <Input name="grade" list="grades-new" />
              <datalist id="grades-new">
                {lookups.grades.map((g) => (
                  <option key={g.id} value={g.code} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Qty</Label>
              <Input name="qty" type="number" min={1} defaultValue={1} required />
            </div>
            <div>
              <Label>Buying price GBP</Label>
              <Input name="buyPriceGbp" type="number" step="0.01" defaultValue={0} />
            </div>
            <div>
              <Label>Buying price EUR</Label>
              <Input name="buyPriceEur" type="number" step="0.01" defaultValue={0} />
            </div>
            <div>
              <Label>Selling price GBP</Label>
              <Input name="unitPriceGbp" type="number" step="0.01" defaultValue={0} />
            </div>
            <div>
              <Label>Selling price EUR</Label>
              <Input name="unitPriceEur" type="number" step="0.01" defaultValue={0} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-6">
              Buying price is for internal reference only and never appears on the printed invoice.
            </p>
            <div className="flex items-end sm:col-span-6 sm:justify-end">
              <SubmitButton pendingText="Adding…" size="sm">
                Add line
              </SubmitButton>
            </div>
          </form>
        </div>
      </Card>

      <Card className="no-print">
        <h2 className="mb-3 font-medium">Line IMEIs</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
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
                  <div className="text-xs text-slate-500 dark:text-slate-400">
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
