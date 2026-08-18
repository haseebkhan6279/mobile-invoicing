import { createInvoice } from "@/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  const lookups = await getLookups();
  return (
    <div>
      <PageHeader
        title="Create invoice"
        description="Invoice number is assigned automatically. Type a customer name to fetch their details."
      />
      <Notice error={error} />
      <Card>
        <form action={createInvoice} className="space-y-6">
          <InvoiceForm
            grades={lookups.grades}
            colors={lookups.colors}
            networks={lookups.networks}
          />
          <Button type="submit">Save invoice</Button>
        </form>
      </Card>
    </div>
  );
}
