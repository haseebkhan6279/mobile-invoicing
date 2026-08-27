import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePurchaseOrderMeta } from "@/actions/purchase-orders";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase-order-form";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import { getLookups } from "@/lib/lookups";
import { formatDate } from "@/lib/utils";

type PurchaseOrderDetail = {
  id: string;
  poNumber: string;
  supplierId: string;
  status: string;
  notes: string | null;
  fxRate: number;
  shippingCostGbp: number;
  shippingCostEur: number;
  actualCostGbp: number;
  actualCostEur: number;
  createdAt: string;
  supplier: { name: string };
  lines: {
    id: string;
    qty: number;
    productName: string;
    color: string | null;
    network: string | null;
    grade: string | null;
    unitCostGbp: number;
    unitCostEur: number;
  }[];
  stockUnits: { id: string; imei: string | null; productName: string; grade: string; status: string }[];
};

export default async function PurchaseOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { ok, error } = await searchParams;
  let po: PurchaseOrderDetail;
  try {
    po = await apiClient.get<PurchaseOrderDetail>(`/purchase-orders/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const lookups = await getLookups(apiToken);

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
          className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
        >
          Supplier hisab
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
          <StatusBadge status={po.status} />
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Shipping cost</div>
          <MoneyPair gbp={po.shippingCostGbp} eur={po.shippingCostEur} stacked />
        </Card>
        <Card>
          <div className="text-xs text-slate-500 dark:text-slate-400">Actual / landed cost</div>
          <MoneyPair gbp={po.actualCostGbp} eur={po.actualCostEur} stacked />
        </Card>
      </div>

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
                <Td className="font-mono">{unit.imei ?? "—"}</Td>
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
        <h2 className="mb-4 font-medium">Edit purchase order</h2>
        <form action={updatePurchaseOrderMeta} className="space-y-6">
          <input type="hidden" name="id" value={po.id} />
          <PurchaseOrderForm
            mode="edit"
            suppliers={lookups.suppliers}
            supplierName={po.supplier.name}
            grades={lookups.grades}
            colors={lookups.colors}
            networks={lookups.networks}
            initialLines={po.lines.map((line) => ({
              productName: line.productName,
              color: line.color || "Black",
              network: line.network || "Unlocked",
              grade: line.grade || "A",
              qty: line.qty,
              unitCostGbp: line.unitCostGbp,
              unitCostEur: line.unitCostEur,
            }))}
            initialStatus={po.status}
            initialFxRate={po.fxRate}
            initialShippingGbp={po.shippingCostGbp}
            initialShippingEur={po.shippingCostEur}
            initialActualCostGbp={po.actualCostGbp}
            initialActualCostEur={po.actualCostEur}
            initialNotes={po.notes ?? ""}
          />
          <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
