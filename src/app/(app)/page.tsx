import Link from "next/link";
import { Boxes, FileText, Truck, Warehouse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { totalsFromLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const [stockCounts, unpaid, recentPos, recentInvoices, suppliers, shipments] =
    await Promise.all([
      prisma.stockUnit.groupBy({
        by: ["grade", "status"],
        _count: { _all: true },
        where: { status: "IN_STOCK" },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
        include: { customer: true, lines: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.purchaseOrder.findMany({
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.invoice.findMany({
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.supplier.findMany({ include: { ledger: true } }),
      prisma.shipment.count({
        where: { status: { in: ["PREPARING", "SHIPPED", "IN_TRANSIT"] } },
      }),
    ]);

  const inStock = stockCounts.reduce((sum, row) => sum + row._count._all, 0);
  const payable = suppliers.reduce((acc, supplier) => {
    const t = totalsFromLedger(supplier.ledger);
    return {
      gbp: acc.gbp + t.balanceGbp,
      eur: acc.eur + t.balanceEur,
    };
  }, { gbp: 0, eur: 0 });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Stock, invoices, supplier balances, and recent activity."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3 text-slate-500">
            <Boxes className="h-5 w-5" /> In stock
          </div>
          <div className="mt-2 text-3xl font-semibold">{inStock}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 text-slate-500">
            <FileText className="h-5 w-5" /> Unpaid invoices
          </div>
          <div className="mt-2 text-3xl font-semibold">{unpaid.length}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 text-slate-500">
            <Warehouse className="h-5 w-5" /> Supplier payable
          </div>
          <div className="mt-2 text-lg font-semibold">
            <MoneyPair gbp={payable.gbp} eur={payable.eur} stacked />
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 text-slate-500">
            <Truck className="h-5 w-5" /> Open shipments
          </div>
          <div className="mt-2 text-3xl font-semibold">{shipments}</div>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">In stock by grade</h2>
          <div className="flex flex-wrap gap-2">
            {stockCounts.length ? (
              stockCounts.map((row) => (
                <div
                  key={row.grade}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  Grade {row.grade}:{" "}
                  <span className="font-semibold">{row._count._all}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No stock yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Awaiting payment</h2>
          {unpaid.length ? (
            <ul className="space-y-2 text-sm">
              {unpaid.map((invoice) => (
                <li key={invoice.id} className="flex justify-between gap-3">
                  <Link className="text-[#0b3a6e] hover:underline" href={`/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber} · {invoice.customer.name}
                  </Link>
                  <StatusBadge status={invoice.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No unpaid invoices.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Recent purchase orders</h2>
          <Table>
            <THead>
              <tr>
                <Th>PO</Th>
                <Th>Supplier</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <tbody>
              {recentPos.map((po) => (
                <tr key={po.id}>
                  <Td>
                    <Link className="text-[#0b3a6e] hover:underline" href={`/purchase-orders/${po.id}`}>
                      {po.poNumber}
                    </Link>
                  </Td>
                  <Td>{po.supplier.name}</Td>
                  <Td>
                    <StatusBadge status={po.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Recent invoices</h2>
          <Table>
            <THead>
              <tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
              </tr>
            </THead>
            <tbody>
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <Td>
                    <Link className="text-[#0b3a6e] hover:underline" href={`/invoices/${invoice.id}`}>
                      {invoice.invoiceNumber}
                    </Link>
                  </Td>
                  <Td>{invoice.customer.name}</Td>
                  <Td>{formatDate(invoice.issuedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
