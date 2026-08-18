import { createRma } from "@/actions/rma";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";
import { RMA_ACTIONS } from "@/lib/status";
import { prisma } from "@/lib/prisma";

export default async function NewRmaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invoiceId?: string }>;
}) {
  await requireUser();
  const { error, invoiceId } = await searchParams;
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, stockUnits: true },
    orderBy: { createdAt: "desc" },
  });
  const selected = invoices.find((invoice) => invoice.id === invoiceId);

  return (
    <div>
      <PageHeader title="Create RMA" description="Select an invoice, then the IMEIs being returned." />
      <Notice error={error} />
      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-72 flex-1">
            <Label htmlFor="invoiceId">Invoice</Label>
            <Select id="invoiceId" name="invoiceId" defaultValue={invoiceId ?? ""}>
              <option value="">Select invoice</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} · {invoice.customer.name} ({invoice.customer.clientId})
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Load IMEIs
          </Button>
        </form>
      </Card>

      {selected ? (
        <Card>
          <form action={createRma} className="space-y-4">
            <input type="hidden" name="invoiceId" value={selected.id} />
            <p className="text-sm text-slate-600">
              {selected.customer.name} · Client {selected.customer.clientId}
            </p>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" name="reason" placeholder="DOA, cosmetic, customer change of mind…" />
            </div>
            <div className="space-y-2">
              <Label>IMEIs</Label>
              {selected.stockUnits.map((unit) => (
                <label
                  key={unit.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm"
                >
                  <input type="checkbox" name="stockUnitId" value={unit.id} className="rounded" />
                  <span className="font-mono">{unit.imei}</span>
                  <span>
                    {unit.productName} · {unit.color} · {unit.grade}
                  </span>
                  <Select name={`action-${unit.id}`} defaultValue="RESTOCK" className="w-40">
                    {RMA_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <Button type="submit">Create RMA</Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
