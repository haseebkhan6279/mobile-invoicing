import { notFound } from "next/navigation";
import { addLedgerEntry, updateSupplier } from "@/actions/suppliers";
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
import { totalsFromLedger, withRunningBalance } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { error, ok } = await searchParams;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      ledger: { orderBy: { date: "asc" } },
      purchaseOrders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!supplier) notFound();
  const totals = totalsFromLedger(supplier.ledger);
  const rows = withRunningBalance(supplier.ledger);

  return (
    <div className="space-y-6">
      <PageHeader title={supplier.name} description="Supplier hisab and details" />
      <Notice error={error} ok={ok} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs text-slate-500">Credit</div>
          <MoneyPair gbp={totals.creditGbp} eur={totals.creditEur} stacked />
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Debit</div>
          <MoneyPair gbp={totals.debitGbp} eur={totals.debitEur} stacked />
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Balance payable</div>
          <MoneyPair gbp={totals.balanceGbp} eur={totals.balanceEur} stacked />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-medium">Record credit / debit</h2>
        <form action={addLedgerEntry} className="grid gap-3 md:grid-cols-6">
          <input type="hidden" name="supplierId" value={supplier.id} />
          <div>
            <Label>Type</Label>
            <Select name="type" defaultValue="DEBIT">
              <option value="DEBIT">Debit (payment / return)</option>
              <option value="CREDIT">Credit (goods / you owe)</option>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input name="date" type="date" />
          </div>
          <div>
            <Label>Amount GBP</Label>
            <Input name="amountGbp" type="number" step="0.01" required />
          </div>
          <div>
            <Label>Amount EUR</Label>
            <Input name="amountEur" type="number" step="0.01" required />
          </div>
          <div>
            <Label>Reference</Label>
            <Input name="reference" placeholder="PO-0001 / payment" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input name="notes" />
          </div>
          <div className="md:col-span-6">
            <Button type="submit">Add to hisab</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Hisab ledger</h2>
        <Table>
          <THead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Running balance</Th>
              <Th>Reference</Th>
            </tr>
          </THead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <Td>{formatDate(row.date)}</Td>
                <Td>
                  <StatusBadge status={row.type} />
                </Td>
                <Td>
                  <MoneyPair gbp={row.amountGbp} eur={row.amountEur} stacked />
                </Td>
                <Td>
                  <MoneyPair gbp={row.balanceGbp} eur={row.balanceEur} stacked />
                </Td>
                <Td>
                  {row.reference || "—"}
                  {row.notes ? (
                    <div className="text-xs text-slate-500">{row.notes}</div>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Supplier details</h2>
        <form action={updateSupplier} className="space-y-4">
          <input type="hidden" name="id" value={supplier.id} />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={supplier.name} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={supplier.phone ?? ""} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" defaultValue={supplier.email ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="vatNumber">VAT</Label>
            <Input id="vatNumber" name="vatNumber" defaultValue={supplier.vatNumber ?? ""} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={supplier.address ?? ""} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={supplier.notes ?? ""} />
          </div>
          <Button type="submit">Save details</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Purchase orders</h2>
        <ul className="space-y-2 text-sm">
          {supplier.purchaseOrders.map((po) => (
            <li key={po.id} className="flex justify-between">
              <Link className="text-[#0b3a6e] hover:underline" href={`/purchase-orders/${po.id}`}>
                {po.poNumber}
              </Link>
              <StatusBadge status={po.status} />
            </li>
          ))}
          {!supplier.purchaseOrders.length ? (
            <li className="text-slate-500">No purchase orders.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
