import { notFound } from "next/navigation";
import { receivePurchaseOrder } from "@/actions/purchase-orders";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StockBatchForm } from "@/components/stock-batch-form";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";
import { apiClient, ApiError } from "@/lib/api-client";

type PoForReceive = {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: { name: string };
  lines: { id: string; qty: number; productName: string; color: string | null; network: string | null; grade: string | null }[];
};

export default async function ReceivePoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  let po: PoForReceive;
  try {
    po = await apiClient.get<PoForReceive>(`/purchase-orders/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const lookups = await getLookups(apiToken);

  return (
    <div>
      <PageHeader
        title={`Receive ${po.poNumber}`}
        description={`Grade-wise IMEI intake from ${po.supplier.name}`}
      />
      <Notice error={error} />
      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Expected</h2>
        <ul className="text-sm">
          {po.lines.map((line) => (
            <li key={line.id}>
              {line.qty} × {line.productName} · {line.color} · {line.network} ·{" "}
              {line.grade}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <form action={receivePurchaseOrder}>
          <StockBatchForm
            grades={lookups.grades}
            colors={lookups.colors}
            networks={lookups.networks}
            suppliers={lookups.suppliers}
            purchaseOrders={[{ id: po.id, poNumber: po.poNumber, supplierId: po.supplierId }]}
            defaultSupplierId={po.supplierId}
            defaultPurchaseOrderId={po.id}
            showLedgerToggle={false}
          />
          <div className="mt-6">
            <SubmitButton pendingText="Receiving…">Receive stock</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
