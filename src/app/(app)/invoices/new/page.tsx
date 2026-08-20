import { createInvoice } from "@/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth-guard";
import { getLookups } from "@/lib/lookups";
import { prisma } from "@/lib/prisma";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; customerId?: string }>;
}) {
  await requireUser();
  const { error, customerId } = await searchParams;
  const lookups = await getLookups();
  const newCustomer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : null;
  return (
    <div>
      <PageHeader
        title="Create invoice"
        description="Invoice number is assigned automatically. Type a customer name to fetch their details."
      />
      <Notice error={error} ok={newCustomer ? `Customer ${newCustomer.name} added` : undefined} />
      <Card>
        <form action={createInvoice} className="space-y-6">
          <InvoiceForm
            grades={lookups.grades}
            colors={lookups.colors}
            networks={lookups.networks}
            initialCustomer={newCustomer}
          />
          <SubmitButton pendingText="Saving…">Save invoice</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
