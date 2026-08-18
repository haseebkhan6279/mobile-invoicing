import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePurchaseOrderMeta } from "@/actions/purchase-orders";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { PO_STATUSES } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, lines: true, stockUnits: true },
  });
  if (!po) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={po.poNumber}
        description={`${po.supplier.name} · created ${formatDate(po.createdAt)}`}
      />
      <Notice ok={ok} error={error} />
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/purchase-orders/${po.id}/receive`}
          className="inline-flex h-10 items-center rounded-lg bg-[#0b3a6e] px-4 text-sm font-medium text-white"
        >
          Receive stock
        </Link>
        <Link
          href={`/suppliers/${po.supplierId}`}
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200"
        >
          Supplier hisab
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs text-slate-500">Status</div>
          <StatusBadge status={po.status} />
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Shipping cost</div>
          <MoneyPair gbp={po.shippingCostGbp} eur={po.shippingCostEur} stacked />
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Actual / landed cost</div>
          <MoneyPair gbp={po.actualCostGbp} eur={po.actualCostEur} stacked />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Ordered lines</h2>
        <Table>
          <THead>
            <tr>
              <Th>Qty</Th>
              <Th>Product</Th>
              <Th>Color</Th>
              <Th>Network</Th>
              <Th>Grade</Th>
              <Th>Unit cost</Th>
            </tr>
          </THead>
          <tbody>
            {po.lines.map((line) => (
              <tr key={line.id}>
                <Td>{line.qty}</Td>
                <Td>{line.productName}</Td>
                <Td>{line.color || "—"}</Td>
                <Td>{line.network || "—"}</Td>
                <Td>{line.grade || "—"}</Td>
                <Td>
                  <MoneyPair gbp={line.unitCostGbp} eur={line.unitCostEur} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Received IMEIs ({po.stockUnits.length})</h2>
        <Table>
          <THead>
            <tr>
              <Th>IMEI</Th>
              <Th>Product</Th>
              <Th>Grade</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <tbody>
            {po.stockUnits.map((unit) => (
              <tr key={unit.id}>
                <Td className="font-mono">{unit.imei}</Td>
                <Td>{unit.productName}</Td>
                <Td>{unit.grade}</Td>
                <Td>
                  <StatusBadge status={unit.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Update PO</h2>
        <form action={updatePurchaseOrderMeta} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={po.id} />
          <div>
            <Label>Status</Label>
            <Select name="status" defaultValue={po.status}>
              {PO_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>FX rate</Label>
            <Input name="fxRate" type="number" step="0.0001" defaultValue={po.fxRate} />
          </div>
          <div>
            <Label>Shipping GBP</Label>
            <Input name="shippingCostGbp" type="number" step="0.01" defaultValue={po.shippingCostGbp} />
          </div>
          <div>
            <Label>Shipping EUR</Label>
            <Input name="shippingCostEur" type="number" step="0.01" defaultValue={po.shippingCostEur} />
          </div>
          <div>
            <Label>Actual cost GBP</Label>
            <Input name="actualCostGbp" type="number" step="0.01" defaultValue={po.actualCostGbp} />
          </div>
          <div>
            <Label>Actual cost EUR</Label>
            <Input name="actualCostEur" type="number" step="0.01" defaultValue={po.actualCostEur} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={po.notes ?? ""} />
          </div>
          <div>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
