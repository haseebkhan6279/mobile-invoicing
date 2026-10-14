import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteShipment, updateShipment } from "@/actions/shipments";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import { formatGbp } from "@/lib/money";
import { SHIPMENT_STATUSES } from "@/lib/status";

type ShipmentDetail = {
  id: string;
  shipmentNumber: string;
  invoiceId: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippingCostGbp: number;
  actualCostGbp: number;
  status: string;
  notes: string | null;
  invoice: { invoiceNumber: string; customer: { name: string } };
};

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
  let shipment: ShipmentDetail;
  try {
    shipment = await apiClient.get<ShipmentDetail>(`/shipments/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={shipment.shipmentNumber}
        description={`${shipment.invoice.invoiceNumber} · ${shipment.invoice.customer.name}`}
      />
      <Notice ok={ok} error={error} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            Invoice:{" "}
            <Link className="text-brand-500 hover:underline" href={`/invoices/${shipment.invoiceId}`}>
              {shipment.invoice.invoiceNumber}
            </Link>
          </div>
          <div>
            Shipping vs actual: {formatGbp(shipment.shippingCostGbp)} vs{" "}
            {formatGbp(shipment.actualCostGbp)}
          </div>
        </div>
        <form action={updateShipment} className="space-y-4">
          <input type="hidden" name="id" value={shipment.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Carrier</Label>
              <Input name="carrier" defaultValue={shipment.carrier ?? ""} />
            </div>
            <div>
              <Label>Tracking number</Label>
              <Input name="trackingNumber" defaultValue={shipment.trackingNumber ?? ""} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select name="status" defaultValue={shipment.status}>
              {SHIPMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Shipping cost GBP</Label>
              <Input name="shippingCostGbp" type="number" step="0.01" defaultValue={shipment.shippingCostGbp} />
            </div>
            <div>
              <Label>Actual cost GBP</Label>
              <Input name="actualCostGbp" type="number" step="0.01" defaultValue={shipment.actualCostGbp} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={shipment.notes ?? ""} />
          </div>
          <SubmitButton pendingText="Saving…">Save tracking</SubmitButton>
        </form>
      </Card>
      <Card className="border-red-100 dark:border-red-900/40">
        <h2 className="mb-1 font-medium text-red-700 dark:text-red-400">Delete shipment</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Removes this shipment&apos;s tracking from {shipment.invoice.invoiceNumber}. The invoice
          itself is not changed.
        </p>
        <form action={deleteShipment}>
          <input type="hidden" name="id" value={shipment.id} />
          <ConfirmSubmitButton
            variant="danger"
            pendingText="Deleting…"
            confirmTitle={`Delete shipment ${shipment.shipmentNumber}?`}
            confirmMessage="This cannot be undone."
          >
            Delete shipment
          </ConfirmSubmitButton>
        </form>
      </Card>
    </div>
  );
}
