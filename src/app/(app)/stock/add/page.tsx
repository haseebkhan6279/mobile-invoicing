import { addStock } from "@/actions/stock";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StockBatchForm } from "@/components/stock-batch-form";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";
import { prisma } from "@/lib/prisma";

export default async function AddStockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  const lookups = await getLookups();
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    select: { id: true, poNumber: true, supplierId: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Add stock"
        description="Add IMEIs grade-wise, with colour, network, and unit cost in GBP & EUR."
      />
      <Notice error={error} />
      <Card>
        <form action={addStock}>
          <StockBatchForm
            grades={lookups.grades}
            colors={lookups.colors}
            networks={lookups.networks}
            suppliers={lookups.suppliers}
            purchaseOrders={purchaseOrders}
          />
          <div className="mt-6">
            <SubmitButton pendingText="Adding…">Add to inventory</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
