import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addRmaItems,
  applyRmaCredit,
  deleteRma,
  deleteRmaCreditPayment,
  deleteRmaItem,
  processRma,
  updateRmaCreditPayments,
  updateRmaDetails,
  updateRmaItems,
} from "@/actions/rma";
import { GoodsNotReceivedWarning } from "@/components/goods-not-received-warning";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { RmaManualItems } from "@/components/rma-manual-items";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";
import { formatGbp } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api-client";
import { rmaCreditSummary, rmaGoodsReceived } from "@/lib/rma";
import { labelStatus, RMA_ACTIONS, RMA_PAYMENT_TYPES, RMA_STATUSES } from "@/lib/status";

type RmaDetail = {
  id: string;
  rmaNumber: string;
  status: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  invoiceId: string;
  paymentType: string;
  paymentAmountGbp: number;
  paymentDate: string | null;
  appliedInvoiceId: string | null;
  customer: { name: string };
  invoice: { invoiceNumber: string };
  appliedInvoice: { id: string; invoiceNumber: string } | null;
  payments: {
    id: string;
    amountGbp: number;
    paidAt: string;
    invoice: { id: string; invoiceNumber: string };
  }[];
  items: {
    id: string;
    reason: string | null;
    unitPriceGbp: number;
    action: string;
    invoiceNumber: string | null;
    productName: string | null;
    imei: string | null;
    grade: string | null;
    color: string | null;
    stockUnit: {
      id: string;
      imei: string;
      productName: string;
      color: string;
      grade: string;
      status: string;
    } | null;
  }[];
};
type InvoiceOption = { id: string; invoiceNumber: string; customer: { name: string } };
type SourceInvoice = {
  invoiceNumber: string;
  stockUnits: {
    id: string;
    imei: string;
    productName: string;
    color: string;
    grade: string;
    status: string;
  }[];
};

export default async function RmaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
  let rma: RmaDetail;
  try {
    rma = await apiClient.get<RmaDetail>(`/rma/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const credit = rmaCreditSummary(rma);
  const remainingGbp = credit.remainingGbp;
  const [invoiceList, sourceInvoice] = await Promise.all([
    apiClient.get<InvoiceOption[]>("/invoices", apiToken),
    apiClient.get<SourceInvoice>(`/invoices/${rma.invoiceId}`, apiToken),
  ]);
  const invoices = invoiceList.slice(0, 100);
  // Units still out on the sale — anything already in RMA or written off is
  // part of a return already.
  const returnedUnitIds = new Set(rma.items.map((item) => item.stockUnit?.id).filter(Boolean));
  const returnableUnits = sourceInvoice.stockUnits.filter(
    (unit) => !returnedUnitIds.has(unit.id) && unit.status !== "RMA" && unit.status !== "FAULTY",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={rma.rmaNumber}
        description={`${rma.customer.name} · ${rma.invoice.invoiceNumber}`}
      />
      <Notice ok={ok} error={error} />
      <div className="no-print">
        <Link
          href={`/returns/${rma.id}/print`}
          className="inline-flex h-11 items-center rounded-lg border border-gray-300 bg-white px-4 text-theme-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          Format / print
        </Link>
      </div>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Reason: {rma.reason || "—"}
          {rma.notes ? <span> · {rma.notes}</span> : null}
        </p>
        <p className="mt-2">
          Invoice:{" "}
          <Link className="text-brand-500 hover:underline dark:text-sky-400" href={`/invoices/${rma.invoiceId}`}>
            {rma.invoice.invoiceNumber}
          </Link>
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total amount
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatGbp(credit.totalGbp)}
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Amount applied
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatGbp(credit.appliedGbp)}
            </dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Balance remaining
            </dt>
            <dd
              className={`mt-1 text-lg font-semibold tabular-nums ${
                credit.availableGbp > 0 ? "text-brand-500 dark:text-sky-400" : "text-slate-500"
              }`}
            >
              {formatGbp(credit.remainingGbp)}
            </dd>
            {credit.settled && credit.remainingGbp > 0 ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Marked {labelStatus(rma.paymentType)} — this balance can no longer be applied.
              </p>
            ) : null}
          </div>
        </dl>
        <details className="no-print mt-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-500 dark:text-sky-400">
            Edit date, reason &amp; notes
          </summary>
          <form action={updateRmaDetails} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={rma.id} />
            <div className="max-w-xs">
              <Label htmlFor="createdAt">RMA date</Label>
              <Input
                id="createdAt"
                name="createdAt"
                type="date"
                required
                defaultValue={rma.createdAt.slice(0, 10)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" name="reason" defaultValue={rma.reason ?? ""} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={rma.notes ?? ""} />
            </div>
            <SubmitButton pendingText="Saving…" size="sm">
              Save details
            </SubmitButton>
          </form>
        </details>
      </Card>
      <Card>
        <h2 className="mb-1 font-medium">Items</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Edit any field and save. Tracked IMEIs take their product details from stock; manual
          items can be changed freely. The items can&rsquo;t total less than the credit already
          applied to invoices.
        </p>
        <Table>
          <THead>
            <tr>
              <Th>Invoice</Th>
              <Th>IMEI</Th>
              <Th>Product</Th>
              <Th>Reason</Th>
              <Th>Unit price £</Th>
              <Th>Action</Th>
              <Th>Stock status</Th>
              <Th className="no-print">{""}</Th>
            </tr>
          </THead>
          <tbody>
            {rma.items.map((item) =>
              item.stockUnit ? (
                <tr key={item.id}>
                  <Td>{item.invoiceNumber ?? rma.invoice.invoiceNumber}</Td>
                  <Td className="font-mono">{item.stockUnit.imei}</Td>
                  <Td>
                    {item.stockUnit.productName} · {item.stockUnit.grade}
                  </Td>
                  <Td>
                    <Input
                      form="items-bulk"
                      name={`reason-${item.id}`}
                      defaultValue={item.reason ?? ""}
                      className="w-44"
                    />
                  </Td>
                  <Td>
                    <Input
                      form="items-bulk"
                      name={`unitPriceGbp-${item.id}`}
                      type="number"
                      step="0.01"
                      min={0}
                      defaultValue={item.unitPriceGbp}
                      className="w-28"
                    />
                  </Td>
                  <Td>
                    <ActionSelect itemId={item.id} action={item.action} />
                  </Td>
                  <Td>
                    <StatusBadge status={item.stockUnit.status} />
                  </Td>
                  <Td className="no-print">
                    <DeleteItemButton rmaId={rma.id} itemId={item.id} single={rma.items.length === 1} />
                  </Td>
                </tr>
              ) : (
                <tr key={item.id}>
                  <Td>
                    <Input
                      form="items-bulk"
                      name={`invoiceNumber-${item.id}`}
                      defaultValue={item.invoiceNumber ?? rma.invoice.invoiceNumber}
                      className="w-28"
                    />
                  </Td>
                  <Td>
                    <Input
                      form="items-bulk"
                      name={`imei-${item.id}`}
                      defaultValue={item.imei ?? ""}
                      placeholder="Optional"
                      className="w-40 font-mono"
                    />
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Input
                        form="items-bulk"
                        name={`productName-${item.id}`}
                        defaultValue={item.productName ?? ""}
                        required
                        className="w-48"
                      />
                      <div className="flex gap-1">
                        <Input
                          form="items-bulk"
                          name={`color-${item.id}`}
                          defaultValue={item.color ?? ""}
                          placeholder="Color"
                          className="w-[5.75rem]"
                        />
                        <Input
                          form="items-bulk"
                          name={`grade-${item.id}`}
                          defaultValue={item.grade ?? ""}
                          placeholder="Grade"
                          className="w-[5.75rem]"
                        />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Input
                      form="items-bulk"
                      name={`reason-${item.id}`}
                      defaultValue={item.reason ?? ""}
                      className="w-44"
                    />
                  </Td>
                  <Td>
                    <Input
                      form="items-bulk"
                      name={`unitPriceGbp-${item.id}`}
                      type="number"
                      step="0.01"
                      min={0}
                      defaultValue={item.unitPriceGbp}
                      className="w-28"
                    />
                  </Td>
                  <Td>
                    <ActionSelect itemId={item.id} action={item.action} />
                  </Td>
                  <Td>—</Td>
                  <Td className="no-print">
                    <DeleteItemButton rmaId={rma.id} itemId={item.id} single={rma.items.length === 1} />
                  </Td>
                </tr>
              ),
            )}
          </tbody>
        </Table>
        <form id="items-bulk" action={updateRmaItems} className="no-print mt-3 flex justify-end">
          <input type="hidden" name="id" value={rma.id} />
          <input
            type="hidden"
            name="itemIds"
            value={rma.items.map((item) => item.id).join(",")}
          />
          <SubmitButton pendingText="Saving…" size="sm" variant="secondary">
            Save item changes
          </SubmitButton>
        </form>

        <details className="no-print mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <summary className="cursor-pointer text-sm font-medium text-brand-500 dark:text-sky-400">
            Add items to this RMA
          </summary>
          <form action={addRmaItems} className="mt-3 space-y-4">
            <input type="hidden" name="id" value={rma.id} />
            {returnableUnits.length ? (
              <div className="space-y-2">
                <Label>IMEIs from {sourceInvoice.invoiceNumber}</Label>
                {returnableUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
                  >
                    <input type="checkbox" name="stockUnitId" value={unit.id} className="rounded" />
                    <span className="font-mono">{unit.imei}</span>
                    <span>
                      {unit.productName} · {unit.color} · {unit.grade}
                    </span>
                    <Input
                      name={`reason-${unit.id}`}
                      placeholder="e.g. Back glass broken"
                      className="w-56"
                    />
                    <Select name={`action-${unit.id}`} defaultValue="RESTOCK" className="w-40">
                      {RMA_ACTIONS.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </Select>
                  </label>
                ))}
              </div>
            ) : null}
            <RmaManualItems defaultInvoiceNumber={sourceInvoice.invoiceNumber} />
            <SubmitButton pendingText="Adding…" size="sm">
              Add items
            </SubmitButton>
          </form>
        </details>
      </Card>
      <Card>
        <form action={processRma} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={rma.id} />
          <div>
            <Select name="status" defaultValue={rma.status}>
              {RMA_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <SubmitButton pendingText="Updating…">Update RMA</SubmitButton>
        </form>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Set to Received, Refunded, or Closed to restock, credit, or write off units.
        </p>
      </Card>
      <Card>
        <h2 className="mb-3 font-medium">Apply credit</h2>
        {rmaGoodsReceived(rma) ? null : <GoodsNotReceivedWarning variant="block" />}
        <form action={applyRmaCredit} className="space-y-3">
          <input type="hidden" name="rmaId" value={rma.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="paymentType">Payment type</Label>
              <Select id="paymentType" name="paymentType" defaultValue={rma.paymentType}>
                {RMA_PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="appliedInvoiceId">Apply to invoice</Label>
              <Select
                id="appliedInvoiceId"
                name="appliedInvoiceId"
                defaultValue={rma.appliedInvoiceId ?? ""}
              >
                <option value="">Select invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} · {invoice.customer.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentAmountGbp">Amount GBP</Label>
              <Input
                id="paymentAmountGbp"
                name="paymentAmountGbp"
                type="number"
                step="0.01"
                max={remainingGbp}
                defaultValue={remainingGbp}
              />
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment date</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={rma.paymentDate ? rma.paymentDate.slice(0, 10) : ""}
              />
            </div>
          </div>
          <SubmitButton pendingText="Saving…">Save credit</SubmitButton>
        </form>
        {rma.payments.length ? (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium">Applied to invoices</h3>
            <Table>
              <THead>
                <tr>
                  <Th>Date</Th>
                  <Th>Amount £</Th>
                  <Th>Invoice</Th>
                  <Th className="no-print">{""}</Th>
                </tr>
              </THead>
              <tbody>
                {rma.payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td>
                      <Input
                        form="credit-payments-bulk"
                        name={`paidAt-${payment.id}`}
                        type="date"
                        defaultValue={payment.paidAt.slice(0, 10)}
                        aria-label={`Date applied, ${formatDate(payment.paidAt)}`}
                        className="w-40"
                      />
                    </Td>
                    <Td>
                      <Input
                        form="credit-payments-bulk"
                        name={`amountGbp-${payment.id}`}
                        type="number"
                        step="0.01"
                        min={0.01}
                        defaultValue={payment.amountGbp}
                        aria-label={`Amount applied, ${formatGbp(payment.amountGbp)}`}
                        className="w-28"
                      />
                    </Td>
                    <Td>
                      <Link
                        className="text-brand-500 hover:underline dark:text-sky-400"
                        href={`/invoices/${payment.invoice.id}`}
                      >
                        {payment.invoice.invoiceNumber}
                      </Link>
                    </Td>
                    <Td className="no-print">
                      <form action={deleteRmaCreditPayment}>
                        <input type="hidden" name="id" value={rma.id} />
                        <input type="hidden" name="invoiceId" value={payment.invoice.id} />
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <ConfirmSubmitButton
                          variant="danger"
                          size="sm"
                          pendingText="Removing…"
                          confirmTitle={`Remove ${formatGbp(payment.amountGbp)} from ${payment.invoice.invoiceNumber}?`}
                          confirmMessage={`The invoice balance goes back up and the credit returns to ${rma.rmaNumber} to spend again.`}
                        >
                          Remove
                        </ConfirmSubmitButton>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <form
              id="credit-payments-bulk"
              action={updateRmaCreditPayments}
              className="no-print mt-3 flex justify-end"
            >
              <input type="hidden" name="id" value={rma.id} />
              <input
                type="hidden"
                name="payments"
                value={rma.payments
                  .map((payment) => `${payment.invoice.id}:${payment.id}`)
                  .join(",")}
              />
              <SubmitButton pendingText="Saving…" size="sm" variant="secondary">
                Save changes
              </SubmitButton>
            </form>
          </div>
        ) : null}
      </Card>
      <Card className="no-print border-red-100 dark:border-red-900/40">
        <h2 className="mb-1 font-medium text-red-700 dark:text-red-400">Delete RMA</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Puts the returned units back on {rma.invoice.invoiceNumber} as if the return was
          never raised. Only possible while none of this credit has been applied to an invoice.
        </p>
        <form action={deleteRma}>
          <input type="hidden" name="id" value={rma.id} />
          <ConfirmSubmitButton
            variant="danger"
            pendingText="Deleting…"
            confirmTitle={`Delete RMA ${rma.rmaNumber}?`}
            confirmMessage="Its returned items go with it. This cannot be undone."
          >
            Delete RMA
          </ConfirmSubmitButton>
        </form>
      </Card>
    </div>
  );
}

function ActionSelect({ itemId, action }: { itemId: string; action: string }) {
  return (
    <Select form="items-bulk" name={`action-${itemId}`} defaultValue={action} className="w-36">
      {RMA_ACTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}

function DeleteItemButton({
  rmaId,
  itemId,
  single,
}: {
  rmaId: string;
  itemId: string;
  single: boolean;
}) {
  // The last item can't go on its own — that is deleting the RMA.
  if (single) return null;
  return (
    <form action={deleteRmaItem}>
      <input type="hidden" name="id" value={rmaId} />
      <input type="hidden" name="itemId" value={itemId} />
      <ConfirmSubmitButton
        variant="ghost"
        size="sm"
        pendingText="Removing…"
        confirmTitle="Remove this item from the RMA?"
        confirmMessage="A tracked IMEI goes back on its invoice as if it was never returned."
      >
        Remove
      </ConfirmSubmitButton>
    </form>
  );
}
