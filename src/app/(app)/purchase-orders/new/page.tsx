import { createPurchaseOrder } from "@/actions/purchase-orders";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase-order-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  const lookups = await getLookups();
  return (
    <div>
      <PageHeader title="Create purchase order" />
      <Notice error={error} />
      <Card>
        <form action={createPurchaseOrder} className="space-y-6">
          <PurchaseOrderForm
            suppliers={lookups.suppliers}
            grades={lookups.grades}
            colors={lookups.colors}
            networks={lookups.networks}
          />
          <Button type="submit">Save purchase order</Button>
        </form>
      </Card>
    </div>
  );
}
