import Link from "next/link";
import { notFound } from "next/navigation";
import { updateShipment } from "@/actions/shipments";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_STATUSES } from "@/lib/status";

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { ok } = await searchParams;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { invoice: { include: { customer: true } } },
  });
  if (!shipment) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={shipment.shipmentNumber}
        description={`${shipment.invoice.invoiceNumber} · ${shipment.invoice.customer.name}`}
      />
      <Notice ok={ok} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            Invoice:{" "}
            <Link className="text-[#0b3a6e] hover:underline" href={`/invoices/${shipment.invoiceId}`}>
              {shipment.invoice.invoiceNumber}
            </Link>
          </div>
          <div>
            Shipping vs actual:{" "}
            <MoneyPair gbp={shipment.shippingCostGbp} eur={shipment.shippingCostEur} /> vs{" "}
            <MoneyPair gbp={shipment.actualCostGbp} eur={shipment.actualCostEur} />
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
              <Label>Shipping cost EUR</Label>
              <Input name="shippingCostEur" type="number" step="0.01" defaultValue={shipment.shippingCostEur} />
            </div>
            <div>
              <Label>Actual cost GBP</Label>
              <Input name="actualCostGbp" type="number" step="0.01" defaultValue={shipment.actualCostGbp} />
            </div>
            <div>
              <Label>Actual cost EUR</Label>
              <Input name="actualCostEur" type="number" step="0.01" defaultValue={shipment.actualCostEur} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={shipment.notes ?? ""} />
          </div>
          <Button type="submit">Save tracking</Button>
        </form>
      </Card>
    </div>
  );
}
