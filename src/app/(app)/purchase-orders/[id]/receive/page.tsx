import { notFound } from "next/navigation";
import { receivePurchaseOrder } from "@/actions/purchase-orders";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StockBatchForm } from "@/components/stock-batch-form";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";
import { prisma } from "@/lib/prisma";

export default async function ReceivePoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, lines: true },
  });
  if (!po) notFound();
  const lookups = await getLookups();

  return (
    <div>
      <PageHeader
        title={`Receive ${po.poNumber}`}
        description={`Grade-wise IMEI intake from ${po.supplier.name}`}
      />
      <Notice error={error} />
      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-medium text-slate-500">Expected</h2>
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
